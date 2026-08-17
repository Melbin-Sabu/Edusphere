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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await api.get("/students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(res.data.students || []);
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.course?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Admin Management Console">
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-8 text-white shadow-xl mb-8">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Enrolled Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{students.length}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Active Records
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
          <p className="text-3xl font-black text-slate-900">5 Departments</p>
          <p className="text-xs text-slate-500 mt-2">CSE, ECE, ME, CE, IT</p>
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
          <p className="text-xl font-bold text-slate-900">Sub-Admin (View Only)</p>
          <p className="text-xs text-slate-500 mt-2">Access to student directory & reports</p>
        </Card>
      </div>

      {/* STUDENT DIRECTORY OVERVIEW TABLE */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Student Directory & Records
            </h3>
            <p className="text-xs text-slate-500">
              Browse and inspect enrolled student profiles and academic details
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
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition"
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
            Loading student records...
          </div>
        ) : filteredStudents.length === 0 ? (
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
                  <tr key={st._id} className="hover:bg-purple-50/30 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        {st.fullName?.charAt(0)}
                      </div>
                      <span>{st.fullName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-700 font-bold">
                      {st.admissionNumber || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{st.email}</td>
                    <td className="py-3.5 px-4">{st.course}</td>
                    <td className="py-3.5 px-4">{st.batch}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 transition"
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
        )}
      </Card>

      {/* VIEW STUDENT PROFILE MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-lg">
                {selectedStudent.fullName?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedStudent.fullName}</h3>
                <p className="text-xs font-mono text-purple-600 font-bold">
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
    </AdminLayout>
  );
}

export default AdminDashboard;

