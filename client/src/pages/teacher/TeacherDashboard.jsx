import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Link } from "react-router-dom";
import api from "../../api/api";
import {
  Users,
  BookOpen,
  GraduationCap,
  Search,
  ArrowRight,
  Eye,
  Info,
  Calendar,
  Mail,
  User,
  X,
  CheckCircle2,
  Layers,
  Award
} from "lucide-react";
import ProfilePicUpload from "../../components/common/ProfilePicUpload";
import TeacherNotesSection from "../../components/dashboard/TeacherNotesSection";

function TeacherDashboard() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [students, setStudents] = useState([]);
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [subjectBatches, setSubjectBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handlePicSuccess = (url) => {
    setUser((prev) => ({ ...prev, profilePic: url }));
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        const [studentsRes, teachersRes] = await Promise.all([
          api.get("/students", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/teachers", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { teachers: [] } }))
        ]);

        const allStudents = studentsRes.data.students || [];
        
        // Find current teacher's batches
        let myBatches = [];
        let mySubjectBatches = [];
        
        if (teachersRes.data?.teachers) {
          const me = teachersRes.data.teachers.find(t => t.email === user.email);
          if (me) {
            myBatches = me.assignedBatches || [];
            mySubjectBatches = me.subjectBatches || [];
          }
        }
        setAssignedBatches(myBatches);
        setSubjectBatches(mySubjectBatches);
        
        const allMyBatches = [...new Set([...myBatches, ...mySubjectBatches])];
        
        // Filter students by assigned batches using string matching
        const myStudents = allStudents.filter(s => {
          if (allMyBatches.length === 0) return false;
          
          const sCourse = (s.course || "").toUpperCase();
          const sBatch = (s.batch || "").toLowerCase();
          
          return allMyBatches.some(batchId => 
            batchId.toUpperCase().includes(sCourse) && 
            batchId.toLowerCase().includes(sBatch)
          );
        });

        setStudents(myStudents);
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
    <AdminLayout title="Faculty Portal Console">
      {/* WELCOME HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <ProfilePicUpload
            currentImage={user.profilePic}
            name={user.name || "Faculty Member"}
            onUploadSuccess={handlePicSuccess}
          />
          <div>
            <h2 className="text-2xl font-bold">Welcome, {user.name || "Faculty Member"}!</h2>
            {assignedBatches.length > 0 || subjectBatches.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {assignedBatches.map(batch => (
                  <div key={`ct-${batch}`} className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 rounded-lg text-xs font-black text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-400 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <Award className="w-4 h-4 text-amber-100 relative z-10" />
                    <span className="relative z-10 tracking-wide uppercase">Class Teacher • {batch}</span>
                  </div>
                ))}
                {subjectBatches.map(batch => (
                  <div key={`st-${batch}`} className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/50 px-4 py-1.5 rounded-lg text-xs font-bold text-indigo-200">
                    <BookOpen className="w-4 h-4" />
                    <span className="tracking-wide uppercase">Subject Teacher • {batch}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-purple-200 mt-1">EduSphere Teacher ERP Workspace</p>
            )}
            <p className="text-xs text-slate-300 max-w-xl mt-3">
              Manage your registered student batches, verify academic profiles, and monitor attendance & evaluation metrics.
            </p>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-slate-200 hover:border-purple-300 transition">
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
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Active Roster
          </p>
        </Card>

        <Card className="p-6 border-slate-200 hover:border-purple-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              My Classes
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{assignedBatches.length + subjectBatches.length} {assignedBatches.length + subjectBatches.length === 1 ? 'Batch' : 'Batches'}</p>
          <p className="text-xs text-slate-500 mt-2 truncate">
            {assignedBatches.length + subjectBatches.length > 0 ? [...assignedBatches, ...subjectBatches].join(", ") : "No batches assigned"}
          </p>
        </Card>

        <Card className="p-6 border-slate-200 hover:border-purple-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Teaching Scope
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">Faculty Professor</p>
          <p className="text-xs text-slate-500 mt-2">Class Roster & Academic Monitoring</p>
        </Card>
      </div>

      {/* TEACHER NOTES / STUDY MATERIALS */}
      <TeacherNotesSection 
        assignedBatches={[...assignedBatches, ...subjectBatches]} 
        uploadableBatches={subjectBatches}
      />

      {/* STUDENT ROSTER TABLE */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Assigned Student Roster
            </h3>
            <p className="text-xs text-slate-500">
              Browse and inspect enrolled student profiles across your assigned courses
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search roster..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition"
              />
            </div>

            <Link to="/administrator/students">
              <Button variant="outline" size="sm" icon={ArrowRight}>
                Full Roster
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading student roster...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            No students found in roster matching your search query.
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
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-lg overflow-hidden shrink-0">
                {(selectedStudent.user?.profilePic || selectedStudent.profilePic) ? (
                  <img
                    src={(selectedStudent.user?.profilePic || selectedStudent.profilePic).startsWith("http") ? (selectedStudent.user?.profilePic || selectedStudent.profilePic) : `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000${selectedStudent.user?.profilePic || selectedStudent.profilePic}`}
                    alt={selectedStudent.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedStudent.fullName?.charAt(0)
                )}
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
              className="w-full mt-6 py-2.5 bg-purple-600 hover:bg-purple-700"
            >
              Close Profile
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default TeacherDashboard;


