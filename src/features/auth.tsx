"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/providers/app";
import { ClyvoAppIcon, ClyvoLogo } from "@/components/brand";
import { Button, Field } from "@/components/ui";
export default function Auth() {
  const { state, update } = useApp();
  const router = useRouter();
  const [name, setName] = useState(state.user?.name || "");
  const [email, setEmail] = useState(state.user?.email || "");
  const [role, setRole] = useState(state.user?.role || "");
  const [error, setError] = useState("");
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <ClyvoLogo />
        <div>
          <span className="eyebrow">YOUR CONVERSATION WORKSPACE</span>
          <h1>
            Think faster.
            <br />
            Speak clearer.
          </h1>
          <p>
            Set up a local profile to prepare, navigate, and review important
            conversations.
          </p>
        </div>
        <small>Your data is saved in this browser only.</small>
      </div>
      <div className="auth-form">
        <ClyvoAppIcon />
        <h2>Open CLYVO</h2>
        <p>Local profile · No password or cloud account</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !email.includes("@")) {
              setError("Enter your name and a valid email.");
              return;
            }
            update((s) => ({
              ...s,
              user: {
                name: name.trim(),
                email: email.trim(),
                role: role.trim(),
                goal: s.user?.goal || "",
                resume: s.user?.resume || "",
                companyContext: s.user?.companyContext || "",
                projects: s.user?.projects || "",
              },
            }));
            router.push(state.onboarding ? "/dashboard" : "/onboarding");
          }}
        >
          <Field
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Your name"
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
          />
          <Field
            label="Professional role"
            value={role}
            onChange={setRole}
            placeholder="e.g. Product designer"
          />
          {error && <p className="error-text">{error}</p>}
          <Button type="submit">
            Continue <ArrowRight size={16} />
          </Button>
        </form>
        <Link className="text-link" href="/">
          Back to home
        </Link>
      </div>
    </div>
  );
}
