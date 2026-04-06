import React, { useMemo, useState } from "react";
import { Code, Trash } from "iconsax-react";
import {
  showErrorToast,
  showSuccessToast,
} from "../../components/ToastComponent";
import { useStates } from "../../contexts/StatesContext";
import ScriptEditorModal from "./components/ScriptEditorModal";
import {
  Asset,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { WalletKitService } from "../../wallet-kit/services/global-service";
import {
  buildOperation,
  builderOperationOptions,
  flattenObject,
} from "../../utils/helper-functions";
import OperationSelect from "./components/OperationSelect";
import {
  anyTransactionBuilder,
  sendTransactionMainnet,
} from "../../utils/soroban";

const defaultBuilderValues = {
  assetCode: "",
  issuerAddress: "",
  limit: "",
  amount: "",
  destination: "",
};

export default function TransactionBuilderFeature() {
  const { userKey, network, BASE_FEE, setShowOutputModal, setOutputs } =
    useStates();

  const [inputMode, setInputMode] = useState("form");
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [builderScript, setBuilderScript] = useState("");
  const [scriptQueuedOperations, setScriptQueuedOperations] = useState([]);
  const [readableScriptOperations, setReadableScriptOperations] = useState([]);

  const [selectedBuilderOperation, setSelectedBuilderOperation] =
    useState("changeTrust");
  const [builderValues, setBuilderValues] = useState(defaultBuilderValues);
  const [queuedOperations, setQueuedOperations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeBuilderOperation = useMemo(() => {
    return builderOperationOptions.find(
      (item) => item.id === selectedBuilderOperation
    );
  }, [selectedBuilderOperation]);

  const effectiveQueuedOperations =
    inputMode === "script"
      ? scriptQueuedOperations?.map((op) => op?.values)
      : queuedOperations?.map((op) => buildOperation(op));

  const humanReadableOperations =
    inputMode === "script"
      ? readableScriptOperations
      : queuedOperations.map((op) => flattenObject(op));

  const canAddBuilderOperation = useMemo(() => {
    if (!activeBuilderOperation) return false;

    return activeBuilderOperation.fields.every((field) => {
      if (!field.required) return true;
      return Boolean(builderValues[field.name]?.toString().trim());
    });
  }, [activeBuilderOperation, builderValues]);

  const canBuildTransaction = useMemo(() => {
    return Boolean(userKey && network && effectiveQueuedOperations.length > 0);
  }, [userKey, network, effectiveQueuedOperations.length]);

  function handleBuilderChange(e) {
    const { name, value } = e.target;
    setBuilderValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddBuilderOperation() {
    if (!activeBuilderOperation || !canAddBuilderOperation) return;

    const values = {};
    activeBuilderOperation.fields.forEach((field) => {
      values[field.name] = builderValues[field.name] || "";
    });

    setQueuedOperations((prev) => [
      ...prev,
      {
        id: `${activeBuilderOperation.id}-${Date.now()}-${prev.length}`,
        type: activeBuilderOperation.id,
        label: activeBuilderOperation.label,
        values,
      },
    ]);

    setBuilderValues(defaultBuilderValues);
  }

  function handleClearFields() {
    setBuilderValues(defaultBuilderValues);
  }

  function removeQueuedOperation(index) {
    if (inputMode === "script") {
      setReadableScriptOperations((prev) => prev.filter((_, i) => i !== index));
      setScriptQueuedOperations((prev) => prev.filter((_, i) => i !== index));
    } else {
      setQueuedOperations((prev) => prev.filter((_, i) => i !== index));
    }

    // se((prev) => prev.filter((_, i) => i !== index));
  }

  function handleApplyBuilderScript(result, script, readableOperations) {
    setReadableScriptOperations(readableOperations);

    setBuilderScript(script);

    const ops = Array.isArray(result?.value) ? result.value : [];

    setScriptQueuedOperations(
      ops.map((op, i) => ({
        id: op.id || `script-${i}`,
        type: op.type || "operation",
        label: op.label || formatOperationType(op.type) || "Operation",
        values: op.values || op,
      }))
    );
  }

  function getBuilderScriptInitialValue() {
    if (builderScript?.trim()) return builderScript;

    return `// Build Stellar operations using Sorobuild script context
// Available globals: Operation, Asset

operations = [
  Operation.payment({
    destination: "G...",
    asset: new Asset("USDC", "G..."),
    amount: "50"
  }),

  Operation.changeTrust({
    asset: new Asset("USDC", "G..."),
    limit: "1000"
  })
];
`;
  }

  const HORIZON_URL = {
    TESTNET:
      "https://rpc.ankr.com/premium-http/stellar_testnet_horizon/8f847212cefcc391509e0aee929c173b83eaf25592bc7f122da333bddb851c79",
    PUBLIC: "https://horizon.stellar.org",
  };

  async function handleBuildTransaction() {
    try {
      setIsProcessing(true);

      const server = new Horizon.Server(HORIZON_URL[network?.network]);
      console.log("Wallet:", userKey);
      console.log("Network:", network);
      const source = await server.loadAccount(userKey);
      console.log("fine here 1");
      let transaction = new TransactionBuilder(source, {
        fee: BASE_FEE,
        networkPassphrase: Networks[network?.network],
      });
      console.log("fine here 2");

      const newAccount = Keypair.random();

      const testOperations = [
        {
          values: Operation.beginSponsoringFutureReserves({
            sponsoredId: newAccount.publicKey(),
          }),
        },
        {
          values: Operation.createAccount({
            destination: newAccount.publicKey(),
            startingBalance: "0",
          }),
        },
        {
          values: Operation.endSponsoringFutureReserves({
            source: newAccount.publicKey(),
          }),
        },
      ];

      for (let op of effectiveQueuedOperations) {
        transaction.addOperation(op);
      }

      const operationsXdr = effectiveQueuedOperations.map((op) =>
        op.toXDR("base64")
      );

      const signedTx = await anyTransactionBuilder(
        userKey,
        network,
        operationsXdr
      );

      const response = await sendTransactionMainnet(
        signedTx,
        network,
        "classic"
      );

      console.log("the response is", response);

      if (response) {
        setOutputs(response);
        setShowOutputModal(true);
      }
      // return;
    } catch (e) {
      showErrorToast(e?.message || "Transaction build failed");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Builder input mode
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Form mode is selected by default. Switch to script mode when
                  you want to define operations using code.
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

          {inputMode === "form" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <OperationSelect
                  selectedBuilderOperation={selectedBuilderOperation}
                  setSelectedBuilderOperation={setSelectedBuilderOperation}
                />

                <ReadOnlyField
                  label="Connected wallet"
                  value={userKey || "Connect wallet first"}
                />
              </div>

              {activeBuilderOperation && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold  text-slate-900">
                    {activeBuilderOperation.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeBuilderOperation.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Required inputs:{" "}
                    {
                      activeBuilderOperation.fields.filter(
                        (field) => field.required
                      ).length
                    }
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {activeBuilderOperation?.fields.map((field) => (
                  <Field
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    value={builderValues[field.name]}
                    onChange={handleBuilderChange}
                    placeholder={field.placeholder}
                    help={field.required ? "Required" : "Optional"}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddBuilderOperation}
                  disabled={!canAddBuilderOperation}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add operation
                </button>

                <button
                  type="button"
                  onClick={handleClearFields}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear fields
                </button>
              </div>
            </>
          )}

          {inputMode === "script" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Script mode enabled
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    Operations will be taken from your JavaScript script output.
                  </p>
                  <p className="mt-2 text-xs text-blue-700">
                    Expected shape: <code>operations = [ ... ]</code>
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

              {scriptQueuedOperations.length > 0 ? (
                <div className="mt-3 rounded-xl border border-blue-200 bg-white px-3 py-3 text-sm text-blue-900">
                  Loaded script operations: {scriptQueuedOperations.length}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-blue-200 bg-white px-3 py-3 text-sm text-blue-900">
                  No script operations applied yet.
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h4 className="text-base font-semibold text-slate-900">
                Queued operations
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Review the operations that will be included in the transaction.
              </p>
            </div>

            <div className="space-y-3 px-5 py-5 sm:px-6">
              {effectiveQueuedOperations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No operations added yet.
                </div>
              ) : (
                humanReadableOperations.map((operation, index) => (
                  <CompactOperationCard
                    key={operation.id || `${operation.type}-${index}`}
                    operation={operation}
                    index={index}
                    onRemove={removeQueuedOperation}
                  />
                ))
              )}
            </div>
          </div>
          {userKey ? (
            <button
              type="button"
              onClick={handleBuildTransaction}
              disabled={!canBuildTransaction || isProcessing}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? "Building transaction..." : "Build transaction"}
            </button>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Connect a wallet to use the transaction builder.
            </div>
          )}
        </div>
      </section>

      <ScriptEditorModal
        open={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Transaction Script"
        scriptKind="operations"
        initialScript={getBuilderScriptInitialValue()}
        context={{ userKey, network }}
        onApply={handleApplyBuilderScript}
      />
    </div>
  );
}

// function CompactOperationCard({ operation, index, onRemove }) {
//   function formatValue(value) {
//     if (typeof value === "object") {
//       try {
//         return JSON.stringify(value);
//       } catch {
//         return "[Object]";
//       }
//     }
//     return String(value);
//   }

//   const visibleEntries = Object.entries(operation.values || {}).filter(
//     ([, value]) => {
//       if (value === undefined || value === null) return false;

//       if (typeof value === "string") {
//         return value.trim() !== "";
//       }

//       if (typeof value === "number") return true;
//       if (typeof value === "boolean") return true;

//       if (Array.isArray(value)) return value.length > 0;

//       if (typeof value === "object") return Object.keys(value).length > 0;

//       return true;
//     }
//   );

//   return (
//     <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//         <div className="min-w-0 flex-1">
//           <div className="flex flex-wrap items-center gap-2">
//             <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
//               #{index + 1}
//             </span>

//             <h5 className="text-sm font-semibold text-slate-900">
//               {operation.label || formatOperationType(operation.type)}
//             </h5>
//           </div>

//           {visibleEntries.length > 0 && (
//             <div className="mt-3 flex flex-wrap gap-2">
//               {visibleEntries.map(([key, value]) => (
//                 <div
//                   key={key}
//                   className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
//                 >
//                   <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
//                     {formatKeyLabel(key)}
//                   </span>

//                   <span className="max-w-[220px] truncate text-sm text-slate-800">
//                     {formatValue(value)}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           type="button"
//           onClick={() => onRemove(index)}
//           className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
//         >
//           <Trash size="16" color="currentColor" />
//           <span className="ml-2">Remove</span>
//         </button>
//       </div>
//     </div>
//   );
// }

function CompactOperationCard({ operation, index, onRemove }) {
  function formatValue(value) {
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "object" && value !== null) {
      try {
        return JSON.stringify(value);
      } catch {
        return "[Object]";
      }
    }

    return String(value);
  }

  const visibleEntries = Object.entries(operation || {}).filter(
    ([key, value]) => {
      if (["id", "type", "label", "operationInstance"].includes(key)) {
        return false;
      }

      if (value === undefined || value === null) return false;

      if (typeof value === "string") {
        return value.trim() !== "";
      }

      if (typeof value === "number") return true;
      if (typeof value === "boolean") return true;

      if (Array.isArray(value)) return value.length > 0;

      if (typeof value === "object") return Object.keys(value).length > 0;

      return true;
    }
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ">
        <div className="min-w-0  ">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
              #{index + 1}
            </span>

            <h5 className="text-sm font-semibold text-slate-900">
              {operation.label || formatOperationType(operation.type)}
            </h5>
          </div>

          {visibleEntries.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {visibleEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {formatKeyLabel(key)}
                  </div>

                  <div className="mt-1 break-words text-sm text-slate-800">
                    {formatValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <Trash size="16" color="currentColor" />
          <span className="ml-2">Remove</span>
        </button>
      </div>
    </div>
  );
}

function Field({ label, help, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="mb-2  block text-sm font-semibold text-slate-900">
        {label}
      </label>
      <input
        {...props}
        className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-900"
      />
      {help ? <p className="mt-2 text-xs text-slate-500">{help}</p> : null}
    </div>
  );
}

function ReadOnlyField({ label, value, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-900">
        {label}
      </label>
      <div className="break-all rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {value}
      </div>
    </div>
  );
}

function formatOperationType(type) {
  if (!type) return "Operation";

  const map = {
    changeTrust: "Change Trustline",
    payment: "Payment",
    manageData: "Manage Data",
    setOptions: "Set Options",
  };

  return map[type] || type;
}

function formatKeyLabel(key) {
  const map = {
    assetCode: "Asset",
    issuerAddress: "Issuer",
    destination: "Destination",
    amount: "Amount",
    limit: "Limit",
    dataName: "Data key",
    dataValue: "Data value",
    homeDomain: "Home domain",
    masterWeight: "Master",
    lowThreshold: "Low",
    medThreshold: "Medium",
    highThreshold: "High",
  };

  return map[key] || key;
}
