import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { Plus, Edit, Trash2, Eye, Calendar, Clock, CheckCircle, BookOpen } from "lucide-react";

function TeacherQuizDashboard() {
  const confirm = useConfirm();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quizzes/teacher");
      setQuizzes(res.data);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const deleteQuiz = async (id) => {
    const isConfirmed = await confirm({ title: "Delete Quiz", message: "Are you sure you want to delete this quiz?", isDanger: true, confirmText: "Delete" });
    if (isConfirmed) {
      try {
        await api.delete(`/quizzes/${id}`);
        fetchQuizzes();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error deleting quiz");
      }
    }
  };

  const publishQuiz = async (id) => {
    const isConfirmed = await confirm({ title: "Publish Quiz", message: "Are you sure you want to publish this quiz? It cannot be un-published.", confirmText: "Publish" });
    if (isConfirmed) {
      try {
        await api.post(`/quizzes/${id}/publish`);
        fetchQuizzes();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error publishing quiz");
      }
    }
  };

  return (
    <AdminLayout title="Quiz Management">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Quizzes</h2>
          <p className="text-sm text-slate-500">Manage and create quizzes for your assigned batches.</p>
        </div>
        <Link to="/teacher/quizzes/create">
          <Button icon={Plus}>Create New Quiz</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 my-10">Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <Card className="p-10 text-center flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">No Quizzes Found</h3>
          <p className="text-sm text-slate-500 mb-6">You haven't created any quizzes yet.</p>
          <Link to="/teacher/quizzes/create">
            <Button icon={Plus}>Create First Quiz</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="p-5 flex flex-col h-full border hover:border-orange-300 transition">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-slate-800 truncate pr-2">{quiz.title}</h3>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                  quiz.status === "DRAFT" ? "bg-slate-100 text-slate-600" :
                  quiz.status === "PUBLISHED" ? "bg-blue-100 text-blue-700" :
                  quiz.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {quiz.status}
                </span>
              </div>
              
              <div className="text-xs text-slate-500 mb-4 flex-1 space-y-2">
                <p><strong>Batch:</strong> <span className="text-orange-600 font-semibold">{quiz.batch}</span></p>
                <p><strong>Subject:</strong> {quiz.subject}</p>
                <p className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {quiz.durationMinutes} mins</p>
                <p className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(quiz.startDate).toLocaleDateString()} {quiz.startTime}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 mt-auto">
                {quiz.status === "DRAFT" ? (
                  <>
                    <Link to={`/teacher/quizzes/${quiz._id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" icon={Edit}>Edit</Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-red-200" onClick={() => deleteQuiz(quiz._id)} icon={Trash2}>
                      Delete
                    </Button>
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => publishQuiz(quiz._id)} icon={CheckCircle}>
                      Publish
                    </Button>
                  </>
                ) : (
                  <Link to={`/teacher/quizzes/${quiz._id}/results`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-orange-700 border-orange-200 hover:bg-orange-50" icon={Eye}>
                      View Results
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export default TeacherQuizDashboard;
