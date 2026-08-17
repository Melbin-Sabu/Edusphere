import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import ProfilePicUpload from "../../components/common/ProfilePicUpload";
import StudentNotesSection from "../../components/dashboard/StudentNotesSection";
import PaymentModal from "../../components/common/PaymentModal";
import api from "../../api/api";
import {
  GraduationCap,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  User,
  Mail,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function StudentDashboard() {
  const { user, updateUser } = useAuth();
  const [application, setApplication] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");

  const handlePicSuccess = (url) => {
    updateUser({ profilePic: url });
  };

  const fetchStudentApplication = async () => {
    try {
      setLoadingApp(true);
      if (user.email) {
        const res = await api.get(`/applications/${encodeURIComponent(user.email)}`);
        if (res.data && res.data.application) {
          setApplication(res.data.application);
        }
      }
    } catch (err) {
      console.log("No specific application found or fetch error:", err.message);
    } finally {
      setLoadingApp(false);
    }
  };

  useEffect(() => {
    fetchStudentApplication();
  }, [user.email]);

  const handlePaymentSuccess = (receiptData) => {
    if (application) {
      setApplication((prev) => ({
        ...prev,
        paymentStatus: "SUCCESS",
        applicationStatus: "ENROLLED",
      }));
    }

    updateUser({
      paymentStatus: "SUCCESS",
      isFirstLogin: false,
    });

    setPaymentSuccessMsg(`Razorpay Payment Verified! Transaction Ref: ${receiptData.paymentId}`);
  };

  const isFeePaid = (application && application.paymentStatus === "SUCCESS") || user.paymentStatus === "SUCCESS";

  return (
    <AdminLayout title="Student ERP Workspace">
      {/* REGISTRATION FEE PROVISION BANNER (If Fee Pending) */}
      {!isFeePaid && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-slate-900 border border-amber-500/30 p-5 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Admission Registration Fee Pending (₹500)
              </h3>
              <p className="text-xs text-amber-300 mt-0.5">
                Complete your ₹500 admission registration fee via Razorpay to finalize your active student profile.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shrink-0 shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Pay ₹500 via Razorpay</span>
          </Button>
        </div>
      )}

      {/* FEE PAID SUCCESS CONFIRMATION BANNER */}
      {paymentSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{paymentSuccessMsg}</span>
        </div>
      )}

      {/* REUSABLE RAZORPAY PAYMENT MODAL */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        userEmail={user.email || application?.email}
        applicationId={application?.applicationId}
        amount={500}
        onSuccess={handlePaymentSuccess}
      />

      {/* WELCOME PROFILE BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <ProfilePicUpload
            currentImage={user.profilePic}
            name={user.name || "Student"}
            onUploadSuccess={handlePicSuccess}
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[11px] font-bold mb-2">
              <Sparkles className="w-3 h-3" /> Enrolled & Active Student
            </div>
            <h2 className="text-2xl font-bold">Welcome, {user.name || "Student"}!</h2>
            <p className="text-xs text-purple-200">
              EduSphere Student Portal &bull; Admission No:{" "}
              <span className="font-mono font-bold text-purple-300">
                {user.admissionNumber || application?.applicationId || "EDS20260001"}
              </span>
            </p>
            <p className="text-xs text-slate-300 max-w-xl mt-2">
              Access your personalized adaptive learning roadmaps, attendance records, exam schedules, and performance insights.
            </p>
          </div>
        </div>

        {/* Right side badges */}
        <div className="flex flex-col md:items-end gap-2 shrink-0">
          {(user.course || application?.courseId) && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-400" /> {user.course || application?.courseId}
            </div>
          )}
          {(user.batch || application?.batchId) && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> {user.batch || application?.batchId}
            </div>
          )}
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admission Number</span>
          <p className="text-lg font-mono font-extrabold text-purple-600 mt-1">
            {user.admissionNumber || application?.applicationId || "EDS20260001"}
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Registration Fee Status</span>
          <div className="mt-1">
            {isFeePaid ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid via Razorpay (₹500)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Pending (₹500)
              </span>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Program & Batch</span>
          <p className="text-lg font-bold text-indigo-600 mt-1">
            {user.course || application?.courseId || "N/A"}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {user.batch || application?.batchId || "Unassigned"}
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Attendance</span>
          <p className="text-lg font-bold text-emerald-600 mt-1">94.8% (Good)</p>
        </Card>
      </div>

      {/* STUDENT NOTES / STUDY MATERIALS */}
      <StudentNotesSection />

      {/* PROFILE SUMMARY CARD */}
      <Card className="p-6">
        <h4 className="text-base font-bold text-slate-900 mb-4">Student Profile Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
              <User className="w-4 h-4 text-purple-600" />
              <span>Full Name:</span>
              <strong className="text-slate-900 ml-auto">{user.name}</strong>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Mail className="w-4 h-4 text-purple-600" />
              <span>Email:</span>
              <strong className="text-slate-900 ml-auto">{user.email}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Account Status:</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                Active
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Password Security:</span>
              <strong className="text-slate-900 ml-auto">Original Password Set ✓</strong>
            </div>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}

export default StudentDashboard;
