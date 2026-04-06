export default function InDevelopmentFloating() {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30">
      <div className="pointer-events-auto w-[480px] rounded-2xl border border-amber-200 bg-white/90 backdrop-blur-md p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-amber-200 px-4 py-0.5 text-2xl font-semibold text-amber-700">
            In Development
          </span>
        </div>

        <p className="mt-3 text-lg font-medium text-slate-900">SoroBuild IDE</p>

        <p className="mt-1 text-s leading-relaxed text-slate-600">
          We’re building a streamlined, Remix-style experience for Soroban &
          Stellar transactions.
        </p>

        <p className="mt-2 text-lg text-slate-500">Stay tuned!!</p>
      </div>
    </div>
  );
}
