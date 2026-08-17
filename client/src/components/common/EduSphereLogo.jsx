import React from "react";

function EduSphereLogo({ size = "md", showText = true, showSubtitle = false, className = "", light = false }) {
  const sizeMap = {
    sm: { icon: "w-7 h-7", text: "text-lg", sub: "text-[10px]" },
    md: { icon: "w-9 h-9", text: "text-xl", sub: "text-xs" },
    lg: { icon: "w-12 h-12", text: "text-2xl", sub: "text-xs" },
    xl: { icon: "w-16 h-16", text: "text-3xl", sub: "text-sm" },
  };

  const { icon, text, sub } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Gradient SVG Logo */}
      <div className={`relative flex items-center justify-center ${icon} rounded-xl bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-600 p-0.5 shadow-md shadow-purple-500/20`}>
        <div className="w-full h-full bg-slate-950/20 backdrop-blur-xs rounded-[10px] flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1.5 text-white">
            <defs>
              <linearGradient id="eduSphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="50%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>

            {/* AI Circuit Lines / Rays Background */}
            <path d="M50 15 L50 5 M50 85 L50 95 M15 50 L5 50 M85 50 L95 50" stroke="url(#eduSphereGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
            <circle cx="50" cy="50" r="38" stroke="url(#eduSphereGrad)" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.5" />

            {/* Open Book Base */}
            <path d="M22 68 C32 60 44 60 50 64 C56 60 68 60 78 68 V42 C68 35 56 35 50 39 C44 35 32 35 22 42 Z" fill="url(#eduSphereGrad)" opacity="0.9" />
            <path d="M50 39 V64" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

            {/* Graduation Cap Top */}
            <polygon points="50,18 80,30 50,42 20,30" fill="url(#eduSphereGrad)" />
            {/* Tassel */}
            <path d="M72 33 V48 C72 50 75 52 75 52" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="75" cy="53" r="2" fill="#F59E0B" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-tight ${text} flex items-center gap-1.5 font-sans`}>
            <span className={light ? "text-white" : "text-slate-900 font-black"}>Edu</span>
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Sphere</span>
          </div>
          {showSubtitle && (
            <span className={`font-medium tracking-wide uppercase ${sub} ${light ? "text-purple-200/80" : "text-slate-500"}`}>
              AI-Powered Adaptive Coaching Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default EduSphereLogo;
