import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  CalendarDays,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User
} from "lucide-react";

function TeacherLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [action, setAction] = useState(""); // "APPROVED" or "REJECTED"
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leaves/teacher");
      if (res.data.success) {
        setLeaves(res.data.leaves);
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const openActionModal = (leave, type) => {
    setSelectedLeave(leave);
    setAction(type);
    setRemarks(leave.teacherRemarks || "");
    setShowModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/leaves/${selectedLeave._id}/status`, {
        status: action,
        remarks
      });

      if (res.data.success) {
        toast.success(`Leave request ${action.toLowerCase()} successfully!`);
        setShowModal(false);
        setSelectedLeave(null);
        setRemarks("");
        fetchLeaves(); // Refresh list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update leave status.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <AdminLayout title="Leave Approvals">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold mb-3">
            <CalendarDays className="w-3.5 h-3.5" /> Leave Management
          </div>
          <h2 className="text-2xl font-bold">Review Leave Applications</h2>
          <p className="text-xs text-blue-200 mt-2 max-w-xl">
            View, approve, or reject leave requests submitted by students in your assigned batches.
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <Card className="bg-slate-800/50 border-slate-700 p-4 text-center backdrop-blur-md">
            <p className="text-xs text-slate-400 font-bold uppercase">Pending Requests</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {leaves.filter(l => l.status === "PENDING").length}
            </p>
          </Card>
        </div>
      </div>

      {/* Leave List */}
      <Card className="overflow-hidden border-slate-200 shadow-lg">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-800" /> Student Leave Requests
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading leave requests...
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No leave requests found for your batches.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 pl-6">Student Info</th>
                  <th className="p-4">Leave Duration</th>
                  <th className="p-4 max-w-xs">Reason</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{leave.studentId?.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{leave.studentId?.admissionNumber} • {leave.batch}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md inline-block">
                        {new Date(leave.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })} 
                        <span className="text-slate-400 mx-1">→</span> 
                        {new Date(leave.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">
                        Applied: {new Date(leave.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs text-sm text-slate-600">
                      <p className="line-clamp-2" title={leave.reason}>{leave.reason}</p>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="p-4 text-right pr-6">
                      {leave.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openActionModal(leave, "APPROVED")}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition shadow-sm"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openActionModal(leave, "REJECTED")}
                            className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white transition shadow-sm"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1">
                          <MessageSquare className="w-3 h-3" /> Reviewed
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Action Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D2F24]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between ${
              action === "APPROVED" ? "bg-emerald-50/50" : "bg-rose-50/50"
            }`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${
                action === "APPROVED" ? "text-emerald-800" : "text-rose-800"
              }`}>
                {action === "APPROVED" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />} 
                {action === "APPROVED" ? "Approve Leave Request" : "Reject Leave Request"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm hover:shadow transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Student Reason:</p>
                <p className="text-sm text-slate-800 italic">"{selectedLeave?.reason}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Remarks (Optional)
                </label>
                <textarea
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={`Add a note for the student...`}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 outline-none transition-all resize-none ${
                    action === "APPROVED" 
                      ? "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200" 
                      : "border-rose-200 focus:border-rose-500 focus:ring-rose-200"
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${
                    action === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting ? "Processing..." : action === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default TeacherLeave;
