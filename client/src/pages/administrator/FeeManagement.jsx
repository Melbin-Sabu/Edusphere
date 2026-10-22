import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";
import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import api from "../../api/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  FileText,
  Download,
  Trash2
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function FeeManagement() {
  const confirm = useConfirm();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState({ summary: {}, overdue: {}, recentPayments: [] });
  const [structures, setStructures] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [payments, setPayments] = useState([]);

  // Modals & Forms
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudentFee, setSelectedStudentFee] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const initialFeeForm = {
    courseId: "",
    batchId: "",
    scope: "COURSE",
    academicYear: "",
    dueDate: "",
    installmentEnabled: false,
    installmentCount: 1,
    installmentIntervalMonths: 1,
    firstInstallmentDate: "",
    components: [{ name: "Tuition Fee", amount: "" }]
  };

  const [feeForm, setFeeForm] = useState(initialFeeForm);

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "ONLINE",
    transactionId: ""
  });

  const getFinalInstallmentDate = () => {
    if (!feeForm.firstInstallmentDate) return null;
    const count = Number(feeForm.installmentCount) || 1;
    const interval = Number(feeForm.installmentIntervalMonths) || 1;
    if (count <= 1) return feeForm.firstInstallmentDate;
    const d = new Date(feeForm.firstInstallmentDate);
    d.setMonth(d.getMonth() + (count - 1) * interval);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (tab) => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const res = await api.get("/fees/reports/summary");
        setReports(res.data);
      } else if (tab === "structures") {
        const res = await api.get("/fees/structures");
        setStructures(res.data.feeStructures);
      } else if (tab === "students") {
        const res = await api.get("/fees/students");
        setStudentFees(res.data.studentFees);
      } else if (tab === "history") {
        const res = await api.get("/fees/payments");
        setPayments(res.data.payments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStructureComponent = () => {
    setFeeForm((prev) => ({
      ...prev,
      components: [...prev.components, { name: "", amount: "" }]
    }));
  };

  const handleRemoveStructureComponent = (idx) => {
    if (feeForm.components.length <= 1) {
      toast.error("At least one fee component is required.");
      return;
    }
    setFeeForm((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== idx)
    }));
  };

  const handleComponentChange = (idx, field, value) => {
    const newComponents = [...feeForm.components];
    if (field === "amount") {
      // Allow only digits (0-9)
      const sanitized = value.replace(/[^0-9]/g, "");
      newComponents[idx][field] = sanitized;
    } else {
      newComponents[idx][field] = value;
    }
    setFeeForm((prev) => ({ ...prev, components: newComponents }));
  };

  const submitFeeStructure = async (e) => {
    e.preventDefault();

    // 1. Validate Course ID
    if (!feeForm.courseId || !feeForm.courseId.trim()) {
      toast.error("Please enter a Course ID (e.g. NEET, JEE).");
      return;
    }

    // 2. Validate Scope / Batch
    if (feeForm.scope === "BATCH" && (!feeForm.batchId || !feeForm.batchId.trim())) {
      toast.error("Batch ID is required when fee structure applies to a specific batch.");
      return;
    }

    // 3. Validate Academic Year format
    const trimmedYear = feeForm.academicYear.trim();
    if (!trimmedYear) {
      toast.error("Please enter an Academic Year.");
      return;
    }
    const yearRegex = /^\d{4}-\d{2,4}$/;
    if (!yearRegex.test(trimmedYear)) {
      toast.error("Academic Year format should be YYYY-YYYY or YYYY-YY (e.g. 2026-2027 or 2026-27).");
      return;
    }

    // 4. Validate Dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!feeForm.dueDate) {
      toast.error("Please select an Overall Due Date.");
      return;
    }

    const overallDue = new Date(feeForm.dueDate);
    overallDue.setHours(0, 0, 0, 0);

    if (overallDue < today) {
      toast.error("Overall Due Date cannot be in the past.");
      return;
    }

    // 5. Validate Installments
    if (feeForm.installmentEnabled) {
      const count = Number(feeForm.installmentCount);
      const interval = Number(feeForm.installmentIntervalMonths);

      if (!count || count < 1) {
        toast.error("Installment count must be at least 1.");
        return;
      }
      if (!interval || interval < 1) {
        toast.error("Installment interval must be at least 1 month.");
        return;
      }
      if (!feeForm.firstInstallmentDate) {
        toast.error("Please choose the First Installment Date.");
        return;
      }

      const firstDate = new Date(feeForm.firstInstallmentDate);
      firstDate.setHours(0, 0, 0, 0);

      if (firstDate < today) {
        toast.error("First Installment Date cannot be in the past.");
        return;
      }

      if (firstDate > overallDue) {
        toast.error("First Installment Date cannot be after the Overall Due Date.");
        return;
      }

      const finalDate = new Date(firstDate);
      if (count > 1) {
        finalDate.setMonth(finalDate.getMonth() + (count - 1) * interval);
      }
      if (finalDate > overallDue) {
        const finalDateStr = finalDate.toISOString().split("T")[0];
        toast.error(
          `Final installment (#${count}) falls on ${finalDateStr}, which is after the Overall Due Date (${feeForm.dueDate}). Please adjust the Overall Due Date or use the 'Set Due Date' button.`
        );
        return;
      }
    }

    // 6. Validate Components
    if (!feeForm.components || feeForm.components.length === 0) {
      toast.error("Please add at least one fee component.");
      return;
    }

    for (let i = 0; i < feeForm.components.length; i++) {
      const comp = feeForm.components[i];
      if (!comp.name || !comp.name.trim()) {
        toast.error(`Please provide a name for component #${i + 1}.`);
        return;
      }
      const numAmt = Number(comp.amount);
      if (!comp.amount || isNaN(numAmt) || numAmt <= 0) {
        toast.error(`Please enter a valid amount greater than ₹0 for "${comp.name}".`);
        return;
      }
    }

    const totalAmount = feeForm.components.reduce((sum, c) => sum + Number(c.amount), 0);
    if (totalAmount <= 0) {
      toast.error("Total fee amount must be greater than ₹0.");
      return;
    }

    const payload = {
      ...feeForm,
      courseId: feeForm.courseId.trim().toUpperCase(),
      batchId: feeForm.scope === "BATCH" ? feeForm.batchId.trim().toUpperCase() : undefined,
      academicYear: trimmedYear,
      components: feeForm.components.map((c) => ({
        name: c.name.trim(),
        amount: Number(c.amount)
      })),
      totalAmount
    };

    try {
      await api.post("/fees/structures", payload);
      toast.success("Fee Structure Created Successfully!");
      setShowStructureModal(false);
      setFeeForm(initialFeeForm);
      loadData("structures");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating fee structure");
    }
  };

  const deleteStructure = async (id) => {
    const isConfirmed = await confirm({ title: "Delete Fee Structure", message: "Are you sure you want to delete this fee structure? This will also remove the fee assignments from students.", confirmText: "Delete", isDanger: true });
    if (!isConfirmed) return;
    try {
      await api.delete(`/fees/structures/${id}`);
      toast.success("Fee structure deleted.");
      loadData("structures");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete fee structure");
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudentFee) return;
    
    if (paymentForm.amount <= 0 || paymentForm.amount > selectedStudentFee.pendingAmount) {
      toast.error("Invalid payment amount. Must be between 1 and " + selectedStudentFee.pendingAmount);
      return;
    }

    try {
      await api.post("/fees/payments", {
        studentFeeId: selectedStudentFee._id,
        ...paymentForm
      });
      toast.success("Payment Recorded Successfully!");
      setShowPaymentModal(false);
      setSelectedStudentFee(null);
      loadData("students");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error recording payment");
    }
  };

  const generateReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/fees/payments/${paymentId}/receipt`);
      const payment = res.data.payment;
      const student = payment.studentId;
      const feeStruct = payment.studentFeeId.feeStructureId;

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(107, 70, 193); // Purple-600
      doc.text("EduSphere Platform", 105, 20, null, null, "center");
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Official Fee Receipt", 105, 30, null, null, "center");

      // Details
      doc.setFontSize(10);
      doc.text(`Receipt No: ${payment.receiptNumber}`, 15, 45);
      doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 150, 45);

      doc.text(`Student Name: ${student.fullName}`, 15, 55);
      doc.text(`Admission No: ${student.admissionNumber}`, 150, 55);
      doc.text(`Course: ${student.course}`, 15, 65);
      doc.text(`Batch: ${student.batch}`, 150, 65);
      
      doc.text(`Academic Year: ${feeStruct.academicYear}`, 15, 75);

      // Payment info table
      autoTable(doc, {
        startY: 85,
        head: [['Description', 'Details']],
        body: [
          ['Payment Method', payment.paymentMethod],
          ['Transaction ID', payment.transactionId || 'N/A'],
          ['Amount Paid', `Rs. ${payment.amount}`],
          ['Payment Status', payment.paymentStatus],
        ],
        theme: 'grid',
        headStyles: { fillColor: [107, 70, 193] }
      });

      const finalY = doc.lastAutoTable.finalY || 130;
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94); // Green for paid amount
      doc.text(`Total Amount Paid: Rs. ${payment.amount}`, 15, finalY + 15);

      doc.save(`Receipt_${payment.receiptNumber}.pdf`);
    } catch (err) {
      console.error("Error generating receipt", err);
      toast.error("Failed to generate receipt.");
    }
  };

  return (
    <AdminLayout title="Fee Management System">
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
        {["overview", "structures", "students", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
              activeTab === tab
                ? "bg-orange-600 text-white shadow-lg"
                : "text-slate-500 hover:bg-slate-100 hover:text-[#0D2F24]"
            }`}
          >
            {tab.replace("-", " ")}
          </button>
        ))}
      </div>

      {loading && <div className="text-center p-4 text-xs text-slate-500">Loading records...</div>}

      {!loading && activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card padding="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><IndianRupee className="w-5 h-5"/></div>
              </div>
              <h4 className="text-2xl font-extrabold text-[#0D2F24]">₹{(reports.summary.totalExpected || 0).toLocaleString('en-IN')}</h4>
              <p className="text-xs font-bold text-slate-500">Total Expected</p>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-5 h-5"/></div>
              </div>
              <h4 className="text-2xl font-extrabold text-[#0D2F24]">₹{(reports.summary.totalCollected || 0).toLocaleString('en-IN')}</h4>
              <p className="text-xs font-bold text-slate-500">Total Collected</p>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Clock className="w-5 h-5"/></div>
              </div>
              <h4 className="text-2xl font-extrabold text-[#0D2F24]">₹{(reports.summary.totalPending || 0).toLocaleString('en-IN')}</h4>
              <p className="text-xs font-bold text-slate-500">Total Pending</p>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle className="w-5 h-5"/></div>
              </div>
              <h4 className="text-2xl font-extrabold text-[#0D2F24]">₹{(reports.overdue.totalOverdue || 0).toLocaleString('en-IN')}</h4>
              <p className="text-xs font-bold text-slate-500">Overdue ({reports.overdue.count || 0} students)</p>
            </Card>
          </div>
          
          <Card padding="p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Payments</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reports.recentPayments?.map(p => (
                  <tr key={p._id}>
                    <td className="py-3 px-4">{(p.studentId?.fullName)} ({(p.studentId?.admissionNumber)})</td>
                    <td className="py-3 px-4 text-emerald-600">₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">{p.paymentMethod}</td>
                    <td className="py-3 px-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-orange-600">{p.receiptNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {!loading && activeTab === "structures" && (
        <Card padding="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800">Fee Structures</h3>
            {(user.role?.toUpperCase() === "ADMINISTRATOR" || user.role?.toUpperCase() === "ADMIN") && (
              <Button onClick={() => setShowStructureModal(true)} size="sm" className="flex items-center gap-1">
                <Plus className="w-4 h-4" /> New Structure
              </Button>
            )}
          </div>
          <table className="w-full text-left text-xs mt-4">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Course / Batch</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {structures.map(s => (
                <tr key={s._id}>
                  <td className="py-3 px-4 font-bold">{s.courseId} / {s.batchId}</td>
                  <td className="py-3 px-4">{s.academicYear}</td>
                  <td className="py-3 px-4 text-orange-700">₹{(s.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">{new Date(s.dueDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px]">{s.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => deleteStructure(s._id)} className="text-rose-500 hover:text-rose-700" title="Delete Structure">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && activeTab === "students" && (
        <Card padding="p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Student Fee Status</h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course/Batch</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {studentFees.map(sf => (
                <tr key={sf._id}>
                  <td className="py-3 px-4">
                    <div className="font-bold">{sf.studentId?.fullName}</div>
                    <div className="text-[10px] text-slate-400">{sf.studentId?.admissionNumber}</div>
                  </td>
                  <td className="py-3 px-4">{sf.studentId?.course} / {sf.studentId?.batch}</td>
                  <td className="py-3 px-4">₹{(sf.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-emerald-600">₹{(sf.paidAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-rose-600">₹{(sf.pendingAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      sf.status === "PAID" ? "bg-emerald-100 text-emerald-800" :
                      sf.status === "OVERDUE" ? "bg-rose-100 text-rose-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {sf.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {sf.status !== "PAID" && (
                      <Button 
                        onClick={() => {
                          setSelectedStudentFee(sf);
                          setPaymentForm({ amount: sf.pendingAmount, paymentMethod: "ONLINE", transactionId: "" });
                          setShowPaymentModal(true);
                        }} 
                        size="sm"
                        className="bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-none text-[10px] px-2 py-1"
                      >
                        Record Payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && activeTab === "history" && (
        <Card padding="p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Payment History</h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Receipt No.</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {payments.map(p => (
                <tr key={p._id}>
                  <td className="py-3 px-4 text-orange-700 font-mono">{p.receiptNumber}</td>
                  <td className="py-3 px-4">{p.studentId?.fullName} ({p.studentId?.admissionNumber})</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">{p.paymentMethod}</td>
                  <td className="py-3 px-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => generateReceipt(p._id)}
                      className="text-orange-600 hover:text-orange-800"
                      title="Download Receipt"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* CREATE STRUCTURE MODAL */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-[#05110d]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">New Fee Structure</h3>
              <button onClick={() => setShowStructureModal(false)}><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <form onSubmit={submitFeeStructure} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course ID</label>
                  <input type="text" required value={feeForm.courseId} onChange={e => setFeeForm({...feeForm, courseId: e.target.value})} className="w-full p-2 border rounded-xl text-sm" placeholder="e.g. NEET" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applies To</label>
                  <select value={feeForm.scope} onChange={e => setFeeForm({...feeForm, scope: e.target.value})} className="w-full p-2 border rounded-xl text-sm">
                    <option value="COURSE">Entire Course</option>
                    <option value="BATCH">Specific Batch</option>
                  </select>
                </div>
              </div>
              {feeForm.scope === "BATCH" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch ID</label>
                  <input type="text" required value={feeForm.batchId} onChange={e => setFeeForm({...feeForm, batchId: e.target.value})} className="w-full p-2 border rounded-xl text-sm" placeholder="e.g. MORNING" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
                  <input type="text" required value={feeForm.academicYear} onChange={e => setFeeForm({...feeForm, academicYear: e.target.value})} className="w-full p-2 border rounded-xl text-sm" placeholder="e.g. 2026-2027" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Overall Due Date</label>
                  <input type="date" min={todayStr} required value={feeForm.dueDate} onChange={e => setFeeForm({...feeForm, dueDate: e.target.value})} className="w-full p-2 border rounded-xl text-sm" />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={feeForm.installmentEnabled} onChange={e => setFeeForm({...feeForm, installmentEnabled: e.target.checked})} className="rounded" />
                  Enable Installments
                </label>
                
                {feeForm.installmentEnabled && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Count</label>
                        <input 
                          type="number" 
                          min="1" 
                          required={feeForm.installmentEnabled} 
                          value={feeForm.installmentCount} 
                          onChange={e => {
                            const val = e.target.value;
                            setFeeForm({
                              ...feeForm, 
                              installmentCount: val === "" ? "" : Math.max(1, parseInt(val, 10) || 1)
                            });
                          }} 
                          className="w-full p-2 border rounded-xl text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Interval (Months)</label>
                        <input 
                          type="number" 
                          min="1" 
                          required={feeForm.installmentEnabled} 
                          value={feeForm.installmentIntervalMonths} 
                          onChange={e => {
                            const val = e.target.value;
                            setFeeForm({
                              ...feeForm, 
                              installmentIntervalMonths: val === "" ? "" : Math.max(1, parseInt(val, 10) || 1)
                            });
                          }} 
                          className="w-full p-2 border rounded-xl text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">First Date</label>
                        <input type="date" min={todayStr} max={feeForm.dueDate || undefined} required={feeForm.installmentEnabled} value={feeForm.firstInstallmentDate} onChange={e => setFeeForm({...feeForm, firstInstallmentDate: e.target.value})} className="w-full p-2 border rounded-xl text-sm" />
                      </div>
                    </div>

                    {(() => {
                      const finalDateStr = getFinalInstallmentDate();
                      if (!finalDateStr || !feeForm.dueDate) return null;
                      const isOverdue = new Date(finalDateStr) > new Date(feeForm.dueDate);
                      return (
                        <div className={`mt-2.5 p-2.5 rounded-xl text-xs font-medium flex flex-wrap items-center justify-between gap-2 ${isOverdue ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                          <div className="flex items-center gap-1.5">
                            <span>{isOverdue ? '⚠️' : '✓'}</span>
                            <span>
                              {isOverdue 
                                ? `Final installment (#${feeForm.installmentCount || 1}) falls on ${finalDateStr}, which is after Overall Due Date (${feeForm.dueDate}).`
                                : `Final installment (#${feeForm.installmentCount || 1}) will be due on ${finalDateStr}.`}
                            </span>
                          </div>
                          {isOverdue && (
                            <button
                              type="button"
                              onClick={() => setFeeForm(prev => ({ ...prev, dueDate: finalDateStr }))}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer shadow-xs"
                            >
                              Set Due Date to {finalDateStr}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700">Fee Components</label>
                  <button type="button" onClick={handleAddStructureComponent} className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer transition">
                    + Add Item
                  </button>
                </div>
                {feeForm.components.map((comp, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Component Name (e.g. Tuition Fee)" 
                      required 
                      value={comp.name} 
                      onChange={(e) => handleComponentChange(idx, "name", e.target.value)} 
                      className="flex-1 p-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" 
                    />
                    <div className="relative w-36">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0" 
                        required 
                        value={comp.amount} 
                        onChange={(e) => handleComponentChange(idx, "amount", e.target.value)} 
                        className="w-full pl-7 pr-2 py-2 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500" 
                      />
                    </div>
                    {feeForm.components.length > 1 && (
                      <button type="button" onClick={() => handleRemoveStructureComponent(idx)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition" title="Remove Component">
                        <X className="w-4 h-4"/>
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed">
                  <span className="text-xs text-slate-500 font-medium">
                    {feeForm.components.length} component{feeForm.components.length > 1 ? "s" : ""}
                  </span>
                  <div className="text-sm font-bold text-slate-800">
                    Total: <span className="text-orange-600 font-bold text-base">₹{(feeForm.components.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full mt-4">Create Structure & Assign to Students</Button>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedStudentFee && (
        <div className="fixed inset-0 bg-[#05110d]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <div className="mb-4 p-3 bg-orange-50 rounded-xl text-xs space-y-1">
              <p>Student: <strong>{selectedStudentFee.studentId?.fullName}</strong></p>
              <p>Pending Amount: <strong className="text-rose-600">₹{(selectedStudentFee.pendingAmount || 0).toLocaleString('en-IN')}</strong></p>
            </div>
            <form onSubmit={submitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
                <input type="number" min="1" max={selectedStudentFee.pendingAmount} required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="w-full p-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})} className="w-full p-2 border rounded-xl text-sm">
                  <option value="ONLINE">ONLINE / GATEWAY</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD (POS)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction ID (Optional)</label>
                <input type="text" value={paymentForm.transactionId} onChange={e => setPaymentForm({...paymentForm, transactionId: e.target.value})} className="w-full p-2 border rounded-xl text-sm" placeholder="e.g. TXN-987654321" />
              </div>
              <Button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">Confirm Payment</Button>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default FeeManagement;
