import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { ArrowLeft, CheckCircle, XCircle, CircleDashed, Award } from "lucide-react";

function QuizResultView() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${id}/result`);
      setResult(res.data.attempt);
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching result or result not found.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AdminLayout><p className="p-10 text-center">Loading Result...</p></AdminLayout>;
  if (!result) return <AdminLayout><p className="p-10 text-center">Result not found.</p></AdminLayout>;

  return (
    <AdminLayout title="Quiz Result">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/student/quizzes" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Your Score Card</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 md:col-span-4 bg-gradient-to-r from-indigo-900 to-orange-900 text-white flex flex-col md:flex-row items-center justify-between shadow-xl border-none">
          <div>
            <h3 className="text-xl font-bold text-indigo-100 flex items-center gap-2"><Award className="w-6 h-6 text-yellow-400" /> Performance Summary</h3>
            <p className="text-sm text-indigo-200 mt-1">Submitted on: {new Date(result.submittedAt).toLocaleString()}</p>
          </div>
          <div className="mt-4 md:mt-0 text-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 min-w-[200px]">
            <p className="text-xs uppercase tracking-widest text-indigo-200 font-bold mb-1">Final Score</p>
            <p className="text-4xl font-black text-white">{result.totalScore}</p>
            <p className="text-sm font-bold text-emerald-400">{result.percentage.toFixed(1)}%</p>
          </div>
        </Card>

        <Card className="p-5 text-center flex flex-col items-center border-t-4 border-t-emerald-500">
          <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
          <p className="text-3xl font-black text-slate-800">{result.correctCount}</p>
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Correct</p>
        </Card>

        <Card className="p-5 text-center flex flex-col items-center border-t-4 border-t-red-500">
          <XCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-3xl font-black text-slate-800">{result.wrongCount}</p>
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Wrong</p>
        </Card>

        <Card className="p-5 text-center flex flex-col items-center border-t-4 border-t-slate-400">
          <CircleDashed className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-3xl font-black text-slate-800">{result.unansweredCount}</p>
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Unanswered</p>
        </Card>

        <Card className="p-5 text-center flex flex-col items-center border-t-4 border-t-emerald-700">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-emerald-800 font-black mb-2">#</div>
          <p className="text-3xl font-black text-slate-800">{questions.length}</p>
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Qs</p>
        </Card>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-4">Detailed Analysis</h3>
      
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const studentAns = result.answers.find(a => a.questionId === q._id)?.answer;
          const isCorrect = studentAns === q.correctAnswer;
          const isUnanswered = !studentAns;

          return (
            <Card key={q._id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  {isCorrect ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle className="w-5 h-5"/></div>
                  ) : isUnanswered ? (
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center"><CircleDashed className="w-5 h-5"/></div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><XCircle className="w-5 h-5"/></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-500 text-sm">Question {idx + 1}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCorrect ? 'bg-emerald-50 text-emerald-600' : isUnanswered ? 'bg-slate-50 text-slate-500' : 'bg-red-50 text-red-600'}`}>
                      {isCorrect ? `+${q.positiveMark}` : isUnanswered ? '0' : `-${q.negativeMark}`} Marks
                    </span>
                  </div>
                  <h4 className="text-base font-medium text-slate-800 mb-4">{q.questionText}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {q.options.map((opt, oIdx) => {
                      const isStudentChoice = opt === studentAns;
                      const isActualCorrect = opt === q.correctAnswer;
                      
                      let optClass = "border-slate-200 bg-slate-50 text-slate-600";
                      
                      if (isActualCorrect) {
                        optClass = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                      } else if (isStudentChoice && !isActualCorrect) {
                        optClass = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                      }
                      
                      return (
                        <div key={oIdx} className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-between ${optClass}`}>
                          <span>{opt}</span>
                          {isStudentChoice && <span className="text-[10px] font-black uppercase tracking-wider bg-white/50 px-2 py-0.5 rounded">Your Answer</span>}
                          {!isStudentChoice && isActualCorrect && <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Correct Answer</span>}
                        </div>
                      )
                    })}
                  </div>
                  
                  {q.explanation && (
                    <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                      <span className="font-bold block mb-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </AdminLayout>
  );
}

export default QuizResultView;
