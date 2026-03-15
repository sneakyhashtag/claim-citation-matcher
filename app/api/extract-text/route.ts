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
      // pdf2json works in Node.js/Vercel serverless without DOM dependencies.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PDFParser = (await import("pdf2json")).default as any;
      const parser = new PDFParser(null, 1); // rawTextMode = 1
      text = await new Promise<string>((resolve, reject) => {
        parser.on("pdfParser_dataReady", () => {
          try {
            resolve(parser.getRawTextContent() as string);
          } catch (e) {
            reject(e);
          }
        });
        parser.on("pdfParser_dataError", (err: unknown) => {
          reject(
            new Error(
              typeof err === "object" &&
              err !== null &&
              "parserError" in err
                ? String((err as { parserError: unknown }).parserError)
                : "Failed to parse PDF"
            )
          );
        });
        parser.parseBuffer(buffer);
      });
      // Strip pdf2json page-break markers and normalise whitespace
      text = text
        .replace(/----------------Page \(\d+\) Break----------------/g, "\n\n")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

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
