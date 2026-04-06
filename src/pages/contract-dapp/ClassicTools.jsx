import React, { useMemo, useState } from "react";
import { Code, Trash } from "iconsax-react";
import {
  Asset,
  BASE_FEE,
  Networks,
  Operation,
  TransactionBuilder,
  rpc,
} from "@stellar/stellar-sdk";
import {
  showErrorToast,
  showSuccessToast,
} from "../../components/ToastComponent";
import { useStates } from "../../contexts/StatesContext";
import ScriptEditorModal from "./components/ScriptEditorModal";
import SelectField from "./components/SelectField";
import { WalletKitService } from "../../wallet-kit/services/global-service";
import {
  anyTransactionBuilder,
  sendTransactionMainnet,
} from "../../utils/soroban";

const RPC_URL = {
  TESTNET: "https://soroban-testnet.stellar.org",
  PUBLIC: "https://mainnet.sorobanrpc.com",
};

const classicToolTabs = [
  {
    id: "changeTrust",
    label: "Change Trustline",
    description:
      "Create, update, or remove a trustline for an issued Stellar asset.",
  },
  {
    id: "payment",
    label: "Make Payment",
    description: "Send a Stellar asset payment to another address.",
  },
  {
    id: "createStellarAssetContract",
    label: "Deploy SAC",
    description:
      "Deploy the built-in Stellar Asset Contract for native XLM or an issued asset.",
  },
  {
    id: "manageSellOffer",
    label: "Manage Sell Offer",
    description: "Create, update, or delete a Stellar sell offer on the DEX.",
  },
];

const defaultValues = {
  assetType: "issued",
  assetCode: "",
  issuerAddress: "",
  amount: "",
  destination: "",
  limit: "",
  sellingAssetType: "native",
  sellingAssetCode: "",
  sellingIssuerAddress: "",
  buyingAssetType: "issued",
  buyingAssetCode: "",
  buyingIssuerAddress: "",
  price: "",
  offerId: "0",
};

export default function ClassicTools() {
  const { userKey, network, setShowOutputModal, setOutputs } = useStates();

  const [selectedTool, setSelectedTool] = useState("changeTrust");
  const [inputMode, setInputMode] = useState("form");
  const [formValues, setFormValues] = useState(defaultValues);
  const [queuedOperations, setQueuedOperations] = useState([]);
  const [scriptQueuedOperations, setScriptQueuedOperations] = useState([]);
  const [readableScriptOperations, setReadableScriptOperations] = useState([]);
  const [builderScript, setBuilderScript] = useState("");
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeTool = useMemo(() => {
    return classicToolTabs.find((item) => item.id === selectedTool);
  }, [selectedTool]);

  const effectiveQueuedOperations = useMemo(() => {
    if (inputMode === "script") {
      return scriptQueuedOperations.map((item) => item.values).filter(Boolean);
    }

    return queuedOperations.map((item) => item.operation).filter(Boolean);
  }, [inputMode, queuedOperations, scriptQueuedOperations]);

  const humanReadableOperations = useMemo(() => {
    if (inputMode === "script") {
      return readableScriptOperations.length > 0
        ? readableScriptOperations
        : scriptQueuedOperations.map((item) => ({
            id: item.id,
            type: item.type,
            label: item.label,
          }));
    }

    return queuedOperations.map((item) => item.preview);
  }, [
    inputMode,
    queuedOperations,
    readableScriptOperations,
    scriptQueuedOperations,
  ]);

  const canAddOperation = useMemo(() => {
    if (!activeTool) return false;

    if (activeTool.id === "changeTrust") {
      return Boolean(
        formValues.assetCode.trim() && formValues.issuerAddress.trim()
      );
    }

    if (activeTool.id === "payment") {
      return Boolean(
        formValues.assetCode.trim() &&
          formValues.issuerAddress.trim() &&
          formValues.amount.trim() &&
          formValues.destination.trim()
      );
    }

    if (activeTool.id === "createStellarAssetContract") {
      if (formValues.assetType === "native") return true;

      return Boolean(
        formValues.assetCode.trim() && formValues.issuerAddress.trim()
      );
    }

    if (activeTool.id === "manageSellOffer") {
      const sellingValid =
        formValues.sellingAssetType === "native" ||
        Boolean(
          formValues.sellingAssetCode.trim() &&
            formValues.sellingIssuerAddress.trim()
        );

      const buyingValid =
        formValues.buyingAssetType === "native" ||
        Boolean(
          formValues.buyingAssetCode.trim() &&
            formValues.buyingIssuerAddress.trim()
        );

      return Boolean(
        sellingValid &&
          buyingValid &&
          formValues.amount.trim() &&
          formValues.price.trim()
      );
    }

    return false;
  }, [activeTool, formValues]);

  const canSubmit = Boolean(
    userKey && network && effectiveQueuedOperations.length > 0
  );

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSelectChange(name, value) {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setFormValues(defaultValues);
  }

  function handleAddOperation() {
    if (!canAddOperation || !activeTool) return;

    try {
      const operation = buildClassicOperation(activeTool.id, formValues);
      const preview = buildPreview(activeTool.id, formValues);

      setQueuedOperations((prev) => [
        ...prev,
        {
          id: `${activeTool.id}-${Date.now()}-${prev.length}`,
          type: activeTool.id,
          label: activeTool.label,
          operation,
          preview,
        },
      ]);

      resetForm();
    } catch (error) {
      showErrorToast(error?.message || "Unable to add operation");
    }
  }

  function removeQueuedOperation(index) {
    if (inputMode === "script") {
      setScriptQueuedOperations((prev) => prev.filter((_, i) => i !== index));
      setReadableScriptOperations((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setQueuedOperations((prev) => prev.filter((_, i) => i !== index));
  }

  function clearQueuedOperations() {
    if (inputMode === "script") {
      setScriptQueuedOperations([]);
      setReadableScriptOperations([]);
      return;
    }

    setQueuedOperations([]);
  }

  function handleApplyBuilderScript(result, script, readableOperations) {
    setBuilderScript(script);

    const operations = Array.isArray(result?.value)
      ? result.value
      : result?.value
      ? [result.value]
      : [];

    const normalized = operations.map((op, index) => ({
      id: `script-${Date.now()}-${index}`,
      type: guessOperationType(op),
      label: formatOperationType(guessOperationType(op)),
      values: op,
    }));

    setScriptQueuedOperations(normalized);

    if (Array.isArray(readableOperations) && readableOperations.length > 0) {
      setReadableScriptOperations(readableOperations);
    } else {
      setReadableScriptOperations(
        normalized.map((item) => ({
          id: item.id,
          type: item.type,
          label: item.label,
        }))
      );
    }
  }

  function getBuilderScriptInitialValue() {
    if (builderScript.trim()) return builderScript;

    const map = {
      changeTrust: `// Build Stellar operations using Sorobuild script context
// Available globals: Operation, Asset

operations = [
  Operation.changeTrust({
    asset: new Asset("USDC", "G..."),
    limit: "1000"
  })
];
`,
      payment: `// Build Stellar operations using Sorobuild script context
// Available globals: Operation, Asset

operations = [
  Operation.payment({
    destination: "G...",
    asset: new Asset("USDC", "G..."),
    amount: "50"
  })
];
`,
      createStellarAssetContract: `// Build Stellar operations using Sorobuild script context
// Available globals: Operation, Asset

operations = [
  Operation.createStellarAssetContract({
    asset: new Asset("USDC", "G...")
    // Or use: asset: Asset.native()
  })
];
`,
      manageSellOffer: `// Build Stellar operations using Sorobuild script context
// Available globals: Operation, Asset

operations = [
  Operation.manageSellOffer({
    selling: Asset.native(),
    buying: new Asset("USDC", "G..."),
    amount: "100",
    price: "0.25",
    offerId: "0"
  })
];
`,
    };

    return map[selectedTool] || map.changeTrust;
  }

  async function handleSubmit() {
    try {
      setIsProcessing(true);

      const operationMeta =
        inputMode === "script" ? scriptQueuedOperations : queuedOperations;

      const containsSacOperation = operationMeta.some(
        (item) => item.type === "createStellarAssetContract"
      );

      if (containsSacOperation && effectiveQueuedOperations.length !== 1) {
        throw new Error(
          "Deploy SAC must be submitted alone in a single transaction."
        );
      }

      if (containsSacOperation) {
        const response = await submitSacOperation({
          operation: effectiveQueuedOperations[0],
          userKey,
          network,
        });

        const txHash = response?.hash || response?.txHash;
        const contractId = extractContractId(response);
        if (response) {
          setOutputs(response);
          setShowOutputModal(true);
          showSuccessToast(
            contractId
              ? `SAC deployed successfully: ${contractId}`
              : "SAC deployment submitted successfully"
          );

          clearQueuedOperations();
          return;
        }
      }

      const operationsXdr = effectiveQueuedOperations.map((operation) =>
        operation.toXDR("base64")
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

      if (response) {
        setOutputs(response);
        setShowOutputModal(true);

        showSuccessToast(
          "Transaction submitted successfully"
          // response?.txHash || response?.hash,
          // network
        );

        clearQueuedOperations();
      }
    } catch (error) {
      showErrorToast(error?.message || error?.error || "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-6 px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2 xl:grid-cols-4">
            {classicToolTabs.map((tab) => {
              const active = selectedTool === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTool(tab.id)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-900">
                  {activeTool?.label}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTool?.description}
                </p>
              </div>

              <div className="inline-flex w-full rounded-2xl border border-slate-300 bg-white p-1 lg:w-auto">
                <button
                  type="button"
                  onClick={() => setInputMode("form")}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition lg:flex-none ${
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
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition lg:flex-none ${
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

          {inputMode === "form" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyField
                  label="Connected wallet"
                  value={userKey || "Connect wallet first"}
                />

                <ReadOnlyField
                  label="Selected tool"
                  value={activeTool?.label || "-"}
                />
              </div>

              {activeTool?.id === "changeTrust" && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Asset code"
                    name="assetCode"
                    value={formValues.assetCode}
                    onChange={handleFormChange}
                    placeholder="ex: USDC"
                  />
                  <div className="md:col-span-2">
                    <Field
                      label="Issuer address"
                      name="issuerAddress"
                      value={formValues.issuerAddress}
                      onChange={handleFormChange}
                      placeholder="G..."
                    />
                  </div>
                  <Field
                    label="Limit"
                    name="limit"
                    value={formValues.limit}
                    onChange={handleFormChange}
                    placeholder="ex: 1000"
                    help="Optional. Use 0 to remove trustline."
                  />
                </div>
              )}

              {activeTool?.id === "payment" && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Asset code"
                    name="assetCode"
                    value={formValues.assetCode}
                    onChange={handleFormChange}
                    placeholder="ex: USDC"
                  />
                  <div className="md:col-span-2">
                    <Field
                      label="Issuer address"
                      name="issuerAddress"
                      value={formValues.issuerAddress}
                      onChange={handleFormChange}
                      placeholder="G..."
                    />
                  </div>
                  <Field
                    label="Amount"
                    name="amount"
                    value={formValues.amount}
                    onChange={handleFormChange}
                    placeholder="ex: 50"
                  />
                  <div className="md:col-span-2">
                    <Field
                      label="Destination address"
                      name="destination"
                      value={formValues.destination}
                      onChange={handleFormChange}
                      placeholder="G..."
                    />
                  </div>
                </div>
              )}

              {activeTool?.id === "createStellarAssetContract" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <SelectField
                        label="Asset type"
                        value={formValues.assetType}
                        onChange={(value) =>
                          handleSelectChange("assetType", value)
                        }
                        options={[
                          { value: "issued", label: "Issued Asset" },
                          { value: "native", label: "Native XLM" },
                        ]}
                      />
                    </div>

                    <ReadOnlyField
                      className="md:col-span-2"
                      label="Deployer wallet"
                      value={userKey || "Connect wallet first"}
                    />
                  </div>

                  {formValues.assetType === "issued" ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field
                        label="Asset code"
                        name="assetCode"
                        value={formValues.assetCode}
                        onChange={handleFormChange}
                        placeholder="ex: USDC"
                      />
                      <div className="md:col-span-2">
                        <Field
                          label="Issuer address"
                          name="issuerAddress"
                          value={formValues.issuerAddress}
                          onChange={handleFormChange}
                          placeholder="G..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                      Native XLM does not require asset code or issuer input.
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    SAC deployment is submitted through Soroban RPC and must be
                    sent alone in its own transaction.
                  </div>
                </div>
              )}

              {activeTool?.id === "manageSellOffer" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-900">
                        Selling asset
                      </p>
                      <div className="space-y-4">
                        <SelectField
                          label="Asset type"
                          value={formValues.sellingAssetType}
                          onChange={(value) =>
                            handleSelectChange("sellingAssetType", value)
                          }
                          options={[
                            { value: "native", label: "Native XLM" },
                            { value: "issued", label: "Issued Asset" },
                          ]}
                        />

                        {formValues.sellingAssetType === "issued" && (
                          <>
                            <Field
                              label="Asset code"
                              name="sellingAssetCode"
                              value={formValues.sellingAssetCode}
                              onChange={handleFormChange}
                              placeholder="ex: USDC"
                            />
                            <Field
                              label="Issuer address"
                              name="sellingIssuerAddress"
                              value={formValues.sellingIssuerAddress}
                              onChange={handleFormChange}
                              placeholder="G..."
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-900">
                        Buying asset
                      </p>
                      <div className="space-y-4">
                        <SelectField
                          label="Asset type"
                          value={formValues.buyingAssetType}
                          onChange={(value) =>
                            handleSelectChange("buyingAssetType", value)
                          }
                          options={[
                            { value: "native", label: "Native XLM" },
                            { value: "issued", label: "Issued Asset" },
                          ]}
                        />

                        {formValues.buyingAssetType === "issued" && (
                          <>
                            <Field
                              label="Asset code"
                              name="buyingAssetCode"
                              value={formValues.buyingAssetCode}
                              onChange={handleFormChange}
                              placeholder="ex: USDC"
                            />
                            <Field
                              label="Issuer address"
                              name="buyingIssuerAddress"
                              value={formValues.buyingIssuerAddress}
                              onChange={handleFormChange}
                              placeholder="G..."
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field
                      label="Amount to sell"
                      name="amount"
                      value={formValues.amount}
                      onChange={handleFormChange}
                      placeholder="ex: 100"
                    />
                    <Field
                      label="Price"
                      name="price"
                      value={formValues.price}
                      onChange={handleFormChange}
                      placeholder="ex: 0.25"
                    />
                    <Field
                      label="Offer ID"
                      name="offerId"
                      value={formValues.offerId}
                      onChange={handleFormChange}
                      placeholder="0 for new offer"
                      help="Use an existing offer ID to update or delete."
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddOperation}
                  disabled={!canAddOperation}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add operation
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear fields
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Script mode enabled
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    Write asset-specific Stellar operations in JavaScript and
                    apply them into the queue.
                  </p>
                  <p className="mt-2 text-xs text-blue-700">
                    Expected shape:{" "}
                    <code>
                      operations = [Operation.payment(...),
                      Operation.changeTrust(...)]
                    </code>
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

              <div className="mt-3 rounded-xl border border-blue-200 bg-white px-3 py-3 text-sm text-blue-900">
                {scriptQueuedOperations.length > 0
                  ? `Loaded script operations: ${scriptQueuedOperations.length}`
                  : "No script operations applied yet."}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
              <h4 className="text-base font-semibold text-slate-900">
                Queued operations
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Review the operations that will be included in the transaction.
              </p>
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
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
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isProcessing}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing
                ? "Submitting transaction..."
                : "Submit transaction"}
            </button>

            {/* <button
              type="button"
              onClick={clearQueuedOperations}
              disabled={effectiveQueuedOperations.length === 0 || isProcessing}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear queue
            </button> */}
          </div>
        </div>
      </section>

      <ScriptEditorModal
        open={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Classic Tools Script"
        scriptKind="operations"
        initialScript={getBuilderScriptInitialValue()}
        context={{ userKey, network }}
        onApply={handleApplyBuilderScript}
      />
    </div>
  );
}

function buildClassicOperation(type, values) {
  switch (type) {
    case "changeTrust": {
      return Operation.changeTrust({
        asset: new Asset(values.assetCode.trim(), values.issuerAddress.trim()),
        ...(values.limit?.trim() ? { limit: values.limit.trim() } : {}),
      });
    }

    case "payment": {
      return Operation.payment({
        destination: values.destination.trim(),
        asset: new Asset(values.assetCode.trim(), values.issuerAddress.trim()),
        amount: values.amount.trim(),
      });
    }

    case "createStellarAssetContract": {
      const asset =
        values.assetType === "native"
          ? Asset.native()
          : new Asset(values.assetCode.trim(), values.issuerAddress.trim());

      return Operation.createStellarAssetContract({ asset });
    }

    case "manageSellOffer": {
      return Operation.manageSellOffer({
        selling: createAssetFromForm(
          values.sellingAssetType,
          values.sellingAssetCode,
          values.sellingIssuerAddress
        ),
        buying: createAssetFromForm(
          values.buyingAssetType,
          values.buyingAssetCode,
          values.buyingIssuerAddress
        ),
        amount: values.amount.trim(),
        price: values.price.trim(),
        offerId: values.offerId?.trim() || "0",
      });
    }

    default:
      throw new Error("Unsupported classic operation");
  }
}

function buildPreview(type, values) {
  switch (type) {
    case "changeTrust":
      return {
        type,
        label: "Change Trustline",
        assetCode: values.assetCode,
        issuerAddress: values.issuerAddress,
        limit: values.limit,
      };

    case "payment":
      return {
        type,
        label: "Make Payment",
        assetCode: values.assetCode,
        issuerAddress: values.issuerAddress,
        amount: values.amount,
        destination: values.destination,
      };

    case "createStellarAssetContract":
      return {
        type,
        label: "Deploy SAC",
        assetType: values.assetType,
        assetCode: values.assetType === "native" ? "XLM" : values.assetCode,
        issuerAddress:
          values.assetType === "native" ? "-" : values.issuerAddress,
      };

    case "manageSellOffer":
      return {
        type,
        label: "Manage Sell Offer",
        selling:
          values.sellingAssetType === "native"
            ? "XLM"
            : `${values.sellingAssetCode}:${values.sellingIssuerAddress}`,
        buying:
          values.buyingAssetType === "native"
            ? "XLM"
            : `${values.buyingAssetCode}:${values.buyingIssuerAddress}`,
        amount: values.amount,
        price: values.price,
        offerId: values.offerId,
      };

    default:
      return {
        type,
        label: formatOperationType(type),
      };
  }
}

function createAssetFromForm(assetType, assetCode, issuerAddress) {
  if (assetType === "native") return Asset.native();

  if (!assetCode?.trim() || !issuerAddress?.trim()) {
    throw new Error(
      "Issued assets require both asset code and issuer address."
    );
  }

  return new Asset(assetCode.trim(), issuerAddress.trim());
}

async function submitSacOperation({ operation, userKey, network }) {
  const networkKey = network?.network;
  const rpcUrl =
    network?.rpcUrl || network?.sorobanRpcUrl || RPC_URL[networkKey];

  if (!rpcUrl) {
    throw new Error("No Soroban RPC URL configured for this network.");
  }

  const server = new rpc.Server(rpcUrl);
  const sourceAccount = await server.getAccount(userKey);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks[networkKey],
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signedXdr = await WalletKitService.signTx(preparedTx.toXDR(), network);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks[networkKey]);

  const sendResponse = await server.sendTransaction(signedTx);
  const hash = sendResponse?.hash;

  if (!hash) {
    return sendResponse;
  }

  const finalResponse = await pollTransaction(server, hash);
  return { ...finalResponse, hash };
}

async function pollTransaction(server, hash, attempts = 30, delayMs = 1200) {
  for (let i = 0; i < attempts; i += 1) {
    const response = await server.getTransaction(hash);

    if (response?.status && response.status !== "NOT_FOUND") {
      return response;
    }

    await wait(delayMs);
  }

  throw new Error("Transaction submitted but confirmation timed out.");
}

function extractContractId(response) {
  try {
    const maybeAddress = response?.returnValue?.address?.();
    if (maybeAddress) return maybeAddress.toString();
  } catch {}

  try {
    const maybeToString = response?.returnValue?.toString?.();
    if (maybeToString) return maybeToString;
  } catch {}

  try {
    if (response?.resultMetaXdr) {
      return null;
    }
  } catch {}

  return null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function guessOperationType(op) {
  if (!op) return "operation";

  try {
    const opBody = op.body?.();
    if (!opBody) return op.type || "operation";

    if (opBody.switch) {
      const rawType = String(
        opBody.switch().name || opBody.switch()
      ).toLowerCase();
      if (rawType.includes("change_trust")) return "changeTrust";
      if (rawType.includes("payment")) return "payment";
      if (rawType.includes("manage_sell_offer")) return "manageSellOffer";
      if (rawType.includes("create_stellar_asset_contract")) {
        return "createStellarAssetContract";
      }
    }
  } catch {}

  if (op?.type) return op.type;
  if (op?.label) return op.label;
  return "operation";
}

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
      if (
        [
          "id",
          "type",
          "label",
          "operation",
          "operationInstance",
          "values",
        ].includes(key)
      ) {
        return false;
      }

      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim() !== "";
      if (typeof value === "number" || typeof value === "boolean") return true;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value).length > 0;
      return true;
    }
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
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
      <label className="mb-2 block text-sm font-semibold text-slate-900">
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
  const map = {
    changeTrust: "Change Trustline",
    payment: "Make Payment",
    createStellarAssetContract: "Deploy SAC",
    manageSellOffer: "Manage Sell Offer",
  };

  return map[type] || "Operation";
}

function formatKeyLabel(key) {
  const map = {
    assetType: "Asset type",
    assetCode: "Asset",
    issuerAddress: "Issuer",
    amount: "Amount",
    destination: "Destination",
    limit: "Limit",
    selling: "Selling",
    buying: "Buying",
    price: "Price",
    offerId: "Offer ID",
  };

  return map[key] || key;
}
