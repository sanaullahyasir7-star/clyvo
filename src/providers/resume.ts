export const MAX_CV_BYTES = 10 * 1024 * 1024;
export const MAX_CV_CHARACTERS = 100_000;
export function validateResumeFile(file: { name: string; size: number }) {
  if (!file.size) throw new Error("This file is empty. Choose another CV.");
  if (file.size > MAX_CV_BYTES)
    throw new Error("Choose a CV smaller than 10 MB.");
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "doc")
    throw new Error(
      "For older .doc files, open the CV in Word and save it as .docx or PDF, then select that file.",
    );
  if (!["pdf", "docx", "txt", "md"].includes(extension || ""))
    throw new Error("Choose a PDF, Word (.docx), TXT, or Markdown CV.");
  return extension!;
}
export function cleanResumeText(text: string) {
  const cleaned = text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  if (!cleaned)
    throw new Error(
      "No readable text was found. This may be a scanned or image-only CV. Export a text-based PDF or Word document, or paste your CV text.",
    );
  if (cleaned.length > MAX_CV_CHARACTERS)
    throw new Error(
      "This document contains too much text. Select a CV with fewer pages or paste the relevant sections.",
    );
  return cleaned;
}
export async function extractResume(
  file: File,
  progress: (message: string) => void = () => {},
  pdfWorkerSrc?: string,
) {
  const extension = validateResumeFile(file);
  progress("Reading your CV on this device…");
  if (extension === "txt" || extension === "md")
    return cleanResumeText(await file.text());
  const bytes = await file.arrayBuffer();
  if (extension === "docx") {
    if (new Uint8Array(bytes)[0] !== 0x50 || new Uint8Array(bytes)[1] !== 0x4b)
      throw new Error(
        "This is not a readable Word .docx file. Save it again from Word and retry.",
      );
    try {
      const mammoth = await import("mammoth/mammoth.browser");
      const result = await mammoth.extractRawText({ arrayBuffer: bytes });
      return cleanResumeText(result.value);
    } catch (error) {
      if (
        error instanceof Error &&
        /No readable|too much text/.test(error.message)
      )
        throw error;
      throw new Error(
        "The Word document could not be read. It may be damaged or password-protected. Save an unlocked .docx or PDF and try again.",
      );
    }
  }
  const header = new TextDecoder().decode(
    new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 1024)),
  );
  if (!header.includes("%PDF-"))
    throw new Error(
      "This file does not appear to be a PDF. Choose the original PDF file.",
    );
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    pdfWorkerSrc ||
    `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/pdf.worker-${pdfjs.version}.min.mjs`;
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    standardFontDataUrl: pdfWorkerSrc
      ? undefined
      : `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/pdf-assets-${pdfjs.version}/standard_fonts/`,
    cMapUrl: pdfWorkerSrc
      ? undefined
      : `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/pdf-assets-${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    useWasm: false,
    disableFontFace: true,
  });
  try {
    const document = await task.promise;
    if (document.numPages > 30)
      throw new Error("Choose a CV with 30 pages or fewer.");
    const pages: string[] = [];
    for (let n = 1; n <= document.numPages; n++) {
      progress(`Reading PDF page ${n} of ${document.numPages}…`);
      const page = await document.getPage(n);
      const content = await page.getTextContent();
      let previousY: number | undefined;
      let text = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        if (
          previousY !== undefined &&
          Math.abs(y - previousY) > 3 &&
          !text.endsWith("\n")
        )
          text += "\n";
        text += item.str + (item.hasEOL ? "\n" : " ");
        previousY = y;
      }
      pages.push(text);
      page.cleanup();
      if (pages.join("").length > MAX_CV_CHARACTERS)
        throw new Error(
          "This document contains too much text. Choose a shorter CV.",
        );
    }
    return cleanResumeText(pages.join("\n\n"));
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException")
      throw new Error(
        "This PDF is password-protected. Save an unlocked copy and try again.",
      );
    if (
      error instanceof Error &&
      /No readable|too much text|30 pages/.test(error.message)
    )
      throw error;
    throw new Error(
      "The PDF could not be read. Try saving it again or upload the Word .docx version.",
      { cause: error },
    );
  } finally {
    await task.destroy();
  }
}
