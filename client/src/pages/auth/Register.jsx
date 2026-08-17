import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema } from "../../validation/applicationSchema";
import { Link } from "react-router-dom";
import axios from "axios";
import { User, BookOpen, Users, FileCheck, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import Input from "../../components/common/Input";
import SelectInput from "../../components/common/SelectInput";
import TextArea from "../../components/common/TextArea";
import FileUpload from "../../components/common/FileUpload";
import Button from "../../components/common/Button";
import AuthLayout from "../../layouts/AuthLayout";

function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [serverError, setServerError] = useState("");
  const [existingAppInfo, setExistingAppInfo] = useState(null);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    mode: "onTouched",
  });

  const steps = [
    { number: 1, title: "Personal", icon: User },
    { number: 2, title: "Academic", icon: BookOpen },
    { number: 3, title: "Parent", icon: Users },
    { number: 4, title: "Documents", icon: FileCheck },
  ];

  const validateAndNext = async (fieldsToValidate) => {
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    setServerError("");
    setExistingAppInfo(null);
    setSubmissionResult(null);

    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      formData.append("mobile", data.mobile);
      formData.append("dateOfBirth", data.dateOfBirth);
      formData.append("gender", data.gender);
      formData.append("address", data.address);
      formData.append("courseId", data.courseId);
      formData.append("batchId", data.batchId || "General");
      formData.append("tenthPercentage", data.tenthPercentage);
      formData.append("twelfthPercentage", data.twelfthPercentage);
      formData.append("parentName", data.parentName);
      formData.append("parentEmail", data.parentEmail);
      formData.append("parentMobile", data.parentMobile);
      formData.append("relationship", data.relationship);

      if (data.tenthCertificate && data.tenthCertificate[0]) {
        formData.append("tenthCertificate", data.tenthCertificate[0]);
      }
      if (data.twelfthCertificate && data.twelfthCertificate[0]) {
        formData.append("twelfthCertificate", data.twelfthCertificate[0]);
      }

      const res = await axios.post("http://localhost:5000/api/applications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmissionResult(res.data);
      reset();
    } catch (err) {
      console.error("Submission error:", err);
      const errMsg = err.response?.data?.message || "Failed to submit admission application. Please try again.";
      setServerError(errMsg);
      if (err.response?.data?.applicationId) {
        setExistingAppInfo({
          applicationId: err.response.data.applicationId,
          status: err.response.data.status,
        });
      }
    }
  };

  const handlePayRegistrationFee = async () => {
    if (!submissionResult?.application?._id && !submissionResult?.application?.applicationId) return;

    setIsProcessingPayment(true);
    try {
      const appId = submissionResult.application._id || submissionResult.application.applicationId;
      const res = await axios.post(`http://localhost:5000/api/applications/${appId}/payment`, {
        amount: 500,
      });

      setSubmissionResult((prev) => ({
        ...prev,
        application: res.data.application,
        paymentResult: res.data.paymentResult,
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <AuthLayout
      wide={true}
      title="Admission Application"
      subtitle="Complete your step-by-step application for EduSphere enrollment"
    >
      {serverError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm space-y-2">
          <p className="font-semibold">{serverError}</p>
          {existingAppInfo && (
            <div className="pt-2 border-t border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span>Existing Application ID: <strong className="font-mono text-purple-300">{existingAppInfo.applicationId}</strong></span>
              <Link
                to={`/apply/payment?appId=${existingAppInfo.applicationId}`}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition text-center"
              >
                Track / Pay Registration Fee &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {submissionResult ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 text-2xl font-bold mb-2">
            ✓
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
            <p className="text-sm text-slate-400 mt-1">
              Application ID:{" "}
              <span className="font-mono text-indigo-400 font-semibold">
                {submissionResult.application?.applicationId}
              </span>
            </p>
          </div>

          {/* Instruction & Status Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Application Stage:</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Under Administrator Review
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  <strong>Application Submitted:</strong> Your details and 10th & 12th certificates have been successfully received in our system.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  <strong>Administrator Verification:</strong> Our Administration will review your uploaded certificates and academic details in the Administrator Control Hub.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  <strong>Email Notification:</strong> Once the Administrator accepts your application as <strong>ELIGIBLE</strong>, an email notification containing your <strong>Registration Fee Payment Link (₹500)</strong> will be dispatched to <strong className="text-purple-300 font-mono">{submissionResult.application?.email}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => {
                setSubmissionResult(null);
                setCurrentStep(1);
              }}
              className="text-slate-400 hover:text-white underline"
            >
              Submit Another Application
            </button>
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Go to Login Page &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {/* STEP PROGRESS PAGINATION BAR */}
          <div className="mb-8 px-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
              {steps.map((st) => {
                const IconComp = st.icon;
                const isActive = currentStep === st.number;
                const isCompleted = currentStep > st.number;

                return (
                  <div key={st.number} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 ${
                        isCompleted
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : isActive
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg shadow-purple-500/40 scale-110"
                          : "bg-slate-800/90 border-slate-700/80 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : <IconComp className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-2 tracking-wide ${
                        isActive ? "text-purple-300 font-extrabold" : isCompleted ? "text-emerald-400 font-semibold" : "text-slate-400 font-medium"
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* STEP 1: PERSONAL INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                    Step 1 of 4: Personal Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    register={register("fullName")}
                    error={errors.fullName}
                  />

                  <Input
                    label="Email Address"
                    placeholder="Enter your email"
                    register={register("email")}
                    error={errors.email}
                  />

                  <Input
                    label="Mobile Number"
                    placeholder="Enter 10-digit mobile number"
                    register={register("mobile")}
                    error={errors.mobile}
                  />

                  <Input
                    type="date"
                    label="Date of Birth (Min Age: 17 Years)"
                    register={register("dateOfBirth")}
                    error={errors.dateOfBirth}
                  />

                  <SelectInput
                    label="Gender"
                    options={["Male", "Female", "Other"]}
                    register={register("gender")}
                    error={errors.gender}
                  />
                </div>

                <TextArea
                  label="Address"
                  placeholder="Enter your permanent address"
                  register={register("address")}
                  error={errors.address}
                />
              </div>
            )}

            {/* STEP 2: ACADEMIC DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                    Step 2 of 4: Academic Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectInput
                    label="Course Applied For"
                    options={["NEET", "JEE"]}
                    register={register("courseId")}
                    error={errors.courseId}
                  />

                  <SelectInput
                    label="Batch Preference"
                    options={["Morning Batch", "Evening Batch"]}
                    register={register("batchId")}
                    error={errors.batchId}
                  />

                  <Input
                    type="number"
                    label="10th Percentage (%)"
                    placeholder="e.g. 85.5"
                    register={register("tenthPercentage")}
                    error={errors.tenthPercentage}
                  />

                  <Input
                    type="number"
                    label="12th Percentage (%)"
                    placeholder="e.g. 88.0"
                    register={register("twelfthPercentage")}
                    error={errors.twelfthPercentage}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: PARENT / GUARDIAN DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                    Step 3 of 4: Parent & Guardian Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Parent / Guardian Name"
                    placeholder="Enter parent name"
                    register={register("parentName")}
                    error={errors.parentName}
                  />

                  <SelectInput
                    label="Relationship"
                    options={["Father", "Mother", "Guardian"]}
                    register={register("relationship")}
                    error={errors.relationship}
                  />

                  <Input
                    type="email"
                    label="Parent Email Address"
                    placeholder="Enter parent email"
                    register={register("parentEmail")}
                    error={errors.parentEmail}
                  />

                  <Input
                    label="Parent Mobile Number"
                    placeholder="Enter parent 10-digit mobile"
                    register={register("parentMobile")}
                    error={errors.parentMobile}
                  />
                </div>
              </div>
            )}

            {/* STEP 4: CERTIFICATES & DOCUMENTS UPLOAD */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                    Step 4 of 4: Document Uploads
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileUpload
                    label="10th Certificate (PDF/JPG max 5MB)"
                    register={register("tenthCertificate")}
                    error={errors.tenthCertificate}
                  />

                  <FileUpload
                    label="12th Certificate (PDF/JPG max 5MB)"
                    register={register("twelfthCertificate")}
                    error={errors.twelfthCertificate}
                  />
                </div>
              </div>
            )}

            {/* STEP NAVIGATION PAGINATION CONTROLS */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 text-xs font-semibold hover:bg-slate-800 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1) {
                      validateAndNext(["fullName", "email", "mobile", "dateOfBirth", "gender", "address"]);
                    } else if (currentStep === 2) {
                      validateAndNext(["courseId", "batchId", "tenthPercentage", "twelfthPercentage"]);
                    } else if (currentStep === 3) {
                      validateAndNext(["parentName", "relationship", "parentEmail", "parentMobile"]);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="py-2.5 px-6">
                  {isSubmitting ? "Submitting Application..." : "Submit Admission Application"}
                </Button>
              )}
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">
                Already enrolled?{" "}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Log In
                </Link>
              </span>
            </div>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}

export default Register;