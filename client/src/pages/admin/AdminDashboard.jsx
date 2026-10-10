import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Link } from "react-router-dom";
import api from "../../api/api";
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Search,
  ArrowRight,
  Eye,
  CheckCircle2,
  BookOpen,
  Info,
  Calendar,
  Mail,
  User,
  X
} from "lucide-react";

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        const [resStudents, resTeachers] = await Promise.all([
          api.get("/students", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/teachers", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setStudents(resStudents.data.students || []);
        setTeachers(resTeachers.data.teachers || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.course?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      t.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Admin Management Console">
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-orange-900 p-8 text-white shadow-xl mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sub-Admin Management Portal</h2>
            <p className="text-xs text-blue-200">Welcome, {user.name || "Admin"}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 max-w-2xl">
          You are logged in with Sub-Admin access. You have full visibility over student directories, academic performance, and institutional reports.
        </p>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3 text-xs text-amber-200 bg-amber-950/30 px-4 py-2.5 rounded-xl border border-amber-500/20">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Access Level Note:</strong> Student registration is restricted to Super Administrator. You have full view and monitoring access over all student records.
          </span>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Enrolled Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0D2F24]">{students.length}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Active Records
          </p>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Faculty
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0D2F24]">{teachers.length}</p>
          <p className="text-xs text-teal-600 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Staff Members
          </p>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Academic Courses
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0D2F24]">2 Streams</p>
          <p className="text-xs text-slate-500 mt-2">NEET, JEE</p>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Your Privilege Scope
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#0D2F24]">Sub-Admin (View Only)</p>
          <p className="text-xs text-slate-500 mt-2">Access to student directory & reports</p>
        </Card>
      </div>

      {/* DIRECTORY OVERVIEW TABLE */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex bg-slate-100 p-1 rounded-xl w-max mb-2">
              <button
                onClick={() => setActiveTab("students")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "students"
                    ? "bg-white text-[#0D2F24] shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Student Directory
              </button>
              <button
                onClick={() => setActiveTab("teachers")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "teachers"
                    ? "bg-white text-[#0D2F24] shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Teacher Directory
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Browse and inspect enrolled {activeTab} profiles and details
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-600 transition"
              />
            </div>

            <Link to="/administrator/students">
              <Button variant="outline" size="sm" icon={ArrowRight}>
                Full Directory
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading directory records...
          </div>
        ) : activeTab === "students" ? (
          filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              No students found matching your search query.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.slice(0, 8).map((st) => (
                  <tr key={st._id} className="hover:bg-orange-50/30 transition">
                    <td className="py-3.5 px-4 font-bold text-[#0D2F24] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                        {st.fullName?.charAt(0)}
                      </div>
                      <span>{st.fullName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-orange-700 font-bold">
                      {st.admissionNumber || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{st.email}</td>
                    <td className="py-3.5 px-4">{st.course}</td>
                    <td className="py-3.5 px-4">{st.batch}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-100 transition"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        ) : (
          filteredTeachers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              No teachers found matching your search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((t) => (
                <div key={t._id || t.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-emerald-600/5 rounded-bl-full pointer-events-none -z-10"></div>
                  
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-teal-500/30">
                      {(t.fullName || t.name)?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0D2F24] text-base">{t.fullName || t.name}</h4>
                      <div className="inline-block mt-0.5 px-2 py-0.5 bg-teal-50 border border-teal-100 rounded-md">
                        <p className="text-[10px] font-mono text-teal-700 font-bold tracking-wider">{t.employeeId || "TCH-PENDING"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs mt-2 z-10">
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <span className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">Department</span>
                      <strong className="text-slate-800">{t.department || "Unassigned"}</strong>
                    </div>
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <span className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">Designation</span>
                      <strong className="text-slate-800">{t.designation || "Faculty"}</strong>
                    </div>
                  </div>
                  
                  <div className="text-xs flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 z-10">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" /> 
                    <span className="truncate font-medium">{t.email}</span>
                  </div>
                  
                  <div className="pt-2 flex justify-end z-10">
                    <button 
                      onClick={() => setSelectedTeacher(t)} 
                      className="w-full text-teal-700 hover:text-white bg-teal-50 hover:bg-teal-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> View Full Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      {/* VIEW STUDENT PROFILE MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D2F24]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-extrabold text-lg">
                {selectedStudent.fullName?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-[#0D2F24] text-lg">{selectedStudent.fullName}</h3>
                <p className="text-xs font-mono text-orange-600 font-bold">
                  {selectedStudent.admissionNumber}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Course</span>
                  <strong className="text-slate-800">{selectedStudent.course}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Batch</span>
                  <strong className="text-slate-800">{selectedStudent.batch}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">10th Score</span>
                  <strong className="text-slate-800">{selectedStudent.tenthPercentage}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">12th Score</span>
                  <strong className="text-slate-800">{selectedStudent.twelfthPercentage}%</strong>
                </div>
              </div>

              <div className="space-y-2 p-3 border border-slate-100 rounded-xl">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email: <strong>{selectedStudent.email}</strong>
                </p>
                <p className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Mobile: <strong>{selectedStudent.mobileNumber}</strong>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> DOB: <strong>{selectedStudent.dob}</strong>
                </p>
              </div>
            </div>

            <Button
              onClick={() => setSelectedStudent(null)}
              className="w-full mt-6 py-2.5"
            >
              Close Profile
            </Button>
          </div>
        </div>
      )}

      {/* VIEW TEACHER PROFILE MODAL */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D2F24]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setSelectedTeacher(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-extrabold text-lg">
                {(selectedTeacher.fullName || selectedTeacher.name)?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-[#0D2F24] text-lg">{selectedTeacher.fullName || selectedTeacher.name}</h3>
                <p className="text-xs font-mono text-teal-600 font-bold">
                  {selectedTeacher.employeeId || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Department</span>
                  <strong className="text-slate-800">{selectedTeacher.department || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Designation</span>
                  <strong className="text-slate-800">{selectedTeacher.designation || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Status</span>
                  <strong className="text-slate-800">{selectedTeacher.status || "Active"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Role</span>
                  <strong className="text-slate-800">{selectedTeacher.role || "Teacher"}</strong>
                </div>
              </div>

              <div className="space-y-2 p-3 border border-slate-100 rounded-xl">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email: <strong>{selectedTeacher.email}</strong>
                </p>
                {selectedTeacher.phone && (
                  <p className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Phone: <strong>{selectedTeacher.phone}</strong>
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => setSelectedTeacher(null)}
              className="w-full mt-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white border-0"
            >
              Close Profile
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;

