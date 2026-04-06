// ./components/script/ScriptEditorModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Code1, CloseCircle, PlayCircle } from "iconsax-react";

import {
  getScriptHelp,
  getScriptTemplate,
} from "../../../utils/scriptTemplates";
import { runUserScript } from "../../../utils/scriptRuntime";

export default function ScriptEditorModal({
  open,
  onClose,
  title = "Script Editor",
  scriptKind = "args", // "args" | "payload" | "operations"
  initialScript = "",
  context = {},
  onApply,
}) {
  const [script, setScript] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const helpText = useMemo(() => getScriptHelp(scriptKind), [scriptKind]);
  const placeholder = useMemo(
    () => getScriptTemplate(scriptKind),
    [scriptKind]
  );

  useEffect(() => {
    if (!open) return;
    setScript(initialScript?.trim() ? initialScript : placeholder);
    setError("");
    setPreview(null);
  }, [open, initialScript, placeholder]);

  if (!open) return null;

  function validateShape(result) {
    if (scriptKind === "args") {
      if (!result || result.kind !== "args" || !Array.isArray(result.value)) {
        throw new Error("Script must return: args = [ ... ]");
      }
      return;
    }

    if (scriptKind === "payload") {
      if (
        !result ||
        result.kind !== "payload" ||
        typeof result.value !== "object" ||
        Array.isArray(result.value) ||
        !result.value
      ) {
        throw new Error("Script must return: payload = { ... }");
      }
      return;
    }

    if (scriptKind === "operations") {
      if (
        !result ||
        result.kind !== "operations" ||
        !Array.isArray(result.value)
      ) {
        throw new Error("Script must return: operations = [ ... ]");
      }
    }
  }

  function handleRunPreview() {
    try {
      const result = runUserScript(script, context);
      validateShape(result);
      setPreview(result);
      setError("");
    } catch (e) {
      setPreview(null);
      setError(e?.message || "Invalid script");
    }
  }

  function handleApply() {
    try {
      const result = runUserScript(script, context);
      validateShape(result);
      onApply?.(result, script);
      setError("");
      onClose?.();
    } catch (e) {
      setError(e?.message || "Invalid script");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Code1 size="20" color="currentColor" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Write JavaScript and return {scriptKind}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <CloseCircle size="18" color="currentColor" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 border-b border-slate-200 lg:border-b-0 lg:border-r">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              spellCheck={false}
              className="h-[470px] w-full resize-none border-0 bg-slate-950 px-5 py-4 font-mono text-sm leading-6 text-slate-100 outline-none"
            />
          </div>

          <div className="space-y-4 overflow-y-auto bg-slate-50 px-5 py-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-900">
                Script shape
              </h4>
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                {helpText}
              </pre>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-900">Starter</h4>
              <pre className="mt-2 overflow-x-auto text-xs leading-5 text-slate-600">
                {placeholder}
              </pre>
            </div>

            {preview ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-sm font-semibold text-emerald-900">
                  Preview OK
                </h4>
                <pre className="mt-2 overflow-x-auto text-xs leading-5 text-emerald-800">
                  {JSON.stringify(
                    {
                      kind: preview.kind,
                      size: Array.isArray(preview.value)
                        ? preview.value.length
                        : Object.keys(preview.value || {}).length,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={handleRunPreview}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <PlayCircle size="18" color="currentColor" />
            Run preview
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Apply script
          </button>
        </div>
      </div>
    </div>
  );
}
