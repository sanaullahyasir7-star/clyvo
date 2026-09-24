export interface ScreenContextProvider {
  start(onEnded: () => void): Promise<MediaStream>;
  stop(): void;
  snapshot(video: HTMLVideoElement): string;
}
export function browserScreenProvider(): ScreenContextProvider {
  let stream: MediaStream | null = null;
  return {
    async start(onEnded) {
      if (!navigator.mediaDevices?.getDisplayMedia)
        throw new Error("Screen sharing is unavailable in this browser.");
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      stream.getVideoTracks().forEach((t) => (t.onended = onEnded));
      return stream;
    },
    stop() {
      stream?.getTracks().forEach((t) => {
        t.onended = null;
        t.stop();
      });
      stream = null;
    },
    snapshot(video) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(video.videoWidth, 1280);
      canvas.height = Math.round(
        (canvas.width * video.videoHeight) / video.videoWidth,
      );
      canvas
        .getContext("2d")
        ?.drawImage(video, 0, 0, canvas.width, canvas.height);
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
