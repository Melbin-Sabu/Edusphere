import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  User, Lock, ArrowRight, X, ShieldAlert, UserPlus, 
  CheckCircle2, Eye, EyeOff, BookOpen, GraduationCap, Users,
  Brain, BarChart2, Shield, Bot, Star
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../validation/loginSchema";
import { motion } from "framer-motion";

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, getRoleDashboard } = useAuth();
  
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customEmailMode, setCustomEmailMode] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleUpper = (user.role || "").toUpperCase();
      const targetDashboard = getRoleDashboard(roleUpper);
      navigate(targetDashboard, { replace: true });
    }
  }, [isAuthenticated, user, getRoleDashboard, navigate]);

  const mockGoogleAccounts = [
    { name: "Melbin Sabu", email: "melbinsabu600@gmail.com", avatarBg: "bg-emerald-700", initials: "MS" },
    { name: "Melbin Sabu", email: "melbinsabu2027@mca.ajce.in", avatarBg: "bg-orange-700", initials: "M" },
  ];

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { token, user: loggedUser } = response.data;
      login(token, loggedUser);

      const roleUpper = (loggedUser.role || "").toUpperCase();
      if (loggedUser.isFirstLogin && roleUpper !== "ADMINISTRATOR") {
        navigate("/change-password", { replace: true });
        return;
      }

      const targetDashboard = getRoleDashboard(roleUpper);
      navigate(targetDashboard, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed. Please verify your credentials.");
    }
  };

  const handleSelectGoogleAccount = async (account) => {
    const emailToUse = typeof account === "string" ? account : account.email;
    const nameToUse = typeof account === "string" ? account.split("@")[0] : account.name;

    if (!emailToUse || !emailToUse.includes("@")) {
      setGoogleError("Please enter a valid Google email address");
      return;
    }

    try {
      setGoogleError("");
      setGoogleLoading(true);

      const response = await api.post("/auth/google-login", {
        email: emailToUse.trim(),
        name: nameToUse,
        googleId: `google_${Date.now()}`,
      });

      const { token, user: loggedUser } = response.data;
      login(token, loggedUser);
      setShowGoogleChooser(false);

      const roleUpper = (loggedUser.role || "").toUpperCase();
      const targetDashboard = getRoleDashboard(roleUpper);
      navigate(targetDashboard, { replace: true });
    } catch (error) {
      setGoogleError(error.response?.data?.message || "Google Sign-In Failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const LeafLogo = ({ className = "w-10 h-10" }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 36 C10 36 4 28 4 16 C4 6 12 12 20 18 Z" fill="#1D824C" />
      <path d="M20 36 C30 36 36 28 36 16 C36 6 28 12 20 18 Z" fill="#D9531E" />
      <path d="M20 16 L23 4 L20 10 L17 4 Z" fill="#F6E05E" />
    </svg>
  );

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden lg:overflow-hidden bg-[#05110d] font-sans selection:bg-[#E25C31] selection:text-white flex flex-col lg:block">
      
      {/* 1. BACKGROUND IMAGE (Right Side) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/student_hero.png" 
          alt="Student Studying" 
          className="w-full h-full object-cover object-[70%_center] lg:object-cover" 
        />
        {/* Subtle dark gradient overlay only on mobile or edges if needed, but mockup shows it clear */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05110d]/40 to-transparent lg:hidden"></div>
      </div>

      {/* 2. SVG VECTOR CURVE (Left Side Cream Shape for Desktop) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden lg:block">
        <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full">
          {/* Shadow/Secondary wave for depth */}
          <path d="M0 0 H1050 C1050 0 850 300 700 900 H0 V0 Z" fill="#E8E2D2" opacity="0.4" />
          {/* Main cream wave */}
          <path d="M0 0 H980 C980 0 750 350 600 900 H0 V0 Z" fill="#FDFBF7" />
        </svg>
      </div>

      {/* 3. FLOATING 3D ELEMENTS (Right side over the image) */}
      <div className="hidden xl:flex absolute top-[25%] right-[42%] z-20 items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl shadow-black/20 border border-white/40 motion-safe:animate-bounce" style={{animationDuration: '4s'}}>
         <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500"><BookOpen className="w-4 h-4"/></div>
         <span className="text-[11px] font-bold text-[#0D2F24] leading-tight">Personalized<br/>Study Plan</span>
      </div>
      <div className="hidden xl:flex absolute top-[45%] right-[32%] z-20 items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl shadow-black/20 border border-white/40 motion-safe:animate-bounce" style={{animationDuration: '5s', animationDelay: '1s'}}>
         <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500"><Bot className="w-4 h-4"/></div>
         <span className="text-[11px] font-bold text-[#0D2F24]">AI Doubt Solver</span>
      </div>
      <div className="hidden xl:flex absolute top-[60%] right-[38%] z-20 items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl shadow-black/20 border border-white/40 motion-safe:animate-bounce" style={{animationDuration: '4.5s', animationDelay: '0.5s'}}>
         <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-500"><BarChart2 className="w-4 h-4"/></div>
         <span className="text-[11px] font-bold text-[#0D2F24] leading-tight">Performance<br/>Analytics</span>
      </div>

      {/* 4. MAIN FOREGROUND CONTAINER */}
      <div className="relative z-30 w-full min-h-screen flex flex-col lg:flex-row lg:px-12 lg:py-10">
        
        {/* Left Side Wrapper (Has Cream Background on Mobile) */}
        <div className="w-full lg:w-[55%] flex flex-col pt-6 px-6 pb-12 lg:p-0 bg-[#FDFBF7] lg:bg-transparent rounded-b-[40px] lg:rounded-none shadow-2xl lg:shadow-none z-20">
          
          {/* Header */}
          <header className="flex justify-between items-center w-full">
            <div className="w-full lg:w-full flex justify-between items-center lg:pr-10">
               {/* Logo */}
               <div className="flex items-center gap-2">
                 <LeafLogo className="w-10 h-10" />
                 <div>
                   <span className="text-xl font-extrabold text-[#0D2F24] tracking-tight block leading-none">Edu<span className="text-[#D9531E]">Sphere</span></span>
                   <span className="text-[7px] font-bold tracking-widest text-[#65776F] uppercase">AI-Powered Coaching Platform</span>
                 </div>
               </div>
               {/* Nav Links */}
               <nav className="hidden xl:flex items-center gap-8">
                  <Link to="#" className="text-[#0D2F24] text-sm font-bold border-b-2 border-[#D9531E] pb-0.5">Home</Link>
                  <Link to="#" className="text-[#65776F] text-sm font-bold hover:text-[#D9531E] transition-colors">About</Link>
                  <Link to="#" className="text-[#65776F] text-sm font-bold hover:text-[#D9531E] transition-colors">Features</Link>
                  <Link to="#" className="text-[#65776F] text-sm font-bold hover:text-[#D9531E] transition-colors">Contact</Link>
               </nav>
            </div>
            
            <div className="hidden lg:flex w-[45%] justify-end items-center gap-4">
               <span className="text-white/90 text-sm font-medium">New Applicant?</span>
               <Link to="/apply" className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D9531E] to-[#C94921] hover:shadow-lg hover:shadow-[#D9531E]/30 text-white text-sm font-bold transition-all shadow-md">
                 Apply for Admission &rarr;
               </Link>
            </div>
          </header>

          <div className="flex flex-col justify-center lg:pr-16 xl:pr-24 mt-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9531E]/20 bg-[#D9531E]/5 text-[#D9531E] text-xs font-bold tracking-widest uppercase mb-6">
                Learn • Analyze • Grow • Achieve
              </div>
              
              <h1 className="text-5xl xl:text-[64px] font-extrabold leading-[1.1] text-[#0D2F24] mb-6 tracking-tight">
                Smarter Learning <br/>
                for a <span className="text-[#D9531E] relative inline-block">
                  Brighter Future
                  <svg className="absolute w-full h-3 -bottom-1 left-0" viewBox="0 0 200 10" preserveAspectRatio="none">
                     <path d="M0,5 Q50,10 100,5 T200,5" stroke="#D9531E" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </h1>
              
              <p className="text-[#4A5D54] text-sm xl:text-base leading-relaxed mb-8 font-medium max-w-lg">
                EduSphere is an AI-powered coaching platform that personalizes learning, streamlines management, and helps every student reach their full potential.
              </p>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mb-12">
                {[
                  { title: "AI Learning Paths", desc: "Personalized study plans for every student", icon: Brain, bg: "bg-[#2F855A]" },
                  { title: "Smart Analytics", desc: "Track performance & predict future success", icon: BarChart2, bg: "bg-[#DD6B20]" },
                  { title: "Unified Platform", desc: "Students, Teachers & Parents in one place", icon: Users, bg: "bg-[#805AD5]" },
                  { title: "Secure & Reliable", desc: "Enterprise-grade security and data privacy", icon: Shield, bg: "bg-[#E53E3E]" },
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center p-3 rounded-[20px] bg-white shadow-sm shadow-black/5 border border-[#E8E2D2]/50 hover:-translate-y-1 hover:shadow-md transition-all group">
                     <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white mr-3 shrink-0 ${feat.bg}`}>
                       <feat.icon className="w-5 h-5"/>
                     </div>
                     <div className="flex-1">
                       <h4 className="text-[#0D2F24] font-extrabold text-[13px] leading-tight mb-0.5">{feat.title}</h4>
                       <p className="text-[#65776F] text-[10px] leading-tight">{feat.desc}</p>
                     </div>
                     <div className="w-6 h-6 rounded-full border border-[#E8E2D2] flex items-center justify-center text-[#A3B3AA] group-hover:bg-[#FDFBF7] group-hover:text-[#0D2F24] transition-colors ml-2 shrink-0">
                       <ArrowRight className="w-3 h-3" />
                     </div>
                  </div>
                ))}
              </div>

              {/* Stats Row (Left Section Bottom) */}
              <div className="flex flex-wrap items-center gap-6 xl:gap-10 mt-auto pt-4 border-t border-[#E8E2D2]/60 max-w-xl">
                <div className="flex items-center gap-3">
                   <GraduationCap className="w-6 h-6 text-[#D9531E]" />
                   <div>
                     <div className="text-lg font-extrabold text-[#0D2F24] leading-tight">10K+</div>
                     <div className="text-[10px] text-[#65776F] uppercase tracking-wider font-semibold">Students</div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <Users className="w-6 h-6 text-[#1D824C]" />
                   <div>
                     <div className="text-lg font-extrabold text-[#0D2F24] leading-tight">500+</div>
                     <div className="text-[10px] text-[#65776F] uppercase tracking-wider font-semibold">Expert Teachers</div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <BarChart2 className="w-6 h-6 text-[#D9531E]" />
                   <div>
                     <div className="text-lg font-extrabold text-[#0D2F24] leading-tight">95%</div>
                     <div className="text-[10px] text-[#65776F] uppercase tracking-wider font-semibold">Success Rate</div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <Star className="w-6 h-6 text-[#F6E05E] fill-current" />
                   <div>
                     <div className="text-lg font-extrabold text-[#0D2F24] leading-tight">4.8/5</div>
                     <div className="text-[10px] text-[#65776F] uppercase tracking-wider font-semibold">User Rating</div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side Login Card Wrapper */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center items-center mt-12 lg:mt-0 px-6 lg:px-0 relative z-10">
          <div className="w-full max-w-[420px]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#FDFBF7] rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-black/50 border border-white/20"
              >
                {/* Logo and Theme Toggle inside Card */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <LeafLogo className="w-8 h-8" />
                    <div>
                      <span className="text-lg font-extrabold text-[#0D2F24] tracking-tight block leading-none">Edu<span className="text-[#D9531E]">Sphere</span></span>
                      <span className="text-[5px] font-bold tracking-widest text-[#65776F] uppercase">AI-Powered Coaching Platform</span>
                    </div>
                  </div>
                  <div className="flex items-center bg-[#E8E2D2] rounded-full p-1 border border-[#DCD5C5]">
                    <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[#D9531E]"><Star className="w-3 h-3 fill-current" /></div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[#8B9E95]"><div className="w-3 h-3 rounded-full bg-[#8B9E95]"></div></div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-3xl font-extrabold text-[#0D2F24] mb-1.5 tracking-tight">Welcome Back 👋</h2>
                  <p className="text-[#65776F] text-[13px] font-medium leading-relaxed">Sign in to access your dashboard and continue your learning journey.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#0D2F24] mb-1.5">
                      Email / Admission Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-[18px] h-[18px] text-[#A3B3AA]" />
                      </div>
                      <input
                        {...register("email")}
                        type="text"
                        placeholder="alen.chemistry@edusphere.com"
                        className={`w-full pl-11 pr-4 py-3 bg-white border rounded-[14px] text-[13px] font-medium text-[#0D2F24] placeholder-[#A3B3AA] focus:outline-none focus:border-[#D9531E] focus:ring-1 focus:ring-[#D9531E] transition-all shadow-sm ${
                          errors.email ? "border-red-400" : "border-[#E8E2D2]"
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>}
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#0D2F24] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-[18px] h-[18px] text-[#A3B3AA]" />
                      </div>
                      <input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-11 py-3 bg-white border rounded-[14px] text-[13px] font-medium text-[#0D2F24] placeholder-[#A3B3AA] focus:outline-none focus:border-[#D9531E] focus:ring-1 focus:ring-[#D9531E] transition-all shadow-sm ${
                          errors.password ? "border-red-400" : "border-[#E8E2D2]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#A3B3AA] hover:text-[#0D2F24] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs font-semibold mt-1">{errors.password.message}</p>}
                  </div>

                  {/* Options */}
                  <div className="flex items-center justify-between pt-1 pb-2">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-[18px] h-[18px]">
                         <input type="checkbox" className="peer appearance-none w-[18px] h-[18px] rounded-[4px] bg-[#0D2F24] cursor-pointer" defaultChecked />
                         <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100" />
                      </div>
                      <span className="text-xs font-semibold text-[#4A5D54] group-hover:text-[#0D2F24] transition-colors">Remember this device</span>
                    </label>
                    <Link to="/forgot-password" className="text-xs font-extrabold text-[#D9531E] hover:text-[#C94921] transition-colors">
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#D9531E] to-[#C94921] hover:opacity-95 text-white rounded-[14px] font-extrabold text-[13px] shadow-lg shadow-[#D9531E]/30 transition-all disabled:opacity-70 mt-1"
                  >
                    {isSubmitting ? "Authenticating..." : "Sign In to EduSphere"}
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </motion.button>
                </form>

                <div className="mt-7 mb-7 relative flex items-center justify-center">
                  <div className="absolute inset-0 border-t border-[#E8E2D2]"></div>
                  <span className="relative bg-[#FDFBF7] px-3 text-[10px] font-bold uppercase tracking-widest text-[#8B9E95]">Or continue with</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setGoogleError("");
                    setCustomEmailMode(false);
                    setShowGoogleChooser(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 py-3 border border-[#E8E2D2] bg-white hover:bg-gray-50 text-[#0D2F24] rounded-[14px] font-extrabold text-[13px] transition-all shadow-sm"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Sign in with Google Account
                </motion.button>
              </motion.div>
              
              <div className="mt-8 text-center lg:hidden">
                 <span className="text-white/80 text-xs font-medium">New to EduSphere? </span>
                 <Link to="/apply" className="text-[#E25C31] text-xs font-bold">Apply for Admission &rarr;</Link>
              </div>
            </div>
          </div>

        </div>


      {/* Google Sign-in Modal */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a1f18]/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-[420px] bg-white border border-[#E8E2D2] rounded-[32px] p-8 shadow-2xl font-sans">
            <button
              onClick={() => setShowGoogleChooser(false)}
              className="absolute top-5 right-5 text-[#8B9E95] hover:text-[#0D2F24] p-1.5 rounded-full hover:bg-[#FDFBF7] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-sm font-bold text-[#65776F]">Sign in with Google</span>
            </div>

            <h2 className="text-2xl font-extrabold text-[#0D2F24] mb-1">Choose an account</h2>
            <p className="text-sm text-[#8B9E95] font-medium mb-6">to continue to EduSphere</p>

            {googleError && (
              <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{googleError}</span>
              </div>
            )}

            {!customEmailMode ? (
              <div className="space-y-2">
                {mockGoogleAccounts.map((acc, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectGoogleAccount(acc)}
                    disabled={googleLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#FDFBF7] border border-transparent hover:border-[#E8E2D2] transition text-left cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-full ${acc.avatarBg} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                      {acc.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#0D2F24] group-hover:text-[#D9531E] transition truncate">
                        {acc.name}
                      </div>
                      <div className="text-xs text-[#65776F] truncate">{acc.email}</div>
                    </div>
                  </button>
                ))}

                <div className="border-t border-[#E8E2D2] my-3"></div>

                <button
                  type="button"
                  onClick={() => setCustomEmailMode(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#FDFBF7] border border-transparent hover:border-[#E8E2D2] transition text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FDFBF7] border border-[#E8E2D2] text-[#0D2F24] flex items-center justify-center shrink-0 group-hover:border-[#D9531E] transition">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-[#0D2F24] group-hover:text-[#D9531E] transition">
                    Use another account
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#0D2F24] mb-1.5">
                    Enter Google email
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="email@gmail.com"
                    autoFocus
                    className="w-full px-4 py-3 bg-white border border-[#E8E2D2] rounded-xl text-sm font-medium text-[#0D2F24] focus:outline-none focus:border-[#D9531E] focus:ring-1 focus:ring-[#D9531E] transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCustomEmailMode(false)}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-[#E8E2D2] bg-white text-[#65776F] text-xs font-bold hover:bg-[#FDFBF7] transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectGoogleAccount(customEmail)}
                    disabled={googleLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#D9531E] hover:bg-[#C94921] text-white text-xs font-bold transition shadow-md disabled:opacity-50"
                  >
                    {googleLoading ? "Signing in..." : "Continue"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
