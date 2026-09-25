export interface ScreenContextProvider {
  start(onEnded: () => void): Promise<MediaStream>;
  stop(): void;
  snapshot(video: HTMLVideoElement): string;
}
export function browserScreenProvider(): ScreenContextProvider {
  let stream: MediaStream | null = null;
  let generation = 0;
  function stop() {
    generation++;
    stream?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    stream = null;
  }
  return {
    async start(onEnded) {
      stop();
      const request = generation;
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getDisplayMedia
      )
        throw new Error(
          "Screen sharing is unavailable in this browser. You can still use manual questions.",
        );
      const captured = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      if (request !== generation) {
        captured.getTracks().forEach((t) => t.stop());
        throw new Error("Screen sharing was cancelled.");
      }
      stream = captured;
      stream.getVideoTracks().forEach((t) => {
        t.onended = () => {
          if (stream !== captured) return;
          stop();
          onEnded();
        };
      });
      return captured;
    },
    stop,
    snapshot(video) {
      if (
        !stream ||
        !video.videoWidth ||
        !video.videoHeight ||
        video.readyState < 2
      )
        throw new Error(
          "Wait for the screen preview before taking a snapshot.",
        );
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(video.videoWidth, 1280);
      canvas.height = Math.round(
        (canvas.width * video.videoHeight) / video.videoWidth,
      );
      const context = canvas.getContext("2d");
      if (!context)
        throw new Error("Snapshots are unavailable in this browser.");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    },
  };
}
export interface ScreenInterpreter {
  describe(label: string): string;
}
export const mockScreenInterpreter: ScreenInterpreter = {
  describe(label) {
    return label
      ? `Manual screen label: ${label}. CLYVO has not analyzed the image.`
      : "Screen preview is active. This local release does not interpret arbitrary screen content.";
  },
};
