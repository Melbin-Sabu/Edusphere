import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import {
  Layers,
  GraduationCap,
  Sparkles,
  Users,
  Search,
  Check,
  X,
  UserCheck
} from "lucide-react";

function BatchManagement() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("Teachers"); // "Teachers" or "Students"
  const [search, setSearch] = useState("");
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const batches = [
    { id: "JEE Morning Batch", name: "JEE Morning Batch", type: "JEE", icon: GraduationCap },
    { id: "JEE Evening Batch", name: "JEE Evening Batch", type: "JEE", icon: GraduationCap },
    { id: "NEET Morning Batch", name: "NEET Morning Batch", type: "NEET", icon: Sparkles },
    { id: "NEET Evening Batch", name: "NEET Evening Batch", type: "NEET", icon: Sparkles },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const [teachersRes, studentsRes] = await Promise.all([
        api.get("/teachers", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/students", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (teachersRes.data.teachers) {
        setTeachers(teachersRes.data.teachers);
      }
      if (studentsRes.data.students) {
        setStudents(studentsRes.data.students);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTeacherBatch = async (teacherId, batchName, currentBatches, isAssigned) => {
    try {
      const token = localStorage.getItem("token");
      let newBatches = [...(currentBatches || [])];
      
      if (isAssigned) {
        // Remove batch
        newBatches = newBatches.filter(b => b !== batchName);
      } else {
        // Check if another teacher is already assigned to this batch
        const existingTeacher = teachers.find(t => t.assignedBatches?.includes(batchName));
        if (existingTeacher) {
          alert(`This batch is already assigned to ${existingTeacher.fullName}. Please unassign them first before assigning a new teacher.`);
          return;
        }

        // Add batch
        if (!newBatches.includes(batchName)) {
          newBatches.push(batchName);
        }
      }

      await api.put(
        `/teachers/${teacherId}`,
        { assignedBatches: newBatches },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Optimistic update
      setTeachers(prev => prev.map(t => 
        t._id === teacherId ? { ...t, assignedBatches: newBatches } : t
      ));

    } catch (err) {
      alert(err.response?.data?.message || "Failed to update batch allocation.");
    }
  };

  const filteredTeachers = teachers.filter(t => 
    (t.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.department || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = students.filter(s => {
    if (!selectedBatch) return false;
    const sCourse = (s.course || "").toUpperCase();
    const sBatch = (s.batch || "").toLowerCase();
    const matchesBatch = selectedBatch.id.toUpperCase().includes(sCourse) && 
                         selectedBatch.id.toLowerCase().includes(sBatch);
    
    const matchesSearch = (s.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
                          (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
                          (s.admissionNumber || "").toLowerCase().includes(search.toLowerCase());
                          
    return matchesBatch && matchesSearch;
  });

  return (
    <AdminLayout title="Batch Management">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-600" /> Class Batch Allocations
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage and allocate class teachers to specific batches across all departments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {batches.map(batch => {
          const Icon = batch.icon;
          const assignedTeachers = teachers.filter(t => t.assignedBatches?.includes(batch.id));
          const enrolledStudents = students.filter(s => {
            const sCourse = (s.course || "").toUpperCase();
            const sBatch = (s.batch || "").toLowerCase();
            return batch.id.toUpperCase().includes(sCourse) && 
                   batch.id.toLowerCase().includes(sBatch);
          });
          
          return (
            <Card key={batch.id} className="p-5 border-slate-200 hover:border-blue-300 transition hover:shadow-md flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  batch.type === "JEE" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              
              <h3 className="font-bold text-slate-900">{batch.name}</h3>
              
              <div className="mt-3 mb-5 flex gap-4 flex-grow">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Teachers</p>
                  <p className="text-xl font-black text-slate-800">{assignedTeachers.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Students</p>
                  <p className="text-xl font-black text-slate-800">{enrolledStudents.length}</p>
                </div>
              </div>
              
              {(user?.role || "").toUpperCase() === "ADMIN" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    setSelectedBatch(batch);
                    setShowAssignModal(true);
                    setActiveModalTab("Teachers");
                    setSearch("");
                  }}
                >
                  Manage Batch
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-900 text-lg">All Allocated Teachers</h3>
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading faculty data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Allocated Batches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {teachers.filter(t => t.assignedBatches && t.assignedBatches.length > 0).map(t => (
                  <tr key={t._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                       <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                        {t.fullName?.charAt(0) || "T"}
                       </div>
                       <div>
                         <span className="block font-bold text-slate-900">{t.fullName}</span>
                         <span className="text-[10px] text-slate-400 font-mono">{t.employeeId || "N/A"}</span>
                       </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        (t.department || "").toUpperCase() === "JEE" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                        (t.department || "").toUpperCase() === "NEET" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {t.department || "Faculty"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {t.assignedBatches.map(b => (
                          <span key={b} className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {teachers.filter(t => t.assignedBatches && t.assignedBatches.length > 0).length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-400 italic">
                      No teachers have been allocated to any batch yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ALLOCATION MODAL */}
      {showAssignModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-600" /> Manage {selectedBatch.name}
              </h3>
              
              <div className="flex gap-4 mt-4 border-b border-slate-200">
                <button
                  onClick={() => {
                    setActiveModalTab("Teachers");
                    setSearch("");
                  }}
                  className={`pb-2 text-sm font-bold transition border-b-2 ${
                    activeModalTab === "Teachers" 
                      ? "border-blue-600 text-blue-700" 
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Allocate Faculty
                </button>
                <button
                  onClick={() => {
                    setActiveModalTab("Students");
                    setSearch("");
                  }}
                  className={`pb-2 text-sm font-bold transition border-b-2 ${
                    activeModalTab === "Students" 
                      ? "border-blue-600 text-blue-700" 
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Enrolled Students
                </button>
              </div>
            </div>
            
            <div className="mb-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={activeModalTab === "Teachers" ? "Search faculty..." : "Search students..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {activeModalTab === "Teachers" ? (
                <>
                  {filteredTeachers.filter(t => {
                    const isAssignedToThis = t.assignedBatches?.includes(selectedBatch.id);
                    const isAssignedToAnother = t.assignedBatches && t.assignedBatches.length > 0 && !isAssignedToThis;
                    return !isAssignedToAnother; // hide if assigned to a different batch
                  }).map(t => {
                    const isAssigned = t.assignedBatches?.includes(selectedBatch.id);
                    return (
                      <div 
                        key={t._id} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition ${
                          isAssigned ? "bg-blue-50/50 border-blue-200" : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isAssigned ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {t.fullName?.charAt(0) || "T"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{t.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {t.department || "Faculty"} • {t.subject || "Subject"}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleToggleTeacherBatch(t._id, selectedBatch.id, t.assignedBatches, isAssigned)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                            isAssigned 
                              ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100" 
                              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                          }`}
                        >
                          {isAssigned ? (
                            <>Unassign</>
                          ) : (
                            <><Check className="w-3.5 h-3.5" /> Assign</>
                          )}
                        </button>
                      </div>
                    );
                  })}
                  {filteredTeachers.filter(t => {
                    const isAssignedToThis = t.assignedBatches?.includes(selectedBatch.id);
                    const isAssignedToAnother = t.assignedBatches && t.assignedBatches.length > 0 && !isAssignedToThis;
                    return !isAssignedToAnother;
                  }).length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm">No available teachers found matching your search.</div>
                  )}
                </>
              ) : (
                <>
                  {filteredStudents.map(s => (
                    <div 
                      key={s._id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-100 text-emerald-700">
                          {s.fullName?.charAt(0) || "S"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{s.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-medium font-mono">
                            {s.admissionNumber || "N/A"} • {s.email}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                        {s.course}
                      </span>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm">No enrolled students found in this batch.</div>
                  )}
                </>
              )}
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100">
              <Button
                onClick={() => setShowAssignModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default BatchManagement;
