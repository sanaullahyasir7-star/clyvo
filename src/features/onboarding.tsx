"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/providers/app";
import { ResumeImport } from "@/components/resume-import";
import { sampleState } from "@/lib/model";
import { ClyvoLogo } from "@/components/brand";
import { Button, Field } from "@/components/ui";
export default function Onboarding() {
  const { state, update, replace } = useApp();
  const router = useRouter();
  const [goal, setGoal] = useState(state.user?.goal || "");
  const [job, setJob] = useState(state.user?.jobDescription || "");
  const [kind, setKind] = useState(state.user?.interviewType || "Mixed");
  const [resume, setResume] = useState(state.user?.resume || "");
  const [company, setCompany] = useState(state.user?.companyContext || "");
  const [projects, setProjects] = useState(state.user?.projects || "");
  const complete = () => {
    update((s) => ({
      ...s,
      onboarding: true,
      user: s.user
        ? {
            ...s.user,
            goal,
            resume,
            companyContext: company,
            projects,
            jobDescription: job,
            interviewType: kind,
          }
        : null,
    }));
    router.push("/dashboard");
  };
  return (
    <div className="setup">
      <div className="setup-head">
        <ClyvoLogo />
        <span>SETUP / 01</span>
      </div>
      <div className="setup-body">
        <span className="eyebrow">MAKE CLYVO YOURS</span>
        <h1>Give CLYVO useful context.</h1>
        <p>
          These details make local suggestions more relevant. You can change
          them later.
        </p>
        <div className="form-grid">
          <Field
            label="Primary goal"
            value={goal}
            onChange={setGoal}
            placeholder="Prepare for interviews"
          />
          <Field
            label="Professional role"
            value={state.user?.role || ""}
            onChange={(v) =>
              update((s) => ({
                ...s,
                user: s.user ? { ...s.user, role: v } : null,
              }))
            }
          />
          <Field
            label="Resume summary"
            value={resume}
            onChange={setResume}
            multiline
            placeholder="Your real work and skills"
          />
          <ResumeImport onApply={setResume} />
          <Field
            label="Job description"
            value={job}
            onChange={setJob}
            multiline
          />
          <label className="field">
            <span>Preferred interview type</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {[
                "Mixed",
                "Behavioral",
                "Technical",
                "Coding",
                "System Design",
                "HR",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Field
            label="Projects"
            value={projects}
            onChange={setProjects}
            multiline
            placeholder="Projects you can discuss"
          />
          <Field
            label="Company context"
            value={company}
            onChange={setCompany}
            multiline
            placeholder="A company you are preparing for"
          />
        </div>
        <div className="row">
          <Button onClick={complete}>
            Continue to dashboard <ArrowRight size={16} />
          </Button>
          <Button variant="secondary" onClick={complete}>
            Skip for now
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              replace(sampleState());
              router.push("/dashboard");
            }}
          >
            Use sample data
          </Button>
        </div>
        <p className="muted small-text">
          Sample data is fictional and replaces this local profile.
        </p>
      </div>
    </div>
  );
}
