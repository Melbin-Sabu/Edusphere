import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/common/Button";
import PaymentModal from "../../components/common/PaymentModal";
import { CheckCircle2, ShieldAlert, Sparkles, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function ApplicationPayment() {
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appIdParam = searchParams.get("appId") || "";
  const nextParam = searchParams.get("next") || "";

  const [applicationIdInput, setApplicationIdInput] = useState(appIdParam);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const fetchApplicationDetails = async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get(`/applications/${encodeURIComponent(idToFetch.trim())}`);
      setApplication(res.data.application);
      if (res.data.application?.paymentStatus === "SUCCESS") {
        setPaymentSuccess(true);
      }
    } catch (err) {
      console.error("Fetch application error:", err);
      setErrorMsg(err.response?.data?.message || "Application not found. Please check your Application ID or Email.");
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appIdParam) {
      fetchApplicationDetails(appIdParam);
    }
  }, [appIdParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchApplicationDetails(applicationIdInput);
  };

  const handlePaymentSuccess = (receiptData) => {
    setPaymentSuccess(true);
    setPaymentReceipt(receiptData);

    if (application) {
      setApplication((prev) => ({
        ...prev,
        paymentStatus: "SUCCESS",
        applicationStatus: "ENROLLED",
      }));
    }

    // Update local stored user if matches
    if (authUser?.email === application?.email) {
      updateUser({
        paymentStatus: "SUCCESS",
        isFirstLogin: false,
      });
    } else {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser.email === application?.email) {
        storedUser.paymentStatus = "SUCCESS";
        storedUser.isFirstLogin = false;
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
    }

    // Auto redirect to dashboard if nextParam specified
    if (nextParam === "dashboard") {
      setTimeout(() => {
        navigate("/student/dashboard", { replace: true });
      }, 2000);
    }
  };

  return (
    <AuthLayout
      title="Razorpay Registration Fee Payment"
      subtitle="Complete your admission registration payment via Razorpay Gateway to activate your student workspace."
    >
      <form onSubmit={handleSearch} className="mb-6 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={applicationIdInput}
            onChange={(e) => setApplicationIdInput(e.target.value)}
            placeholder="Enter Application ID or Email"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
          />
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Searching..." : "Find App"}
          </Button>
        </div>
      </form>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {application && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">{application.fullName}</h3>
              <p className="text-xs text-slate-400 font-mono">{application.email}</p>
            </div>
            <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-full">
              {application.applicationId}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Course Applied:</span>
              <span className="font-semibold text-white">{application.courseId}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Eligibility Status:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${application.eligibilityStatus === "ELIGIBLE"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}
              >
                {application.eligibilityStatus}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Registration Fee:</span>
              <span className="font-bold text-emerald-400 text-sm">₹ 500.00</span>
            </div>
          </div>

          {paymentSuccess || application.paymentStatus === "SUCCESS" ? (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                Razorpay Payment Verified! (₹500 Fee Received)
              </div>

              {paymentReceipt && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-left font-mono text-[11px] space-y-1">
                  <div><span className="text-slate-400">Payment ID:</span> <strong className="text-blue-400">{paymentReceipt.paymentId}</strong></div>
                  <div><span className="text-slate-400">Order ID:</span> <strong className="text-slate-300">{paymentReceipt.orderId}</strong></div>
                  {paymentReceipt.method && <div><span className="text-slate-400">Method:</span> <strong className="text-purple-300">{paymentReceipt.method}</strong></div>}
                </div>
              )}

              <p className="text-slate-300 leading-relaxed">
                Your admission registration fee payment has been verified by Razorpay. Your student account and original password setup are complete. You may now enter your Student ERP Workspace!
              </p>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => navigate("/student/dashboard", { replace: true })}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Enter Student Dashboard &rarr;
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-2 space-y-3">
              <Button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-extrabold text-xs text-white flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Pay ₹500 Registration Fee via Razorpay</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* REUSABLE RAZORPAY PAYMENT MODAL WITH CARD / QR CODE SUPPORT */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        userEmail={application?.email}
        applicationId={application?.applicationId}
        amount={500}
        onSuccess={handlePaymentSuccess}
      />

      <div className="pt-6 text-center text-xs flex justify-between items-center">
        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
          Return to Login Page
        </Link>
        <Link to="/student/dashboard" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
          Go to Student Dashboard &rarr;
        </Link>
      </div>
    </AuthLayout>
  );
}

export default ApplicationPayment;
