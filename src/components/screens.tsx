"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Dialog } from "@/components/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  AudioLines,
  Brain,
  Check,
  ChevronRight,
  History,
  Home,
  Menu,
  MessageSquareText,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  X,
} from "lucide-react";
import { useApp } from "@/providers/app";
import { ClyvoIndicator, ClyvoLogo } from "@/components/brand";
import { Empty } from "@/components/ui";
import Help from "@/features/help";
import Auth from "@/features/auth";
import Onboarding from "@/features/onboarding";
import Dashboard from "@/features/dashboard";
import Live from "@/features/live";
import Interview from "@/features/interview";
import Meetings from "@/features/meetings";
import Memory from "@/features/memory";
import SearchPage from "@/features/search";
import HistoryPage from "@/features/history";
import Feedback from "@/features/feedback";
import SettingsPage from "@/features/settings";
export function AppScreen({ section }: { section: string }) {
  const { state, ready, error, setError, saveStatus } = useApp();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
      if (e.key === "Escape") setPalette(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!ready || section === "help") return;
    if (section !== "auth" && !state.user) router.replace("/auth");
    else if (
      section !== "auth" &&
      section !== "onboarding" &&
      state.user &&
      !state.onboarding
    )
      router.replace("/onboarding");
  }, [ready, section, state.user, state.onboarding, router]);
  if (section === "help") return <Help />;
  if (!ready)
    return (
      <div className="center-page">
        <ClyvoIndicator state="thinking" />
        <p>Opening CLYVO…</p>
      </div>
    );
  if (section === "auth") return <Auth />;
  if (section === "onboarding") return <Onboarding />;
  if (!state.user)
    return (
      <div className="center-page">
        <ClyvoIndicator state="thinking" />
      </div>
    );
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    live: "Live",
    interview: "Interview",
    meetings: "Meetings",
    memory: "Memory",
    search: "Search",
    feedback: "Feedback",
    history: "History",
    settings: "Settings",
  };
  return (
    <div
      className={`app-shell ${state.settings.reducedMotion ? "reduce-motion" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Link
          href="/dashboard"
          className="sidebar-logo"
          onClick={() => setMenu(false)}
        >
          <ClyvoLogo />
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([path, title, Icon]) => (
            <Link
              key={path}
              href={`/${path}`}
              aria-current={path === section ? "page" : undefined}
              className={`nav-item ${path === section ? "selected" : ""}`}
              onClick={() => setMenu(false)}
            >
              <Icon size={18} strokeWidth={1.8} />
              {title}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link className="text-link" href="/help">
            Help and privacy
          </Link>
          <div className="local-tag">
            <ShieldCheck size={15} /> Local browser data
          </div>
          <button className="palette-hint" onClick={() => setPalette(true)}>
            Quick actions <kbd>⌘ K</kbd>
          </button>
        </div>
      </aside>
      {menu && (
        <button
          className="scrim"
          aria-label="Close menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="app-main">
        <header className="topbar">
          <div className="top-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open menu"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span className="crumb">
              WORKSPACE <ChevronRight size={13} /> {labels[section] || "CLYVO"}
            </span>
          </div>
          <div className="top-right">
            <span className="status">
              <span className="dot" />{" "}
              {saveStatus === "saved"
                ? "Saved locally"
                : saveStatus === "error"
                  ? "Not saved"
                  : "Saving…"}
            </span>
            <span className="avatar" title={state.user.name}>
              {state.user.name[0]?.toUpperCase()}
            </span>
          </div>
        </header>
        {error && (
          <div className="notice error" role="alert">
            {error}
            <button aria-label="Dismiss" onClick={() => setError("")}>
              <X size={15} />
            </button>
          </div>
        )}
        <motion.main
          id="main-content"
          tabIndex={-1}
          className="content"
          key={section}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration:
              prefersReducedMotion || state.settings.reducedMotion ? 0 : 0.2,
          }}
        >
          {section === "dashboard" ? (
            <Dashboard />
          ) : section === "live" ? (
            <Live />
          ) : section === "interview" ? (
            <Interview />
          ) : section === "meetings" ? (
            <Meetings />
          ) : section === "memory" ? (
            <Memory />
          ) : section === "search" ? (
            <SearchPage />
          ) : section === "feedback" ? (
            <Feedback />
          ) : section === "history" ? (
            <HistoryPage />
          ) : section === "settings" ? (
            <SettingsPage />
          ) : (
            <Empty
              title="Page not found"
              copy="Choose a section from the navigation."
            />
          )}
        </motion.main>
        <nav className="mobile-nav">
          {nav.slice(0, 5).map(([path, title, Icon]) => (
            <Link
              key={path}
              href={`/${path}`}
              className={path === section ? "selected" : ""}
            >
              <Icon size={20} />
              <span>{title}</span>
            </Link>
          ))}
        </nav>
      </div>
      {palette && (
        <Dialog label="Quick actions" onClose={() => setPalette(false)}>
          <div className="palette-head">
            Quick actions{" "}
            <button
              className="icon-button"
              aria-label="Close"
              onClick={() => setPalette(false)}
            >
              <X size={18} />
            </button>
          </div>
          {[
            ["Start Live", "/live"],
            ["Prepare Interview", "/interview"],
            ["Start Meeting", "/meetings"],
            ["Add Memory", "/memory?new=1"],
            ["Search", "/search"],
            ["Recent Sessions", "/history"],
            ["Settings", "/settings"],
          ].map(([label, href]) => (
            <button
              key={href}
              className="palette-row"
              onClick={() => {
                router.push(href);
                setPalette(false);
              }}
            >
              {label}
              <ArrowRight size={16} />
            </button>
          ))}
        </Dialog>
      )}
    </div>
  );
}
const nav = [
  ["dashboard", "Dashboard", Home],
  ["live", "Live", AudioLines],
  ["interview", "Interview", MessageSquareText],
  ["meetings", "Meetings", Activity],
  ["memory", "Memory", Brain],
  ["search", "Search", Search],
  ["feedback", "Feedback", Check],
  ["history", "History", History],
  ["settings", "Settings", SettingsIcon],
] as const;
