import React from "react";

function TextArea({
  label,
  placeholder,
  register,
  error,
  rows = 3,
  className = "",
  ...props
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 font-sans">
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        placeholder={placeholder}
        {...register}
        {...props}
        className={`w-full bg-slate-800/90 text-white placeholder-slate-500 text-xs sm:text-sm font-medium rounded-xl border px-4 py-2.5 transition-all duration-200 shadow-sm outline-none ${
          error
            ? "border-red-500/80 bg-red-500/10 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-red-200"
            : "border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-slate-600"
        }`}
      />

      {error && (
        <p className="text-red-400 text-xs font-semibold mt-1.5 flex items-center gap-1">
          <span>•</span> {error.message}
        </p>
      )}
    </div>
  );
}

export default TextArea;