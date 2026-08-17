import React, { useState, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import api from "../../api/api";
import { BookOpen, Upload, Trash2, Eye, FileText, X, Users, CheckCircle2, Clock } from "lucide-react";

export default function TeacherNotesSection({ assignedBatches, uploadableBatches = [] }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  
  // Stats modal state
  const [statsNote, setStatsNote] = useState(null);
  const [studentStats, setStudentStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState("");

  useEffect(() => {
    if (uploadableBatches?.length > 0 && !selectedBatchId) {
      setSelectedBatchId(uploadableBatches[0]);
    }
  }, [uploadableBatches, selectedBatchId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/notes/teacher", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
      
      if (!validTypes.includes(selectedFile.type)) {
        alert("Please upload a valid PDF, DOC/DOCX, or PPT/PPTX file.");
        return;
      }
      
      if (selectedFile.size > 15 * 1024 * 1024) {
        alert("File size exceeds the 15MB limit.");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      alert("Please provide a title and select a file.");
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("file", file);
      
      if (selectedBatchId) {
        formData.append("batchId", selectedBatchId);
      }

      await api.post("/notes", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      alert("Note uploaded successfully!");
      setShowUploadModal(false);
      setTitle("");
      setDescription("");
      setFile(null);
      fetchNotes();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to upload note.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotes();
    } catch (err) {
      alert("Failed to delete note.");
    }
  };

  const openStatsModal = async (note) => {
    setStatsNote(note);
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/notes/${note._id}/views`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentStats(res.data.stats || []);
    } catch (err) {
      alert("Failed to fetch student view statistics.");
      setStatsNote(null);
    } finally {
      setLoadingStats(false);
    }
  };

  if (uploadableBatches.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Study Materials & Notes
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Upload study materials (PDF, DOC, PPT) for your assigned batches.
          </p>
        </div>
        
        {uploadableBatches.length > 0 && (
          <Button 
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 text-xs py-2 px-4"
          >
            <Upload className="w-4 h-4" /> Upload Material
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center">
          <FileText className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-600">No materials available yet</p>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            {uploadableBatches.length > 0 
              ? "You haven't uploaded any study materials for your assigned batches."
              : "Subject teachers haven't uploaded any study materials for your assigned batches yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note._id} className="border border-slate-200 rounded-xl p-4 hover:border-purple-300 transition hover:shadow-sm bg-white flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {note.batchId}
                </span>
              </div>
              
              <h4 className="font-bold text-slate-900 mt-2 truncate" title={note.title}>{note.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">{note.description || "No description"}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex-grow flex flex-col justify-end">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {note.viewCount} / {note.totalStudents} Viewed
                  </span>
                  <span className="text-slate-400 font-mono">
                    {(note.fileSize / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => openStatsModal(note)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" /> View Stats
                  </button>
                  <button 
                    onClick={() => handleDelete(note._id)}
                    className="w-8 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" /> Upload Study Material
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. Newton's Laws - Chapter 1"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition resize-none h-20"
                  placeholder="Brief context about this material..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Batch *</label>
                <select
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition"
                  required
                >
                  {uploadableBatches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">File * (PDF, DOCX, PPTX - Max 15MB)</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  required
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Material"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATS MODAL */}
      {statsNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <button
              onClick={() => setStatsNote(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 pr-8">
              <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{statsNote.title}</h3>
              <p className="text-xs font-semibold text-purple-600 mt-1">View Statistics &bull; {statsNote.batchId}</p>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Viewed By</span>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  {studentStats.filter(s => s.hasViewed).length} <span className="text-xs font-medium text-emerald-600/70">/ {studentStats.length}</span>
                </p>
              </div>
              <div className="flex-1 bg-rose-50 border border-rose-100 rounded-xl p-3">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Not Viewed</span>
                <p className="text-xl font-black text-rose-700 mt-1">
                  {studentStats.filter(s => !s.hasViewed).length}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              {loadingStats ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading student statistics...</div>
              ) : (
                <div className="space-y-2">
                  {studentStats.map(student => (
                    <div key={student._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {student.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{student.fullName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{student.admissionNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {student.hasViewed ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-bold bg-emerald-100 px-2 py-0.5 rounded-full mb-1">
                              <CheckCircle2 className="w-3 h-3" /> Viewed
                            </span>
                            <p className="text-[9px] text-slate-400">
                              Last: {new Date(student.lastViewedAt).toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 text-[11px] font-bold bg-rose-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {studentStats.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4">No students found in this batch.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
