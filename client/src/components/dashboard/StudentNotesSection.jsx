import React, { useState, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import api from "../../api/api";
import { BookOpen, FileText, CheckCircle2, Clock, ExternalLink } from "lucide-react";

export default function StudentNotesSection() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/notes/student", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error("Failed to fetch student notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleOpenNote = async (note) => {
    try {
      const token = localStorage.getItem("token");
      
      // If not viewed yet, mark as viewed
      if (!note.isViewed) {
        await api.post(`/notes/${note._id}/view`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Optimistically update UI
        setNotes(prev => prev.map(n => 
          n._id === note._id ? { ...n, isViewed: true } : n
        ));
      } else {
        // Even if viewed, we might want to update the lastViewedAt timestamp in the background
        api.post(`/notes/${note._id}/view`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(e => console.error("Failed to update view count", e));
      }
      
      // Open file in new tab
      const fileUrl = note.fileUrl.startsWith("http") ? note.fileUrl : `http://${window.location.hostname}:5000${note.fileUrl}`;
      window.open(fileUrl, "_blank");
      
    } catch (err) {
      console.error("Error opening note:", err);
      alert("Failed to open note.");
    }
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            My Courses & Study Materials
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Access study materials and notes assigned to your current batch.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading study materials...</div>
      ) : notes.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center">
          <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-600">No materials available</p>
          <p className="text-xs text-slate-400 max-w-xs mt-1">Your teachers have not uploaded any study materials for your batch yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note._id} className="border border-slate-200 rounded-xl p-4 hover:border-purple-300 transition hover:shadow-sm bg-white flex flex-col h-full group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                      {note.subjectId || "General"}
                    </span>
                    <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">
                      By {note.teacherId?.fullName || "Faculty"}
                    </p>
                  </div>
                </div>
                
                {note.isViewed ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Viewed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                    <Clock className="w-3 h-3" /> New
                  </span>
                )}
              </div>
              
              <h4 className="font-bold text-slate-900 mt-2 line-clamp-1" title={note.title}>{note.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">{note.description || "No description provided."}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex-grow flex flex-col justify-end">
                <div className="flex items-center justify-between text-[10px] mb-3 text-slate-400 font-semibold">
                  <span>Uploaded: {new Date(note.createdAt).toLocaleDateString()}</span>
                  <span className="uppercase">{note.fileType.split('/')[1] || "DOC"} &bull; {(note.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                
                <Button 
                  onClick={() => handleOpenNote(note)}
                  className="w-full py-2 bg-slate-900 hover:bg-purple-700 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Open Material
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
