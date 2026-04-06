import React, { useEffect, useMemo, useState } from "react";
import { Copy, DocumentCode, Code } from "iconsax-react";
import {
  anyInvoke,
  BASE_FEE,
  loadContractMainnet,
  loadContractSpecs,
  sendTransactionMainnet,
  sendTransactionMemoryMainnet,
  xlmToStroop,
} from "../../utils/soroban";
import SelectOperation from "./components/SelectOperation";
import SelectField from "./components/SelectField";
import ScriptEditorModal from "./components/ScriptEditorModal";
import { useStates } from "../../contexts/StatesContext";
import OutputModal from "../../components/OutputModal";
import { useNavigate, useParams } from "react-router-dom";
import { Networks } from "@stellar/stellar-sdk";
import {
  showErrorToast,
  showSuccessToast,
} from "../../components/ToastComponent";
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
  { value: "Wasm", label: "Wasm" },
];

export default function LoadedContract() {
  const {
    userKey,
    setLoadedContractId,
    loadedContractId,
    connecting,
    setConnecting,
    network,
    contractOperations,
    setContractOperations,
    setNetwork,
    selectedTab,
    outputs,
    setOutputs,
    showOutputModal,
    setShowOutputModal,
  } = useStates();

  const { loadedNetwork, contractId } = useParams();

  const [selectedToken, setSelectedToken] = useState("");
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [args, setArgs] = useState([]);
  const [wasmFiles, setWasmFiles] = useState({});

  const [isProcessing, setIsProcessing] = useState(false);

  const [inputMode, setInputMode] = useState("form");
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [invokeScript, setInvokeScript] = useState("");
  const [scriptArgs, setScriptArgs] = useState([]);

  const canInvoke = useMemo(() => {
    return Boolean(userKey && loadedContractId && selectedOperation);
  }, [userKey, loadedContractId, selectedOperation]);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadContractHandler() {
      if (!contractId?.trim() && !loadedNetwork) return;

      const network = {
        network: loadedNetwork?.toUpperCase(),
        networkPassphrase: Networks[loadedNetwork?.toUpperCase()],
      };

      try {
        setIsProcessing(true);
        const contractSpecs = await loadContractSpecs(
          network,
          contractId.trim()
        );

        if (contractSpecs) {
          setLoadedContractId(contractId);
          setContractOperations(contractSpecs);
          setSelectedOperation(null);
          setArgs([]);
          setOutputs(null);
          setShowOutputModal(false);
          setNetwork(network);
          setInputMode("form");
          setInvokeScript("");
          setScriptArgs([]);
          setWasmFiles({});
        } else {
          navigate("/contract");
          setLoadedContractId(null);
          setContractOperations(null);
          setSelectedOperation(null);
          setArgs([]);
          setOutputs(null);
          setShowOutputModal(false);
          setNetwork(network);
          setInputMode("form");
          setInvokeScript("");
          setScriptArgs([]);
          setWasmFiles({});
        }
      } catch (e) {
        console.error(e);
        showErrorToast(e?.message || "Failed to load contract");
      } finally {
        setIsProcessing(false);
      }
    }

    loadContractHandler();
  }, [loadedNetwork, contractId]);

  useEffect(() => {
    setInputMode("form");
    setInvokeScript("");
    setScriptArgs([]);
    setWasmFiles({});
  }, [selectedOperation?.name]);

  async function uploadWasmMainnet(file) {
    const signedTx = await loadContractMainnet(
      file,
      userKey,
      BASE_FEE,
      network
    );
    return sendTransactionMemoryMainnet(userKey, signedTx, network);
  }

  async function anyMainnet(finalArgs) {
    return anyInvoke(
      userKey,
      network,
      loadedContractId,
      selectedOperation?.name,
      finalArgs
    );
  }

  function getFinalInvokeArgs() {
    return inputMode === "script"
      ? scriptArgs
      : args?.map((arg) => processArgs(arg));
  }

  async function anyInvokeHandler(e) {
    e.preventDefault();

    try {
      setConnecting(true);

      const finalArgs = getFinalInvokeArgs();
      const finalArgsXdr = finalArgs.map((arg) => arg.toXDR("base64"));

      console.log("the final args are", finalArgsXdr);

      const wasmArgs = finalArgs.filter((arg) => arg.type === "Wasm");
      for (const arg of wasmArgs) {
        const file = wasmFiles[arg.id];
        if (file) {
          await uploadWasmMainnet(file);
        }
      }

      const signedTx = await anyMainnet(finalArgsXdr);

      if (signedTx?.noStateChange) {
        setOutputs(signedTx?.output);
        setShowOutputModal(true);
        return;
      }

      const res = await sendTransactionMainnet(signedTx, network);
      setOutputs(res || null);
      setShowOutputModal(true);
      showSuccessToast("Contract invoked successfully");
    } catch (e) {
      console.error(e);
      showErrorToast(e?.message || "Failed to invoke contract");
    } finally {
      setConnecting(false);
    }
  }

  async function loadContractHandler(e) {
    if (e?.preventDefault) e.preventDefault();
    if (!selectedToken?.trim()) return;

    try {
      setIsProcessing(true);
      const contractSpecs = await loadContractSpecs(
        network,
        selectedToken.trim()
      );

      if (contractSpecs) {
        setLoadedContractId(selectedToken.trim());
        setContractOperations(contractSpecs);
        setSelectedOperation(null);
        setArgs([]);
        setOutputs(null);
        setShowOutputModal(false);
        setInputMode("form");
        setInvokeScript("");
        setScriptArgs([]);
        setWasmFiles({});
      }
    } catch (e) {
      console.error(e);
      showErrorToast(e?.message || "Failed to load contract");
    } finally {
      setIsProcessing(false);
    }
  }

  async function copyHandler() {
    if (!loadedContractId) return;
    try {
      await navigator.clipboard.writeText(loadedContractId);
      showSuccessToast("Contract ID copied successfully");
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to copy contract ID");
    }
  }

  function handleArgChange(argId, value) {
    setArgs((current) =>
      current.map((arg) => (arg.id === argId ? { ...arg, value } : arg))
    );
  }

  function handleArgTypeChange(argId, type) {
    setArgs((current) =>
      current.map((arg) => (arg.id === argId ? { ...arg, type } : arg))
    );
  }

  function handleWasmFileChange(argId, file) {
    setWasmFiles((current) => ({ ...current, [argId]: file || null }));
  }

  function handleApplyInvokeScript(result, script) {
    setInvokeScript(script);
    setScriptArgs(Array.isArray(result?.value) ? result.value : []);
  }

  function getInvokeScriptInitialValue() {
    if (invokeScript?.trim()) return invokeScript;

    if (args.length > 0) {
      return `args = [
${args
  .map(
    (arg) => `  {
    id: ${JSON.stringify(arg.id)},
    name: ${JSON.stringify(arg.name)},
    type: ${JSON.stringify(arg.type)},
    value: ${formatScriptValue(arg.value, arg.type)}
  }`
  )
  .join(",\n")}
];`;
    }

    return `args = [
  {
    id: "1",
    name: "to",
    type: "Address",
    value: "GC4O26MXQN72WX5SG7BOIV2N72RVDOLXN33BJFDJW3RS3FEBMRXPD56U"
  },
  {
    id: "2",
    name: "amount",
    type: "i128",
    value: "1000"
  },
  {
    id: "3",
    name: "enabled",
    type: "bool",
    value: true
  }
];`;
  }

  const hasArgs = args?.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h3 className="text-base font-semibold text-slate-900">
            Interact with contract
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Load a contract, inspect methods, configure arguments, and invoke.
          </p>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          {!loadedContractId && (
            <form onSubmit={loadContractHandler} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Contract ID
                </label>
                <input
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  type="text"
                  placeholder="Paste contract ID"
                  className="block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !selectedToken.trim()}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {isProcessing ? "Loading..." : "Load contract"}
              </button>
            </form>
          )}

          {loadedContractId && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-700 break-all">
                {loadedContractId}
              </div>
              <button
                type="button"
                onClick={copyHandler}
                className="p-2 rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
              >
                <Copy size="18" color="currentColor" />
              </button>
            </div>
          )}

          {loadedContractId && contractOperations?.length > 0 && (
            <SelectOperation
              selectedOperation={selectedOperation}
              setSelectedOperation={setSelectedOperation}
              contractOperations={contractOperations}
              setArgs={setArgs}
            />
          )}

          {selectedOperation && hasArgs && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Argument input mode
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Use the default form inputs or switch to script mode.
                  </p>
                </div>

                <div className="inline-flex rounded-2xl border border-slate-300 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setInputMode("form")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      inputMode === "form"
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Form
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputMode("script");
                      setShowScriptModal(true);
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      inputMode === "script"
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Script
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasArgs && inputMode === "form" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900">
                  Arguments
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Provide values for the selected method arguments.
                </p>
              </div>

              <div className="space-y-3">
                {args.map((arg) => (
                  <ArgumentRow
                    key={arg.id}
                    arg={arg}
                    value={args.find((cur) => cur.id === arg.id)?.value}
                    onChange={handleArgChange}
                    onTypeChange={handleArgTypeChange}
                    onWasmFileChange={handleWasmFileChange}
                    wasmFile={wasmFiles[arg.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {hasArgs && inputMode === "script" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Script mode enabled
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    Method arguments will be taken from your JavaScript script
                    output.
                  </p>
                  <p className="mt-2 text-xs text-blue-700">
                    Expected shape: <code>args = [ ... ]</code>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScriptModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Code size="18" color="currentColor" />
                  <span>Edit script</span>
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

          {userKey && contractOperations?.length > 0 && (
            <button
              type="button"
              onClick={anyInvokeHandler}
              disabled={!canInvoke || connecting}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {connecting ? "Processing..." : "Invoke contract"}
            </button>
          )}
        </div>
      </section>

      <ScriptEditorModal
        open={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title={
          selectedOperation?.name
            ? `${selectedOperation.name} Script`
            : "Method Script"
        }
        scriptKind="args"
        initialScript={getInvokeScriptInitialValue()}
        context={{
          userKey,
          network,
          contractId: loadedContractId || "",
          method: selectedOperation?.name || "",
        }}
        onApply={handleApplyInvokeScript}
      />
    </div>
  );
}

function ArgumentRow({
  arg,
  value,
  onChange,
  onTypeChange,
  onWasmFileChange,
  wasmFile,
}) {
  const uploadId = `wasm-upload-${arg.id}`;

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <div className="md:w-1/4">
        <SelectField
          isDisabled={true}
          label="Type"
          value={arg.type}
          onChange={(val) => onTypeChange(arg.id, val)}
          options={typeOptions}
        />
      </div>

      <div className="md:w-3/4">
        {arg.type === "Wasm" ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Value
            </label>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {wasmFile ? wasmFile.name : "Upload .wasm file"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Select the wasm file for this argument
                  </div>
                </div>

                <label
                  htmlFor={uploadId}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <DocumentCode size="18" color="currentColor" />
                </label>
              </div>

              <input
                id={uploadId}
                type="file"
                accept=".wasm"
                className="hidden"
                onChange={(e) =>
                  onWasmFileChange(arg.id, e.target.files?.[0] || null)
                }
              />
            </div>
          </div>
        ) : arg.type === "bool" ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Value
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange(arg.id, true)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  value === true
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                True
              </button>

              <button
                type="button"
                onClick={() => onChange(arg.id, false)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  value === false
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                False
              </button>
            </div>
          </div>
        ) : (
          <Field
            label="Value"
            value={value ?? ""}
            onChange={(e) => onChange(arg.id, e.target.value)}
            placeholder={`Enter ${arg.type}`}
          />
        )}
      </div>
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

function formatScriptValue(value, type) {
  if (type === "bool") {
    return value === true ? "true" : "false";
  }

  return JSON.stringify(value ?? "");
}
