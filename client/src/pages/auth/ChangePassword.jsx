import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import PasswordInput from "../../components/common/PasswordInput";
import Button from "../../components/common/Button";
import {
  Lock,
  ShieldAlert,
  LogOut,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "../../validation/changePasswordSchema";

import { useAuth } from "../../context/AuthContext";

function ChangePassword() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const currentUser = user || {};

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

      updateUser({
        ...updatedUser,
        isFirstLogin: false
      });

      const roleUpper = (updatedUser.role || "").toUpperCase();
      toast.success("Password updated successfully!");

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
        case "STUDENT":
          navigate("/student/dashboard", { replace: true });
          break;
        default:
          navigate("/dashboard", { replace: true });
          break;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password. Please check your current password.");
    }
  };



  return (
    <AuthLayout
      title="Update Password"
      subtitle="Security Step: Update temporary credentials issued by Administrator"
    >
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
            : "Update Password"}
        </Button>

        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Cancel & Sign Out
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ChangePassword;
