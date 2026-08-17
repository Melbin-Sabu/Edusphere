import React from "react";
import EduSphereLogo from "../components/common/EduSphereLogo";
import { CheckCircle2, Sparkles, ShieldCheck, Cpu, BarChart3, LogIn } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

function AuthLayout({ title, subtitle, wide = false, children }) {
  const location = useLocation();
  const isApplyPage = location.pathname.includes("/apply") || location.pathname.includes("/register");

  const features = [
    { title: "AI Learning", desc: "Adaptive study paths & smart recommendation engine", icon: Cpu },
    { title: "Smart Analytics", desc: "Real-time rank forecasting & performance metrics", icon: BarChart3 },
    { title: "Secure Platform", desc: "Enterprise role-based access & encrypted records", icon: ShieldCheck },
    { title: "Personalized Coaching", desc: "Tailored feedback for every student", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {/* LEFT SIDE: Brand Showcase & Features */}
      <div className="hidden lg:flex lg:w-7/12 relative bg-mesh-purple p-8 xl:p-10 flex-col justify-between overflow-hidden border-r border-slate-800">
        {/* Subtle glowing orb backgrounds */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Brand Header */}
        <div className="relative z-10">
          <EduSphereLogo size="lg" light={true} showSubtitle={true} />
        </div>

        {/* Hero Title & Illustration Cards */}
        <div className="relative z-10 my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            Enterprise ERP Platform
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            AI-Powered Adaptive Coaching & <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">Rank Intelligence</span>
          </h1>

          <p className="text-slate-300 text-xs xl:text-sm leading-relaxed mb-6">
            Empower educators, streamline administrative operations, and provide personalized adaptive learning pathways for high-performing students.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="group p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-purple-500/40 hover:bg-slate-900/90 transition-all duration-300"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {feat.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pl-1">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Integrated Educational ERP Solution</span>
          <span>v2.5 Enterprise</span>
        </div>
      </div>

      {/* RIGHT SIDE: Modern Glassmorphism Card */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-8 xl:p-10 bg-slate-900 relative overflow-y-auto max-h-screen">
        {/* Top Navigation Bar with Dynamic Context Button */}
        <div className="flex justify-between items-center mb-6 z-20">
          <div className="lg:hidden flex items-center">
            <EduSphereLogo size="sm" light={true} showSubtitle={false} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {isApplyPage ? (
              <>
                <span className="hidden sm:inline text-xs text-slate-400">Already Enrolled?</span>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-extrabold text-xs transition-all border border-slate-700 hover:border-purple-500/50 cursor-pointer shadow-md"
                >
                  <LogIn className="w-3.5 h-3.5 text-purple-400" />
                  <span>Log In to Workspace &rarr;</span>
                </Link>
              </>
            ) : (
              <>
                <span className="hidden sm:inline text-xs text-slate-400">New Applicant?</span>
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-purple-400/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Apply for Admission</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className={`my-auto w-full mx-auto ${wide ? "max-w-2xl" : "max-w-md"}`}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-xl relative">
            {/* Header */}
            <div className="text-left mb-6">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{title}</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {subtitle || "Enter your credentials to access your EduSphere account"}
              </p>
            </div>

            {/* Form Children */}
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 text-xs text-slate-500">
          <p>© 2026 EduSphere. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;