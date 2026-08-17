import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import api from "../../api/api";
import {
  ShieldCheck,
  UserPlus,
  Key,
  Lock,
  CheckCircle2,
  X,
  Mail,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  User
} from "lucide-react";

function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Success Modal State
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/auth/staff-users?role=Admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !email.trim()) {
      setErrorMessage("Please enter both full name and email address.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/auth/add-staff",
        {
          name: name.trim(),
          email: email.trim(),
          role: role,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessData({
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
        tempPassword: res.data.tempPassword,
        emailSent: res.data.emailSent,
      });

      setName("");
      setEmail("");
      setShowModal(false);
      fetchAdmins();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to create Admin user account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout title="System Admin Control">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              Administrator Accounts
            </h3>
            <p className="text-xs text-slate-500">
              Manage administrative privileges, add new sub-admins, and issue security tokens
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={() => {
              setErrorMessage("");
              setShowModal(true);
            }}
          >
            + Create Sub-Admin
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading administrator directory...
          </div>
        ) : admins.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Admin Accounts Created Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "+ Create Sub-Admin" to onboard your first administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {admins.map((a) => (
              <Card
                key={a._id || a.id}
                className="p-5 border-slate-200 hover:border-purple-300 transition shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{a.name}</h4>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                      {a.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <p className="flex items-center gap-2 font-mono text-[11px] truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {a.email}
                  </p>
                  <p className="text-slate-500 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> First Login Status:{" "}
                    <strong className={a.isFirstLogin ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                      {a.isFirstLogin ? "Pending Pass Change" : "Active & Verified"}
                    </strong>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> {a.status || "Active"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "System Default"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* CREATE ADMIN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Administrator</h3>
                <p className="text-xs text-slate-500">Send an onboarding invitation email with temp password</p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Admin User"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin.user@edusphere.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Type
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition cursor-pointer"
                >
                  <option value="Admin">Admin (Standard Administrative Access)</option>
                  <option value="Administrator">Administrator (Super Admin Access)</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Auto Email & Temporary Credentials
                </p>
                <p className="text-amber-700/90 leading-relaxed">
                  An onboarding email will be automatically sent to <strong>{email || "the entered email"}</strong> with a generated temporary password. The user will be required to update their password on first login.
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
                  disabled={submitting}
                  className="flex-1 py-2.5"
                  icon={UserPlus}
                >
                  {submitting ? "Provisioning..." : "Create & Send Email"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-emerald-100 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-bold text-slate-900 text-lg mb-1">
              Admin Account Created!
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Account provisioned for <strong className="text-slate-800">{successData.name}</strong> ({successData.role})
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3 mb-5">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Registered Email Address
                </span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {successData.email}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="flex items-center gap-2 text-purple-700 font-semibold mb-1">
                  <Mail className="w-4 h-4 text-purple-600" /> Temporary Password Sent to Email
                </p>
                <p className="text-slate-500">
                  The temporary password and login credentials have been sent directly to <strong>{successData.email}</strong>. The user must update their password upon first login.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setSuccessData(null)}
              className="w-full py-2.5"
            >
              Done & Return to Admin Directory
            </Button>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminManagement;

