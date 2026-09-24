"use client";
import { useState } from "react";
import { Pin, Plus, X } from "lucide-react";
import { useApp } from "@/providers/app";
import { MemoryType, now, uid } from "@/lib/model";
import { Dialog } from "@/components/dialog";
import { Button, Card, Empty, SectionTitle, Field } from "@/components/ui";
import { useSearchParams } from "next/navigation";
export default function Memory() {
  const params = useSearchParams();
  const { state, update } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<MemoryType["type"]>("Custom");
  const [tags, setTags] = useState("");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Recent");
  const [open, setOpen] = useState(params.get("new") === "1");
  function reset() {
    setEditing(null);
    setTitle("");
    setContent("");
    setType("Custom");
    setTags("");
    setOpen(false);
  }
  function edit(m: MemoryType) {
    setEditing(m.id);
    setTitle(m.title);
    setContent(m.content);
    setType(m.type);
    setTags(m.tags.join(", "));
    setOpen(true);
  }
  function save() {
    if (!title.trim() || !content.trim()) return;
    const item: MemoryType = {
      id: editing || uid(),
      title: title.trim(),
      content: content.trim(),
      type,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: editing
        ? state.memories.find((x) => x.id === editing)?.createdAt || now()
        : now(),
      updatedAt: now(),
      pinned: editing
        ? !!state.memories.find((x) => x.id === editing)?.pinned
        : false,
    };
    update((s) => ({
      ...s,
      memories: editing
        ? s.memories.map((x) => (x.id === editing ? item : x))
        : [item, ...s.memories],
    }));
    reset();
  }
  const items = state.memories
    .filter(
      (m) =>
        (filter === "All" || m.type === filter) &&
        (m.title + " " + m.content + " " + m.tags.join(" "))
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Title"
        ? a.title.localeCompare(b.title)
        : Number(b.pinned) - Number(a.pinned) ||
          b.updatedAt.localeCompare(a.updatedAt),
    );
  return (
    <>
      <SectionTitle
        title="Memory"
        subtitle="Keep the useful parts of your experience close."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add memory
          </Button>
        }
      />
      <div className="filter-row">
        <input
          aria-label="Search memories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories…"
        />
        <select
          aria-label="Filter type"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {[
            "All",
            "Profile",
            "Project",
            "Story",
            "Skill",
            "Achievement",
            "Company",
            "Interview Answer",
            "Custom",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          aria-label="Sort memories"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>Recent</option>
          <option>Title</option>
        </select>
      </div>
      {items.length ? (
        <div className="memory-grid">
          {items.map((m) => (
            <Card
              key={m.id}
              className={params.get("id") === m.id ? "highlight-record" : ""}
            >
              <div className="memory-top">
                <span className="tag">{m.type}</span>
                <button
                  className="icon-button"
                  aria-label={m.pinned ? "Unpin" : "Pin"}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      memories: s.memories.map((x) =>
                        x.id === m.id ? { ...x, pinned: !x.pinned } : x,
                      ),
                    }))
                  }
                >
                  <Pin size={17} fill={m.pinned ? "currentColor" : "none"} />
                </button>
              </div>
              <h3>{m.title}</h3>
              <p>{m.content}</p>
              <div className="tag-row">
                {m.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="card-actions">
                <button onClick={() => edit(m)}>Edit</button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete “${m.title}”?`))
                      update((s) => ({
                        ...s,
                        memories: s.memories.filter((x) => x.id !== m.id),
                      }));
                  }}
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty
          title="No memories found"
          copy={
            query || filter !== "All"
              ? "Try another search or filter."
              : "Save useful context and CLYVO can use it during conversations."
          }
          action={<Button onClick={() => setOpen(true)}>Add memory</Button>}
        />
      )}{" "}
      {open && (
        <Dialog label={editing ? "Edit memory" : "Add memory"} onClose={reset}>
          <div className="panel-title">
            <h2>{editing ? "Edit" : "Add"} memory</h2>
            <button className="icon-button" aria-label="Close" onClick={reset}>
              <X size={18} />
            </button>
          </div>
          <Field label="Title" value={title} onChange={setTitle} />
          <label className="field">
            <span>Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MemoryType["type"])}
            >
              {[
                "Profile",
                "Project",
                "Story",
                "Skill",
                "Achievement",
                "Company",
                "Interview Answer",
                "Custom",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <Field
            label="Content"
            value={content}
            onChange={setContent}
            multiline
          />
          <Field
            label="Tags (comma separated)"
            value={tags}
            onChange={setTags}
          />
          <Button disabled={!title.trim() || !content.trim()} onClick={save}>
            Save memory
          </Button>
        </Dialog>
      )}
    </>
  );
}
