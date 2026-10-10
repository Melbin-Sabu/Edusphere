import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import {
  BarChart3,
  CalendarCheck,
  Trophy,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Award
} from "lucide-react";

function AdminReports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("leaderboard"); // 'leaderboard' or 'attendance'

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports/analytics");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const leaderboardData = [...filteredData].sort((a, b) => b.quizPercentage - a.quizPercentage);
  const attendanceData = [...filteredData].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AdminLayout title="Reports & Analytics">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/20 border border-emerald-600/30 text-indigo-300 text-[11px] font-bold mb-3 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" /> Performance & Attendance Analytics
          </div>
          <h2 className="text-2xl font-bold">Admin Reports Hub</h2>
          <p className="text-xs text-indigo-200 mt-2 max-w-xl leading-relaxed">
            Track student performance across quizzes and monitor their overall attendance. View the leaderboard to identify top performers.
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <Card className="bg-slate-800/50 border-slate-700 p-4 text-center backdrop-blur-md">
            <p className="text-xs text-slate-400 font-bold uppercase">Total Students</p>
            <p className="text-2xl font-black text-white mt-1">{data.length}</p>
          </Card>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "leaderboard"
                ? "bg-white text-indigo-700 shadow-md"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Trophy className="w-4 h-4" /> Quiz Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "attendance"
                ? "bg-white text-emerald-700 shadow-md"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <CalendarCheck className="w-4 h-4" /> Attendance Register
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or admission no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-700 focus:ring-2 focus:ring-indigo-200 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Content Area */}
      <Card className="overflow-hidden border-slate-200 shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading analytics data...
          </div>
        ) : activeTab === "leaderboard" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 pl-6 text-center w-20">Rank</th>
                  <th className="p-4">Student Info</th>
                  <th className="p-4">Program & Batch</th>
                  <th className="p-4 text-center">Quizzes Taken</th>
                  <th className="p-4 text-right pr-6">Overall Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboardData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No students found.</td>
                  </tr>
                ) : (
                  leaderboardData.map((student, index) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4 pl-6 text-center">
                        {index === 0 ? (
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm border border-amber-200">
                            <Award className="w-5 h-5" />
                          </div>
                        ) : index === 1 ? (
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto shadow-sm border border-slate-300">
                            <span className="font-bold">2</span>
                          </div>
                        ) : index === 2 ? (
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center mx-auto shadow-sm border border-orange-200">
                            <span className="font-bold">3</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold">{index + 1}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{student.admissionNumber}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-700">{student.course}</div>
                        <div className="text-xs text-emerald-800 font-medium">{student.batch}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                          {student.totalQuizzes}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
                            <div 
                              className={`absolute top-0 left-0 h-full rounded-full ${
                                student.quizPercentage >= 80 ? 'bg-emerald-500' :
                                student.quizPercentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${student.quizPercentage}%` }}
                            />
                          </div>
                          <span className="font-black text-slate-800 min-w-[3rem]">{student.quizPercentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 pl-6">Student Info</th>
                  <th className="p-4">Program & Batch</th>
                  <th className="p-4">Attendance Status</th>
                  <th className="p-4 text-right pr-6">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500">No students found.</td>
                  </tr>
                ) : (
                  attendanceData.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{student.admissionNumber}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-700">{student.course}</div>
                        <div className="text-xs text-emerald-800 font-medium">{student.batch}</div>
                      </td>
                      <td className="p-4">
                        {student.attendancePercentage >= 75 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <ArrowUpRight className="w-3 h-3" /> Good Standing
                          </span>
                        ) : student.attendancePercentage > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200">
                            <ArrowDownRight className="w-3 h-3" /> Needs Attention
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                            No Data
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <span className={`text-lg font-black ${
                          student.attendancePercentage >= 75 ? 'text-emerald-600' : 
                          student.attendancePercentage > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                          {student.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}

export default AdminReports;
