import { Button, Card } from "@/components/ui";
export function LocalAIControls({ status, progress, error, enable, disable }: {
  status: "off" | "loading" | "ready" | "error"; progress: string; error: string;
  enable: () => void; disable: () => void;
}) {
  return <Card>
    <h2>Free local AI · experimental</h2>
    <p>Generate answers using your CV on this device. No API key or subscription. First use downloads roughly 1 GB of model files and needs around 2 GB of available GPU memory. Speed and quality depend on your device.</p>
    <p>Model files come from Hugging Face and the MLC project and may be cached in this browser. Your CV and questions stay on-device for answer generation. Browser speech recognition has separate privacy limits.</p>
    <div role="status" aria-live="polite">{status === "ready" ? "Local AI ready — new questions use the model." : status === "loading" ? progress || "Loading local model…" : "Template guidance is active. Enable the model for generated answers."}</div>
    {error && <p role="alert">{error}</p>}
    {status === "off" || status === "error" ? <Button onClick={enable}>Download & enable free AI</Button> : <Button variant="secondary" onClick={disable}>{status === "loading" ? "Cancel download" : "Turn off AI"}</Button>}
    <p className="small-text muted">Keep this page open after loading. Leaving Live releases the model from memory. Cached files may remain. Generated answers can be wrong; check every draft.</p>
  </Card>;
}
