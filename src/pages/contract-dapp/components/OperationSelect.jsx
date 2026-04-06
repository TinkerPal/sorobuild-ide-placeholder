import { useState, useMemo, useRef, useEffect } from "react";
import { SearchNormal1 } from "iconsax-react";
import { builderOperationOptions } from "../../../utils/helper-functions";
import { ChevronDown } from "lucide-react";

export default function OperationSelect({
  selectedBuilderOperation,
  setSelectedBuilderOperation,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef();

  const selected = builderOperationOptions.find(
    (op) => op.id === selectedBuilderOperation
  );

  const filtered = useMemo(() => {
    return builderOperationOptions.filter((op) =>
      `${op.label} ${op.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, builderOperationOptions]);

  // close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full " ref={ref}>
      <label className="mb-2 block text-sm font-semibold text-slate-900">
        Operation
      </label>

      {/* TRIGGER */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left text-sm text-slate-900 transition hover:border-slate-400"
      >
        <div>
          <p className="font-medium">{selected?.label || "Select operation"}</p>
          {/* {selected?.description && (
            <p className="text-xs text-slate-500">{selected.description}</p>
          )} */}
        </div>

        <ChevronDown className="text-slate-400" />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* SEARCH */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <SearchNormal1 size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search operation..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* LIST */}
          <div className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">
                No operations found
              </p>
            )}

            {filtered.map((op) => (
              <button
                key={op.id}
                onClick={() => {
                  setSelectedBuilderOperation(op.id);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full rounded-xl px-3 py-2 text-left transition ${
                  selectedBuilderOperation === op.id
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{op.label}</p>
                <p className="text-xs text-slate-500">{op.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
