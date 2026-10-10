import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import api from "../../api/api";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

function QuizResults() {
  const { id } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [id]);

  async function fetchResults() {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${id}/results`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Quiz Results">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/teacher/quizzes" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Student Results</h2>
      </div>

      <Card className="p-6">
        {loading ? (
          <p className="text-center text-slate-500 py-10">Loading results...</p>
        ) : results.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No students are currently assigned to this batch.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Adm #</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Correct</th>
                  <th className="py-3 px-4">Wrong</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {results.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold">{r.studentId?.fullName}</td>
                    <td className="py-3 px-4 text-orange-600">{r.studentId?.admissionNumber}</td>
                    <td className="py-3 px-4 font-bold">{r.totalScore}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{r.percentage !== undefined ? r.percentage.toFixed(1) : 0}%</td>
                    <td className="py-3 px-4 flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4"/> {r.correctCount}</td>
                    <td className="py-3 px-4 text-red-600">{r.wrongCount}</td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-500">{r.status}</td>
                    <td className="py-3 px-4 text-xs">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}

export default QuizResults;
