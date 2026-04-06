// ./components/script/ScriptModeToggle.jsx
import React from "react";
import { Code1, TextBlock } from "iconsax-react";

export default function ScriptModeToggle({ value = "form", onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
      <button
        type="button"
        onClick={() => onChange("form")}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          value === "form"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-white hover:text-slate-900"
        }`}
      >
        <TextBlock size="18" color="currentColor" />
        Form
      </button>

      <button
        type="button"
        onClick={() => onChange("script")}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          value === "script"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-white hover:text-slate-900"
        }`}
      >
        <Code1 size="18" color="currentColor" />
        Script
      </button>
    </div>
  );
}
