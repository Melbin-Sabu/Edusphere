import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teacherRegistrationSchema } from "../../validation/teacherRegistrationSchema";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  CheckCircle2,
  Lock,
  X,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  User,
  GraduationCap,
  Phone,
  Building,
  Briefcase,
  Award,
  Calendar,
  MapPin,
  Eye,
  BadgeCheck,
  AlertCircle,
  Trash2,
  Power,
  Layers
} from "lucide-react";

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Allocation Modal State
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationTeacher, setAllocationTeacher] = useState(null);
  const [selectedBatches, setSelectedBatches] = useState([]);

  // Success Modal State
  const [successData, setSuccessData] = useState(null);

  // React Hook Form with Zod Validation Schema
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(teacherRegistrationSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      mobileNumber: "",
      department: "JEE",
      subject: "Physics",
      designation: "Assistant Professor",
      qualification: "M.Tech / Ph.D.",
      experience: "3 Years",
      gender: "Male",
      address: "",
    },
  });

  const selectedDepartment = watch("department", "JEE");
  const jeeSubjects = ["Physics", "Chemistry", "Mathematics"];
  const neetSubjects = ["Physics", "Chemistry", "Botany", "Zoology"];
  const availableSubjects = selectedDepartment === "NEET" ? neetSubjects : jeeSubjects;

  useEffect(() => {
    const currentSub = watch("subject");
    if (!availableSubjects.includes(currentSub)) {
      setValue("subject", availableSubjects[0]);
    }
  }, [selectedDepartment, setValue, watch, availableSubjects]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        const res = await api.get("/teachers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.teachers && res.data.teachers.length > 0) {
          const formatted = res.data.teachers.map((t) => ({
            _id: t._id,
            id: t._id,
            name: t.fullName || t.user?.name || "N/A",
            email: t.email || t.user?.email || "N/A",
            role: "Teacher",
            employeeId: t.employeeId || "N/A",
            mobileNumber: t.mobileNumber || "N/A",
            department: t.department || "JEE",
            subject: t.subject || "Physics",
            designation: t.designation || "Faculty",
            qualification: t.qualification || "N/A",
            experience: t.experience || "N/A",
            gender: t.gender || "Male",
            joiningDate: t.joiningDate || t.createdAt,
            address: t.address || "N/A",
            assignedBatches: t.assignedBatches || [],
            profilePic: t.profilePic || t.user?.profilePic || "",
            isFirstLogin: t.user?.isFirstLogin ?? true,
            status: t.status || t.user?.status || "Active",
            createdAt: t.createdAt,
          }));
          setTeachers(formatted);
          return;
        }
      } catch (err) {
        console.warn("Fallback to auth staff-users endpoint:", err);
      }

      const res = await api.get("/auth/staff-users?role=Teacher", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = async (teacherId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const confirmMsg = `Are you sure you want to change this faculty member status to ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/teachers/${teacherId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (viewTeacher && (viewTeacher._id === teacherId || viewTeacher.id === teacherId)) {
        setViewTeacher((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update faculty status.");
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    const confirmMsg = `Are you sure you want to permanently delete faculty member "${teacherName}" from the database?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (viewTeacher && (viewTeacher._id === teacherId || viewTeacher.id === teacherId)) {
        setViewTeacher(null);
      }
      alert(`Faculty member "${teacherName}" deleted successfully from database.`);
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete faculty record.");
    }
  };

  const handleAllocateBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/teachers/${allocationTeacher._id || allocationTeacher.id}`,
        { assignedBatches: selectedBatches },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAllocationModal(false);
      setAllocationTeacher(null);
      setSelectedBatches([]);
      fetchTeachers();
      alert("Batches allocated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to allocate batches.");
    }
  };

  const handleRegisterTeacher = async (data) => {
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        fullName: data.name.trim(),
        name: data.name.trim(),
        email: data.email.trim(),
        mobileNumber: data.mobileNumber.trim(),
        department: data.department,
        subject: data.subject,
        designation: data.designation,
        qualification: data.qualification.trim(),
        experience: data.experience.trim(),
        gender: data.gender,
        address: data.address.trim(),
        role: "Teacher",
      };

      const res = await api.post("/teachers", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessData({
        name: res.data.teacher?.fullName || res.data.user?.name || data.name,
        email: res.data.teacher?.email || res.data.user?.email || data.email,
        employeeId: res.data.teacher?.employeeId || "TCH-PENDING",
        department: res.data.teacher?.department || data.department,
        designation: res.data.teacher?.designation || data.designation,
        role: "Teacher",
        tempPassword: res.data.tempPassword || res.data.user?.tempPassword || "Edu@48392",
        emailSent: res.data.emailSent,
      });

      reset();
      setShowModal(false);
      fetchTeachers();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to register Teacher account."
      );
    }
  };

  const departments = ["All", "JEE", "NEET"];

  const jeeCount = teachers.filter(
    (t) => (t.department || "").toUpperCase() === "JEE"
  ).length;
  const neetCount = teachers.filter(
    (t) => (t.department || "").toUpperCase() === "NEET"
  ).length;

  const filtered = teachers.filter((t) => {
    const matchesSearch =
      (t.name || t.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.employeeId || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.department || "").toLowerCase().includes(search.toLowerCase());

    const teacherDept = (t.department || "").toUpperCase();
    const matchesTab =
      activeTab === "All" || teacherDept === activeTab.toUpperCase();

    const matchesDept =
      departmentFilter === "All" || teacherDept === departmentFilter.toUpperCase();

    return matchesSearch && matchesTab && matchesDept;
  });

  return (
    <AdminLayout title="Teacher & Faculty Management">
      <Card className="p-6">
        {/* FACULTY STREAM TABS (SEPARATE VIEWS FOR JEE & NEET) */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("All")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${activeTab === "All"
              ? "bg-purple-600 text-white shadow-md shadow-purple-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <Users className="w-4 h-4" />
            <span>All Faculty</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "All" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
            >
              {teachers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("JEE")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${activeTab === "JEE"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60"
              }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            <span>JEE Faculty</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "JEE" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"
                }`}
            >
              {jeeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("NEET")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${activeTab === "NEET"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
              }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>NEET Faculty</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "NEET" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                }`}
            >
              {neetCount}
            </span>
          </button>
        </div>

        {/* TOP CONTROLS & FILTER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, employee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-56 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 text-slate-700"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "All" ? "Filter by Department (All)" : `${dept} Department`}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
            onClick={() => {
              setErrorMessage("");
              reset();
              setShowModal(true);
            }}
          >
            + Add New Faculty
          </Button>
        </div>

        {/* TEACHER LIST / GRID */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching faculty directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Faculty Accounts Found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "+ Add New Faculty" to register a new teacher for JEE or NEET.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <Card
                key={t._id || t.id}
                className="p-5 border-slate-200 hover:border-purple-300 transition shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Header Badge & Name */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-base shadow-inner shrink-0 overflow-hidden">
                        {t.profilePic ? (
                          <img
                            src={t.profilePic.startsWith("http") ? t.profilePic : `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000${t.profilePic}`}
                            alt={t.name || t.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (t.name || t.fullName || "T").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {t.name || t.fullName}
                        </h4>
                        <div className="mt-1">
                          {(t.department || "").toUpperCase() === "JEE" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                              <GraduationCap className="w-3 h-3 text-indigo-600" /> JEE • {t.subject || "Physics"}
                            </span>
                          ) : (t.department || "").toUpperCase() === "NEET" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <Sparkles className="w-3 h-3 text-emerald-600" /> NEET • {t.subject || "Physics"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                              <Building className="w-3 h-3 text-purple-600" /> {t.department || "Faculty"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {t.employeeId && (
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md shrink-0">
                        {t.employeeId}
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <p className="flex items-center gap-2 font-mono text-[11px] truncate text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.email}
                    </p>

                    {t.mobileNumber && t.mobileNumber !== "N/A" && (
                      <p className="flex items-center gap-2 text-slate-700 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {t.mobileNumber}
                      </p>
                    )}

                    <p className="flex items-center gap-2 text-slate-700 text-[11px]">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />{" "}
                      <span>{t.designation || "Faculty Member"} ({t.subject || "Subject Teacher"})</span>
                    </p>

                    {t.assignedBatches && t.assignedBatches.length > 0 && (
                      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-50">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {t.assignedBatches.map(b => (
                            <span key={b} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(t._id || t.id, t.status || "Active")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition cursor-pointer ${
                      (t.status || "Active") === "Active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    }`}
                    title={`Click to set status to ${(t.status || "Active") === "Active" ? "Inactive" : "Active"}`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{t.status || "Active"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setAllocationTeacher(t);
                        setSelectedBatches(t.assignedBatches || []);
                        setShowAllocationModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      title="Allocate Batches"
                    >
                      <Layers className="w-3.5 h-3.5" /> Allocate
                    </button>
                    <button
                      onClick={() => setViewTeacher(t)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      title="View Full Profile"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>

                    <button
                      onClick={() => handleDeleteTeacher(t._id || t.id, t.name || t.fullName)}
                      className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                      title="Delete Faculty from Database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* REGISTER TEACHER MODAL WITH FULL FIELD VALIDATION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Faculty / Teacher</h3>
                <p className="text-xs text-slate-500">
                  Enter faculty details to provision account for JEE or NEET
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleRegisterTeacher)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ananya Sen"
                    {...register("name")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.name ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ananya.sen@edusphere.com"
                    {...register("email")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.email ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    {...register("mobileNumber")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.mobileNumber ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  />
                  {errors.mobileNumber && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.mobileNumber.message}
                    </p>
                  )}
                </div>

                {/* Department (Only JEE & NEET) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Stream <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("department")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.department ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  >
                    <option value="JEE">JEE Faculty</option>
                    <option value="NEET">NEET Faculty</option>
                  </select>
                  {errors.department && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.department.message}
                    </p>
                  )}
                </div>

                {/* Teaching Subject (Dynamic for JEE / NEET) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teaching Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("subject")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.subject ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.subject.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("designation")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.designation ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  >
                    <option value="Head of Department">Head of Department (HOD)</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                    <option value="Lecturer">Lecturer</option>
                  </select>
                  {errors.designation && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.designation.message}
                    </p>
                  )}
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualification <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ph.D. in CS, M.Tech"
                    {...register("qualification")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.qualification ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  />
                  {errors.qualification && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.qualification.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Experience */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teaching Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Years"
                    {...register("experience")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.experience ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  />
                  {errors.experience && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.experience.message}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("gender")}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.gender ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                      } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Flat 4B, Emerald Heights, City Center"
                  {...register("address")}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.address ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-purple-600"
                    } rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition`}
                ></textarea>
                {errors.address && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.address.message}
                  </p>
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-[11px] text-purple-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-purple-800">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Onboarding Credentials
                </p>
                <p className="text-purple-700/90 leading-relaxed">
                  An automated email with temporary login credentials will be dispatched to the entered email address.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 border-purple-600 text-white"
                  icon={UserPlus}
                >
                  {isSubmitting ? "Registering..." : "Register Faculty"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW FULL TEACHER PROFILE MODAL */}
      {viewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setViewTeacher(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xl shadow-inner overflow-hidden shrink-0">
                {viewTeacher.profilePic ? (
                  <img
                    src={viewTeacher.profilePic.startsWith("http") ? viewTeacher.profilePic : `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000${viewTeacher.profilePic}`}
                    alt={viewTeacher.name || viewTeacher.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (viewTeacher.name || viewTeacher.fullName || "T").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {viewTeacher.name || viewTeacher.fullName}
                </h3>
                <p className="text-xs text-purple-700 font-semibold flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-purple-600" /> {viewTeacher.department || "Faculty"} &bull; {viewTeacher.subject || "Subject"} &bull; {viewTeacher.designation || "Teacher"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Employee ID</span>
                <span className="font-mono font-bold text-slate-800 text-xs">{viewTeacher.employeeId || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Email Address</span>
                <span className="font-mono text-slate-800 text-xs truncate block">{viewTeacher.email}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Mobile Number</span>
                <span className="font-semibold text-slate-800 text-xs">{viewTeacher.mobileNumber || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Qualification</span>
                <span className="font-semibold text-slate-800 text-xs">{viewTeacher.qualification || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Teaching Experience</span>
                <span className="font-semibold text-slate-800 text-xs">{viewTeacher.experience || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Gender</span>
                <span className="font-semibold text-slate-800 text-xs">{viewTeacher.gender || "Male"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Allocated Batches</span>
                <div className="flex flex-wrap gap-1">
                  {viewTeacher.assignedBatches && viewTeacher.assignedBatches.length > 0 ? (
                    viewTeacher.assignedBatches.map(b => (
                      <span key={b} className="text-[10px] font-bold bg-white text-slate-700 px-2 py-1 rounded border border-slate-200 shadow-sm">
                        {b}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No batches allocated</span>
                  )}
                </div>
              </div>
            </div>

            {viewTeacher.address && viewTeacher.address !== "N/A" && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mb-5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Residential Address</span>
                <p className="text-slate-700">{viewTeacher.address}</p>
              </div>
            )}

            {/* Modal Footer Controls: Toggle Status, Delete & Close */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => handleToggleStatus(viewTeacher._id || viewTeacher.id, viewTeacher.status || "Active")}
                className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  (viewTeacher.status || "Active") === "Active"
                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{(viewTeacher.status || "Active") === "Active" ? "Deactivate Account" : "Activate Account"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteTeacher(viewTeacher._id || viewTeacher.id, viewTeacher.name || viewTeacher.fullName)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Faculty
              </button>

              <Button
                onClick={() => setViewTeacher(null)}
                className="w-full sm:w-auto py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL WITH DISPLAYED TEMPORARY PASSWORD */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-purple-100 text-center">
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-bold text-slate-900 text-lg mb-1">
              Faculty Account Created Successfully!
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Account registered for <strong className="text-slate-800">{successData.name}</strong>
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Employee ID</span>
                  <span className="text-xs font-mono font-bold text-purple-700">{successData.employeeId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Department</span>
                  <span className="text-xs font-semibold text-slate-800">{successData.department}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-1">
                  Registered Email Address
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {successData.email}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 leading-relaxed bg-purple-50/70 p-3.5 rounded-xl border border-purple-100 mt-2">
                <p className="flex items-center gap-2 text-purple-800 font-bold mb-1 text-xs">
                  <Mail className="w-4 h-4 text-purple-600" /> Login Credentials Dispatched
                </p>
                <p className="text-slate-600 text-[11px] leading-normal">
                  The account password and login instructions have been sent directly to the registered email address: <strong className="text-purple-900 font-mono block mt-0.5">{successData.email}</strong>
                </p>
              </div>
            </div>

            <Button
              onClick={() => setSuccessData(null)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Done & Return to Directory
            </Button>
          </div>
        </div>
      )}

      {/* ALLOCATION MODAL */}
      {showAllocationModal && allocationTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowAllocationModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" /> Allocate Batches
              </h3>
              <p className="text-xs text-slate-500 mt-1">Select batches for {allocationTeacher.name || allocationTeacher.fullName}</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {["NEET Morning Batch", "NEET Evening Batch", "JEE Morning Batch", "JEE Evening Batch"].map(batchName => (
                <label key={batchName} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="batchAllocation"
                    className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                    checked={selectedBatches.includes(batchName)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBatches([batchName]);
                      }
                    }}
                  />
                  <span className="text-sm font-semibold text-slate-700">{batchName}</span>
                </label>
              ))}
              
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-rose-50 cursor-pointer transition">
                <input
                  type="radio"
                  name="batchAllocation"
                  className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500"
                  checked={selectedBatches.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBatches([]);
                    }
                  }}
                />
                <span className="text-sm font-semibold text-rose-600">Unassign (No Batch)</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAllocationModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <Button
                onClick={handleAllocateBatches}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default TeacherManagement;
