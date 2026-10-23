import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Printer,
  Layers,
  GraduationCap,
  Award,
  Check,
  UserCheck
} from "lucide-react";

function TeacherTimetable() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const [course, setCourse] = useState("NEET");
  const [batch, setBatch] = useState("Morning");
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teacherSubject, setTeacherSubject] = useState(user.subject || "Chemistry");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Fetch teacher details to automatically detect the teacher's assigned subject and batch
  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/teachers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const teachers = res.data?.teachers || [];
        const me = teachers.find(
          (t) =>
            t.email?.toLowerCase() === user.email?.toLowerCase() ||
            t.user?._id === user.id ||
            t.user?.email?.toLowerCase() === user.email?.toLowerCase()
        );

        if (me && me.subject && me.subject !== "General") {
          setTeacherSubject(me.subject);
          const updatedUser = { ...user, subject: me.subject, department: me.department };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);

          // If teacher is assigned to a department/batch, align course selection
          if (me.department === "JEE" || me.department === "NEET") {
            setCourse(me.department);
          }
        } else if (user.subject && user.subject !== "General") {
          setTeacherSubject(user.subject);
        }
      } catch (err) {
        if (user.subject) {
          setTeacherSubject(user.subject);
        }
      }
    };

    fetchTeacherDetails();
  }, [user.email, user.id]);

  // Load published timetable for selected course & batch
  useEffect(() => {
    let isMounted = true;
    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/timetable?course=${course}&batch=${batch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted && res.data?.timetable) {
          setTimetable(res.data.timetable);
        }
      } catch (err) {
        console.error("Failed to load timetable:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTimetable();
    return () => {
      isMounted = false;
    };
  }, [course, batch]);

  // Automatic subject matching logic (handles aliases like Maths / Mathematics)
  const isSubjectMatch = (sessionSubject, targetSubject) => {
    if (!sessionSubject || !targetSubject) return false;
    const s1 = sessionSubject.trim().toLowerCase();
    const s2 = targetSubject.trim().toLowerCase();
    if (s1 === s2) return true;
    if ((s1 === "maths" || s1 === "mathematics") && (s2 === "maths" || s2 === "mathematics")) return true;
    if (s1.includes(s2) || s2.includes(s1)) return true;
    return false;
  };

  // Calculate teacher's automatically allotted hours for this timetable
  const allottedSummary = useMemo(() => {
    if (!timetable || !timetable.schedule) return { count: 0, sessions: [] };
    const sessions = [];
    let count = 0;

    days.forEach((day) => {
      const daySlots = timetable.schedule[day] || [];
      daySlots.forEach((session, periodIdx) => {
        if (isSubjectMatch(session.subject, teacherSubject)) {
          count++;
          sessions.push({
            day,
            period: periodIdx + 1,
            time: timetable.slots ? timetable.slots[periodIdx] : `Period ${periodIdx + 1}`,
            subject: session.subject,
          });
        }
      });
    });

    return { count, sessions };
  }, [timetable, teacherSubject]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout title="Faculty Timetable & Allocated Hours">
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0D2F24] flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-emerald-800" />
            Faculty Academic Schedule
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Weekly class schedule with your assigned teaching hours automatically highlighted.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm text-xs py-2.5"
            icon={Printer}
          >
            Print Timetable
          </Button>
        </div>
      </div>

      {/* TEACHER ALLOTTED SUBJECT HERO BANNER */}
      <div className="bg-gradient-to-r from-[#0D2F24] via-emerald-900 to-[#124434] text-white p-6 rounded-2xl shadow-md mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-600/10 -skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Automatic Faculty Allotment Active
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">
              Welcome, {user.name || "Faculty Member"}!
            </h3>
            <p className="text-emerald-100/80 text-sm max-w-xl">
              You are assigned to{" "}
              <span className="font-extrabold text-white underline decoration-emerald-400 decoration-2 underline-offset-4">
                {teacherSubject}
              </span>
              . All your allotted teaching hours across the weekly batch timetable are automatically highlighted with priority badges.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3 rounded-xl text-center min-w-[130px]">
              <div className="text-xs uppercase tracking-wider text-emerald-200 font-bold">
                Weekly Allotted
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                {allottedSummary.count} <span className="text-xs font-medium text-emerald-300">Hours</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3 rounded-xl text-center min-w-[130px]">
              <div className="text-xs uppercase tracking-wider text-emerald-200 font-bold">
                Assigned Subject
              </div>
              <div className="text-lg font-black text-emerald-300 mt-1">
                {teacherSubject}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AUTOMATIC CONTROLS & BATCH SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Course Filter */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
            Target Course
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCourse("NEET")}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                course === "NEET"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              NEET
            </button>
            <button
              onClick={() => setCourse("JEE")}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                course === "JEE"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              JEE
            </button>
          </div>
        </div>

        {/* Batch Shift */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
            Batch Shift
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBatch("Morning")}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                batch === "Morning"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => setBatch("Evening")}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                batch === "Evening"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Evening
            </button>
          </div>
        </div>

        {/* Automatic Highlight Indicator */}
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <label className="block text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
            Automatic Faculty Highlighting
          </label>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mt-1">
            <span>Subject: <strong className="text-emerald-950 font-black text-sm">{teacherSubject}</strong></span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[10px] uppercase tracking-wider font-extrabold">
              Active Highlight
            </span>
          </div>
        </div>
      </div>

      {/* TIMETABLE DISPLAY */}
      {loading ? (
        <Card className="min-h-[400px] flex flex-col items-center justify-center p-8 border-slate-200">
          <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-base font-bold text-slate-800">Loading Academic Timetable...</h3>
          <p className="text-xs text-slate-500 mt-1">Retrieving weekly schedule for {course} {batch} batch.</p>
        </Card>
      ) : timetable ? (
        <Card className="p-6 border-slate-200 shadow-sm overflow-hidden mb-6">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-black text-xl text-[#0D2F24] flex items-center gap-2">
                <span>{timetable.course} {timetable.batch} Batch Schedule</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                  Weekly
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Time slots are synchronized with academic bell schedule
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                {allottedSummary.count} Hours Allotted to {teacherSubject}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="py-2.5 px-3 text-slate-400 font-extrabold uppercase tracking-wider text-xs w-28 bg-slate-50/50 rounded-lg">
                    Day
                  </th>
                  {timetable.slots?.map((slot, i) => (
                    <th
                      key={i}
                      className="py-2.5 px-3 text-slate-700 font-bold text-center text-xs bg-slate-100/70 rounded-lg border border-slate-200/50"
                    >
                      <div className="font-extrabold text-[#0D2F24]">Period {i + 1}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 font-normal">
                        {slot}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {days.map((day) => {
                  const daySessions = timetable.schedule[day] || [];
                  const dayHasAllotted = daySessions.some((s) => isSubjectMatch(s.subject, teacherSubject));

                  return (
                    <tr key={day} className={dayHasAllotted ? "bg-emerald-50/20" : ""}>
                      <td className="py-3 px-3 font-black text-slate-800 border-r border-slate-100 align-middle">
                        <div className="flex items-center gap-2">
                          <span>{day}</span>
                          {dayHasAllotted && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="You have class on this day" />
                          )}
                        </div>
                      </td>

                      {daySessions.map((session, i) => {
                        const isAllotted = isSubjectMatch(session.subject, teacherSubject);

                        if (isAllotted) {
                          return (
                            <td key={i} className="p-1 h-full min-w-[140px]">
                              <div className="h-full flex flex-col items-center justify-center p-3 rounded-xl border-2 border-emerald-600 bg-gradient-to-b from-emerald-100/95 to-emerald-50 text-center min-h-[75px] shadow-md ring-2 ring-emerald-400 ring-offset-2 ring-offset-white transform scale-[1.02] transition-all hover:scale-[1.04]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-800 text-white shadow-xs mb-1.5 animate-pulse">
                                  <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                                  ALLOTTED HOUR
                                </span>
                                <span className="font-black text-sm text-emerald-950 tracking-tight">
                                  {session.subject}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-800 mt-0.5 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-700" /> Your Class
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // Regular / Other classes (clean and readable)
                        return (
                          <td key={i} className="p-1 h-full min-w-[130px]">
                            <div
                              className={`h-full flex flex-col items-center justify-center p-2.5 rounded-xl border ${session.color} text-center min-h-[70px] opacity-75 hover:opacity-100 transition-opacity`}
                            >
                              <span className="font-bold text-xs text-slate-800">
                                {session.subject}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider opacity-70 mt-1 font-semibold">
                                {session.type}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* LEGEND BAR */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-700">Schedule Legend:</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 border border-emerald-600 ring-1 ring-emerald-300" />
                <strong className="text-emerald-900">Your Allotted Hour ({teacherSubject})</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-200" />
                Physics
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-200" />
                Chemistry
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-teal-100 border border-teal-200" />
                Botany
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-200" />
                Zoology
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-200" />
                Mock Test
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Timetable generated & allocated by College Administration
            </div>
          </div>
        </Card>
      ) : (
        <Card className="min-h-[300px] flex flex-col items-center justify-center p-8 border-slate-200 border-dashed text-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Timetable Published Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            The administrator has not published a timetable for {course} {batch} yet.
          </p>
        </Card>
      )}

      {/* ALLOTTED HOURS WEEKLY AGENDA BREAKDOWN */}
      {allottedSummary.sessions.length > 0 && (
        <Card className="p-6 border-slate-200 shadow-sm">
          <h4 className="font-extrabold text-[#0D2F24] text-base mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-800" />
            Your Weekly Class Schedule ({teacherSubject})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allottedSummary.sessions.map((slotItem, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-emerald-950 uppercase tracking-wide">
                    {slotItem.day}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                    Period {slotItem.period}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{slotItem.time}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-900">{slotItem.subject}</span>
                  <span className="text-slate-400 font-medium">Standard Lecture</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}

export default TeacherTimetable;
