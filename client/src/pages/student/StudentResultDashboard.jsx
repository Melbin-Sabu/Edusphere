import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { CheckCircle, Award } from "lucide-react";

function StudentResultDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quizzes/student");
      // Filter only quizzes that the student has attempted
      const attemptedQuizzes = res.data.filter(q => q.attemptCount > 0);
      setQuizzes(attemptedQuizzes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Quiz Results">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Quiz Results</h2>
        <p className="text-sm text-slate-500">View the results and scorecards of your attempted quizzes.</p>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 my-10">Loading results...</p>
      ) : quizzes.length === 0 ? (
        <Card className="p-10 text-center flex flex-col items-center">
          <Award className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">No Results Found</h3>
          <p className="text-sm text-slate-500 mb-6">You haven't attempted any quizzes yet.</p>
          <Link to="/student/quizzes">
            <Button>View Available Quizzes</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="p-5 flex flex-col h-full border hover:border-emerald-300 transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-slate-800 truncate pr-2">{quiz.title}</h3>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Attempted</span>
              </div>
              <p className="text-xs text-emerald-800 font-bold mb-4">{quiz.subject}</p>
              
              <div className="text-xs text-slate-500 mb-4 flex-1 space-y-2">
                <p>Attempts made: <strong className="text-slate-700">{quiz.attemptCount}</strong> / {quiz.attemptLimit}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-auto">
                <Link to={`/student/quizzes/${quiz._id}/result`}>
                  <Button variant="outline" className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50" icon={CheckCircle}>
                    View Score Card
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export default StudentResultDashboard;
