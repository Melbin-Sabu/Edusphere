import React from "react";

function Card({ children, className = "", hover = true, padding = "p-6" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${hover ? "hover:shadow-md hover:border-purple-200 transition-all duration-300" : ""
        } ${padding} ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
