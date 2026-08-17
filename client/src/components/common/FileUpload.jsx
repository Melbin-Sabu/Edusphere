import React, { useState } from "react";
import { UploadCloud, FileCheck } from "lucide-react";

function FileUpload({
  label,
  register,
  error,
  accept = ".pdf,.jpg,.jpeg,.png",
  className = "",
  helperText = "PDF, JPG, PNG up to 10MB",
}) {
  const [selectedFileName, setSelectedFileName] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
    }
  };

  const registerProps = register || {};
  const { onChange, ...restRegister } = registerProps;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 font-sans">
          {label}
        </label>
      )}

      <div className="relative">
        <label
          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
            error
              ? "border-red-400 bg-red-50/20"
              : selectedFileName
              ? "border-purple-500 bg-purple-50/30"
              : "border-slate-300 bg-slate-50/50 hover:bg-purple-50/20 hover:border-purple-400"
          }`}
        >
          <div className="flex items-center gap-3 text-slate-600">
            {selectedFileName ? (
              <FileCheck className="w-6 h-6 text-purple-600" />
            ) : (
              <UploadCloud className="w-6 h-6 text-slate-400" />
            )}
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-700">
                {selectedFileName || "Click to upload document"}
              </p>
              <p className="text-[11px] text-slate-400">{helperText}</p>
            </div>
          </div>

          <input
            type="file"
            accept={accept}
            onChange={(e) => {
              handleFileChange(e);
              if (onChange) onChange(e);
            }}
            {...restRegister}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
          <span>•</span> {error.message}
        </p>
      )}
    </div>
  );
}

export default FileUpload;