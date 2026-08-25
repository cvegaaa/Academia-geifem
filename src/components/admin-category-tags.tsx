"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui";

export function CategoryTagsInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
}) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <Badge key={tag}>
            <span className="flex items-center gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                <X size={12} />
              </button>
            </span>
          </Badge>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(draft);
            }
          }}
          placeholder="Agregar categoría..."
          list="categorias-existentes"
          className="min-w-40 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-ink outline-none hover:border-border focus:border-border"
        />
        <datalist id="categorias-existentes">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={() => addTag(draft)}
          className="flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-700"
        >
          <Plus size={12} /> Agregar
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-soft">Enter o coma para agregar cada categoría.</p>
    </div>
  );
}
