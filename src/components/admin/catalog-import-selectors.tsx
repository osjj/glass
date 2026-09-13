"use client";

import { useState } from "react";

type SourceOption = { id: string; label: string; sourcePath: string; targetCategoryId?: string };
type TargetOption = { id: string; label: string };
const inputClass = "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)]";

export function CatalogImportSelectors({ sources, targets, defaultSource, defaultTarget, provider }: {
  sources: SourceOption[]; targets: TargetOption[]; defaultSource: string; defaultTarget: string; provider: string;
}) {
  const [source, setSource] = useState(defaultSource);
  const [target, setTarget] = useState(defaultTarget || sources.find((item) => item.id === defaultSource)?.targetCategoryId || "");
  return <>
    <label className="text-sm font-black">{provider} source category
      <select className={inputClass} name="sourceCategoryId" value={source} required onChange={(event) => {
        setSource(event.target.value);
        setTarget(sources.find((item) => item.id === event.target.value)?.targetCategoryId || "");
      }}>
        <option value="" disabled>Select a source category</option>
        {sources.map((item) => <option key={item.id} value={item.id}>{item.label} ({item.sourcePath})</option>)}
      </select>
    </label>
    <label className="text-sm font-black">Target Glarivo category
      <select className={inputClass} name="categoryId" value={target} onChange={(event) => setTarget(event.target.value)} required>
        <option value="" disabled>Select a category</option>
        {targets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
  </>;
}
