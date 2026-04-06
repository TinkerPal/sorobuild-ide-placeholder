import { useCallback, useEffect, useMemo, useState } from "react";

import PairedButton from "../../components/PairedButton";
import { useStates } from "../../contexts/StatesContext";
import { Outlet, useLocation } from "react-router-dom";
import BadgeButtons from "./components/BadgeButtons";
import OutputModal from "../../components/OutputModal";

export default function ContractDapp() {
  // interact | asset | contract | load

  const [loadedContractId, setLoadedContractId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractAddr, setContractAddr] = useState("");
  const [contractOperations, setContractOperations] = useState([]);

  const {
    userKey,
    network,

    isWalletInstalled,
    connecting,

    selectedTab,
    setSelectedTab,
  } = useStates();

  const location = useLocation();

  useEffect(() => {
    function setSelected() {
      if (location) {
        const path = location?.pathname?.slice(1);
        if (path.startsWith("contract")) {
          setSelectedTab("contract");
        } else {
          setSelectedTab(path);
        }
      }
    }
    setSelected();
  }, [location]);

  const isWalletConnected = Boolean(userKey?.length);
  const activeTabLabel = useMemo(() => {
    switch (selectedTab) {
      case "contract":
        return "Invoke Contract";
      case "deploy":
        return "Deploy Contract";
      case "load":
        return "Load Contract";
      case "asset":
        return "Asset Tools";
      case "builder":
        return "Transaction Builder";
      default:
        return "Contract Interaction";
    }
  }, [selectedTab]);

  const activeTabDescription = useMemo(() => {
    switch (selectedTab) {
      case "contract":
        return "Load a contract, inspect methods, configure arguments, and invoke.";
      case "deploy":
        return "Upload a compiled Soroban `.wasm` file and deploy it using the connected wallet.";
      case "load":
        return "Load Contract";
      case "asset":
        return "Manage trustlines, send Stellar asset payments, deploy SACs, and build custom classic transactions.";
      case "builder":
        return "Construct custom transactions by combining multiple operations, including payments, trustlines, and contract interactions.";
      default:
        return "Contract Interaction";
    }
  }, [selectedTab]);

  const networkLabel = useMemo(() => {
    if (!network) return "No network selected";
    if (typeof network === "string") return network;
    return network?.networkPassphrase || "Unknown network";
  }, [network]);

  const resetLoadedState = useCallback(() => {
    setLoadedContractId("");
    setContractOperations([]);
    setContractAddr("");
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <StudioHero
          activeTabLabel={activeTabLabel}
          networkLabel={networkLabel}
          isWalletConnected={isWalletConnected}
          userKey={userKey}
          loadedContractId={loadedContractId}
          operationsCount={contractOperations?.length || 0}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Studio Workspace
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Deploy contracts, load contract specs, interact with
                      methods, and manage Stellar assets.
                    </p>
                  </div>

                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    Active: {activeTabLabel}
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="w-full ">
                  <PairedButton
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                    setLoadedContractId={setLoadedContractId}
                    setContractOperations={setContractOperations}
                    setContractAddr={setContractAddr}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <h3 className="text-base font-semibold text-slate-900">
                  {activeTabLabel}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTabDescription}
                </p>
              </div>

              <div className="px-4 py-5 sm:px-6">
                <Outlet />
                <OutputModal />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <WalletPanel
              isWalletConnected={isWalletConnected}
              connecting={connecting}
            />

            <StudioStatusCard
              loadedContractId={loadedContractId}
              contractAddr={contractAddr}
              isProcessing={isProcessing}
              operationsCount={contractOperations?.length || 0}
              onReset={resetLoadedState}
            />

            {/* <QuickTipsCard /> */}
          </aside>
        </div>

        {!isWalletConnected && (
          <div className="sticky bottom-4 mt-6 lg:hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
              {!isWalletInstalled ? (
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Install Freighter
                </a>
              ) : (
                <button className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  {connecting ? "Connecting..." : "Connect Wssallet"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StudioHero({
  activeTabLabel,

  isWalletConnected,
  userKey,
  loadedContractId,
  operationsCount,
}) {
  const { network, contractOperations } = useStates();
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_32%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.10),transparent_30%)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="items-center flex gap-2">
              {/* <img src="/sorobuildIcon.svg" className="h-5 w-auto " /> */}

              <BadgeButtons />
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Asset creation, contract deployment, and interaction in one
              workspace
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              A cleaner studio experience for creating Stellar assets, deploying
              contracts, loading contract specs, and interacting with Soroban
              methods from a single interface.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
            <StatPill label="Mode" value={activeTabLabel} />
            <StatPill label="Network" value={network?.network || "NONE"} />
            <StatPill
              label="Wallet"
              value={isWalletConnected ? shortenKey(userKey) : "Not connected"}
            />
            <StatPill
              label="Loaded methods"
              value={contractOperations?.length || 0}
            />
          </div>
        </div>

        {loadedContractId ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Loaded contract:{" "}
            <span className="font-medium">
              {shortenKey(loadedContractId, 10, 10)}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function WalletPanel({ isWalletConnected, connecting }) {
  const { setWalletKitIsOpen, userKey, network, walletApp, maskKey } =
    useStates();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Wallet Info</h3>
      <p className="mt-1 text-sm text-slate-500">
        Connect your wallet to interact with contracts and execute asset
        actions.
      </p>

      <div className="mt-5 space-y-3">
        <StatusRow
          label="Wallet"
          value={walletApp ? walletApp : "Not Selected"}
          tone={"default"}
        />
        <StatusRow
          label="Connection"
          value={isWalletConnected ? "Connected" : "Disconnected"}
          tone={isWalletConnected ? "success" : "warning"}
        />
        <StatusRow
          label="Network"
          value={network?.network ? network?.network : "Disconnected"}
          tone={isWalletConnected ? "success" : "warning"}
        />
      </div>

      {isWalletConnected ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Connected address
          </div>
          <div className="mt-1 break-all text-sm font-medium text-slate-900">
            {maskKey(userKey, 10, 10, 6)}
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setWalletKitIsOpen(true);
          }}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </section>
  );
}

function StudioStatusCard({
  loadedContractId,
  contractAddr,
  isProcessing,
  operationsCount,
  onReset,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">
          Session status
        </h3>
        <button
          onClick={onReset}
          className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 space-y-3">
        <StatusRow
          label="Processing"
          value={isProcessing ? "Running" : "Idle"}
          tone={isProcessing ? "info" : "default"}
        />
        <StatusRow
          label="Loaded contract"
          value={loadedContractId ? shortenKey(loadedContractId, 8, 8) : "None"}
          tone={loadedContractId ? "success" : "default"}
        />
        <StatusRow
          label="Input contract"
          value={contractAddr ? shortenKey(contractAddr, 8, 8) : "Empty"}
          tone="default"
        />
        <StatusRow
          label="Contract methods"
          value={String(operationsCount || 0)}
          tone="default"
        />
      </div>
    </section>
  );
}

function StatPill({ label, value }) {
  const { contractOperations } = useStates();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function StatusRow({ label, value, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tone === "info"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function shortenKey(value, start = 6, end = 6) {
  if (!value || value.length <= start + end + 3) return value || "";
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}
