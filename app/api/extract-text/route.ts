import { NextRequest, NextResponse } from "next/server";
import { readPro } from "@/lib/pro-cookie";

// OCR and document parsing can take a while — allow up to 60 seconds.
export const maxDuration = 60;

/**
 * Clean up raw extracted text from PDFs, DOCX files, and OCR.
 *
 * Problems addressed:
 *  - Hard line-wraps inside paragraphs (PDF column widths, OCR line-by-line)
 *  - Hyphenated word breaks at line ends ("connec-\ntion" → "connection")
 *  - Multiple consecutive spaces / stray tabs
 *  - Runs of 3+ blank lines collapsed to a single paragraph break
 *  - Control characters and junk bytes
 *  - Spaces before punctuation (" ." → ".")
 */
function cleanExtractedText(raw: string): string {
  let t = raw;

  // 1. Normalize line endings
  t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Strip non-printing control characters (keep \n and \t)
  t = t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Strip pdf2json page-break markers
  t = t.replace(/^-{16}Page \(\d+\) Break-{16}$/gm, "\n");

  // 4. Collapse tabs and horizontal runs of spaces within lines
  t = t.replace(/[ \t]{2,}/g, " ");

  // 5. Trim trailing and leading space from each line
  t = t.replace(/^[ \t]+|[ \t]+$/gm, "");

  // 6. Repair soft-hyphen line breaks: "connec-\ntion" → "connection"
  t = t.replace(/-\n([a-zA-Z])/g, "$1");

  // 7. Join soft-wrapped lines.
  //
  //    A "hard" paragraph break is 2+ consecutive newlines — leave those alone.
  //    A single \n that looks like a soft wrap is joined with a space.
  //
  //    We detect soft wraps in two passes:
  //
  //    Pass A — line ends with a character that cannot end a sentence:
  //      lowercase letter, digit, comma, semicolon, colon, dash, opening
  //      bracket/quote.  The next line (anything) is joined.
  t = t.replace(
    /([a-z0-9,;:\-–—(\[{""'])\n([^\n])/g,
    "$1 $2",
  );

  //    Pass B — next line starts with a lowercase letter (continuation of a
  //    sentence regardless of how the previous line ended, e.g. abbreviations
  //    like "Dr.\nSmith" are correctly left alone because "S" is uppercase).
  t = t.replace(/\n([a-z])/g, " $1");

  // 8. Collapse runs of 3+ newlines to a single paragraph break
  t = t.replace(/\n{3,}/g, "\n\n");

  // 9. Remove stray spaces before punctuation
  t = t.replace(/ ([.,;:!?])/g, "$1");

  // 10. Final collapse of any double-spaces introduced above
  t = t.replace(/ {2,}/g, " ");

  return t.trim();
}

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
    let raw = "";

    // ── PDF ──────────────────────────────────────────────────────────────────
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      // pdf2json works in Node.js / Vercel serverless without DOM dependencies.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PDFParser = (await import("pdf2json")).default as any;
      const parser = new PDFParser(null, 1); // rawTextMode = 1
      raw = await new Promise<string>((resolve, reject) => {
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

    // ── DOCX ─────────────────────────────────────────────────────────────────
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      raw = result.value;

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
      raw = data.text;
      await worker.terminate();

    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, PNG, or JPG." },
        { status: 415 }
      );
    }

    const text = cleanExtractedText(raw);

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
