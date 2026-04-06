import React, { useMemo, useState } from "react";
import { Copy, DocumentCode, CommandSquare } from "iconsax-react";
import {
  BASE_FEE,
  createContractMainnet,
  loadContractMainnet,
  sendTransactionMainnet,
  submitLoadContract,
} from "../../utils/soroban";
import { useStates } from "../../contexts/StatesContext";
import {
  showErrorToast,
  showSuccessToast,
} from "../../components/ToastComponent";
import { useNavigate } from "react-router-dom";
import SelectField from "./components/SelectField";

import ScriptModeToggle from "./components/ScriptModeToggle";
import ScriptEditorModal from "./components/ScriptEditorModal";
import { nativeToScVal } from "@stellar/stellar-sdk";
import { processArgs } from "../../utils/helper-functions";

const typeOptions = [
  { value: "Address", label: "Address" },
  { value: "i128", label: "i128" },
  { value: "u32", label: "u32" },
  { value: "u64", label: "u64" },
  { value: "bool", label: "bool" },
  { value: "string", label: "string" },
  { value: "symbol", label: "symbol" },
  { value: "bytes", label: "bytes" },
];

const constructorCountOptions = [0, 1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: n === 0 ? "Zero args" : `${n} ${n === 1 ? "arg" : "args"}`,
}));

export default function DeployContract() {
  const [file, setFile] = useState(null);
  const [loadOnly, setLoadOnly] = useState(false);
  const [argCount, setArgCount] = useState(0);
  const [args, setArgs] = useState([]);
  const [loadedWasm, setLoadedWasm] = useState(null);

  const [inputMode, setInputMode] = useState("");
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [constructorScript, setConstructorScript] = useState("");
  const [scriptArgs, setScriptArgs] = useState([]);

  const {
    userKey,
    connecting,
    setConnecting,
    network,
    contractAddr,
    setContractAddr,
  } = useStates();

  const navigate = useNavigate();

  function useInInvokeHandler() {
    if (!contractAddr || !network?.network) return;
    navigate(`/contract/${network.network.toLowerCase()}/${contractAddr}`);
  }

  const canDeploy = useMemo(
    () => Boolean(userKey && file && network),
    [userKey, file, network]
  );

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  }

  function generateArgs(count) {
    const newArgs = Array.from({ length: count }).map((_, i) => ({
      id: i,
      type: "string",
      value: "",
    }));
    setArgs(newArgs);
  }

  function handleArgCountChange(count) {
    setArgCount(count);
    generateArgs(count);
  }

  function updateArg(id, key, value) {
    setArgs((prev) =>
      prev.map((arg) => (arg.id === id ? { ...arg, [key]: value } : arg))
    );
  }

  function addArg() {
    if (args.length >= 15) return;
    const newArg = {
      id: Date.now(),
      type: "string",
      value: "",
    };
    setArgs((prev) => [...prev, newArg]);
    setArgCount((prev) => prev + 1);
  }

  function getConstructorScriptInitialValue() {
    if (constructorScript?.trim()) return constructorScript;

    if (args.length > 0) {
      return `args = [
${args
  .map(
    (arg) =>
      `  nativeToScVal(${formatJsValue(
        arg.value,
        arg.type
      )}, { type: "${normalizeScriptType(arg.type)}" })`
  )
  .join(",\n")}
];`;
    }

    return `args = [
  nativeToScVal("Hello World"),
  nativeToScVal("GC4O26MXQN72WX5SG7BOIV2N72RVDOLXN33BJFDJW3RS3FEBMRXPD56U", {type: "address"}),
  nativeToScVal('100', {type: "i128"}),
];`;
  }

  function handleApplyConstructorScript(result, script) {
    setConstructorScript(script);

    console.log("the constructor script is", script);
    console.log("the result value", result?.value);
    setScriptArgs(Array.isArray(result?.value) ? result.value : []);
  }

  async function copyHandler() {
    try {
      if (loadOnly) {
        if (loadedWasm) {
          await navigator.clipboard.writeText(loadedWasm);
          showSuccessToast("Wasm hash copied successfully");
        }
        return;
      }

      if (contractAddr) {
        await navigator.clipboard.writeText(contractAddr);
        showSuccessToast("Contract copied successfully");
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to copy");
    }
  }

  async function uploadWasm() {
    const signedTx = await loadContractMainnet(
      file,
      userKey,
      BASE_FEE,
      network
    );

    return submitLoadContract(signedTx, network);
  }

  async function createContract(wasm, constructorArgsXdr) {
    const signedTx = await createContractMainnet(
      wasm,
      userKey,
      network,
      constructorArgsXdr
    );
    return sendTransactionMainnet(signedTx, network);
  }

  async function handleCreateContract(e) {
    e.preventDefault();
    if (!canDeploy) return;

    try {
      setConnecting(true);

      const wasm = (await uploadWasm())?.data?.resultMetaJson?.v4?.soroban_meta
        ?.return_value?.bytes;

      if (wasm) {
        setLoadedWasm(wasm);
      }

      if (loadOnly) {
        return;
      }

      const finalConstructorArgs =
        inputMode === "script"
          ? scriptArgs
          : args.map((arg) => processArgs(arg));

      const constructorArgsXdr = finalConstructorArgs.map((arg) =>
        arg.toXDR("base64")
      );

      const createRes = await createContract(wasm, constructorArgsXdr);
      const address =
        createRes?.resultMetaJson?.v4?.soroban_meta?.return_value?.address ||
        "";

      setContractAddr(address);

      if (address) {
        showSuccessToast("Contract deployed successfully", address);
      }
    } catch (e) {
      console.error(e);
      showErrorToast(e?.message || "Failed to deploy contract");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h3 className="text-base font-semibold text-slate-900">
            Deploy contract
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload a compiled Soroban `.wasm` file and deploy it using the
            connected wallet.
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <form onSubmit={handleCreateContract} className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      <DocumentCode size="22" color="currentColor" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        Contract build file
                      </h4>
                      <p className="text-sm text-slate-500">
                        Upload your compiled `.wasm` file.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                    {file ? (
                      <span className="font-medium text-slate-900">
                        {file.name}
                      </span>
                    ) : (
                      "No file selected yet"
                    )}
                  </div>
                </div>

                <div className="flex  items-center shrink-0 sm:flex-col sm:items-start gap-3 sm:justify-between">
                  <label
                    htmlFor="deploy-wasm-upload"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Choose file
                  </label>
                  <input
                    id="deploy-wasm-upload"
                    type="file"
                    accept=".wasm"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <label className="inline-flex  items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={loadOnly}
                      onChange={(e) => setLoadOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    Load Wasm only
                  </label>
                </div>
              </div>
            </div>

            {!loadOnly && (
              <>
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Add constructor arguments using:
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Switch between guided constructor inputs and JavaScript
                      script mode.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <ScriptModeToggle
                      value={inputMode}
                      onChange={(mode) => {
                        setInputMode(mode);
                        if (mode === "script") {
                          setShowScriptModal(true);
                        }
                      }}
                    />
                  </div>
                </div>

                {inputMode === "form" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:gap-0  sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Add Constructor arguments
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Add constructor inputs for contracts that require
                          initialization arguments.
                        </p>
                      </div>

                      <div className=" ">
                        <SelectField
                          label=""
                          className="w-[150px]"
                          value={String(argCount)}
                          onChange={(val) => handleArgCountChange(Number(val))}
                          options={constructorCountOptions}
                        />
                      </div>
                    </div>

                    {args.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {args.map((arg) => (
                          <div
                            key={arg.id}
                            className="flex flex-col gap-3 md:flex-row"
                          >
                            <div className="md:w-1/3">
                              <SelectField
                                label="Type"
                                value={arg.type}
                                onChange={(val) =>
                                  updateArg(arg.id, "type", val)
                                }
                                options={typeOptions}
                              />
                            </div>

                            <div className="md:w-2/3">
                              <Field
                                label="Value"
                                value={arg.value}
                                onChange={(e) =>
                                  updateArg(arg.id, "value", e.target.value)
                                }
                                placeholder={`Enter ${arg.type}`}
                              />
                            </div>
                          </div>
                        ))}

                        {args.length >= 6 && args.length < 15 && (
                          <button
                            type="button"
                            onClick={addArg}
                            className="text-sm font-semibold text-slate-700 transition hover:text-slate-900 hover:underline"
                          >
                            + Add argument
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {inputMode === "script" && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex justify-between">
                      {" "}
                      <div>
                        {" "}
                        <p className="text-sm font-semibold text-blue-900">
                          Script mode enabled
                        </p>
                        <p className="mt-1 text-sm text-blue-800">
                          Constructor arguments will be taken from your
                          JavaScript script output.
                        </p>
                        <p className="mt-2 text-xs text-blue-700">
                          Expected shape: <code>args = [ ... ]</code>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowScriptModal(true)}
                        className="items-center justify-center rounded-2xl border border-slate-300 bg-white px-4  text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit script
                      </button>
                    </div>

                    {scriptArgs?.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-white px-3 py-3 text-sm text-blue-900">
                        Loaded script arguments: {scriptArgs.length}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-white px-3 py-3 text-sm text-blue-900">
                        No script arguments applied yet.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {loadOnly && loadedWasm ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-emerald-900">
                      Contract wasm loaded successfully
                    </div>

                    <div className="mt-2 flex flex-col gap-1">
                      <div className="text-sm font-medium text-emerald-900">
                        Wasm Hash
                      </div>
                      <div className="break-all text-sm text-emerald-800">
                        {loadedWasm}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyHandler}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300 bg-white text-emerald-900 transition hover:bg-emerald-100"
                    >
                      <Copy size="18" color="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {contractAddr ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-emerald-900">
                      Contract created successfully
                    </div>
                    <div className="mt-1 break-all text-sm text-emerald-800">
                      {contractAddr}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={useInInvokeHandler}
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
                    >
                      <CommandSquare size="18" color="currentColor" />
                      <span className="ml-2">Invoke</span>
                    </button>

                    <button
                      type="button"
                      onClick={copyHandler}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300 bg-white text-emerald-900 transition hover:bg-emerald-100"
                    >
                      <Copy size="18" color="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canDeploy || connecting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting
                ? "Processing..."
                : loadOnly
                ? `Load Wasm on ${network?.network || "network"}`
                : `Deploy contract to ${network?.network || "network"}`}
            </button>
          </form>
        </div>
      </section>

      <ScriptEditorModal
        open={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Constructor Script"
        scriptKind="args"
        initialScript={getConstructorScriptInitialValue()}
        context={{
          userKey,
          network,
          contractId: contractAddr || "",
        }}
        onApply={handleApplyConstructorScript}
      />
    </div>
  );
}

function Field({ label, help, className = "", ...props }) {
  return (
    <div className={className}>
      {label ? (
        <label className="mb-2 block text-sm font-semibold text-slate-900">
          {label}
        </label>
      ) : null}
      <input
        {...props}
        className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-900"
      />
      {help ? <p className="mt-2 text-xs text-slate-500">{help}</p> : null}
    </div>
  );
}

function normalizeScriptType(type) {
  if (!type) return "string";
  return String(type).toLowerCase();
}

function formatJsValue(value, type) {
  const normalizedType = normalizeScriptType(type);

  if (normalizedType === "bool") {
    return value === true || value === "true" ? "true" : "false";
  }

  if (normalizedType === "u32") {
    return value?.toString?.() || "0";
  }

  if (normalizedType === "i128" || normalizedType === "u64") {
    const raw = value?.toString?.() || "0";
    return raw.endsWith("n") ? raw : `${raw}n`;
  }

  return JSON.stringify(value ?? "");
}
