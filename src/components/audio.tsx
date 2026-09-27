"use client";
import { useEffect, useRef, useState } from "react";
import { MicrophoneLease } from "@/providers/audio-monitor";
export function AudioMonitor() {
  const lease = useRef(new MicrophoneLease());
  const version = useRef(0);
  const [pending, setPending] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState("");
  const [status, setStatus] = useState("Off");
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const frame = useRef(0);
  const stop = () => {
    version.current++;
    lease.current.stop();
    setPending(false);
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void context.current?.close();
    context.current = null;
    setStatus("Off");
    setLevel(0);
  };
  useEffect(
    () => () => {
      version.current++;
      lease.current.stop();
      cancelAnimationFrame(frame.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      void context.current?.close();
    },
    [],
  );
  async function start() {
    stop();
    const request = version.current;
    setPending(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Microphone access is unavailable in this browser.");
      const media = await lease.current.acquire(() =>
        navigator.mediaDevices.getUserMedia({
          audio: device ? { deviceId: { exact: device } } : true,
        }),
      );
      if (!media || request !== version.current) return;
      stream.current = media;
      setMuted(false);
      setStatus("Monitoring");
      const available = await navigator.mediaDevices.enumerateDevices();
      if (request !== version.current) return;
      setDevices(available.filter((d) => d.kind === "audioinput"));
      const ctx = new AudioContext();
      context.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(media).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(samples);
        const volume =
          Math.sqrt(
            samples.reduce((sum, n) => sum + (n - 128) ** 2, 0) /
              samples.length,
          ) / 30;
        setLevel(Math.min(volume, 1));
        frame.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      if (request !== version.current) return;
      stop();
      setStatus(
        e instanceof Error ? e.message : "Microphone permission was denied.",
      );
    } finally {
      if (request === version.current) setPending(false);
    }
  }
  return (
    <div className="audio-monitor">
      <span className="eyebrow">MICROPHONE CHECK</span>
      <p className="small-text">
        Test audio locally. Browser speech recognition uses the browser’s
        default microphone.
      </p>
      {devices.length > 0 && (
        <select
          aria-label="Microphone device"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
        >
          <option value="">Default microphone</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || "Microphone"}
            </option>
          ))}
        </select>
      )}
      <div
        className="audio-meter"
        role="meter"
        aria-label="Microphone activity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(level * 100)}
      >
        <span style={{ width: `${level * 100}%` }} />
      </div>
      <small role="status">{status}</small>
      <div className="row">
        <button className="outline-action" onClick={start} disabled={pending}>
          {pending
            ? "Waiting for microphone…"
            : stream.current
              ? "Reconnect"
              : "Test microphone"}
        </button>
        {(stream.current || pending) && (
          <>
            <button
              onClick={() => {
                stream.current
                  ?.getAudioTracks()
                  .forEach((t) => (t.enabled = muted));
                setMuted((v) => !v);
              }}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            <button onClick={stop}>Stop</button>
          </>
        )}
      </div>
    </div>
  );
}
