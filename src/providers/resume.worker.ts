import { extractResume } from "./resume";
self.onmessage = async (event: MessageEvent<{ file: File }>) => {
  try {
    const text = await extractResume(event.data.file, (message) =>
      self.postMessage({ channel: "clyvo-cv", progress: message }),
    );
    self.postMessage({ channel: "clyvo-cv", text });
  } catch (error) {
    self.postMessage({
      channel: "clyvo-cv",
      error: error instanceof Error ? error.message : "Could not read this CV.",
    });
  }
};
