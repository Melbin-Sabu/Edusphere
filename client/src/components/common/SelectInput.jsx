import React from "react";
import { ChevronDown } from "lucide-react";

function SelectInput({
  label,
  options = [],
  register,
  error,
  icon: Icon,
  className = "",
  placeholder,
  ...props
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 font-sans">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          {...register}
          {...props}
          className={`w-full bg-slate-800/90 text-white text-xs sm:text-sm font-medium rounded-xl border py-2.5 pr-10 appearance-none transition-all duration-200 shadow-sm outline-none cursor-pointer ${
            Icon ? "pl-10" : "px-4"
          } ${
            error
              ? "border-red-500/80 bg-red-500/10 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-red-200"
              : "border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-slate-600"
          }`}
        >
          <option value="" className="bg-slate-900 text-slate-400">
            {placeholder || `Select ${label || "Option"}`}
          </option>

          {options.map((item) => {
            const value = typeof item === "object" ? item.value : item;
            const labelText = typeof item === "object" ? item.label : item;
            return (
              <option key={value} value={value} className="bg-slate-900 text-white">
                {labelText}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3.5 text-slate-400 pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs font-semibold mt-1.5 flex items-center gap-1">
          <span>•</span> {error.message}
        </p>
      )}
    </div>
  );
}

export default SelectInput;