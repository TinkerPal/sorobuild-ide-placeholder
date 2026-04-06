import { useState, useRef, useEffect } from "react";

export default function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  className = "",
  isDisabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const selected = options.find((o) => o.value === value);

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
    <div className={className}>
      {" "}
      <div className={`relative  ${className}`} ref={ref}>
        {label && (
          <label className="mb-2 block text-sm font-semibold text-slate-900">
            {label}
          </label>
        )}

        <button
          disabled={isDisabled}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition hover:border-slate-400 focus:border-slate-900"
        >
          <span className={selected ? "" : "text-slate-400"}>
            {selected ? selected.label : placeholder}
          </span>

          <svg
            className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
