import { useId } from "react";
export function ClyvoSymbol({
  size = 32,
  className = "",
  monochrome = false,
}: {
  size?: number;
  className?: string;
  monochrome?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="2" y1="5" x2="46" y2="42">
          <stop stopColor="#7657FF" />
          <stop offset=".52" stopColor="#9477FF" />
          <stop offset="1" stopColor="#5DE2E7" />
        </linearGradient>
      </defs>
      <path
        d="M4 8h9l11 25L35 8h9L28 41h-8L4 8Z"
        fill={monochrome ? "currentColor" : `url(#${id})`}
      />
    </svg>
  );
}
export function ClyvoLogo({ light = false }: { light?: boolean }) {
  return (
    <span
      className="wordmark"
      style={{ color: light ? "#08090B" : "#F7F8FA" }}
      aria-label="CLYVO"
    >
      <span>CLY</span>
      <ClyvoSymbol size={24} />
      <span>O</span>
    </span>
  );
}
export function ClyvoAppIcon() {
  return (
    <div className="app-icon">
      <ClyvoSymbol size={32} />
    </div>
  );
}
export function ClyvoIndicator({
  state = "idle",
}: {
  state?: "idle" | "listening" | "thinking" | "ready" | "paused" | "error";
}) {
  return (
    <span className={`indicator indicator-${state}`}>
      <ClyvoSymbol size={26} />
    </span>
  );
}

export function ClyvoLogoLight() {
  return <ClyvoLogo light />;
}
export function ClyvoLogoDark() {
  return <ClyvoLogo />;
}
export function ClyvoLogoMonochrome() {
  return (
    <span className="wordmark" aria-label="CLYVO">
      <span>CLY</span>
      <ClyvoSymbol size={24} monochrome />
      <span>O</span>
    </span>
  );
}
