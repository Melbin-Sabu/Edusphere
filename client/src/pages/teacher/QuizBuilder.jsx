import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { Save, Plus, Trash2, ArrowLeft, CheckCircle } from "lucide-react";

function QuizBuilder() {
  const confirm = useConfirm();

  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [subjectBatches, setSubjectBatches] = useState([]);

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    course: "General",
    batch: "",
    subject: "",
    durationMinutes: 30,
    negativeMarkingEnabled: false,
    defaultPositiveMark: 4,
    defaultNegativeMark: 1,
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "10:00",
    attemptLimit: 1
  });

  const [docFile, setDocFile] = useState(null);
  const [docQuestionCount, setDocQuestionCount] = useState(5);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    fetchTeacherAssignments();
    if (isEdit) {
      fetchQuizDetails();
    }
  }, [id]);

  const fetchTeacherAssignments = async () => {
    try {
      const res = await api.get("/teachers");
      if (res.data?.teachers) {
        const me = res.data.teachers.find(t => t.email === user.email);
        if (me) {
          setAssignedBatches(me.assignedBatches || []);
          const subs = me.subjectBatches || [];
          if (me.subject && !subs.includes(me.subject)) subs.push(me.subject);
          setSubjectBatches(subs);

          if (!isEdit) {
            setQuizForm(prev => ({
              ...prev,
              batch: me.assignedBatches[0] || "",
              subject: subs[0] || ""
            }));
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuizDetails = async () => {
    try {
      const res = await api.get(`/quizzes/${id}/teacher`);
      const { quiz, questions } = res.data;
      setQuizForm({
        ...quiz,
        startDate: quiz.startDate ? new Date(quiz.startDate).toISOString().split('T')[0] : "",
        endDate: quiz.endDate ? new Date(quiz.endDate).toISOString().split('T')[0] : ""
      });
      setQuestions(questions || []);
    } catch (err) {
      toast.error("Error fetching quiz");
      navigate("/teacher/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuizForm({
      ...quizForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    
    // Validation
    const start = new Date(`${quizForm.startDate}T${quizForm.startTime}`);
    const end = new Date(`${quizForm.endDate}T${quizForm.endTime}`);
    if (end <= start) {
      toast.error("End date/time must be after start date/time");
      return;
    }
    if (quizForm.durationMinutes < 1) {
      toast.error("Duration must be at least 1 minute");
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/quizzes/${id}`, { ...quizForm, course: "General" });
        toast.success("Quiz updated successfully");
      } else {
        let res;
        if (docFile) {
          const formData = new FormData();
          Object.keys(quizForm).forEach(key => formData.append(key, quizForm[key]));
          formData.append("document", docFile);
          formData.append("docQuestionCount", docQuestionCount);
          res = await api.post("/quizzes", formData, { headers: { 'Content-Type': 'multipart/form-data' }});
          toast.success("Quiz created and questions generated successfully!");
        } else {
          res = await api.post("/quizzes", { ...quizForm, course: "General" });
          toast.success("Quiz created successfully");
        }
        navigate(`/teacher/quizzes/${res.data._id}/edit`);
      }
    } catch (err) {
      toast.error((err.response?.data?.message || "Error saving quiz") + ": " + (err.response?.data?.error || ""));
    }
  };

  const handleAddQuestion = async () => {
    const defaultQuestion = {
      questionText: "New Question",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      positiveMark: quizForm.defaultPositiveMark,
      negativeMark: quizForm.negativeMarkingEnabled ? quizForm.defaultNegativeMark : 0,
      order: questions.length + 1
    };

    try {
      const res = await api.post(`/quizzes/${id}/questions`, defaultQuestion);
      setQuestions([...questions, res.data]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding question");
    }
  };

  const handleUpdateQuestion = async (qId, updatedData) => {
    try {
      const res = await api.put(`/quizzes/${id}/questions/${qId}`, updatedData);
      setQuestions(prev => prev.map(q => q._id === qId ? res.data : q));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating question");
    }
  };

  const handleLocalChange = (qId, updatedData) => {
    setQuestions(prev => prev.map(q => q._id === qId ? { ...q, ...updatedData } : q));
  };

  const handleDeleteQuestion = async (qId) => {
    const isConfirmed = await confirm({ title: "Delete Question", message: "Delete this question?", isDanger: true, confirmText: "Delete" });
    if (isConfirmed) {
      try {
        await api.delete(`/quizzes/${id}/questions/${qId}`);
        setQuestions(questions.filter(q => q._id !== qId));
      } catch (err) {
        toast.error("Error deleting question");
      }
    }
  };

  const handlePublish = async () => {
    if (questions.length === 0) {
      toast.success("You need to add at least one question before publishing.");
      return;
    }
    const isConfirmed = await confirm({ title: "Publish Quiz", message: "Are you sure you want to publish this quiz? It cannot be edited afterward.", confirmText: "Publish" });
    if (isConfirmed) {
      try {
        await api.post(`/quizzes/${id}/publish`);
        navigate("/teacher/quizzes");
      } catch (err) {
        toast.error(err.response?.data?.message || "Error publishing quiz");
      }
    }
  };

  const renderTimePicker = (name, value) => {
    let h = "12", m = "00";
    if (value) {
      [h, m] = value.split(":");
    }
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    const hourStr = hour.toString().padStart(2, "0");

    return (
      <div className="flex items-center gap-1">
        <select
          className="border rounded p-2 text-sm bg-white"
          value={hourStr}
          onChange={(e) => {
            let newH = parseInt(e.target.value, 10);
            if (ampm === "PM" && newH !== 12) newH += 12;
            if (ampm === "AM" && newH === 12) newH = 0;
            handleInputChange({ target: { name, type: 'text', value: `${newH.toString().padStart(2, "0")}:${m}` } });
          }}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const val = (i + 1).toString().padStart(2, "0");
            return <option key={val} value={val}>{val}</option>;
          })}
        </select>
        <span>:</span>
        <select
          className="border rounded p-2 text-sm bg-white"
          value={m}
          onChange={(e) => {
            handleInputChange({ target: { name, type: 'text', value: `${h}:${e.target.value}` } });
          }}
        >
          {Array.from({ length: 60 }, (_, i) => {
            const val = i.toString().padStart(2, "0");
            return <option key={val} value={val}>{val}</option>;
          })}
        </select>
        <select
          className="border rounded p-2 text-sm bg-white"
          value={ampm}
          onChange={(e) => {
            const newAmpm = e.target.value;
            let newH = parseInt(h, 10);
            if (newAmpm === "PM" && newH < 12) newH += 12;
            if (newAmpm === "AM" && newH >= 12) newH -= 12;
            handleInputChange({ target: { name, type: 'text', value: `${newH.toString().padStart(2, "0")}:${m}` } });
          }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    );
  };

  if (loading) return <AdminLayout><p>Loading...</p></AdminLayout>;

  return (
    <AdminLayout title={isEdit ? "Edit Quiz" : "Create Quiz"}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/teacher/quizzes")} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">{isEdit ? "Edit Draft Quiz" : "Create New Quiz"}</h2>
        </div>
        {isEdit && quizForm.status === "DRAFT" && (
          <Button onClick={handlePublish} className="bg-emerald-600 hover:bg-emerald-700 border-none text-white shadow-lg shadow-emerald-500/30" icon={CheckCircle}>
            Publish Quiz
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5">
            <h3 className="font-bold text-lg border-b pb-3 mb-4">Quiz Settings</h3>
            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input required name="title" value={quizForm.title} onChange={handleInputChange} className="w-full border rounded-lg p-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Batch</label>
                <select required name="batch" value={quizForm.batch} onChange={handleInputChange} className="w-full border rounded-lg p-2 text-sm">
                  <option value="">Select Batch</option>
                  {[...new Set([...assignedBatches, ...subjectBatches])].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Only your assigned batches are visible.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                <select required name="subject" value={quizForm.subject} onChange={handleInputChange} className="w-full border rounded-lg p-2 text-sm">
                  <option value="">Select Subject</option>
                  {subjectBatches.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Duration (min)</label>
                  <input type="number" required name="durationMinutes" value={quizForm.durationMinutes} onChange={handleInputChange} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Max Attempts</label>
                  <input type="number" required name="attemptLimit" value={quizForm.attemptLimit} onChange={handleInputChange} className="w-full border rounded-lg p-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Start Date</label>
                  <input type="date" required name="startDate" value={quizForm.startDate} onChange={handleInputChange} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Time</label>
                  {renderTimePicker("startTime", quizForm.startTime)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">End Date</label>
                  <input type="date" required name="endDate" value={quizForm.endDate} onChange={handleInputChange} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Time</label>
                  {renderTimePicker("endTime", quizForm.endTime)}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" name="negativeMarkingEnabled" checked={quizForm.negativeMarkingEnabled} onChange={handleInputChange} />
                  Enable Negative Marking
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Def. Positive Mark</label>
                  <input type="number" name="defaultPositiveMark" value={quizForm.defaultPositiveMark} onChange={handleInputChange} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Def. Negative Mark</label>
                  <input type="number" name="defaultNegativeMark" value={quizForm.defaultNegativeMark} onChange={handleInputChange} disabled={!quizForm.negativeMarkingEnabled} className="w-full border rounded-lg p-2 text-sm bg-slate-50 disabled:opacity-50" />
                </div>
              </div>

              {!isEdit && (
                <div className="border-t pt-4 space-y-3 bg-purple-50 -mx-5 px-5 pb-4 rounded-b-lg">
                  <h4 className="font-bold text-sm text-purple-700">Generate Questions with AI (Optional)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Upload Document (.pdf, .docx, .txt)</label>
                      <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setDocFile(e.target.files[0])} className="w-full border rounded-lg p-1.5 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Count</label>
                      <input type="number" min="1" max="20" value={docQuestionCount} onChange={(e) => setDocQuestionCount(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-white" />
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" icon={Save}>{isEdit ? "Update Settings" : "Save & Continue"}</Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {isEdit ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-800 text-white p-4 rounded-xl">
                <h3 className="font-bold">Questions ({questions.length})</h3>
                <Button onClick={handleAddQuestion} size="sm" className="bg-purple-600 hover:bg-purple-500 border-none text-white" icon={Plus}>Add Question</Button>
              </div>

              {questions.map((q, idx) => (
                <Card key={q._id} className="p-5 border-l-4 border-l-purple-500">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-slate-500">Q{idx + 1}</span>
                    <button onClick={() => handleDeleteQuestion(q._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <textarea
                      value={q.questionText}
                      onChange={(e) => handleLocalChange(q._id, { questionText: e.target.value })}
                      onBlur={() => handleUpdateQuestion(q._id, q)}
                      className="w-full border rounded-lg p-3 text-sm font-medium focus:outline-purple-500"
                      rows={2}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q._id}`}
                            checked={q.correctAnswer === opt}
                            onChange={() => {
                              const updated = { ...q, correctAnswer: opt };
                              handleLocalChange(q._id, updated);
                              handleUpdateQuestion(q._id, updated);
                            }}
                            className="w-4 h-4 text-purple-600"
                          />
                          <input
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[oIdx] = e.target.value;
                              const isCorrect = q.correctAnswer === opt;
                              handleLocalChange(q._id, {
                                options: newOpts,
                                correctAnswer: isCorrect ? e.target.value : q.correctAnswer
                              });
                            }}
                            onBlur={() => handleUpdateQuestion(q._id, q)}
                            className={`flex-1 border rounded p-2 text-sm ${q.correctAnswer === opt ? 'bg-emerald-50 border-emerald-200' : ''}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center p-10 border-2 border-dashed rounded-xl border-slate-300 text-slate-500">
                  No questions added yet.
                </div>
              )}
            </div>
          ) : (
            <Card className="p-10 text-center flex flex-col items-center justify-center h-full border-2 border-dashed">
              <h3 className="text-xl font-bold text-slate-400 mb-2">Save Settings First</h3>
              <p className="text-sm text-slate-400 max-w-sm">You need to save the quiz settings before you can start adding questions.</p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default QuizBuilder;
