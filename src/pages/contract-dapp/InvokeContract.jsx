import React, { useMemo, useState } from "react";
import { Copy, DocumentCode } from "iconsax-react";
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
import { useStates } from "../../contexts/StatesContext";
import OutputModal from "../../components/OutputModal";
import { Outlet } from "react-router-dom";

export default function InvokeContract() {
  const {
    userKey,
    setLoadedContractId,
    loadedContractId,
    connecting,
    setConnecting,
    network,
    contractOperations,
    setContractOperations,
    showOutputModal,
    setShowOutputModal,
    outputs,
    setOutputs,
  } = useStates();

  console.log("the values", outputs, showOutputModal);

  const [selectedToken, setSelectedToken] = useState("");
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [args, setArgs] = useState([]);
  const [wasmFiles, setWasmFiles] = useState({});

  const [isProcessing, setIsProcessing] = useState(false);

  const canInvoke = useMemo(() => {
    return Boolean(userKey && loadedContractId && selectedOperation);
  }, [userKey, loadedContractId, selectedOperation]);

  async function uploadWasmMainnet(file) {
    const signedTx = await loadContractMainnet(
      file,
      userKey,
      BASE_FEE,
      network
    );
    return sendTransactionMemoryMainnet(userKey, signedTx, network);
  }

  async function anyMainnet() {
    const memo = "";
    return anyInvoke(
      userKey,
      xlmToStroop(1).toString(),
      network,
      loadedContractId,
      selectedOperation?.name,
      args,
      memo
    );
  }

  async function anyInvokeHandler(e) {
    e.preventDefault();

    try {
      setConnecting(true);

      const wasmArgs = args.filter((arg) => arg.type === "Wasm");
      for (const arg of wasmArgs) {
        const file = wasmFiles[arg.id];
        if (file) {
          await uploadWasmMainnet(file);
        }
      }

      const signedTx = await anyMainnet();

      if (signedTx?.noStateChange) {
        console.log("the outputs", signedTx);
        setOutputs(signedTx?.output);
        setShowOutputModal(true);
        return;
      }

      const res = await sendTransactionMainnet(signedTx, network);
      console.log("the outputs", res);
      setOutputs(res || null);
      setShowOutputModal(true);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to invoke contract");
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
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function copyHandler() {
    if (!loadedContractId) return;
    try {
      await navigator.clipboard.writeText(loadedContractId);
    } catch (err) {
      console.error(err);
    }
  }

  function handleArgChange(argId, value) {
    setArgs((current) =>
      current.map((arg) => (arg.id === argId ? { ...arg, value } : arg))
    );
  }

  function handleWasmFileChange(argId, file) {
    setWasmFiles((current) => ({ ...current, [argId]: file || null }));
  }

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

          {args?.length > 0 && (
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
      <div className="md:w-1/3">
        <SelectField
          label="Type"
          value={arg.type}
          onChange={(val) => onTypeChange(arg.id, val)}
          options={typeOptions}
        />
      </div>

      <div className="md:w-2/3">
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
