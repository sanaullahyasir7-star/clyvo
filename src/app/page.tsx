"use client";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Brain,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { ClyvoLogo, ClyvoSymbol } from "@/components/brand";
export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <ClyvoLogo />
        <Link className="button small" href="/auth">
          Open CLYVO <ArrowRight size={15} />
        </Link>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span className="dot" /> CLYVO PUBLIC BETA
          </div>
          <h1>
            Be ready for every
            <br />
            <span>conversation.</span>
          </h1>
          <p>
            Prepare for interviews, practice your answers, and organize meeting
            notes. Free local guidance from your own experience. No API key
            needed.
          </p>
          <div className="row">
            <Link className="button" href="/auth">
              Open CLYVO <ArrowRight size={17} />
            </Link>
            <a className="button secondary" href="#how">
              See how it works
            </a>
          </div>
          <div className="preview" aria-label="Product preview">
            <div className="preview-top">
              <ClyvoLogo />
              <span>
                <span className="dot" /> Live workspace
              </span>
            </div>
            <div className="preview-grid">
              <div>
                <small>LIVE TRANSCRIPT</small>
                <p>“Tell me about a project you are proud of.”</p>
                <span className="mini-line" />
              </div>
              <div>
                <small>CLYVO SUGGESTS</small>
                <strong>Start with your role.</strong>
                <p>Give one specific decision and the result you can verify.</p>
              </div>
              <div>
                <small>YOUR CONTEXT</small>
                <p>
                  Project experience
                  <br />
                  Interview notes
                  <br />
                  Company details
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="how" className="feature-section">
          <div className="section-heading">
            <span className="eyebrow">A CLEARER WAY FORWARD</span>
            <h2>Context when you need it.</h2>
          </div>
          <div className="feature-grid">
            {[
              [
                AudioLines,
                "Live",
                "Capture a conversation or use manual questions. Get short suggestions grounded in your context.",
              ],
              [
                MessageSquareText,
                "Interview preparation",
                "Organize the role, company, projects, and likely questions before the call.",
              ],
              [
                Brain,
                "Memory",
                "Keep stories, skills, and examples close so they can inform future suggestions.",
              ],
              [
                ShieldCheck,
                "Privacy",
                "Local profile and conversation data stay in your browser. Export or erase them at any time.",
              ],
            ].map(([Icon, title, copy]) => (
              <div className="feature" key={title as string}>
                <Icon size={21} />
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <ClyvoSymbol size={42} />
          <h2>Think faster. Speak clearer.</h2>
          <Link className="button" href="/auth">
            Open CLYVO <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <footer>
        CLYVO Public Beta · Rule-based guidance, no generative AI.
        <br />
        <Link className="text-link" href="/help">
          Help, privacy, and browser limitations
        </Link>
      </footer>
    </div>
  );
}
