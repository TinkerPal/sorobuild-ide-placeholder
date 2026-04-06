import React, { useMemo, useState } from "react";
import { Copy, CloseCircle } from "iconsax-react";
import QRCode from "react-qr-code";
import { X } from "lucide-react";

const LINKS = {
  studio: "https://studio.soro.build",
  ide: "https://ide.soro.build",
  home: "https://soro.build",
};

const donationAddress = import.meta.env.VITE_DONATION_WALLET;

export default function BadgeButtons() {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortAddress = useMemo(() => {
    if (!donationAddress) return "";
    return `${donationAddress.slice(0, 8)}...${donationAddress.slice(-8)}`;
  }, []);

  function openExternal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(donationAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy donation address:", error);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      setShowDonateModal(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openExternal(LINKS.studio)}
          className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:border-indigo-400 hover:bg-indigo-100"
        >
          SoroBuild Studio
        </button>

        <button
          type="button"
          onClick={() => openExternal(LINKS.ide)}
          className="hidden items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 sm:inline-flex"
        >
          SoroBuild IDE
        </button>

        <button
          type="button"
          onClick={() => openExternal(LINKS.home)}
          className="hidden items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 sm:inline-flex"
        >
          SoroBuild Home
        </button>

        <button
          type="button"
          onClick={() => setShowDonateModal(true)}
          className="hidden items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 sm:inline-flex"
        >
          Support SoroBuild
        </button>

        {/* <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600">
          18
        </span> */}
      </div>

      {showDonateModal && (
        <div
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Support SoroBuild
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Thank you for supporting our work. Your donation helps us
                  continue improving SoroBuild for the ecosystem.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDonateModal(false)}
                className="ml-4 inline-flex h-10 w-10 items-center justify-center bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <X size="20" color="currentColor" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mx-auto flex w-full max-w-[220px] justify-center rounded-2xl bg-white p-4 shadow-sm">
                  <QRCode
                    value={donationAddress}
                    size={180}
                    bgColor="transparent"
                    fgColor="#0f172a"
                  />
                </div>

                <p className="mt-4 text-center text-sm text-slate-600">
                  Scan this QR code with your wallet app to donate.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Donation wallet address
                </p>

                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {shortAddress}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {donationAddress}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                    title="Copy wallet address"
                  >
                    <Copy size="18" color="currentColor" />
                  </button>
                </div>

                {copied && (
                  <p className="mt-2 text-xs font-medium text-emerald-600">
                    Wallet address copied.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-900">
                  Thank you for your support
                </p>
                <p className="mt-1 text-sm text-indigo-800">
                  Every contribution helps us keep building better tools for
                  Soroban and Stellar developers.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Copy address
                </button>

                <button
                  type="button"
                  onClick={() => setShowDonateModal(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
