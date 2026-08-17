import React, { useState } from "react";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/common/Input";
import PasswordInput from "../../components/common/PasswordInput";
import Button from "../../components/common/Button";
import { Mail, ArrowLeft, Key, Lock, CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../../validation/forgotPasswordSchema";
import { resetPasswordSchema } from "../../validation/resetPasswordSchema";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function ForgotPassword() {
  const navigate = useNavigate();
  const { isAuthenticated, user, getRoleDashboard, login } = useAuth();
  const [step, setStep] = useState(1); // 1 = Request Temp Code, 2 = Reset Password Form
  const [emailValue, setEmailValue] = useState("");
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const roleUpper = (user.role || "").toUpperCase();
      const targetDashboard = getRoleDashboard(roleUpper);
      navigate(targetDashboard, { replace: true });
    }
  }, [isAuthenticated, user, getRoleDashboard, navigate]);

  // Step 1 Form (Email Request)
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1, isSubmitting: isSubmittingStep1 },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  });

  // Step 2 Form (Reset Password Form)
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    setValue: setValueStep2,
    formState: { errors: errorsStep2, isSubmitting: isSubmittingStep2 },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
  });

  React.useEffect(() => {
    if (step === 2 && emailValue) {
      setValueStep2("email", emailValue);
    }
  }, [step, emailValue, setValueStep2]);

  // Handle Step 1 Submit
  const onStep1Submit = async (data) => {
    try {
      setApiError("");
      await api.post("/auth/forgot-password", {
        email: data.email,
      });

      setEmailValue(data.email);
      setSuccessMessage("Temporary password code has been sent to your email inbox!");
      setStep(2);
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
        "Failed to request password reset. Please verify your email."
      );
    }
  };

  // Handle Step 2 Submit
  const onStep2Submit = async (data) => {
    try {
      setApiError("");
      const response = await api.post("/auth/reset-password", {
        email: data.email,
        tempPassword: data.tempPassword,
        newPassword: data.newPassword,
      });

      // Store JWT token & User via AuthContext
      const user = response.data.user;
      login(response.data.token, user);

      alert("Password updated successfully! Welcome to EduSphere.");

      // Route user directly to role dashboard
      const roleUpper = (user.role || "").toUpperCase();
      const targetDashboard = getRoleDashboard(roleUpper);
      navigate(targetDashboard, { replace: true });
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
        "Failed to reset password. Please check your temporary code."
      );
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? "Reset Password" : "Set New Password"}
      subtitle={
        step === 1
          ? "Enter your email to receive recovery instructions"
          : "Enter the temporary code sent to your email & choose your new password"
      }
    >
      {apiError && (
        <div className="mb-4 p-3 text-xs text-red-300 bg-red-950/50 border border-red-800/50 rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {step === 1 ? (
        /* STEP 1: REQUEST EMAIL */
        <form onSubmit={handleSubmitStep1(onStep1Submit)} className="space-y-4">
          <Input
            label="Email Address"
            placeholder="enter your registered email"
            type="email"
            register={registerStep1("email")}
            error={errorsStep1.email}
            icon={Mail}
          />

          <Button type="submit" disabled={isSubmittingStep1} className="w-full py-3">
            {isSubmittingStep1 ? "Sending Email..." : "Send Reset Code & Proceed"}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </form>
      ) : (
        /* STEP 2: ENTER TEMP CODE & NEW PASSWORD */
        <form onSubmit={handleSubmitStep2(onStep2Submit)} className="space-y-4">
          {successMessage && (
            <div className="p-3 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <Input
            label="Email Address"
            placeholder="enter your registered email"
            type="email"
            register={registerStep2("email")}
            error={errorsStep2.email}
            icon={Mail}
          />

          <PasswordInput
            label="Temporary Password / Code"
            placeholder="Enter temporary password from email"
            register={registerStep2("tempPassword")}
            error={errorsStep2.tempPassword}
            icon={Key}
          />

          <PasswordInput
            label="New Password"
            placeholder="Enter your new password (min 6 chars)"
            register={registerStep2("newPassword")}
            error={errorsStep2.newPassword}
            icon={Lock}
          />

          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm your new password"
            register={registerStep2("confirmPassword")}
            error={errorsStep2.confirmPassword}
            icon={Lock}
          />

          <Button
            type="submit"
            disabled={isSubmittingStep2}
            className="w-full py-3"
            icon={isSubmittingStep2 ? undefined : ArrowRight}
          >
            {isSubmittingStep2 ? "Resetting Password..." : "Update Password & Sign In"}
          </Button>

          <div className="flex justify-between items-center text-xs pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setApiError("");
              }}
              className="text-slate-400 hover:text-white font-semibold transition-colors"
            >
              ← Change Email
            </button>

            <Link
              to="/login"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;