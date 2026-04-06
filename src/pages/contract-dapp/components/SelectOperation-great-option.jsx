import { Category, SearchNormal1, ArrowDown2, TickCircle } from "iconsax-react";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function SelectOperation({
  description = "Select operation",
  contractOperations = [],
  selectedOperation,
  setSelectedOperation,
  setArgs,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filteredOperations = useMemo(() => {
    return contractOperations
      ?.filter((operation) =>
        operation?.name?.toLowerCase().includes(search.toLowerCase())
      )
      ?.sort((a, b) => a.name.localeCompare(b.name));
  }, [contractOperations, search]);

  function formatType(type) {
    const normalized = type.replace(/^scSpecType/, "");

    if (normalized === "Address") return "Address";
    if (normalized === "BytesN") return "BytesNString";

    return normalized.toLowerCase();
  }

  function handleSelect(operation) {
    setSelectedOperation(operation);

    setArgs(
      operation?.inputs?.map((input) => ({
        ...input,
        id: uuidv4(),
        value: "",
        type: formatType(input.type),
      })) || []
    );

    setIsOpen(false);
    setSearch("");
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Category size="18" color="currentColor" />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Operation
              </div>

              <div className="mt-0.5 truncate text-sm font-semibold text-slate-900 sm:text-base">
                {selectedOperation?.name || description}
              </div>

              <div className="mt-0.5 text-xs text-slate-500">
                {selectedOperation
                  ? `${selectedOperation?.inputs?.length || 0} input argument${
                      selectedOperation?.inputs?.length === 1 ? "" : "s"
                    }`
                  : `${contractOperations?.length || 0} available function${
                      contractOperations?.length === 1 ? "" : "s"
                    }`}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {selectedOperation && (
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                {selectedOperation?.inputs?.length || 0} args
              </div>
            )}

            <div
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <ArrowDown2 size="16" color="currentColor" />
            </div>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchNormal1 size="16" color="currentColor" />
              </div>

              <input
                type="text"
                placeholder="Search operation"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filteredOperations?.length > 0 ? (
              <ul className="space-y-1">
                {filteredOperations.map((operation) => {
                  const isSelected =
                    selectedOperation?.name === operation?.name;

                  return (
                    <li key={operation?.name}>
                      <button
                        type="button"
                        onClick={() => handleSelect(operation)}
                        className={`flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3 text-left transition ${
                          isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {operation?.name}
                            </span>
                            {isSelected && (
                              <span className="inline-flex shrink-0 text-emerald-600">
                                <TickCircle size="16" color="currentColor" />
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {operation?.inputs?.length || 0} input argument
                            {(operation?.inputs?.length || 0) === 1 ? "" : "s"}
                          </div>

                          {operation?.doc ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                              {operation.doc}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                          {operation?.inputs?.length || 0} args
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-3 py-8 text-center">
                <div className="text-sm font-medium text-slate-700">
                  No operations found
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Try another search term.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
