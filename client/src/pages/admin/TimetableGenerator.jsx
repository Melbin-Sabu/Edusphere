import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Calendar, Settings, Sparkles, RefreshCw, Clock, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";

function TimetableGenerator() {
  const [course, setCourse] = useState("NEET");
  const [batch, setBatch] = useState("Morning");
  const [additionalSubjects, setAdditionalSubjects] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [timetable, setTimetable] = useState(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Slot times based on batch
  const getSlots = (batchType) => {
    if (batchType === "Morning") {
      return ["08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "10:15 AM - 11:15 AM", "11:15 AM - 12:15 PM"];
    }
    return ["04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM", "06:15 PM - 07:15 PM", "07:15 PM - 08:15 PM"];
  };

  const generateTimetable = () => {
    setIsGenerating(true);
    setTimetable(null);

    // Simulate API delay
    setTimeout(() => {
      const schedule = {};
      const slots = getSlots(batch);

      const neetSubjects = ["Physics", "Chemistry", "Botany", "Zoology"];
      const jeeSubjects = ["Physics", "Chemistry", "Mathematics"];

      const extraSubjects = additionalSubjects.split(",").map(s => s.trim()).filter(s => s);
      const allSubjects = course === "NEET" ? [...neetSubjects, ...extraSubjects] : [...jeeSubjects, ...extraSubjects];

      let subjectIndex = 0;

      days.forEach((day, dayIndex) => {
        schedule[day] = [];

        for (let i = 0; i < 4; i++) {
          // Tuesday (Day 2) and Thursday (Day 4) Mock Tests in Periods 3 & 4
          if ((day === "Tuesday" || day === "Thursday") && (i === 2 || i === 3)) {
            schedule[day].push({
              subject: "Mock Test",
              type: "Test",
              color: "bg-rose-100 text-rose-700 border-rose-200"
            });
            continue;
          }

          // Regular Classes
          const subject = allSubjects[subjectIndex % allSubjects.length];
          subjectIndex++;

          let color = "bg-slate-100 text-slate-700 border-slate-200"; // Default
          if (subject === "Physics") color = "bg-blue-100 text-blue-700 border-blue-200";
          else if (subject === "Chemistry") color = "bg-emerald-100 text-emerald-700 border-emerald-200";
          else if (subject === "Botany") color = "bg-teal-100 text-teal-700 border-teal-200";
          else if (subject === "Zoology") color = "bg-amber-100 text-amber-700 border-amber-200";
          else if (subject === "Mathematics") color = "bg-purple-100 text-purple-700 border-purple-200";
          else color = "bg-indigo-100 text-indigo-700 border-indigo-200"; // Additional Custom Subjects

          schedule[day].push({
            subject,
            type: "Class",
            color
          });
        }
      });

      setTimetable({
        course,
        batch,
        slots,
        schedule
      });
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <AdminLayout title="Automated Timetable Generation">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" /> Timetable Allocation
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Automatically generate optimized weekly schedules for NEET and JEE batches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CONFIGURATION PANEL */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" /> Allocation Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Target Course
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCourse("NEET")}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${course === "NEET"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    NEET
                  </button>
                  <button
                    onClick={() => setCourse("JEE")}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${course === "JEE"
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    JEE
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Batch Shift
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBatch("Morning")}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${batch === "Morning"
                        ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    Morning
                  </button>
                  <button
                    onClick={() => setBatch("Evening")}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${batch === "Evening"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    Evening
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Special / Additional Subjects
                </label>
                <input
                  type="text"
                  placeholder="e.g. English, Mental Ability (comma separated)"
                  value={additionalSubjects}
                  onChange={(e) => setAdditionalSubjects(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-2 text-xs text-slate-600">
                <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 4 Hours daily schedule</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mock Tests on Tue & Thu (Periods 3 & 4)</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Includes custom/extra subjects</p>
              </div>

              <Button
                onClick={generateTimetable}
                disabled={isGenerating}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-sm"
                icon={isGenerating ? RefreshCw : Sparkles}
              >
                {isGenerating ? "Generating..." : "Auto-Allocate Timetable"}
              </Button>
            </div>
          </Card>
        </div>

        {/* TIMETABLE DISPLAY */}
        <div className="lg:col-span-2">
          {isGenerating ? (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-6 border-slate-200 border-dashed">
              <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Generating Optimal Schedule...</h3>
              <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
                Our algorithm is distributing subjects and tests to ensure a balanced academic workload for the {course} {batch} batch.
              </p>
            </Card>
          ) : timetable ? (
            <Card className="p-6 border-slate-200 shadow-sm h-full overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900">
                    {timetable.course} {timetable.batch} Timetable
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Effective for current academic week
                  </p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Allocated Successfully
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm border-separate border-spacing-2">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 text-slate-400 font-bold uppercase tracking-wider text-xs w-24">
                        Day
                      </th>
                      {timetable.slots.map((slot, i) => (
                        <th key={i} className="py-2 px-3 text-slate-600 font-bold text-center text-xs bg-slate-50 rounded-lg">
                          Period {i + 1}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{slot}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map(day => (
                      <tr key={day}>
                        <td className="py-3 px-3 font-bold text-slate-700 border-r border-slate-100">
                          {day}
                        </td>
                        {timetable.schedule[day].map((session, i) => (
                          <td key={i} className="p-1 h-full">
                            <div className={`h-full flex flex-col items-center justify-center p-2 rounded-xl border ${session.color} text-center min-h-[60px] transition-transform hover:scale-[1.02] cursor-default`}>
                              <span className="font-bold text-xs">{session.subject}</span>
                              <span className="text-[9px] uppercase tracking-wider opacity-70 mt-1 font-semibold">{session.type}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-6 border-slate-200 border-dashed bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-indigo-300">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No Timetable Generated</h3>
              <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
                Select your desired course and batch on the left, then click auto-allocate to generate a weekly schedule.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default TimetableGenerator;
