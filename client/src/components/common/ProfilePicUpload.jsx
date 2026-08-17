import React, { useState, useRef } from "react";
import { Camera, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../api/api";

function ProfilePicUpload({ currentImage, name = "User", onUploadSuccess, className = "" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${hostname}:5000${path}`;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select a valid image file (PNG, JPG, WEBP)." });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB." });
      return;
    }

    // Temporary preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setMessage({ type: "", text: "" });

    // Upload to server
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profilePic", file);

      const response = await api.post("/upload/profile-pic", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const uploadedUrl = response.data.profilePic;
      setPreview(uploadedUrl);
      setMessage({ type: "success", text: "Profile photo updated!" });

      // Update local storage user profile picture
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (storedUser && storedUser.role) {
          storedUser.profilePic = uploadedUrl;
          localStorage.setItem("user", JSON.stringify(storedUser));
        }
      } catch (err) {
        console.warn("Could not sync profilePic to localStorage:", err);
      }

      if (onUploadSuccess) {
        onUploadSuccess(uploadedUrl);
      }
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to upload photo. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const displayImage = getFullImageUrl(preview || currentImage);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-purple-100 hover:shadow-lg transition duration-200"
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-purple-700 bg-purple-100">
            {name ? name.charAt(0).toUpperCase() : <User className="w-10 h-10 text-purple-400" />}
          </div>
        )}

        {/* Hover / Loading Overlay */}
        <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
          ) : (
            <>
              <Camera className="w-5 h-5 mb-0.5 text-purple-200" />
              <span className="text-[10px] font-bold tracking-wide">Change</span>
            </>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white">
            <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {message.text && (
        <p
          className={`text-[11px] font-semibold flex items-center gap-1 mt-1 ${message.type === "success" ? "text-emerald-600" : "text-red-500"
            }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          {message.text}
        </p>
      )}
    </div>
  );
}

export default ProfilePicUpload;

