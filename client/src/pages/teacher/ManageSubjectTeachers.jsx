import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api/api";
import SubjectTeacherManagement from "../../components/dashboard/SubjectTeacherManagement";
import { ShieldAlert } from "lucide-react";

export default function ManageSubjectTeachers() {
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBatches = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        
        const res = await api.get("/teachers", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data?.teachers) {
          const me = res.data.teachers.find(t => t.email === user.email);
          if (me && me.assignedBatches) {
            setAssignedBatches(me.assignedBatches);
          }
        }
      } catch (err) {
        console.error("Failed to load teacher profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBatches();
  }, []);

  return (
    <AdminLayout title="Manage Subject Teachers">
      <div className="max-w-5xl mx-auto py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Manage Subject Teachers</h2>
          <p className="text-sm text-slate-500">
            Assign other teachers to upload notes and manage materials for your assigned classes.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading your profile...</div>
        ) : assignedBatches.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 -mt-8">
            <SubjectTeacherManagement assignedBatches={assignedBatches} />
          </div>
        ) : (
          <div className="py-16 text-center flex flex-col items-center bg-white rounded-2xl border border-slate-200">
            <ShieldAlert className="w-12 h-12 text-amber-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Access Denied</h3>
            <p className="text-sm text-slate-500 max-w-md mt-2">
              You are not designated as a Class Teacher for any batches. Only Class Teachers can assign Subject Teachers.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
