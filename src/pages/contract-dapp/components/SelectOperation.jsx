import {
  Category,
  SearchNormal1,
  ArrowDown2,
  TickCircle,
  CloseCircle,
} from "iconsax-react";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const filteredOperations = useMemo(() => {
    return contractOperations
      ?.filter((operation) =>
        operation?.name?.toLowerCase().includes(search.toLowerCase())
      )
      ?.sort((a, b) => a.name.localeCompare(b.name));
  }, [contractOperations, search]);

  function formatType(type) {
    const normalized = String(type || "").replace(/^scSpecType/, "");

    const map = {
      Address: "Address",
      Bool: "bool",
      I32: "i32",
      I64: "i64",
      I128: "i128",
      U32: "u32",
      U64: "u64",
      U128: "u128",
      String: "string",
      Symbol: "symbol",
      Bytes: "bytes",
      BytesN: "BytesNString",
      Vec: "vec",
      Map: "map",
      Option: "option",
      Tuple: "tuple",
    };

    return map[normalized] || normalized;
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
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
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

            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition">
              <ArrowDown2 size="16" color="currentColor" />
            </div>
          </div>
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999]">
            <div
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <div className="absolute inset-x-4 top-[10vh] mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:inset-x-6">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Select operation
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a contract function to inspect and invoke.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                >
                  <CloseCircle size="18" color="currentColor" />
                </button>
              </div>

              <div className="border-b border-slate-200 p-4 sm:p-5">
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

              <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-3">
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
                            className={`flex w-full items-start justify-between gap-4 rounded-2xl px-3 py-3 text-left transition sm:px-4 ${
                              isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                                  {operation?.name}
                                </span>

                                {isSelected && (
                                  <span className="inline-flex shrink-0 text-emerald-600">
                                    <TickCircle
                                      size="16"
                                      color="currentColor"
                                    />
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {operation?.inputs?.length || 0} input argument
                                {(operation?.inputs?.length || 0) === 1
                                  ? ""
                                  : "s"}
                              </div>

                              {operation?.doc ? (
                                <p className="mt-1 text-xs leading-5 text-slate-500">
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
                  <div className="px-3 py-10 text-center">
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
          </div>,
          document.body
        )}
    </>
  );
}
