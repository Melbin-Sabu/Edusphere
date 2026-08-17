import React, { useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import PasswordInput from "../../components/common/PasswordInput";
import Button from "../../components/common/Button";
import PaymentModal from "../../components/common/PaymentModal";
import {
  Lock,
  ShieldAlert,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "../../validation/changePasswordSchema";

import { useAuth } from "../../context/AuthContext";

function ChangePassword() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const currentUser = user || {};

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    try {
      setPaymentError("");
      const token = localStorage.getItem("token");
      const response = await api.post(
        "/auth/change-password",
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local storage and context user record
      const updatedUser = response.data.user;
      updateUser(updatedUser);

      const roleUpper = (updatedUser.role || "").toUpperCase();

      if (roleUpper === "STUDENT" || roleUpper === "") {
        setPasswordSuccess(true);
        setShowRazorpayModal(true);
      } else {
        // Staff / Administrator redirect
        alert("Password updated successfully!");
        switch (roleUpper) {
          case "ADMINISTRATOR":
            navigate("/administrator/dashboard", { replace: true });
            break;
          case "ADMIN":
            navigate("/admin/dashboard", { replace: true });
            break;
          case "TEACHER":
            navigate("/teacher/dashboard", { replace: true });
            break;
          default:
            navigate("/dashboard", { replace: true });
            break;
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update password. Please check your current password.");
    }
  };

  const handlePaymentSuccess = (receiptData) => {
    // Update local user state in context
    updateUser({
      isFirstLogin: false,
      paymentStatus: "SUCCESS",
    });

    // Auto-redirect to Student Dashboard after payment completion
    setTimeout(() => {
      navigate("/student/dashboard", { replace: true });
    }, 1800);
  };

  return (
    <AuthLayout
      title={passwordSuccess ? "Admission Registration Payment" : "Update Password"}
      subtitle={
        passwordSuccess
          ? "Complete Razorpay registration fee to activate your ERP dashboard"
          : "Security Step: Update temporary credentials issued by Administrator"
      }
    >
      {!passwordSuccess ? (
        <>
          <div className="mb-6 text-xs text-amber-300 bg-amber-950/40 p-3.5 rounded-xl border border-amber-800/50 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-200">
                First Login Security Notice ({currentUser.role || "Account"})
              </strong>
              You are currently logged in with a temporary password. Please update your password to secure your account and proceed to registration payment & dashboard.
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PasswordInput
              label="Current / Temporary Password"
              placeholder="Enter temporary password from email"
              register={register("currentPassword")}
              error={errors.currentPassword}
              icon={Lock}
            />

            <PasswordInput
              label="New Password"
              placeholder="Enter new strong password"
              register={register("newPassword")}
              error={errors.newPassword}
              icon={Lock}
            />

            <PasswordInput
              label="Confirm New Password"
              placeholder="Confirm new password"
              register={register("confirmPassword")}
              error={errors.confirmPassword}
              icon={Lock}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full py-3 mt-2">
              {isSubmitting 
                ? "Updating Password..." 
                : (currentUser?.role?.toUpperCase() === "STUDENT" || !currentUser?.role)
                  ? "Update Password & Continue to Razorpay Payment"
                  : "Update Password"}
            </Button>
          </form>
        </>
      ) : (
        /* PASSWORD UPDATED -> RAZORPAY PAYMENT NOTICE */
        <div className="space-y-4 text-center">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">Password Updated Successfully!</span>
          </div>

          <p className="text-xs text-slate-300">
            One final step remaining: Complete your <strong>₹500 Admission Registration Fee</strong> via Razorpay Payment Gateway to enter your Student Dashboard.
          </p>

          <Button
            type="button"
            onClick={() => setShowRazorpayModal(true)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl"
          >
            <CreditCard className="w-5 h-5" />
            Launch Razorpay Payment Gateway (₹500) &rarr;
          </Button>
        </div>
      )}

      {/* REUSABLE RAZORPAY PAYMENT GATEWAY MODAL */}
      <PaymentModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        userEmail={currentUser.email}
        amount={500}
        onSuccess={handlePaymentSuccess}
      />
    </AuthLayout>
  );
}

export default ChangePassword;
