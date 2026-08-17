import React from "react";

function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  icon: Icon,
  className = "",
}) {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none rounded-xl";

  const variants = {
    primary: "bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-600 text-white hover:opacity-95 hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] focus:ring-purple-600 border border-purple-500/20",
    secondary: "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md active:scale-[0.98] focus:ring-slate-800",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-purple-300 hover:text-purple-700 active:scale-[0.98] focus:ring-purple-500 shadow-xs",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:opacity-95 hover:shadow-md hover:shadow-red-500/20 active:scale-[0.98] focus:ring-red-500",
    ghost: "bg-transparent text-slate-600 hover:bg-purple-50 hover:text-purple-700 active:scale-[0.98] focus:ring-purple-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {Icon && <Icon className="text-current text-base" />}
      <span>{children}</span>
    </button>
  );
}

export default Button;