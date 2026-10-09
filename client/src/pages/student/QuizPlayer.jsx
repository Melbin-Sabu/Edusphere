import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { Clock, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";

function QuizPlayer() {
  const { id, attemptId: paramAttemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quizDetails, setQuizDetails] = useState(null);
  const [attemptId, setAttemptId] = useState(paramAttemptId);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    if (attemptId) {
      resumeAttempt(attemptId);
    } else {
      fetchQuizInfoAndStart();
    }
  }, [id, attemptId]);

  useEffect(() => {
    if (!expiresAt) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.floor((expiry - now) / 1000);
      
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        handleAutoSubmit();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const fetchQuizInfoAndStart = async () => {
    try {
      setLoading(true);
      // Fetch details first to show info if needed, but here we just start
      const startRes = await api.post(`/quizzes/${id}/start`);
      setAttemptId(startRes.data.attemptId);
      setExpiresAt(startRes.data.expiresAt);
      setQuestions(startRes.data.questions);
      setAnswers([]); // empty initially
    } catch (err) {
      alert(err.response?.data?.message || "Could not start quiz");
      navigate("/student/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const resumeAttempt = async (attId) => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/attempt/${attId}`);
      if (res.data.status !== "IN_PROGRESS") {
        alert("This attempt is no longer active");
        navigate(`/student/quizzes/${id}/result`);
        return;
      }
      setExpiresAt(res.data.expiresAt);
      setQuestions(res.data.questions);
      setAnswers(res.data.answers || []);
    } catch (err) {
      alert("Error resuming attempt");
      navigate("/student/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswerSelect = (questionId, option) => {
    const existing = answers.find(a => a.questionId === questionId);
    if (existing) {
      setAnswers(answers.map(a => a.questionId === questionId ? { questionId, answer: option } : a));
    } else {
      setAnswers([...answers, { questionId, answer: option }]);
    }
  };

  const handleManualSubmit = async () => {
    if (window.confirm("Are you sure you want to submit your quiz? You cannot change your answers after this.")) {
      submitQuizData();
    }
  };

  const handleAutoSubmit = async () => {
    alert("Time is up! Your quiz is automatically submitted.");
    submitQuizData();
  };

  const submitQuizData = async () => {
    try {
      await api.post(`/quizzes/${id}/submit`, { attemptId, answers });
      navigate(`/student/quizzes/${id}/result`);
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting quiz");
      navigate(`/student/quizzes/${id}/result`);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Quiz Engine...</div>;

  const currentQuestion = questions[currentQ];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?._id)?.answer || "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Quiz Header */}
      <div className="bg-indigo-900 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="font-bold text-lg hidden md:block">EduSphere Secure Quiz Engine</h1>
        
        <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-1.5 rounded-full ${timeLeft < 60 ? 'bg-red-500 animate-pulse' : 'bg-indigo-800'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>

        <Button onClick={handleManualSubmit} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">
          Submit Final
        </Button>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Question Area */}
        <div className="md:col-span-3 space-y-6">
          <Card className="p-6 md:p-8 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">Question {currentQ + 1} of {questions.length}</span>
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-emerald-600">+{currentQuestion.positiveMark} Marks</span>
                <span className="text-red-500">-{currentQuestion.negativeMark} Marks</span>
              </div>
            </div>

            <h3 className="text-lg md:text-xl font-medium text-slate-800 mb-8 whitespace-pre-wrap">{currentQuestion.questionText}</h3>

            <div className="space-y-3 mt-auto">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(currentQuestion._id, opt)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-sm md:text-base flex items-center gap-3 ${
                    currentAnswer === opt 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-[0_0_0_2px_rgba(79,70,229,0.2)]' 
                      : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${currentAnswer === opt ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                    {currentAnswer === opt && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))} 
                disabled={currentQ === 0}
                icon={ArrowLeft}
              >
                Previous
              </Button>
              <Button 
                variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-200" 
                onClick={() => handleAnswerSelect(currentQuestion._id, null)} 
              >
                Clear Answer
              </Button>
              <Button 
                onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))} 
                disabled={currentQ === questions.length - 1}
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Navigation Grid */}
        <div className="md:col-span-1">
          <Card className="p-4 sticky top-24">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase text-center border-b pb-2">Question Palette</h3>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers.some(a => a.questionId === q._id && a.answer);
                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentQ(idx)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition flex items-center justify-center ${
                      currentQ === idx ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                    } ${
                      isAnswered ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div> Answered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div> Unanswered
              </div>
            </div>
            
            <div className="mt-6 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Do not refresh or close the browser, your timer will continue and you may lose connection.</span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

export default QuizPlayer;
