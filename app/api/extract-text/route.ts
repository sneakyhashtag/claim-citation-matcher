import { NextRequest, NextResponse } from "next/server";
import { readPro } from "@/lib/pro-cookie";

// OCR and document parsing can take a while — allow up to 60 seconds.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!readPro(req)) {
    return NextResponse.json(
      { error: "Document upload is a Pro feature." },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const mime = file.type;

  try {
    let text = "";

    // ── PDF ──────────────────────────────────────────────────────────────────
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      // Dynamic import avoids pdf-parse reading test files at module load time
      // (a known incompatibility with Next.js webpack).
      const mod = await import("pdf-parse");
      // pdf-parse ships as CJS; when bundled with ESM interop the callable
      // function may be on `.default` or on the module itself.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (mod as any).default ?? mod;
      const result = await pdfParse(buffer);
      text = result.text;

    // ── DOCX ─────────────────────────────────────────────────────────────────
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;

    // ── Legacy .doc — not supported ───────────────────────────────────────────
    } else if (mime === "application/msword" || name.endsWith(".doc")) {
      return NextResponse.json(
        { error: ".doc files are not supported. Please save as .docx and try again." },
        { status: 415 }
      );

    // ── Images (PNG, JPG, JPEG) — OCR via Tesseract ───────────────────────────
    } else if (
      mime.startsWith("image/") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg")
    ) {
      const { createWorker } = await import("tesseract.js");
      // Cache language data to /tmp so it persists across warm invocations.
      const worker = await createWorker("eng", 1, {
        cachePath: "/tmp",
        logger: () => {}, // suppress verbose progress logs
      });
      const { data } = await worker.recognize(buffer);
      text = data.text;
      await worker.terminate();

    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, PNG, or JPG." },
        { status: 415 }
      );
    }

    text = text.trim();
    if (!text) {
      return NextResponse.json(
        { error: "No text could be extracted from this file." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
