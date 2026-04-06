import React, { useMemo, useState } from "react";
import {
  changeTrust,
  makePayment,
  sendTransactionMainnet,
  xlmToStroop,
} from "../../utils/soroban";
import {
  showErrorToast,
  showSuccessToast,
} from "../../components/ToastComponent";
import { useStates } from "../../contexts/StatesContext";

const assetTabs = [
  { id: "trustline", label: "Change Trustline" },
  { id: "payment", label: "Make Payment" },
  { id: "deploy", label: "Deploy SAC" },
  { id: "builder", label: "Transaction Builder" },
];

export default function CreateAsset() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [assetOperationObj, setAssetOperationObj] = useState({
    assetCode: "",
    issuerAddress: "",
    limit: "",
    destination: "",
  });
  const { assetOperation, setAssetOperation, userKey, network } = useStates();

  const canSubmit = useMemo(() => {
    if (!userKey || !network) return false;

    if (assetOperation === "trustline") {
      return Boolean(
        assetOperationObj.assetCode && assetOperationObj.issuerAddress
      );
    }

    if (assetOperation === "payment") {
      return Boolean(
        assetOperationObj.assetCode &&
          assetOperationObj.issuerAddress &&
          assetOperationObj.destination &&
          assetOperationObj.limit
      );
    }

    return false;
  }, [assetOperation, assetOperationObj, network, userKey]);

  function handleChange(e) {
    const { name, value } = e.target;
    setAssetOperationObj((prev) => ({ ...prev, [name]: value }));
  }

  async function assetOperationHandler(e) {
    e.preventDefault();

    try {
      setIsProcessing(true);

      if (assetOperation === "trustline") {
        const reqBody = {
          pubKey: userKey,
          fee: xlmToStroop(1).toString(),
          network,
          assetCode: assetOperationObj.assetCode,
          issuerAddress: assetOperationObj.issuerAddress,
          limit: assetOperationObj.limit,
        };

        const signedTx = await changeTrust(reqBody);
        const res = await sendTransactionMainnet(signedTx, network);

        if (res) {
          showSuccessToast("Asset trustline updated", res?.txHash, network);
        }
      } else if (assetOperation === "payment") {
        const reqBody = {
          pubKey: userKey,
          fee: xlmToStroop(1).toString(),
          network,
          assetCode: assetOperationObj.assetCode,
          issuerAddress: assetOperationObj.issuerAddress,
          destinationAddresss: assetOperationObj.destination,
          amount: assetOperationObj.limit,
        };

        const signedTx = await makePayment(reqBody);
        const res = await sendTransactionMainnet(signedTx, network);

        if (res) {
          showSuccessToast("Asset payment successful", res?.txHash, network);
        }
      } else {
        showErrorToast("Deploy SAC flow is not wired yet.");
      }
    } catch (e) {
      showErrorToast(e?.error || e?.message || "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h3 className="text-base font-semibold text-slate-900">
            Asset tools
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Manage trustlines, send Stellar asset payments, and prepare for SAC
            flows.
          </p>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-4">
            {assetTabs.map((tab) => {
              const active = assetOperation === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAssetOperation(tab.id)}
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

          <form onSubmit={assetOperationHandler} className="space-y-5">
            {assetOperation === "trustline" && (
              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="Asset code"
                  name="assetCode"
                  value={assetOperationObj.assetCode}
                  onChange={handleChange}
                  placeholder="ex: USDC"
                />
                <div className="md:col-span-2">
                  <Field
                    label="Issuer address"
                    name="issuerAddress"
                    value={assetOperationObj.issuerAddress}
                    onChange={handleChange}
                    placeholder="G..."
                  />
                </div>
                <Field
                  label="Limit"
                  name="limit"
                  value={assetOperationObj.limit}
                  onChange={handleChange}
                  placeholder="ex: 1000"
                  help="Optional. Use 0 to remove trustline."
                />
                <ReadOnlyField
                  className="md:col-span-2"
                  label="Trustor address"
                  value={userKey || "Connect wallet first"}
                />
              </div>
            )}

            {assetOperation === "payment" && (
              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="Asset code"
                  name="assetCode"
                  value={assetOperationObj.assetCode}
                  onChange={handleChange}
                  placeholder="ex: USDC"
                />
                <div className="md:col-span-2">
                  <Field
                    label="Issuer address"
                    name="issuerAddress"
                    value={assetOperationObj.issuerAddress}
                    onChange={handleChange}
                    placeholder="G..."
                  />
                </div>
                <Field
                  label="Amount"
                  name="limit"
                  value={assetOperationObj.limit}
                  onChange={handleChange}
                  placeholder="ex: 200"
                />
                <div className="md:col-span-2">
                  <Field
                    label="Destination address"
                    name="destination"
                    value={assetOperationObj.destination}
                    onChange={handleChange}
                    placeholder="G..."
                  />
                </div>
              </div>
            )}

            {assetOperation === "deploy" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Deploy SAC UI can live here, but the transaction flow is not
                implemented in the current component.
              </div>
            )}

            {userKey ? (
              <button
                type="submit"
                disabled={isProcessing || !canSubmit}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing
                  ? "Processing transaction..."
                  : assetOperation === "trustline"
                  ? "Change asset trustline"
                  : assetOperation === "payment"
                  ? "Make payment"
                  : "Deploy asset SAC"}
              </button>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Connect a wallet to use asset operations.
              </div>
            )}
          </form>
        </div>
      </section>
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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 break-all">
        {value}
      </div>
    </div>
  );
}
