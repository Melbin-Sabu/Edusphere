import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

function PasswordInput({
  label,
  placeholder,
  register,
  error,
  icon: Icon = Lock,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

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

        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...register}
          {...props}
          className={`w-full bg-slate-800/90 text-white placeholder-slate-500 text-xs sm:text-sm font-medium rounded-xl border py-2.5 pr-11 transition-all duration-200 shadow-sm outline-none ${Icon ? "pl-10" : "px-4"
            } ${error
              ? "border-red-500/80 bg-red-500/10 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-red-200"
              : "border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-slate-600"
            }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs font-semibold mt-1.5 flex items-center gap-1">
          <span>•</span> {error.message}
        </p>
      )}
    </div>
  );
}

export default PasswordInput;