"use client";
import { useEffect, useRef, useState } from "react";
export function AudioMonitor() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState("");
  const [status, setStatus] = useState("Off");
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const frame = useRef(0);
  const stop = () => {
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
      cancelAnimationFrame(frame.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      void context.current?.close();
    },
    [],
  );
  async function start() {
    stop();
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Microphone access is unavailable in this browser.");
      const media = await navigator.mediaDevices.getUserMedia({
        audio: device ? { deviceId: { exact: device } } : true,
      });
      stream.current = media;
      setMuted(false);
      setStatus("Monitoring");
      setDevices(
        (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "audioinput",
        ),
      );
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
      setStatus(
        e instanceof Error ? e.message : "Microphone permission was denied.",
      );
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
        <button className="outline-action" onClick={start}>
          {stream.current ? "Reconnect" : "Test microphone"}
        </button>
        {stream.current && (
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
