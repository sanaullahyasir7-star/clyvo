"use client";
import Link from "next/link";
import { ClyvoLogo } from "@/components/brand";
import { Card, SectionTitle } from "@/components/ui";
export default function Help() {
  return (
    <div className="help-page">
      <header className="row">
        <ClyvoLogo />
        <Link className="button secondary" href="/dashboard">
          Open workspace
        </Link>
        <Link className="text-link" href="/">
          Home
        </Link>
      </header>
      <SectionTitle
        title="Help and privacy"
        subtitle="Know what CLYVO does and where your data goes."
      />
      <div className="two-col">
        <Card>
          <h2>Start in a few minutes</h2>
          <ol>
            <li>
              Create a local profile. A nickname is enough; email is optional.
            </li>
            <li>
              Import your CV as PDF or Word .docx, review the extracted text,
              and add a real project or work example in Memory.
            </li>
            <li>Choose an interview type and create a preparation brief.</li>
            <li>
              Practice by typing answers. Save the session to review it later.
            </li>
            <li>
              Download a JSON backup from Settings before switching devices.
            </li>
          </ol>
          <p>
            Live also supports manual questions and clearly labeled simulations.
            You do not need a microphone or screen sharing to use CLYVO.
          </p>
        </Card>
        <Card>
          <h2>Optional free local AI</h2>
          <p>
            Live offers an optional Qwen2.5 1.5B model through WebLLM. Enable it in Live to download model files from Hugging Face and MLC. It requires WebGPU, roughly 1 GB of download and around 2 GB of GPU memory. CV context and questions are processed on your device for answer generation. Downloads expose ordinary network information to those hosts. Without the model, clearly labeled template guidance remains available. Neither mode verifies facts or predicts interview outcomes.
          </p>
          <p>
            Review prompts help you check structure and evidence. They are not
            an assessment of your ability. Screen sharing only provides a
            preview; CLYVO does not understand screenshots.
          </p>
        </Card>
        <Card>
          <h2>Storage and backups</h2>
          <p>
            Your profile, text, notes, and sessions are saved in this browser’s
            local storage. There is no cloud account or cross-device sync.
            Anyone with access to this browser profile may be able to read them.
          </p>
          <p>
            Private browsing, storage cleanup, device loss, or browser limits
            can remove data. Use Settings → Export JSON regularly. Exports
            contain your full workspace, so keep them private.
          </p>
          <p>
            The saved indicator reports local saving. If saving fails, keep the
            tab open and export. If another tab changes the workspace, saving
            pauses to prevent overwrites.
          </p>
        </Card>
        <Card>
          <h2>Microphone and screen permissions</h2>
          <p>
            Speech recognition is optional and browser dependent. Your browser
            may send audio to its speech-service provider. CLYVO does not store
            audio recordings; recognized text is saved with your session.
          </p>
          <p>
            The audio monitor in Settings checks your microphone locally. It is
            separate from speech recognition, which uses the browser’s default
            microphone.
          </p>
          <p>
            Screen sharing starts only after you click and select a source.
            Previews and snapshots are temporary and are not included in
            exports. Stop sharing when you are done.
          </p>
          <p>
            Get participants’ permission before transcribing a conversation.
            Follow your interview, meeting, workplace, or assessment rules.
          </p>
        </Card>
        <Card>
          <h2>Troubleshooting</h2>
          <details>
            <summary>My microphone does not work</summary>
            <p>
              Check the browser’s site permission and your operating system’s
              input device. Browser speech recognition may also require internet
              access. Use typed input if recognition is unsupported or denied.
            </p>
          </details>
          <details>
            <summary>My work is missing</summary>
            <p>
              Check that you are using the same browser profile and site
              address. Import your JSON backup in Settings. Review the previous
              local snapshot if one is available. A backup cannot recover data
              after all browser storage has been erased.
            </p>
          </details>
          <details>
            <summary>An import was rejected</summary>
            <p>
              Choose an unmodified CLYVO JSON export up to 5 MB. Review the
              preview before merging or replacing. Files with an unsupported
              schema are rejected rather than silently changed.
            </p>
          </details>
        </Card>
        <Card>
          <h2>Public beta</h2>
          <p>
            CLYVO is a free preparation and note-taking tool. Manual workflows
            are the dependable fallback when optional browser features are
            unavailable.
          </p>
          <p>
            CLYVO includes no advertising or analytics SDK. GitHub Pages serves
            the app and receives normal web requests, including network
            information. Browser speech services may have separate data
            practices.
          </p>
          <a
            className="button secondary"
            href="https://github.com/sanaullahyasir7-star/clyvo/issues"
            target="_blank"
            rel="noreferrer"
          >
            Report a problem on GitHub
          </a>
          <p className="small-text">
            Issues are public. Describe the steps and browser version; do not
            attach private transcripts, resumes, or exported workspaces.
          </p>
        </Card>
      </div>
    </div>
  );
}
