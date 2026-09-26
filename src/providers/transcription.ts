export interface TranscriptionProvider {
  supported: boolean;
  start(
    onText: (text: string) => void,
    onError: (error: string) => void,
    onEnd?: () => void,
    options?: { audioTrack?: MediaStreamTrack; onStart?: () => void },
  ): void;
  stop(): void;
}
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
        resultIndex: number;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: (audioTrack?: MediaStreamTrack) => void;
  stop: () => void;
};
export function browserSpeechProvider(): TranscriptionProvider {
  let recognition: Recognition | null = null;
  const win =
    typeof window === "undefined"
      ? null
      : (window as Window & {
          SpeechRecognition?: new () => Recognition;
          webkitSpeechRecognition?: new () => Recognition;
        });
  const Klass = win?.SpeechRecognition ?? win?.webkitSpeechRecognition;
  function stop() {
    const previous = recognition;
    recognition = null;
    if (!previous) return;
    previous.onstart = null;
    previous.onresult = null;
    previous.onerror = null;
    previous.onend = null;
    try {
      previous.stop();
    } catch {
      // A browser may already have ended the recording.
    }
  }
  return {
    supported: !!Klass,
    start(onText, onError, onEnd, options) {
      if (!Klass) {
        onError(
          "Speech recognition is unavailable in this browser. Use manual input or a simulated conversation.",
        );
        return;
      }
      try {
        stop();
        recognition = new Klass();
        const current = recognition;
        recognition.onstart = () => {
          if (recognition === current) options?.onStart?.();
        };
        recognition.onend = () => {
          if (recognition !== current) return;
          recognition = null;
          onEnd?.();
        };
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onresult = (e) => {
          if (recognition !== current) return;
          for (let i = e.resultIndex; i < e.results.length; i++)
            onText(e.results[i][0].transcript);
        };
        recognition.onerror = (e) => {
          if (recognition !== current) return;
          stop();
          onError(`Speech recognition: ${e.error}`);
        };
        if (options?.audioTrack) recognition.start(options.audioTrack);
        else recognition.start();
      } catch {
        stop();
        onError(
          options?.audioTrack
            ? "Could not transcribe this audio track. Use a supported desktop Chrome browser and share the meeting tab with audio."
            : "Could not start speech recognition. Check your microphone permission.",
        );
      }
    },
    stop,
  };
}
export const demoLines = [
  "Could you tell me about a project you are proud of?",
  "How did you measure whether it worked?",
  "What technical challenge did you face?",
  "How did you work with your team?",
  "What would you improve next time?",
];
