import { extractResume } from "./resume";
self.onmessage = async (event: MessageEvent<{ file: File }>) => {
  try {
    const text = await extractResume(event.data.file, (message) =>
      self.postMessage({ progress: message }),
    );
    self.postMessage({ text });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Could not read this CV.",
    });
  }
};
