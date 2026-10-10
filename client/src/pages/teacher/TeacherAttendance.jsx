import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { Calendar, Users, Save, CheckCircle, XCircle } from "lucide-react";

function TeacherAttendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeacherBatches();
  }, []);

  const fetchTeacherBatches = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await api.get("/teachers"); 
      const allTeachers = res.data.teachers || [];
      const me = allTeachers.find(t => t.email === user.email);
      
      let myBatches = [];
      if (me && me.assignedBatches) {
        myBatches = me.assignedBatches;
      }
      
      setBatches(myBatches);
      if (myBatches.length > 0) {
        setSelectedBatch(myBatches[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load batches");
    }
  };

  useEffect(() => {
    if (selectedBatch && selectedDate) {
      fetchAttendance();
    }
  }, [selectedBatch, selectedDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/batch/${encodeURIComponent(selectedBatch)}/date/${selectedDate}`);
      setStudents(res.data.records);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (studentId) => {
    setStudents(students.map(s => {
      if (s.studentId === studentId) {
        return { ...s, status: s.status === "Present" ? "Absent" : "Present" };
      }
      return s;
    }));
  };

  const markAll = (status) => {
    setStudents(students.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const records = students.map(s => ({
        studentId: s.studentId,
        status: s.status
      }));
      await api.post("/attendance", {
        date: selectedDate,
        batch: selectedBatch,
        records
      });
      toast.success("Attendance saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Mark Attendance">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Class Attendance</h2>
        <p className="text-sm text-slate-500">Record daily attendance for your assigned batches.</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4"/> Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Batch</label>
            <select 
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 outline-none"
              disabled={batches.length === 0}
            >
              {batches.length === 0 ? (
                <option value="">No batches assigned</option>
              ) : (
                batches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Student Roster</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => markAll("Present")} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">Mark All Present</Button>
            <Button variant="outline" size="sm" onClick={() => markAll("Absent")} className="text-red-600 border-red-200 hover:bg-red-50">Mark All Absent</Button>
          </div>
        </div>
        
        {loading ? (
          <p className="p-10 text-center text-slate-500">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No students found in this batch.</p>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">Roll / Adm #</th>
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map(s => (
                    <tr key={s.studentId} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-6 text-slate-500">{s.admissionNumber}</td>
                      <td className="py-3 px-6 font-bold">{s.fullName}</td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.status === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button 
                          onClick={() => toggleStatus(s.studentId)}
                          className={`p-1.5 rounded-lg border transition ${s.status === "Present" ? "bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300" : "bg-white border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-300"}`}
                        >
                          {s.status === "Present" ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <Button icon={Save} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}

export default TeacherAttendance;
