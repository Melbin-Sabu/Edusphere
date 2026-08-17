import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
        { name: "My Courses", path: "/student/courses", icon: BookOpen, isPlaceholder: true },
        { name: "Attendance Record", path: "/student/attendance", icon: CalendarCheck, isPlaceholder: true },
        { name: "Exams & Results", path: "/student/exams", icon: FileText, isPlaceholder: true },
        { name: "Fee Payments", path: "/student/fees", icon: Receipt, isPlaceholder: true },
        { name: "Change Password", path: "/change-password", icon: Key },
      ];
    }

    if (roleUpper === "TEACHER") {
      return [
        { name: "Faculty Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
        { name: "Manage Subject Teachers", path: "/teacher/subject-teachers", icon: Users },
        { name: "My Batches", path: "/teacher/batches", icon: Layers, isPlaceholder: true },
        { name: "Mark Attendance", path: "/teacher/attendance", icon: CalendarCheck, isPlaceholder: true },
        { name: "Exam Marks Entry", path: "/teacher/exams", icon: FileText, isPlaceholder: true },
        { name: "Student Directory", path: "/administrator/students", icon: GraduationCap },
      ];
    }

    if (roleUpper === "ADMIN") {
      return [
        { name: "Admin Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Student Directory", path: "/administrator/students", icon: GraduationCap, badge: "View Only" },
        { name: "Batch Management", path: "/administrator/batches", icon: Layers },
        { name: "Attendance Records", path: "/administrator/attendance", icon: CalendarCheck, isPlaceholder: true },
        { name: "Reports & Analytics", path: "/administrator/reports", icon: BarChart3, isPlaceholder: true },
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
      { name: "Attendance", path: "/administrator/attendance", icon: CalendarCheck, isPlaceholder: true },
      { name: "Fees", path: "/administrator/fees", icon: Receipt, isPlaceholder: true },
      { name: "Exams & Marks", path: "/administrator/exams", icon: FileText, isPlaceholder: true },
      { name: "Reports", path: "/administrator/reports", icon: BarChart3, isPlaceholder: true },
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
    <div className={`min-h-screen font-sans ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} flex overflow-hidden`}>
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out border-r border-slate-800 ${collapsed ? "w-20" : "w-72"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* LOGO AREA */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800/80">
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
            className="hidden lg:flex p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
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
          <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${collapsed ? "hidden" : "block"}`}>
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
                    alert(`${item.name} module is active under your ${user.role || 'user'} portal.`);
                  } else {
                    setMobileOpen(false);
                  }
                }}
                className={`group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-purple-300"}`} />

                {!collapsed && (
                  <span className="truncate flex-1 flex items-center justify-between">
                    {item.name}
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300">
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
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition ${collapsed ? "justify-center" : ""
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
        <header className={`h-20 px-6 sm:px-8 border-b ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200/80 text-slate-900"} flex items-center justify-between sticky top-0 z-30 shadow-xs`}>
          {/* Left: Mobile Menu Toggle & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">EduSphere Platform Workspace</p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex items-center relative w-72 lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses, announcements, records (Ctrl + K)..."
              className={`w-full pl-10 pr-12 py-2 rounded-xl text-xs font-medium border ${darkMode
                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-purple-500"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:bg-white"
                } outline-none transition`}
            />
            <span className="absolute right-3 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              ⌘K
            </span>
          </div>

          {/* Right: Controls & Profile */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition ${darkMode
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
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
                className={`relative p-2.5 rounded-xl border transition ${darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white"></span>
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl border shadow-xl p-4 z-50 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/50">
                    <h4 className="font-bold text-xs uppercase tracking-wider">Notifications</h4>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">2 New</span>
                  </div>
                  <div className="space-y-2">
                    {notificationsList.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/50 transition cursor-pointer text-xs">
                        <p className="font-semibold text-slate-800">{n.text}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
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
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-purple-500/20 overflow-hidden">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic.startsWith("http") ? user.profilePic : `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000${user.profilePic}`}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold leading-tight">{user.name || "User"}</p>
                  <p className="text-[10px] font-medium text-purple-600 dark:text-purple-400">{user.role || "Student"}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {showProfileMenu && (
                <div className={`absolute right-0 mt-3 w-56 rounded-2xl border shadow-xl p-2 z-50 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}>
                  <div className="px-3 py-2 border-b border-slate-200/50 mb-1">
                    <p className="text-xs font-bold">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/change-password"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition"
                  >
                    <Key className="w-4 h-4" /> Change Password
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 rounded-xl hover:bg-rose-50 transition"
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
        <main className={`flex-1 overflow-y-auto p-6 sm:p-8 ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}>
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
