"use client";
import { SessionType, now, uid } from "@/lib/model";
import { ClyvoSymbol } from "@/components/brand";
export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  return (
    <button
      type={type}
      title={title}
      className={`button ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Empty({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <ClyvoSymbol size={33} />
      <h3>{title}</h3>
      <p>{copy}</p>
      {action}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder = "",
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

export function time(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function createSession(
  type: SessionType["type"],
  title: string,
  company = "",
  role = "",
): SessionType {
  return {
    id: uid(),
    type,
    title,
    company,
    role,
    startedAt: now(),
    status: "active",
    durationSeconds: 0,
    transcript: [],
    questions: [],
    responses: [],
    notes: [],
    summary: "",
    decisions: [],
    actions: [],
  };
}

export function download(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
  return !query.trim() || i < 0 ? (
    <>{text}</>
  ) : (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.trim().length)}</mark>
      {text.slice(i + query.trim().length)}
    </>
  );
}
