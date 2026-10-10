import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { PlayCircle, CheckCircle, Clock, Calendar } from "lucide-react";

function StudentQuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quizzes/student");
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="My Quizzes">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Quizzes</h2>
        <p className="text-sm text-slate-500">View and attempt quizzes assigned to your batch.</p>
      </div>

      {loading ? (
        <p className="text-center text-slate-500 my-10">Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <Card className="p-10 text-center flex flex-col items-center">
          <CheckCircle className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">No Quizzes Available</h3>
          <p className="text-sm text-slate-500 mb-6">You don't have any pending quizzes right now.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="p-5 flex flex-col h-full border hover:border-indigo-300 transition">
              <h3 className="font-bold text-lg text-slate-800 truncate pr-2 mb-2">{quiz.title}</h3>
              <p className="text-xs text-indigo-600 font-bold mb-4">{quiz.subject}</p>
              
              <div className="text-xs text-slate-500 mb-4 flex-1 space-y-2">
                <p className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {quiz.durationMinutes} mins | {quiz.totalQuestions} Questions</p>
                <p className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(quiz.startDate).toLocaleDateString()} to {new Date(quiz.endDate).toLocaleDateString()}</p>
                <p>Attempts allowed: {quiz.attemptLimit}</p>
                <p>Your attempts: {quiz.attemptCount}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-auto flex flex-col gap-2">
                {quiz.hasActiveAttempt ? (
                  <Link to={`/student/quizzes/${quiz._id}/attempt/${quiz.activeAttemptId}`}>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" icon={PlayCircle}>Resume Attempt</Button>
                  </Link>
                ) : quiz.attemptCount >= quiz.attemptLimit ? (
                  <Link to={`/student/quizzes/${quiz._id}/result`}>
                    <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50" icon={CheckCircle}>View Result</Button>
                  </Link>
                ) : (
                  <>
                    <Link to={`/student/quizzes/${quiz._id}/play`}>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" icon={PlayCircle}>Start Quiz</Button>
                    </Link>
                    {quiz.attemptCount > 0 && (
                      <Link to={`/student/quizzes/${quiz._id}/result`}>
                        <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-2" icon={CheckCircle}>View Last Result</Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export default StudentQuizList;
