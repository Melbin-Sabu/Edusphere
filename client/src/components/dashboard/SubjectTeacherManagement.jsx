import React, { useState, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import api from "../../api/api";
import { Users, UserPlus, X, Search, CheckCircle2 } from "lucide-react";

export default function SubjectTeacherManagement({ assignedBatches }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(assignedBatches[0] || "");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setCurrentUser(user);

      // We need to fetch all teachers to allow the Class Teacher to assign them
      const res = await api.get("/teachers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(res.data.teachers || []);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignedBatches.length > 0) {
      fetchTeachers();
    }
  }, [assignedBatches]);

  const handleToggleSubjectTeacher = async (teacherId) => {
    if (!selectedBatch) {
      alert("Please select a batch first.");
      return;
    }

    const targetTeacher = teachers.find(t => t._id === teacherId);
    if (!targetTeacher) return;

    const isCurrentlyAssigned = targetTeacher.subjectBatches?.includes(selectedBatch);
    
    // Validation: Only allow ONE teacher per subject for a batch
    if (!isCurrentlyAssigned) {
      const subject = targetTeacher.subject || "General";
      const existingAssignedTeacher = teachers.find(t => 
        t._id !== teacherId && 
        (t.subject || "General") === subject && 
        t.subjectBatches?.includes(selectedBatch)
      );

      if (existingAssignedTeacher) {
        alert(`Cannot assign ${targetTeacher.fullName}. ${existingAssignedTeacher.fullName} is already assigned for ${subject} in this batch. Please unassign them first.`);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      await api.put(`/teachers/${teacherId}/subject-batches`, { batchId: selectedBatch }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Optimistically update the UI
      setTeachers(prev => prev.map(t => {
        if (t._id === teacherId) {
          const isAssigned = t.subjectBatches?.includes(selectedBatch);
          return {
            ...t,
            subjectBatches: isAssigned 
              ? t.subjectBatches.filter(b => b !== selectedBatch)
              : [...(t.subjectBatches || []), selectedBatch]
          };
        }
        return t;
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update subject teacher assignment.");
    }
  };

  if (!assignedBatches || assignedBatches.length === 0) {
    return null; // Don't show if not a Class Teacher
  }

  // Filter out the logged in user from the list
  const otherTeachers = teachers.filter(t => t.email !== currentUser?.email);

  const getRequiredSubjects = (batchName) => {
    if (!batchName) return [];
    const lowerBatch = batchName.toLowerCase();
    if (lowerBatch.includes("neet")) {
      return ["Physics", "Chemistry", "Botany", "Zoology"];
    } else if (lowerBatch.includes("jee")) {
      return ["Physics", "Chemistry", "Maths"];
    }
    return [];
  };

  const requiredSubjects = getRequiredSubjects(selectedBatch);
  const assignedSubjectTeachers = otherTeachers.filter(t => t.subjectBatches?.includes(selectedBatch));

  const getTeachersForSubject = (subjectName) => {
    return assignedSubjectTeachers.filter(t => t.subject?.toLowerCase() === subjectName.toLowerCase());
  };

  const filteredTeachers = otherTeachers.filter(t => 
    t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTeachers = filteredTeachers.reduce((acc, teacher) => {
    const subject = teacher.subject || "General";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(teacher);
    return acc;
  }, {});

  return (
    <Card className="p-6 mt-8 border-indigo-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Manage Subject Teachers
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Assign other teachers to upload notes and manage materials for your class.
          </p>
        </div>

        {assignedBatches.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Select Batch:</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {assignedBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {requiredSubjects.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-slate-700 mb-3">Required Subjects Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {requiredSubjects.map(sub => {
              const teachersForSub = getTeachersForSubject(sub);
              const isAssigned = teachersForSub.length > 0;
              
              return (
                <div key={sub} className={`p-3 rounded-xl border ${isAssigned ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{sub}</span>
                    {isAssigned ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-500" />
                    )}
                  </div>
                  {isAssigned ? (
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {teachersForSub.map(t => t.fullName).join(", ")}
                    </div>
                  ) : (
                    <div className="text-[10px] text-rose-600 font-medium">
                      Not Assigned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search teachers by name or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading teachers...</div>
      ) : filteredTeachers.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
          No other teachers found matching your search.
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(groupedTeachers).sort(([a], [b]) => a.localeCompare(b)).map(([subject, subTeachers]) => (
            <div key={subject} className="mb-6 last:mb-0">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">{subject} Teachers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subTeachers.map(teacher => {
                  const isClassTeacher = teacher.assignedBatches?.includes(selectedBatch);
                  const isSubjectTeacher = teacher.subjectBatches?.includes(selectedBatch);

                  return (
                    <div key={teacher._id} className={`flex items-center justify-between p-3 rounded-xl border ${isSubjectTeacher ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-300'} transition`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                          {teacher.fullName?.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-slate-900 truncate">{teacher.fullName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{teacher.subject || "General Subject"}</p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isClassTeacher ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 whitespace-nowrap">
                            Class Teacher
                          </span>
                        ) : isSubjectTeacher ? (
                          <button 
                            onClick={() => handleToggleSubjectTeacher(teacher._id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 hover:bg-rose-100 hover:text-rose-600 px-2 py-1 rounded-md transition whitespace-nowrap group"
                          >
                            <CheckCircle2 className="w-3 h-3 group-hover:hidden" />
                            <X className="w-3 h-3 hidden group-hover:block" />
                            Assigned
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleSubjectTeacher(teacher._id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 px-2 py-1 rounded-md transition whitespace-nowrap"
                          >
                            <UserPlus className="w-3 h-3" /> Assign
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
