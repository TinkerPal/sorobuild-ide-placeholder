import React, { useState } from "react";
import { loadContractSpecs } from "../../utils/soroban";
import { useStates } from "../../contexts/StatesContext";
import { useNavigate } from "react-router-dom";

export default function LoadContract() {
  const {
    loadedContractId,
    setLoadedContractId,
    network,
    setContractOperations,
  } = useStates();

  const [selectedToken, setSelectedToken] = useState("");
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [args, setArgs] = useState([]);
  const [outputs, setOutputs] = useState(null);
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

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
        navigate(`${network?.network?.toLowerCase()}/${selectedToken.trim()}`);
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
        </div>
      </section>
    </div>
  );
}
