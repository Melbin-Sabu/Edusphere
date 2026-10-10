import React from "react";

function EduSphereLogo({ size = "md", showText = true, showSubtitle = false, className = "", light = false }) {
  const sizeMap = {
    sm: { icon: "w-7 h-7", text: "text-lg", sub: "text-[9px]" },
    md: { icon: "w-9 h-9", text: "text-xl", sub: "text-[10px]" },
    lg: { icon: "w-12 h-12", text: "text-2xl", sub: "text-[11px]" },
    xl: { icon: "w-16 h-16", text: "text-3xl", sub: "text-sm" },
  };

  const { icon, text, sub } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Exact Leaf Logo SVG matching reference design */}
      <svg className={icon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 36 C10 36 4 28 4 16 C4 6 12 12 20 18 Z" fill="#1D824C" />
        <path d="M20 36 C30 36 36 28 36 16 C36 6 28 12 20 18 Z" fill="#D9531E" />
        <path d="M20 16 L23 4 L20 10 L17 4 Z" fill="#F6E05E" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-tight ${text} flex items-center font-sans leading-none`}>
            <span className={light ? "text-white" : "text-[#0D2F24]"}>Edu</span>
            <span className="text-[#D9531E]">Sphere</span>
          </div>
          {showSubtitle && (
            <span className={`font-bold tracking-widest uppercase mt-0.5 ${sub} ${light ? "text-white/70" : "text-[#65776F]"}`}>
              AI-Powered Coaching Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default EduSphereLogo;
