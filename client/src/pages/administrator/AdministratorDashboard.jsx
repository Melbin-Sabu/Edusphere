import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Link } from "react-router-dom";
import api from "../../api/api";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  DollarSign,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  CheckCircle2,
  Eye,
  X,
  FileText,
  ExternalLink,
  Calendar,
  User,
  FileCheck,
  Check,
  XCircle,
  AlertTriangle,
  Sun,
  Moon,
  Stethoscope,
  Zap,
  Filter,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function AdministratorDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [activeTab, setActiveTab] = useState("applications"); // 'applications' or 'students'
  const [allStudents, setAllStudents] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalResult, setApprovalResult] = useState(null);

  // Filters for NEET / JEE & Morning / Evening Batch
  const [examFilter, setExamFilter] = useState("ALL"); // ALL, NEET, JEE
  const [batchFilter, setBatchFilter] = useState("ALL"); // ALL, MORNING, EVENING

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Load enrolled students
      const resStudents = await api.get("/students", { headers });
      const listStudents = resStudents.data.students || [];
      setAllStudents(listStudents);
      setStudentCount(listStudents.length);

      // Load admission applications
      const resApps = await api.get("/administrator/applications", { headers });
      setApplications(resApps.data.applications || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkEligible = async (appId) => {
    if (!window.confirm("Mark application as ELIGIBLE and dispatch fee payment email to applicant?")) {
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/administrator/applications/${appId}/mark-eligible`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Application marked as ELIGIBLE! Registration fee payment link dispatched to applicant email.");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update application eligibility.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (appId) => {
    if (!window.confirm("Are you sure you want to give final approval and generate student credentials?")) {
      return;
    }
    setActionLoading(true);
    setApprovalResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/administrator/applications/${appId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApprovalResult(res.data);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModalApp || !rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const appId = rejectModalApp._id || rejectModalApp.applicationId;
      await api.post(
        `/administrator/applications/${appId}/reject`,
        { rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Application has been rejected.");
      setRejectModalApp(null);
      setRejectionReason("");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject application.");
    } finally {
      setActionLoading(false);
    }
  };

  // Category Helper Functions
  const isNeet = (courseStr = "") => /neet/i.test(courseStr);
  const isJee = (courseStr = "") => /jee/i.test(courseStr);
  const isMorning = (batchStr = "") => /morning/i.test(batchStr);
  const isEvening = (batchStr = "") => /evening/i.test(batchStr);

  // Statistics Calculations
  const neetStudentsCount = allStudents.filter((s) => isNeet(s.course)).length;
  const neetAppsCount = applications.filter((a) => isNeet(a.courseId)).length;
  const totalNeet = neetStudentsCount + neetAppsCount;

  const jeeStudentsCount = allStudents.filter((s) => isJee(s.course)).length;
  const jeeAppsCount = applications.filter((a) => isJee(a.courseId)).length;
  const totalJee = jeeStudentsCount + jeeAppsCount;

  const morningStudentsCount = allStudents.filter((s) => isMorning(s.batch)).length;
  const morningAppsCount = applications.filter((a) => isMorning(a.batchId)).length;
  const totalMorning = morningStudentsCount + morningAppsCount;

  const eveningStudentsCount = allStudents.filter((s) => isEvening(s.batch)).length;
  const eveningAppsCount = applications.filter((a) => isEvening(a.batchId)).length;
  const totalEvening = eveningStudentsCount + eveningAppsCount;

  // Filter Applications
  const filteredApplications = applications.filter((app) => {
    const courseMatch =
      examFilter === "ALL"
        ? true
        : examFilter === "NEET"
          ? isNeet(app.courseId)
          : isJee(app.courseId);

    const batchMatch =
      batchFilter === "ALL"
        ? true
        : batchFilter === "MORNING"
          ? isMorning(app.batchId)
          : isEvening(app.batchId);

    return courseMatch && batchMatch;
  });

  // Filter Enrolled Students
  const filteredStudents = allStudents.filter((st) => {
    const courseMatch =
      examFilter === "ALL"
        ? true
        : examFilter === "NEET"
          ? isNeet(st.course)
          : isJee(st.course);

    const batchMatch =
      batchFilter === "ALL"
        ? true
        : batchFilter === "MORNING"
          ? isMorning(st.batch)
          : isEvening(st.batch);

    return courseMatch && batchMatch;
  });

  const statsCards = [
    {
      title: "Total Enrolled",
      value: studentCount || 0,
      change: "Enrolled Roster",
      icon: GraduationCap,
      color: "from-purple-600 to-indigo-600",
      bgLight: "bg-purple-50 text-purple-600 border-purple-200",
    },
    {
      title: "NEET Registered",
      value: totalNeet,
      change: `${neetStudentsCount} Enrolled | ${neetAppsCount} Applicants`,
      icon: Stethoscope,
      color: "from-emerald-600 to-teal-600",
      bgLight: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      title: "JEE Registered",
      value: totalJee,
      change: `${jeeStudentsCount} Enrolled | ${jeeAppsCount} Applicants`,
      icon: Zap,
      color: "from-blue-600 to-indigo-600",
      bgLight: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      title: "Morning Batch",
      value: totalMorning,
      change: `${morningStudentsCount} Enrolled | ${morningAppsCount} Applicants`,
      icon: Sun,
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      title: "Evening Batch",
      value: totalEvening,
      change: `${eveningStudentsCount} Enrolled | ${eveningAppsCount} Applicants`,
      icon: Moon,
      color: "from-indigo-600 to-purple-800",
      bgLight: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
  ];

  return (
    <AdminLayout title="Administrator Control Hub">
      {/* WELCOME BANNER CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-8 sm:p-10 text-white shadow-xl border border-purple-800/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Admission & Institution Governance Hub
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user.name || "Administrator"}!
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Manage NEET & JEE registrations, separate Morning and Evening batch rosters, verify student academic credentials, and process admission approvals.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK STATISTICS GRID */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Institution Core Metrics & Roster Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statsCards.map((stat, idx) => {
            const IconComp = stat.icon;
            return (
              <Card key={idx} padding="p-4" className="relative group overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl border ${stat.bgLight} group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</h4>
                <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{stat.title}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 truncate">
                  {stat.change}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CATEGORY & BATCH SEPARATION FILTERS */}
      <Card className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Records:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Exam Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Exam:</span>
              <button
                onClick={() => setExamFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${examFilter === "ALL" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                All Exams
              </button>
              <button
                onClick={() => setExamFilter("NEET")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${examFilter === "NEET" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Stethoscope className="w-3.5 h-3.5" /> NEET Registered ({totalNeet})
              </button>
              <button
                onClick={() => setExamFilter("JEE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${examFilter === "JEE" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Zap className="w-3.5 h-3.5" /> JEE Registered ({totalJee})
              </button>
            </div>

            {/* Batch Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Batch:</span>
              <button
                onClick={() => setBatchFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${batchFilter === "ALL" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                All Batches
              </button>
              <button
                onClick={() => setBatchFilter("MORNING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${batchFilter === "MORNING" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Sun className="w-3.5 h-3.5" /> Morning Batch ({totalMorning})
              </button>
              <button
                onClick={() => setBatchFilter("EVENING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${batchFilter === "EVENING" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Moon className="w-3.5 h-3.5" /> Evening Batch ({totalEvening})
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ADMISSION APPLICATIONS / ENROLLED STUDENTS TABS */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Admission Applications & Enrolled Roster</h4>
            <p className="text-xs text-slate-500">
              Showing records filtered by <strong>Exam ({examFilter})</strong> and <strong>Batch ({batchFilter})</strong>.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "applications"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Admission Applications ({filteredApplications.length})
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "students"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Enrolled Students ({filteredStudents.length})
            </button>
          </div>
        </div>

        {activeTab === "applications" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">App ID</th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Exam Registered</th>
                  <th className="py-3 px-4">Batch Shift</th>
                  <th className="py-3 px-4">10th / 12th %</th>
                  <th className="py-3 px-4">Eligibility</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700">{app.applicationId}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.fullName}</div>
                        <div className="text-[11px] text-slate-400">{app.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isNeet(app.courseId)
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isJee(app.courseId)
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                            }`}
                        >
                          {isNeet(app.courseId) ? <Stethoscope className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                          {app.courseId || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isMorning(app.batchId)
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : isEvening(app.batchId)
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                        >
                          {isMorning(app.batchId) ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                          {app.batchId || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        10th: <span className="font-bold">{app.tenthPercentage}%</span> | 12th: <span className="font-bold">{app.twelfthPercentage}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${app.eligibilityStatus === "ELIGIBLE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : app.eligibilityStatus === "NOT_ELIGIBLE"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                        >
                          {app.eligibilityStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold text-[11px] ${app.paymentStatus === "SUCCESS" ? "text-emerald-600" : "text-amber-600"
                            }`}
                        >
                          {app.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 transition"
                            title="View Full Application & Certificates"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {app.applicationStatus !== "ENROLLED" && app.applicationStatus !== "REJECTED" && (
                            <>
                              {app.eligibilityStatus !== "ELIGIBLE" && (
                                <button
                                  onClick={() => handleMarkEligible(app._id || app.applicationId)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[10px] transition border border-indigo-200 flex items-center gap-1 cursor-pointer"
                                  title="Mark as ELIGIBLE & send payment request email to applicant"
                                >
                                  Mark Eligible
                                </button>
                              )}

                              <button
                                onClick={() => handleApprove(app._id || app.applicationId)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[10px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                                title="Accept student & auto-generate admission number + credentials"
                              >
                                Accept & Add
                              </button>

                              <button
                                onClick={() => setRejectModalApp(app)}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] transition border border-rose-200 cursor-pointer"
                                title="Reject application"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No admission applications found for selected filters ({examFilter} / {batchFilter}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4">Exam Registered</th>
                  <th className="py-3 px-4">Batch Shift</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{st.fullName}</div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </td>
                      <td className="py-3 px-4 text-purple-600 font-mono font-bold">{st.admissionNumber}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isNeet(st.course)
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isJee(st.course)
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                            }`}
                        >
                          {isNeet(st.course) ? <Stethoscope className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                          {st.course || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isMorning(st.batch)
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : isEvening(st.batch)
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                        >
                          {isMorning(st.batch) ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                          {st.batch || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Enrolled & Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedStudent(st)}
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 transition"
                          title="View Full Student Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No enrolled students found for selected filters ({examFilter} / {batchFilter}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* APPROVAL RESULT SUCCESS MODAL */}
      {approvalResult && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl text-slate-900 border border-slate-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Application Approved & Student Enrolled!</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
              <div><span className="text-slate-400">Admission Number:</span> <strong className="text-purple-700">{approvalResult.admissionNumber}</strong></div>
              <div><span className="text-slate-400">Temporary Password:</span> <strong className="text-emerald-600">{approvalResult.tempPassword}</strong></div>
              <div><span className="text-slate-400">Email Sent:</span> <strong>{approvalResult.emailSent ? "Yes (Nodemailer Sent)" : "Logged (Resend Available)"}</strong></div>
            </div>
            <Button onClick={() => setApprovalResult(null)} className="w-full">
              Close Approval Summary
            </Button>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectModalApp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-900">Reject Application</h3>
            <p className="text-xs text-slate-500">Applicant: <strong>{rejectModalApp.fullName}</strong> ({rejectModalApp.applicationId})</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State reason for rejecting application..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRejectModalApp(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleReject} disabled={actionLoading} className="flex-1 bg-rose-600 hover:bg-rose-700">
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* APPLICANT DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold">Applicant Details ({selectedApp.applicationId})</h3>
              <button onClick={() => setSelectedApp(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div><span className="text-slate-400">Full Name:</span> <strong>{selectedApp.fullName}</strong></div>
                <div><span className="text-slate-400">Email:</span> <strong>{selectedApp.email}</strong></div>
                <div><span className="text-slate-400">Mobile:</span> <strong>{selectedApp.mobile}</strong></div>
                <div><span className="text-slate-400">Gender:</span> <strong>{selectedApp.gender}</strong></div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl space-y-1">
                <div className="font-bold text-purple-900">Academic & Course Selection</div>
                <div>Course: <strong>{selectedApp.courseId}</strong> | Batch: <strong>{selectedApp.batchId}</strong></div>
                <div>10th Percentage: <strong>{selectedApp.tenthPercentage}%</strong></div>
                <div>12th Percentage: <strong>{selectedApp.twelfthPercentage}%</strong></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-slate-700">Parent / Guardian Information</div>
                <div>Name: <strong>{selectedApp.parentName}</strong> ({selectedApp.relationship})</div>
                <div>Email: <strong>{selectedApp.parentEmail}</strong></div>
                <div>Mobile: <strong>{selectedApp.parentMobile}</strong></div>
              </div>
            </div>

            <Button onClick={() => setSelectedApp(null)} className="w-full">
              Close Details
            </Button>
          </div>
        </div>
      )}

      {/* STUDENT DETAIL MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold">Enrolled Student Profile</h3>
              <button onClick={() => setSelectedStudent(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl space-y-1">
                <div className="font-bold text-purple-900 text-sm">{selectedStudent.fullName}</div>
                <div>Admission #: <strong className="font-mono text-purple-700">{selectedStudent.admissionNumber}</strong></div>
                <div>Email: <strong>{selectedStudent.email}</strong></div>
                <div>Mobile: <strong>{selectedStudent.mobileNumber}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>Course: <strong>{selectedStudent.course}</strong></div>
                <div>Batch: <strong>{selectedStudent.batch}</strong></div>
                <div>10th %: <strong>{selectedStudent.tenthPercentage}%</strong></div>
                <div>12th %: <strong>{selectedStudent.twelfthPercentage}%</strong></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-slate-700">Parent Details</div>
                <div>Parent Name: <strong>{selectedStudent.parentName}</strong> ({selectedStudent.relationship})</div>
                <div>Parent Mobile: <strong>{selectedStudent.parentMobile}</strong></div>
              </div>
            </div>

            <Button onClick={() => setSelectedStudent(null)} className="w-full">
              Close Profile
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdministratorDashboard;
