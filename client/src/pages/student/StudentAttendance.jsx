import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import api from "../../api/api";
import { CalendarCheck, CheckCircle, XCircle } from "lucide-react";

function StudentAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, percentage: 0 });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get("/attendance/student");
      setRecords(res.data);
      
      const present = res.data.filter(r => r.status === "Present").length;
      const absent = res.data.filter(r => r.status === "Absent").length;
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
      
      setStats({ present, absent, percentage });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Attendance Record">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Attendance</h2>
        <p className="text-sm text-slate-500">View your daily attendance and overall percentage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 text-center border-t-4 border-t-indigo-500 flex flex-col items-center">
          <CalendarCheck className="w-8 h-8 text-indigo-500 mb-2" />
          <p className="text-4xl font-black text-slate-800">{stats.percentage}%</p>
          <p className="text-xs font-bold uppercase text-slate-500 mt-1 tracking-wider">Overall Attendance</p>
        </Card>
        
        <Card className="p-6 text-center border-t-4 border-t-emerald-500 flex flex-col items-center">
          <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
          <p className="text-4xl font-black text-slate-800">{stats.present}</p>
          <p className="text-xs font-bold uppercase text-slate-500 mt-1 tracking-wider">Days Present</p>
        </Card>
        
        <Card className="p-6 text-center border-t-4 border-t-red-500 flex flex-col items-center">
          <XCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-4xl font-black text-slate-800">{stats.absent}</p>
          <p className="text-xs font-bold uppercase text-slate-500 mt-1 tracking-wider">Days Absent</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <h3 className="font-bold text-slate-800 p-4 bg-slate-50 border-b">Attendance History</h3>
        
        {loading ? (
          <p className="p-10 text-center text-slate-500">Loading history...</p>
        ) : records.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-6">{new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}

export default StudentAttendance;
