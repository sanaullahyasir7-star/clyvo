import { browserSpeechProvider, type TranscriptionProvider } from "./transcription";

// Conservative gate: older implementations silently ignore start(audioTrack)
// and could open the microphone instead. Never fall back implicitly.
export function supportsTabSpeech(userAgent: string): boolean {
  const chrome = /\bChrome\/(\d+)/.exec(userAgent);
  return !!chrome && Number(chrome[1]) >= 135 && !/Android|iPhone|iPad|Edg\/|OPR\//.test(userAgent);
}
export type TabAudioStatus = "off" | "choosing" | "connecting" | "listening";
export function createTabAudioProvider(dependencies?: {
  capture: () => Promise<MediaStream>;
  speech: TranscriptionProvider;
  supported: boolean;
}) {
  const speech = dependencies?.speech ?? browserSpeechProvider();
  let stream: MediaStream | null = null;
  let version = 0;
  function release(captured: MediaStream) {
    captured.getTracks().forEach(track => { track.onended = null; track.stop(); });
  }
  function stop() {
    version++;
    speech.stop();
    if (stream) release(stream);
    stream = null;
  }
  return {
    stop,
    async start(onText: (text: string) => void, onStatus: (status: TabAudioStatus) => void, onError: (message: string) => void) {
      stop();
      const request = version;
      const supported = dependencies?.supported ?? (
        typeof navigator !== "undefined" && supportsTabSpeech(navigator.userAgent) && !!navigator.mediaDevices?.getDisplayMedia
      );
      if (!supported || !speech.supported) {
        onStatus("off");
        onError("Meeting-tab transcription requires desktop Google Chrome 135 or newer with speech recognition. Microphone and typed questions remain available.");
        return;
      }
      const finish = () => { if (request !== version) return; stop(); onStatus("off"); };
      try {
        onStatus("choosing");
        const captured = await (dependencies?.capture ?? (() => navigator.mediaDevices.getDisplayMedia({
          video: true, audio: true,
        })))();
        if (request !== version) { release(captured); return; }
        stream = captured;
        const audio = captured.getAudioTracks().find(track => track.readyState === "live");
        const video = captured.getVideoTracks()[0];
        if (!audio) throw new Error("No audio was shared. Select the meeting browser tab and enable ‘Share tab audio’ in the browser picker.");
        // Reject known whole-screen/window sources: this control promises tab audio.
        const surface = video?.getSettings().displaySurface;
        if (surface && surface !== "browser") throw new Error("Select a browser tab, rather than a screen or window, to capture the meeting audio.");
        captured.getTracks().forEach(track => { track.onended = finish; });
        onStatus("connecting");
        speech.start(
          text => { if (request === version) onText(text); },
          message => { if (request === version) { finish(); onError(message); } },
          () => { if (request === version) { finish(); onError("Tab transcription ended. Select Listen to meeting tab to reconnect when ready."); } },
          { audioTrack: audio, onStart: () => { if (request === version) onStatus("listening"); } },
        );
      } catch (error) {
        if (request !== version) return;
        finish();
        onError(error instanceof Error ? error.message : "Meeting-tab capture could not start. Check browser permissions.");
      }
    },
  };
}
