import { CloseCircle, Copy } from "iconsax-react";
import { useStates } from "../contexts/StatesContext";
import { ArrowUpRight } from "lucide-react";

export default function OutputModal() {
  const { showOutputModal, setShowOutputModal, outputs, setOutputs, network } =
    useStates();

  const open = showOutputModal;
  const onClose = () => setShowOutputModal(false);
  const data = outputs;

  const EXPLORER_BASE_URL = "https://stellar.expert/explorer";

  const txHash = outputs?.txHash || outputs?.hash;
  const explorerUrl = txHash
    ? `${EXPLORER_BASE_URL}/${network?.network?.toLowerCase()}/tx/${txHash}`
    : null;

  if (!open) return null;

  const formatted = JSON.stringify(
    data,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );

  const copyHandler = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
      />

      {/* MODAL */}
      <div className="relative w-full max-w-2xl mx-4 rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Transaction Output
          </h3>

          {txHash && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl flex gap-1 items-center text-indigo-600 hover:bg-slate-100 transition"
            >
              View in Explorer
              <ArrowUpRight size={18} />
            </a>
          )}
        </div>

        {/* BODY */}
        <div className="px-6 py-5 max-h-[60vh] overflow-auto">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
            {formatted}
          </pre>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={copyHandler}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-100"
          >
            <Copy size="16" />
            Copy
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
