import { validateResumeFile } from "./resume";
export function readResume(
  file: File,
  progress: (message: string) => void,
  signal: AbortSignal,
): Promise<string> {
  validateResumeFile(file);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./resume.worker.ts", import.meta.url), {
      type: "module",
    });
    const finish = (error?: string, text?: string) => {
      clearTimeout(timer);
      worker.terminate();
      signal.removeEventListener("abort", abort);
      if (error) reject(new Error(error));
      else if (text?.trim()) resolve(text);
      else reject(new Error("No readable text was found. Try a text-based CV."));
    };
    const abort = () => finish("CV import cancelled.");
    const timer = setTimeout(
      () =>
        finish(
          "This CV took too long to read. Use a simpler document or paste the text.",
        ),
      20000,
    );
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (e) => {
      if (e.data?.channel !== "clyvo-cv") return;
      if (e.data.progress) progress(e.data.progress);
      else finish(e.data.error, e.data.text);
    };
    worker.onerror = () =>
      finish("CV reader could not start. Try again or paste your CV text.");
    if (signal.aborted) abort();
    else worker.postMessage({ file });
  });
}
