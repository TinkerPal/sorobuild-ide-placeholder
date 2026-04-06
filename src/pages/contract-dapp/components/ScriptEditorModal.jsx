// ./components/script/ScriptEditorModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Code1, CloseCircle, PlayCircle } from "iconsax-react";
import { X } from "lucide-react";

import {
  getScriptHelp,
  getScriptTemplate,
} from "../../../utils/scriptTemplates";
import { runUserScript } from "../../../utils/scriptRuntime";
import { runBuilderScript } from "../../../utils/helper-functions";

function ScriptCodeEditor({ value, onChange, editorRef }) {
  function handleEditorWillMount(monaco) {
    const tsApi = monaco.languages?.typescript ?? monaco.typescript;
    if (!tsApi?.javascriptDefaults) return;

    tsApi.javascriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
      target: tsApi.ScriptTarget?.ES2020,
      moduleResolution: tsApi.ModuleResolutionKind?.NodeJs,
      noEmit: true,
    });

    tsApi.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    tsApi.javascriptDefaults.setEagerModelSync?.(true);

    tsApi.javascriptDefaults.addExtraLib(
      `
    declare module "@stellar/stellar-sdk" {
      export type scval_type =
        | "address"
        | "string"
        | "symbol"
        | "bool"
        | "i128"
        | "i64"
        | "u32"
        | "u64"
        | "bytes"
        | (string & {});
    
      export interface native_to_scval_options {
        type?: scval_type;
      }
    
      export function nativeToScVal(
        value: any,
        options?: native_to_scval_options
      ): any;
    
      export class Address {
        constructor(value: string);
        toScVal(): any;
        static fromString(value: string): Address;
      }
    
      export class Asset {
        constructor(code: string, issuer?: string);
        static native(): Asset;
      }
    
      export const Operation: {
        changeTrust: (opts: any) => any;
        payment: (opts: any) => any;
        manageData: (opts: any) => any;
        setOptions: (opts: any) => any;
        createAccount: (opts: any) => any;
        [key: string]: any;
      };
    
      export const xdr: any;
    
      const StellarSdk: {
        nativeToScVal: typeof nativeToScVal;
        Address: typeof Address;
        Asset: typeof Asset;
        Operation: typeof Operation;
        xdr: typeof xdr;
        [key: string]: any;
      };
    
      export default StellarSdk;
    }
    
    type scval_type =
      | "address"
      | "string"
      | "symbol"
      | "bool"
      | "i128"
      | "i64"
      | "u32"
      | "u64"
      | "bytes"
      | (string & {});
    
    interface native_to_scval_options {
      type?: scval_type;
    }
    
    declare const StellarSdk: {
      nativeToScVal: (
        value: any,
        options?: native_to_scval_options
      ) => any;
      Address: any;
      Asset: any;
      Operation: any;
      xdr: any;
      [key: string]: any;
    };
    declare const sdk: typeof StellarSdk;
    declare const nativeToScVal: typeof StellarSdk.nativeToScVal;
    declare const Address: typeof StellarSdk.Address;
    declare const Asset: typeof StellarSdk.Asset;
    declare const Operation: typeof StellarSdk.Operation;
    declare const xdr: typeof StellarSdk.xdr;
    declare const Buffer: {
      from: (
        data: string | number[] | ArrayBuffer,
        encoding?: "hex" | "utf8" | "base64"
      ) => any;
    };
    
    declare function address(value: string): any;
    declare function string(value: string): any;
    declare function symbol(value: string): any;
    declare function bool(value: boolean): any;
    declare function i128(value: bigint | number | string): any;
    declare function i64(value: bigint | number | string): any;
    declare function u32(value: number | string): any;
    declare function u64(value: bigint | number | string): any;
    declare function bytes(value: any): any;
    declare function scval(value: any, type?: scval_type): any;
    
    declare const context: {
      userKey?: string;
      network?: any;
      contractId?: string;
      selectedOperation?: any;
      assetOperation?: string;
    };
    
    declare let args: any[];
    declare let payload: Record<string, any>;
    declare let operations: Array<{
      id?: string;
      type?: string;
      label?: string;
      values?: Record<string, any>;
    }>;
    declare let result: any;
      `,
      "ts:filename/stellar-sdk-runtime.d.ts"
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl h-full   border border-slate-800">
      <Editor
        path="script.js"
        // height="clamp(260px, 42vh, 470px)"
        height="clamp(200px, 60vh, 800px)"
        defaultLanguage="javascript"
        value={value}
        onChange={(next) => onChange(next || "")}
        beforeMount={handleEditorWillMount}
        onMount={(editor) => {
          if (editorRef) editorRef.current = editor;
        }}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          parameterHints: { enabled: true },
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}

function PreviewPanel({ preview, setPreview, getPreviewSummary }) {
  if (!preview) return null;

  return (
    <div className="mt-3 relative  pb-2 flex flex-col rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
      <button
        type="button"
        onClick={() => setPreview(null)}
        className="inline-flex absolute right-2 top-2 h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/60 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <X size={18} />
        {/* <CloseCircle size="18" color="currentColor" /> */}
      </button>
      <div className="border-b border-emerald-200 px-4 py-3">
        <h4 className="text-sm font-semibold text-emerald-900">Preview</h4>
        <p className="mt-1 text-xs text-emerald-700">
          Parsed output from the current script.
        </p>
      </div>

      <div className=" max-h-[250px] overflow-auto px-4 py-4 sm:max-h-[500px]">
        <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-emerald-900">
          {JSON.stringify(
            {
              kind: preview.kind,
              summary: getPreviewSummary(preview.value),
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

function ScriptStatusMessage({ error, preview }) {
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <div className="text-sm font-semibold text-rose-800">
          Preview failed
        </div>
        <p className="mt-1 text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-sm font-semibold text-emerald-800">
          Script preview OK
        </div>
        <p className="mt-1 text-sm text-emerald-700">
          The script ran successfully and returned a valid{" "}
          <code>{preview.kind}</code> result.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-800">Preview status</div>
      <p className="mt-1 text-sm text-slate-600">
        Run preview to validate the current script before applying it.
      </p>
    </div>
  );
}

export default function ScriptEditorModal({
  open,
  onClose,
  title = "Script Editor",
  scriptKind = "args",
  initialScript = "",
  context = {},
  onApply,
}) {
  const [script, setScript] = useState("");

  const [error, setError] = useState("failed");
  const [preview, setPreview] = useState(null);

  const editorRef = useRef(null);

  const helpText = useMemo(() => getScriptHelp(scriptKind), [scriptKind]);
  const placeholder = useMemo(
    () => getScriptTemplate(scriptKind),
    [scriptKind]
  );

  useEffect(() => {
    if (!open) return;
    const nextScript = initialScript?.trim() ? initialScript : placeholder;
    setScript(nextScript);
    setError("");
    setPreview(null);
  }, [open, initialScript, placeholder]);

  if (!open) return null;

  function getCurrentScript() {
    if (editorRef.current && typeof editorRef.current.getValue === "function") {
      return editorRef.current.getValue();
    }
    return script;
  }

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

  function getPreviewSummary(value) {
    if (Array.isArray(value)) {
      return {
        entries: value.length,
        sample: value.slice(0, 2),
      };
    }

    if (value && typeof value === "object") {
      return {
        keys: Object.keys(value),
        sample: value,
      };
    }

    return { value };
  }

  function handleRunPreview() {
    try {
      const currentScript = getCurrentScript();
      const result = runUserScript(currentScript, context);
      runBuilderScript(script);

      validateShape(result);
      setScript(currentScript);
      setPreview(result);
      setError("");
    } catch (e) {
      setPreview(null);
      setError(e?.message || "Invalid script");
    }
  }

  function handleApply() {
    try {
      const currentScript = getCurrentScript();
      const result = runUserScript(currentScript, context);
      const readableOperations = runBuilderScript(currentScript);

      validateShape(result);
      setScript(currentScript);
      onApply?.(result, currentScript, readableOperations);
      setError("");
      onClose?.();
    } catch (e) {
      setError(e?.message || "Invalid script");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/55 px-3 py-3 sm:px-4 sm:py-6">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:h-[92vh]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4  sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Code1 size="20" color="currentColor" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Write JavaScript and return <code>{scriptKind}</code>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={18} />
            {/* <CloseCircle size="18" color="currentColor" /> */}
          </button>
        </div>

        <div className="flex-1   overflow-y-auto lg:overflow-hidden">
          <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
              <div className="px-4 py-4 gap-2 h-full  flex flex-col ">
                <div className=" min-h-0 ">
                  <ScriptCodeEditor
                    value={script}
                    onChange={setScript}
                    editorRef={editorRef}
                  />
                </div>

                <ScriptStatusMessage error={error} preview={preview} />
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 px-4 py-4 sm:px-5 lg:overflow-y-auto">
              <PreviewPanel
                setPreview={setPreview}
                preview={preview}
                getPreviewSummary={getPreviewSummary}
              />
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-900">
                  Script shape sample
                </h4>
                <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                  {helpText}
                </pre>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-900">
                  Starter Code
                </h4>
                <pre className="mt-2 overflow-x-auto text-xs leading-5 text-slate-600">
                  {placeholder}
                </pre>
              </div>

              {/* <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-900">
                  Supported helpers
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    "StellarSdk",
                    "sdk",
                    "nativeToScVal",
                    "address",
                    "string",
                    "symbol",
                    "bool",
                    "i128",
                    "i64",
                    "u32",
                    "u64",
                    "bytes",
                    "scval",
                    "context",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-2 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={handleRunPreview}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            <PlayCircle size="18" color="currentColor" />
            Run preview
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Apply script
          </button>
        </div>
      </div>
    </div>
  );
}
