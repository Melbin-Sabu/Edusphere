import React from "react";
import EduSphereLogo from "./EduSphereLogo";

function Loader({ fullScreen = false, text = "Loading EduSphere..." }) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-4 select-none">
      <div className="relative">
        <EduSphereLogo size="lg" showText={false} />
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-30 animate-pulse"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></div>
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
      </div>
      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export default Loader;
