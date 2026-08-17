import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import SelectInput from "../../components/common/SelectInput";
import TextArea from "../../components/common/TextArea";
import FileUpload from "../../components/common/FileUpload";
import api from "../../api/api";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentRegistrationSchema } from "../../validation/studentRegistrationSchema";
import {
  UserPlus,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle2,
  Copy,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  FileCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  ExternalLink,
  Sun,
  Moon,
  Stethoscope,
  Zap,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function StudentManagement() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canRegisterStudent = user.role === "Administrator";

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [copied, setCopied] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(studentRegistrationSchema),
    mode: "onTouched",
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data.students || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Multi-step step validation helper
  const nextStep = async () => {
    let fieldsToValidate = [];
    if (currentStep === 1) {
      fieldsToValidate = ["fullName", "email", "mobileNumber", "dob", "gender", "address"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["course", "tenthPercentage", "twelfthPercentage"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["parentName", "parentEmail", "parentMobile", "relationship"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Personal Details
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      formData.append("mobileNumber", data.mobileNumber);
      formData.append("dob", data.dob);
      formData.append("gender", data.gender);
      formData.append("address", data.address);

      // Academic Details
      formData.append("course", data.course);
      formData.append("tenthPercentage", data.tenthPercentage);
      formData.append("twelfthPercentage", data.twelfthPercentage);

      // Parent Details
      formData.append("parentName", data.parentName);
      formData.append("parentEmail", data.parentEmail);
      formData.append("parentMobile", data.parentMobile);
      formData.append("relationship", data.relationship);

      // Files
      if (data.tenthCertificate && data.tenthCertificate[0]) {
        formData.append("tenthCertificate", data.tenthCertificate[0]);
      }
      if (data.twelfthCertificate && data.twelfthCertificate[0]) {
        formData.append("twelfthCertificate", data.twelfthCertificate[0]);
      }

      const res = await api.post("/students/register", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessData({
        studentName: data.fullName,
        email: data.email,
        admissionNumber: res.data.user?.admissionNumber || res.data.student?.admissionNumber || "EDU" + Math.floor(100000 + Math.random() * 900000),
        tempPassword: res.data.tempPassword || "TempPass123!",
        emailSent: res.data.emailSent,
      });

      reset();
      setShowModal(false);
      setCurrentStep(1);
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to register student");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student record?")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Student record deleted successfully");
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student");
    }
  };

  // Category Match Helpers
  const isNeet = (c = "") => /neet/i.test(c);
  const isJee = (c = "") => /jee/i.test(c);
  const isMorning = (b = "") => /morning/i.test(b);
  const isEvening = (b = "") => /evening/i.test(b);

  // Filter students
  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.email?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCourse = true;
    if (courseFilter === "NEET") matchesCourse = isNeet(st.course);
    else if (courseFilter === "JEE") matchesCourse = isJee(st.course);
    else if (courseFilter) matchesCourse = st.course === courseFilter;

    let matchesBatch = true;
    if (batchFilter === "Morning Batch") matchesBatch = isMorning(st.batch);
    else if (batchFilter === "Evening Batch") matchesBatch = isEvening(st.batch);
    else if (batchFilter) matchesBatch = st.batch === batchFilter;

    return matchesSearch && matchesCourse && matchesBatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredStudents.map((s) => ({
      "Admission No": s.admissionNumber || "N/A",
      "Full Name": s.fullName || "N/A",
      Email: s.email || "N/A",
      Mobile: s.mobileNumber || "N/A",
      Course: s.course || "N/A",
      Batch: s.batch || "N/A",
      "10th %": s.tenthPercentage || "N/A",
      "12th %": s.twelfthPercentage || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "EduSphere_Students_Export.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(109, 40, 217);
    doc.text("EduSphere Educational ERP - Student Registry", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

    const tableColumn = ["Admission #", "Full Name", "Email", "Mobile", "Course", "Batch"];
    const tableRows = filteredStudents.map((s) => [
      s.admissionNumber || "N/A",
      s.fullName || "N/A",
      s.email || "N/A",
      s.mobileNumber || "N/A",
      s.course || "N/A",
      s.batch || "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      headStyles: { fillColor: [109, 40, 217] },
    });

    doc.save("EduSphere_Students_Registry.pdf");
  };

  const copyCredentials = () => {
    if (!successData) return;
    const text = `EduSphere Account Credentials:\nEmail: ${successData.email}\nAdmission No: ${successData.admissionNumber}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wizardSteps = [
    { num: 1, name: "Personal" },
    { num: 2, name: "Academic" },
    { num: 3, name: "Parent" },
    { num: 4, name: "Documents" },
    { num: 5, name: "Preview" },
  ];

  return (
    <AdminLayout title={canRegisterStudent ? "Student Management & Admissions" : "Student Directory & Records"}>
      {/* HEADER CONTROLS CARD */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Name, Admission #, Email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 focus:bg-white transition"
              />
            </div>

            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-44 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="">All Exams (NEET & JEE)</option>
              <option value="NEET">🩺 NEET Registered</option>
              <option value="JEE">⚡ JEE Registered</option>
            </select>

            <select
              value={batchFilter}
              onChange={(e) => {
                setBatchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-44 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="">All Batches</option>
              <option value="Morning Batch">🌅 Morning Batch</option>
              <option value="Evening Batch">🌆 Evening Batch</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" icon={FileSpreadsheet} onClick={exportToExcel}>
              Excel
            </Button>

            <Button variant="outline" size="sm" icon={FileText} onClick={exportToPDF}>
              PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* DATA TABLE CARD */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-6">Student Info</th>
                <th className="py-4 px-6">Admission #</th>
                <th className="py-4 px-6">Course & Batch</th>
                <th className="py-4 px-6">Parent Details</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((st) => (
                  <tr key={st._id || st.admissionNumber} className="hover:bg-purple-50/30 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                          {(st.user?.profilePic || st.profilePic) ? (
                            <img
                              src={(st.user?.profilePic || st.profilePic).startsWith("http") ? (st.user?.profilePic || st.profilePic) : `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000${st.user?.profilePic || st.profilePic}`}
                              alt={st.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            st.fullName ? st.fullName.charAt(0).toUpperCase() : "S"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{st.fullName}</p>
                          <p className="text-[11px] text-slate-400">{st.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        {st.admissionNumber || "PENDING"}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isNeet(st.course)
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : isJee(st.course)
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-purple-100 text-purple-800 border border-purple-200"
                            }`}
                        >
                          {isNeet(st.course) ? <Stethoscope className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                          {st.course || "General"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isMorning(st.batch)
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : isEvening(st.batch)
                                ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                        >
                          {isMorning(st.batch) ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                          {st.batch || "General"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800">{st.parentName || "N/A"}</p>
                      <p className="text-[11px] text-slate-400">{st.parentMobile || st.parentEmail || ""}</p>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Enrolled
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewStudent(st)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(st._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">No student records match your query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <p className="text-slate-500">
            Showing <strong className="text-slate-900">{paginatedStudents.length}</strong> of <strong className="text-slate-900">{filteredStudents.length}</strong> students
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* 5-STEP MULTI-STEP WIZARD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-600" /> Register New Student
                </h3>
                <p className="text-xs text-slate-500">Fill in details for admission & account setup</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEPPER PROGRESS BAR */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-0 -translate-y-1/2" />
                {wizardSteps.map((step) => {
                  const isDone = currentStep > step.num;
                  const isCurrent = currentStep === step.num;

                  return (
                    <div key={step.num} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isDone
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                            ? "bg-purple-600 text-white ring-4 ring-purple-100"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : step.num}
                      </div>
                      <span className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${isCurrent ? "text-purple-600 font-bold" : "text-slate-400"}`}>
                        {step.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* STEP 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Step 1: Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name" placeholder="e.g. Rahul Sharma" register={register("fullName")} error={errors.fullName} icon={User} />
                    <Input label="Email Address" placeholder="rahul@example.com" register={register("email")} error={errors.email} icon={Mail} />
                    <Input label="Mobile Number" placeholder="10-digit mobile" register={register("mobileNumber")} error={errors.mobileNumber} icon={Phone} />
                    <Input label="Date of Birth" type="date" max={new Date().toISOString().split("T")[0]} register={register("dob")} error={errors.dob} icon={Calendar} />
                  </div>
                  <SelectInput label="Gender" options={["Male", "Female", "Other"]} register={register("gender")} error={errors.gender} />
                  <TextArea label="Residential Address" placeholder="Full residential street address..." register={register("address")} error={errors.address} />
                </div>
              )}

              {/* STEP 2: Academic Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Step 2: Academic Record & Batch Allocation</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectInput
                      label="Assigned Course Exam"
                      options={["NEET", "JEE"]}
                      register={register("course")}
                      error={errors.course}
                      icon={GraduationCap}
                    />
                    <SelectInput
                      label="Assigned Batch Shift"
                      options={["Morning Batch", "Evening Batch"]}
                      register={register("batch")}
                      error={errors.batch}
                      icon={Sun}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="10th Marks (%)" placeholder="e.g. 88.5" register={register("tenthPercentage")} error={errors.tenthPercentage} />
                    <Input label="12th Marks (%)" placeholder="e.g. 91.2" register={register("twelfthPercentage")} error={errors.twelfthPercentage} />
                  </div>
                </div>
              )}

              {/* STEP 3: Parent Details */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Step 3: Parent / Guardian Details</h4>
                  <Input label="Parent / Guardian Name" placeholder="e.g. Suresh Sharma" register={register("parentName")} error={errors.parentName} icon={User} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Parent Email" placeholder="parent@example.com" register={register("parentEmail")} error={errors.parentEmail} icon={Mail} />
                    <Input label="Parent Mobile" placeholder="10-digit mobile" register={register("parentMobile")} error={errors.parentMobile} icon={Phone} />
                  </div>
                  <SelectInput label="Relationship" options={["Father", "Mother", "Guardian"]} register={register("relationship")} error={errors.relationship} />
                </div>
              )}

              {/* STEP 4: Document Uploads */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Step 4: Upload Verification Certificates</h4>
                  <FileUpload label="10th Marksheet Certificate" register={register("tenthCertificate")} error={errors.tenthCertificate} />
                  <FileUpload label="12th Marksheet Certificate" register={register("twelfthCertificate")} error={errors.twelfthCertificate} />
                </div>
              )}

              {/* STEP 5: Account Preview */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Step 5: Review Student Profile</h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <p><strong>Name:</strong> {getValues("fullName")}</p>
                    <p><strong>Email:</strong> {getValues("email")}</p>
                    <p><strong>Mobile:</strong> {getValues("mobileNumber")}</p>
                    <p><strong>Course:</strong> {getValues("course")}</p>
                    <p><strong>Parent:</strong> {getValues("parentName")} ({getValues("relationship")})</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900">
                    ✓ Generating admission number and temporary password automatically upon registration.
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" size="sm" onClick={prevStep} icon={ArrowLeft}>
                    Previous
                  </Button>
                ) : <div />}

                {currentStep < 5 ? (
                  <Button type="button" variant="primary" size="sm" onClick={nextStep} icon={ArrowRight}>
                    Next Step
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" size="md" disabled={isSubmitting} icon={CheckCircle2}>
                    {isSubmitting ? "Registering..." : "Confirm & Create Student"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL WITH COPY CREDENTIALS BUTTON */}
      {successData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Registration Successful!</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Account created for <span className="font-semibold text-slate-800">{successData.studentName}</span>
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs font-mono space-y-2.5 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans">Admission #:</span>
                <strong className="text-purple-600 font-bold">{successData.admissionNumber}</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                <span className="text-slate-400 font-sans">Username:</span>
                <strong className="text-slate-800 font-bold">{successData.email}</strong>
              </div>
            </div>

            {/* Email Dispatch Notice Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 text-left text-xs text-purple-900 mb-6 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-purple-950 text-xs">Temporary Password Sent to Email</p>
                <p className="text-[11px] text-purple-800 leading-relaxed mt-0.5">
                  The temporary login password and account activation instructions have been sent directly to:{" "}
                  <strong className="font-mono text-purple-950 break-all">{successData.email}</strong>.
                </p>
                <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2 font-medium">
                  💡 <strong>Tip:</strong> If not found in your main Inbox, please check your <strong>Spam / Junk</strong> folder or <strong>Promotions</strong> tab.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                icon={copied ? Check : Copy}
                onClick={copyCredentials}
                className="w-full"
              >
                {copied ? "Copied!" : "Copy Details"}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setSuccessData(null)}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW STUDENT DETAILS MODAL */}
      {viewStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Student Registration Profile</h3>
                {viewStudent.createdAt && (
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-600" />
                    Registered: {new Date(viewStudent.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} at {new Date(viewStudent.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <button onClick={() => setViewStudent(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar & Hero Banner */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 rounded-2xl border border-purple-100 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-extrabold text-2xl shadow-inner overflow-hidden shrink-0">
                {(viewStudent.user?.profilePic || viewStudent.profilePic) ? (
                  <img
                    src={(viewStudent.user?.profilePic || viewStudent.profilePic).startsWith("http") ? (viewStudent.user?.profilePic || viewStudent.profilePic) : `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000${viewStudent.user?.profilePic || viewStudent.profilePic}`}
                    alt={viewStudent.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  viewStudent.fullName ? viewStudent.fullName.charAt(0).toUpperCase() : "S"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-900 text-lg leading-tight truncate">{viewStudent.fullName}</h4>
                <p className="text-xs font-mono font-bold text-purple-700 mt-0.5">
                  Admission No: {viewStudent.admissionNumber || "N/A"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {viewStudent.course}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Active Roster
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Academic Performance & Credentials Grid */}
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Academic Scores & Course Details
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-slate-700">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">10th Score</span>
                    <span className="font-extrabold text-purple-700 text-sm">{viewStudent.tenthPercentage}%</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">12th Score</span>
                    <span className="font-extrabold text-purple-700 text-sm">{viewStudent.twelfthPercentage}%</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Batch</span>
                    <span className="font-semibold text-slate-800 truncate block">{viewStudent.batch}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Gender / DOB</span>
                    <span className="font-semibold text-slate-800 text-[11px] truncate block">{viewStudent.gender || "Male"}</span>
                  </div>
                </div>
              </div>

              {/* Personal Contact Details */}
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Contact & Personal Details
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Email Address</span>
                    <span className="font-mono text-slate-800 font-semibold truncate block text-[11px]">{viewStudent.email}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Mobile Number</span>
                    <span className="font-semibold text-slate-800">{viewStudent.mobileNumber || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Parent & Guardian Information */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Parent / Guardian Details</span>
                <p className="text-slate-800 font-semibold">
                  {viewStudent.parentName} <span className="text-slate-400 font-normal">({viewStudent.relationship || "Parent"})</span>
                </p>
                <p className="text-slate-600 font-mono text-[11px]">Mobile: {viewStudent.parentMobile || "N/A"} &bull; Email: {viewStudent.parentEmail || "N/A"}</p>
              </div>

              {/* Residential Address */}
              {viewStudent.address && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Residential Address</span>
                  <p className="text-slate-700">{viewStudent.address}</p>
                </div>
              )}

              {/* UPLOADED 10TH AND 12TH MARK LIST CERTIFICATES */}
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-purple-600" /> Uploaded Mark Lists & Certificates
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(() => {
                    const cert10 = viewStudent.tenthCertificate || viewStudent.applicationId?.tenthCertificate;
                    const cert12 = viewStudent.twelfthCertificate || viewStudent.applicationId?.twelfthCertificate;

                    const handleViewCert = (pathStr) => {
                      if (!pathStr) return;
                      const cleanPath = String(pathStr).replace(/\\/g, "/");
                      const filename = cleanPath.split("/").pop();
                      const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
                      const url = pathStr.startsWith("http") ? pathStr : `http://${host}:5000/uploads/${filename}`;
                      window.open(url, "_blank");
                    };

                    return (
                      <>
                        {/* 10th Certificate Card */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-purple-600" /> 10th Mark List
                              </span>
                              {cert10 ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Uploaded
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                  Not Uploaded
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mb-3">
                              {cert10 ? "Verified 10th Marksheet PDF / Image Document" : "No 10th certificate file attached"}
                            </p>
                          </div>

                          {cert10 && (
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleViewCert(cert10)}
                                className="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" /> View 10th Certificate
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 12th Certificate Card */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-purple-600" /> 12th Mark List
                              </span>
                              {cert12 ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Uploaded
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                  Not Uploaded
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mb-3">
                              {cert12 ? "Verified 12th Marksheet PDF / Image Document" : "No 12th certificate file attached"}
                            </p>
                          </div>

                          {cert12 && (
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleViewCert(cert12)}
                                className="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" /> View 12th Certificate
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-5 text-right">
              <Button variant="secondary" size="sm" onClick={() => setViewStudent(null)}>
                Close Profile Overview
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default StudentManagement;
