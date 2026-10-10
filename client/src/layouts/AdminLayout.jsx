import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MEDIA_URL } from "../api/api";
import EduSphereLogo from "../components/common/EduSphereLogo";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Layers,
  CalendarCheck,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Key
} from "lucide-react";

function AdminLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const user = authUser || JSON.parse(localStorage.getItem("user") || "{}");

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Toggle Dark Mode class on body/root element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Determine Role-Based Navigation Items
  const getNavItems = () => {
    const roleUpper = (user.role || "").toUpperCase();

    if (roleUpper === "STUDENT") {
      return [
        { name: "My Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
        { name: "My Quizzes", path: "/student/quizzes", icon: BookOpen },
        { name: "Attendance Record", path: "/student/attendance", icon: CalendarCheck },
        { name: "Leave Applications", path: "/student/leaves", icon: FileText },
        { name: "Exams & Results", path: "/student/results", icon: FileText },
        { name: "Fee Payments", path: "/student/fees", icon: Receipt },
        { name: "Change Password", path: "/change-password", icon: Key },
      ];
    }

    if (roleUpper === "TEACHER") {
      return [
        { name: "Faculty Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
        { name: "Manage Subject Teachers", path: "/teacher/subject-teachers", icon: Users },
        { name: "Quiz Management", path: "/teacher/quizzes", icon: FileText },
        { name: "My Batches", path: "/teacher/batches", icon: Layers, isPlaceholder: true },
        { name: "Mark Attendance", path: "/teacher/attendance", icon: CalendarCheck },
        { name: "Leave Approvals", path: "/teacher/leaves", icon: FileText },
        { name: "Student Directory", path: "/administrator/students", icon: GraduationCap },
      ];
    }

    if (roleUpper === "ADMIN") {
      return [
        { name: "Admin Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Student Directory", path: "/administrator/students", icon: GraduationCap, badge: "View Only" },
        { name: "Batch Management", path: "/administrator/batches", icon: Layers },
        { name: "Attendance Records", path: "/administrator/attendance", icon: CalendarCheck, isPlaceholder: true },
        { name: "Timetable Allocation", path: "/admin/timetable", icon: CalendarCheck },
        { name: "Fee Management", path: "/admin/fees", icon: Receipt },
        { name: "Reports & Analytics", path: "/administrator/reports", icon: BarChart3 },
        { name: "Change Password", path: "/change-password", icon: Key },
      ];
    }

    // Default Administrator (Super Admin) Nav Items
    return [
      { name: "Dashboard", path: "/administrator/dashboard", icon: LayoutDashboard },
      { name: "Student Management", path: "/administrator/students", icon: GraduationCap, badge: "Live" },
      { name: "Teacher Management", path: "/administrator/teachers", icon: Users },
      { name: "Admin Management", path: "/administrator/admins", icon: ShieldCheck },
      { name: "Batch Management", path: "/administrator/batches", icon: Layers, badge: "View Only" },
      { name: "Timetable Allocation", path: "/administrator/timetable", icon: CalendarCheck },
      { name: "Attendance", path: "/administrator/attendance", icon: CalendarCheck, isPlaceholder: true },
      { name: "Fees", path: "/administrator/fees", icon: Receipt },
      { name: "Exams & Marks", path: "/administrator/exams", icon: FileText, isPlaceholder: true },
      { name: "Reports & Analytics", path: "/administrator/reports", icon: BarChart3 },
      { name: "Settings", path: "/administrator/settings", icon: Settings, isPlaceholder: true },
    ];
  };

  const navItems = getNavItems();

  const getDashboardHomePath = () => {
    const roleUpper = (user.role || "").toUpperCase();
    switch (roleUpper) {
      case "STUDENT":
        return "/student/dashboard";
      case "TEACHER":
        return "/teacher/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      default:
        return "/administrator/dashboard";
    }
  };

  const handleLogout = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      if (logout) {
        logout();
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    if (typeof window !== "undefined") {
      window.location.replace("/login");
    } else {
      navigate("/login", { replace: true });
    }
  };

  const notificationsList = [
    { id: 1, text: "System notification received", time: "10m ago", unread: true },
    { id: 2, text: "Academic calendar updated", time: "2h ago", unread: false },
  ];

  return (
    <div className={`min-h-screen font-sans ${darkMode ? "bg-[#05110d] text-[#FDFBF7]" : "bg-[#FDFBF7] text-[#0D2F24]"} flex overflow-hidden`}>
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-[#0D2F24]/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0D2F24] text-white transition-all duration-300 ease-in-out border-r border-white/5 ${collapsed ? "w-20" : "w-72"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* LOGO AREA */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-white/5">
          <Link to={getDashboardHomePath()} className="flex items-center">
            {collapsed ? (
              <EduSphereLogo size="sm" showText={false} light={true} />
            ) : (
              <EduSphereLogo size="md" showText={true} showSubtitle={false} light={true} />
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#A3B3AA] ${collapsed ? "hidden" : "block"}`}>
            {user.role ? `${user.role} Menu` : "Main Menu"}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.isPlaceholder ? "#" : item.path}
                onClick={(e) => {
                  if (item.isPlaceholder) {
                    e.preventDefault();
                    toast.success(`${item.name} module is active under your ${user.role || 'user'} portal.`);
                  } else {
                    setMobileOpen(false);
                  }
                }}
                className={`group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-[#D9531E] to-[#C94921] text-white shadow-lg shadow-[#D9531E]/20"
                  : "text-[#8B9E95] hover:bg-white/5 hover:text-white"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-[#8B9E95] group-hover:text-[#E25C31]"}`} />

                {!collapsed && (
                  <span className="truncate flex-1 flex items-center justify-between">
                    {item.name}
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[#FDFBF7]">
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}

                {/* Active Indicator Glow */}
                {isActive && !collapsed && (
                  <span className="w-1.5 h-6 rounded-r-full bg-white absolute left-0 top-1/2 -translate-y-1/2" />
                )}
              </Link>
            );
          })}
        </div>

        {/* FOOTER USER / LOGOUT AREA */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition ${collapsed ? "justify-center" : ""
              }`}
            title="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVBAR */}
        <header className={`h-20 px-6 sm:px-8 border-b ${darkMode ? "bg-[#0D2F24] border-white/5 text-white" : "bg-[#FDFBF7] border-[#E8E2D2] text-[#0D2F24]"} flex items-center justify-between sticky top-0 z-30 shadow-xs`}>
          {/* Left: Mobile Menu Toggle & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className={`lg:hidden p-2 rounded-xl transition ${darkMode ? "text-[#A3B3AA] hover:text-white hover:bg-white/5" : "text-[#8B9E95] hover:text-[#0D2F24] hover:bg-white"}`}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
              <p className={`text-xs font-semibold ${darkMode ? "text-[#A3B3AA]" : "text-[#65776F]"} hidden sm:block`}>EduSphere Platform Workspace</p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex items-center relative w-72 lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 text-[#8B9E95]" />
            <input
              type="text"
              placeholder="Search courses, announcements, records (Ctrl + K)..."
              className={`w-full pl-10 pr-12 py-2.5 rounded-xl text-xs font-semibold border ${darkMode
                ? "bg-[#05110d] border-white/10 text-white placeholder-[#8B9E95] focus:border-[#D9531E]"
                : "bg-white border-[#E8E2D2] text-[#0D2F24] placeholder-[#A3B3AA] focus:border-[#D9531E] focus:ring-1 focus:ring-[#D9531E]"
                } outline-none transition shadow-sm`}
            />
            <span className={`absolute right-3 text-[10px] font-bold px-1.5 py-0.5 rounded ${darkMode ? "bg-white/10 text-[#A3B3AA]" : "bg-[#FDFBF7] border border-[#E8E2D2] text-[#65776F]"}`}>
              ⌘K
            </span>
          </div>

          {/* Right: Controls & Profile */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition shadow-sm ${darkMode
                ? "bg-[#05110d] border-white/10 text-amber-400 hover:bg-white/5"
                : "bg-white border-[#E8E2D2] text-[#65776F] hover:bg-[#FDFBF7] hover:text-[#D9531E]"
                }`}
              title="Toggle Dark / Light Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className={`relative p-2.5 rounded-xl border transition shadow-sm ${darkMode
                  ? "bg-[#05110d] border-white/10 text-[#A3B3AA] hover:bg-white/5"
                  : "bg-white border-[#E8E2D2] text-[#65776F] hover:bg-[#FDFBF7] hover:text-[#D9531E]"
                  }`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D9531E] ring-2 ring-white"></span>
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl border shadow-2xl p-4 z-50 ${darkMode ? "bg-[#0D2F24] border-white/10 text-white shadow-black/50" : "bg-white border-[#E8E2D2] text-[#0D2F24] shadow-black/10"
                  }`}>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/20">
                    <h4 className="font-bold text-xs uppercase tracking-wider">Notifications</h4>
                    <span className="text-[10px] font-bold text-white bg-[#D9531E] px-2 py-0.5 rounded-full">2 New</span>
                  </div>
                  <div className="space-y-2">
                    {notificationsList.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-xl transition cursor-pointer text-xs ${darkMode ? "bg-[#05110d] hover:bg-white/5" : "bg-[#FDFBF7] hover:bg-[#F2EDDF]"}`}>
                        <p className={`font-semibold ${darkMode ? "text-white" : "text-[#0D2F24]"}`}>{n.text}</p>
                        <span className={`text-[10px] ${darkMode ? "text-[#A3B3AA]" : "text-[#65776F]"}`}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className={`flex items-center gap-3 p-1.5 rounded-xl transition ${darkMode ? "hover:bg-white/5" : "hover:bg-white border border-transparent hover:border-[#E8E2D2]"}`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D9531E] to-[#C94921] text-white flex items-center justify-center font-extrabold text-sm shadow-md overflow-hidden">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic.startsWith("http") ? user.profilePic : `${MEDIA_URL}${user.profilePic}`}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold leading-tight">{user.name || "User"}</p>
                  <p className={`text-[10px] font-bold ${darkMode ? "text-[#E25C31]" : "text-[#D9531E]"}`}>{user.role || "Student"}</p>
                </div>
                <ChevronDown className={`w-4 h-4 hidden sm:block ${darkMode ? "text-[#8B9E95]" : "text-[#A3B3AA]"}`} />
              </button>

              {showProfileMenu && (
                <div className={`absolute right-0 mt-3 w-56 rounded-2xl border shadow-2xl p-2 z-50 ${darkMode ? "bg-[#0D2F24] border-white/10 text-white shadow-black/50" : "bg-white border-[#E8E2D2] text-[#0D2F24] shadow-black/10"
                  }`}>
                  <div className="px-3 py-2 border-b border-gray-200/20 mb-1">
                    <p className="text-xs font-bold">{user.name}</p>
                    <p className={`text-[11px] truncate font-semibold ${darkMode ? "text-[#A3B3AA]" : "text-[#65776F]"}`}>{user.email}</p>
                  </div>

                  <Link
                    to="/change-password"
                    onClick={() => setShowProfileMenu(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl transition ${darkMode ? "text-white hover:bg-white/5" : "text-[#0D2F24] hover:bg-[#FDFBF7] hover:text-[#D9531E]"}`}
                  >
                    <Key className="w-4 h-4" /> Change Password
                  </Link>

                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl transition ${darkMode ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" : "text-red-500 hover:bg-red-50"}`}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DYNAMIC MAIN PAGE CONTENT */}
        <main className={`flex-1 overflow-y-auto p-6 sm:p-8 ${darkMode ? "bg-[#05110d]" : "bg-[#F9F6F0]"}`}>
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
