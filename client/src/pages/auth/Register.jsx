import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema } from "../../validation/applicationSchema";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { User, BookOpen, Users, FileCheck, ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import Input from "../../components/common/Input";
import SelectInput from "../../components/common/SelectInput";
import TextArea from "../../components/common/TextArea";
import FileUpload from "../../components/common/FileUpload";
import Button from "../../components/common/Button";
import AuthLayout from "../../layouts/AuthLayout";
import PaymentModal from "../../components/common/PaymentModal";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [serverError, setServerError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const {
    register,
    handleSubmit,
    trigger,
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
    { number: 5, title: "Verify", icon: Lock },
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
    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      formData.append("mobileNumber", data.mobile);
      formData.append("dob", data.dateOfBirth);
      formData.append("gender", data.gender);
      formData.append("address", data.address);
      formData.append("course", data.courseId);
      formData.append("batch", data.batchId || "General");
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

      const res = await api.post("/students/direct-register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setRegisteredEmail(res.data.email);
      setAdmissionNumber(res.data.admissionNumber);
      setCurrentStep(5); // Move to OTP step
    } catch (err) {
      console.error("Submission error:", err);
      setServerError(err.response?.data?.message || "Failed to submit registration. Please try again.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsVerifying(true);
    try {
      // Login with OTP
      const res = await api.post("/auth/login", {
        identifier: registeredEmail,
        password: otp,
      });

      setRegisteredUser(res.data.user);
      
      // Update context state
      login(res.data.token, res.data.user);
      
      // Show payment modal
      setShowPaymentModal(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePaymentSuccess = async (receiptData, verifyRes) => {
    setShowPaymentModal(false);
    try {
      // Mark as paid in backend
      await api.post(`/students/${registeredUser.id}/payment`, {
        amount: 500
      });
      // Navigate to change password
      navigate("/change-password", { replace: true });
    } catch(err) {
      console.error(err);
      navigate("/change-password", { replace: true }); // navigate anyway
    }
  };

  return (
    <AuthLayout
      wide={true}
      title="Student Registration"
      subtitle="Complete your step-by-step registration for EduSphere enrollment"
    >
      {serverError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm space-y-2">
          <p className="font-semibold">{serverError}</p>
        </div>
      )}

      {currentStep === 5 ? (
        <div className="bg-[#0D2F24]/90 border border-slate-800 rounded-2xl p-6 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-700/10 text-emerald-600 text-2xl font-bold mb-2">
            <Lock />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Verify Your Email</h3>
            <p className="text-sm text-slate-400 mt-1">
              We have sent a 6-digit OTP (Temporary Password) to <br/>
              <span className="font-mono text-emerald-600 font-semibold">{registeredEmail}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto space-y-4">
            <Input
              type="text"
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 123456"
              required
            />
            <Button type="submit" disabled={isVerifying} className="w-full">
              {isVerifying ? "Verifying..." : "Verify & Pay ₹500"}
            </Button>
          </form>
          
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            userEmail={registeredEmail}
            applicationId={admissionNumber}
            amount={500}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      ) : (
        <div>
          {/* STEP PROGRESS PAGINATION BAR */}
          <div className="mb-8 px-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
              {steps.slice(0, 4).map((st) => {
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
                          ? "bg-gradient-to-r from-orange-600 to-emerald-800 border-orange-400 text-white shadow-lg shadow-orange-500/40 scale-110"
                          : "bg-slate-800/90 border-slate-700/80 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : <IconComp className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-2 tracking-wide ${
                        isActive ? "text-orange-300 font-extrabold" : isCompleted ? "text-emerald-400 font-semibold" : "text-slate-400 font-medium"
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
                  <h3 className="text-sm font-bold text-orange-300 uppercase tracking-wider">
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
                  <h3 className="text-sm font-bold text-orange-300 uppercase tracking-wider">
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
                  <h3 className="text-sm font-bold text-orange-300 uppercase tracking-wider">
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
                  <h3 className="text-sm font-bold text-orange-300 uppercase tracking-wider">
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
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="py-2.5 px-6">
                  {isSubmitting ? "Registering..." : "Register"}
                </Button>
              )}
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">
                Already enrolled?{" "}
                <Link to="/login" className="text-emerald-600 hover:text-indigo-300 font-medium">
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