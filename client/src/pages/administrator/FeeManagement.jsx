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
  DollarSign,
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

  const [feeForm, setFeeForm] = useState({
    courseId: "",
    batchId: "",
    scope: "COURSE",
    academicYear: "",
    dueDate: "",
    installmentEnabled: false,
    installmentCount: 1,
    installmentIntervalMonths: 1,
    firstInstallmentDate: "",
    components: [{ name: "Tuition Fee", amount: 0 }]
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "ONLINE",
    transactionId: ""
  });

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
    setFeeForm({
      ...feeForm,
      components: [...feeForm.components, { name: "", amount: 0 }]
    });
  };

  const handleRemoveStructureComponent = (idx) => {
    const newComponents = feeForm.components.filter((_, i) => i !== idx);
    setFeeForm({ ...feeForm, components: newComponents });
  };

  const handleComponentChange = (idx, field, value) => {
    const newComponents = [...feeForm.components];
    newComponents[idx][field] = field === "amount" ? Number(value) : value;
    setFeeForm({ ...feeForm, components: newComponents });
  };

  const submitFeeStructure = async (e) => {
    e.preventDefault();
    try {
      await api.post("/fees/structures", feeForm);
      alert("Fee Structure Created Successfully!");
      setShowStructureModal(false);
      loadData("structures");
    } catch (err) {
      alert(err.response?.data?.message || "Error creating fee structure");
    }
  };

  const deleteStructure = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fee structure? This will also remove the fee assignments from students.")) return;
    try {
      await api.delete(`/fees/structures/${id}`);
      alert("Fee structure deleted.");
      loadData("structures");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete fee structure");
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudentFee) return;
    
    if (paymentForm.amount <= 0 || paymentForm.amount > selectedStudentFee.pendingAmount) {
      alert("Invalid payment amount. Must be between 1 and " + selectedStudentFee.pendingAmount);
      return;
    }

    try {
      await api.post("/fees/payments", {
        studentFeeId: selectedStudentFee._id,
        ...paymentForm
      });
      alert("Payment Recorded Successfully!");
      setShowPaymentModal(false);
      setSelectedStudentFee(null);
      loadData("students");
    } catch (err) {
      alert(err.response?.data?.message || "Error recording payment");
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
      alert("Failed to generate receipt.");
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
                ? "bg-purple-600 text-white shadow-lg"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><DollarSign className="w-5 h-5"/></div>
              </div>
              <h4 className="text-2xl font-extrabold text-slate-900">₹{reports.summary.totalExpected || 0}</h4>
              <p className="text-xs font-bold text-slate-500">Total Expected</p>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-5 h-5"/></div>
              </div>
              <h4 className="text-2xl font-extrabold text-slate-900">₹{reports.summary.totalCollected || 0}</h4>
              <p className="text-xs font-bold text-slate-500">Total Collected</p>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Clock className="w-5 h-5"/></div>
              </div>
              <h4 className="text-2xl font-extrabold text-slate-900">₹{reports.summary.totalPending || 0}</h4>
              <p className="text-xs font-bold text-slate-500">Total Pending</p>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle className="w-5 h-5"/></div>
              </div>
              <h4 className="text-2xl font-extrabold text-slate-900">₹{reports.overdue.totalOverdue || 0}</h4>
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
                    <td className="py-3 px-4">{p.studentId?.fullName} ({p.studentId?.admissionNumber})</td>
                    <td className="py-3 px-4 text-emerald-600">₹{p.amount}</td>
                    <td className="py-3 px-4">{p.paymentMethod}</td>
                    <td className="py-3 px-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-purple-600">{p.receiptNumber}</td>
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
                  <td className="py-3 px-4 text-purple-700">₹{s.totalAmount}</td>
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
                  <td className="py-3 px-4">₹{sf.totalAmount}</td>
                  <td className="py-3 px-4 text-emerald-600">₹{sf.paidAmount}</td>
                  <td className="py-3 px-4 text-rose-600">₹{sf.pendingAmount}</td>
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
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-none text-[10px] px-2 py-1"
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
                  <td className="py-3 px-4 text-purple-700 font-mono">{p.receiptNumber}</td>
                  <td className="py-3 px-4">{p.studentId?.fullName} ({p.studentId?.admissionNumber})</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">₹{p.amount}</td>
                  <td className="py-3 px-4">{p.paymentMethod}</td>
                  <td className="py-3 px-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => generateReceipt(p._id)}
                      className="text-purple-600 hover:text-purple-800"
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
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
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
                  <input type="date" required value={feeForm.dueDate} onChange={e => setFeeForm({...feeForm, dueDate: e.target.value})} className="w-full p-2 border rounded-xl text-sm" />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={feeForm.installmentEnabled} onChange={e => setFeeForm({...feeForm, installmentEnabled: e.target.checked})} className="rounded" />
                  Enable Installments
                </label>
                
                {feeForm.installmentEnabled && (
                  <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Count</label>
                      <input type="number" min="1" required={feeForm.installmentEnabled} value={feeForm.installmentCount} onChange={e => setFeeForm({...feeForm, installmentCount: Number(e.target.value)})} className="w-full p-2 border rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Interval (Months)</label>
                      <input type="number" min="1" required={feeForm.installmentEnabled} value={feeForm.installmentIntervalMonths} onChange={e => setFeeForm({...feeForm, installmentIntervalMonths: Number(e.target.value)})} className="w-full p-2 border rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">First Date</label>
                      <input type="date" required={feeForm.installmentEnabled} value={feeForm.firstInstallmentDate} onChange={e => setFeeForm({...feeForm, firstInstallmentDate: e.target.value})} className="w-full p-2 border rounded-xl text-sm" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700">Fee Components</label>
                  <button type="button" onClick={handleAddStructureComponent} className="text-xs text-purple-600 font-bold">+ Add Item</button>
                </div>
                {feeForm.components.map((comp, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input type="text" placeholder="Name" required value={comp.name} onChange={(e) => handleComponentChange(idx, "name", e.target.value)} className="flex-1 p-2 border rounded-xl text-sm" />
                    <input type="number" placeholder="Amount" min="0" required value={comp.amount} onChange={(e) => handleComponentChange(idx, "amount", e.target.value)} className="w-32 p-2 border rounded-xl text-sm" />
                    {idx > 0 && <button type="button" onClick={() => handleRemoveStructureComponent(idx)} className="text-rose-500"><X className="w-4 h-4"/></button>}
                  </div>
                ))}
                <div className="text-right text-sm font-bold text-slate-800 mt-2">
                  Total: ₹{feeForm.components.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)}
                </div>
              </div>
              <Button type="submit" className="w-full mt-4">Create Structure & Assign to Students</Button>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedStudentFee && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <div className="mb-4 p-3 bg-purple-50 rounded-xl text-xs space-y-1">
              <p>Student: <strong>{selectedStudentFee.studentId?.fullName}</strong></p>
              <p>Pending Amount: <strong className="text-rose-600">₹{selectedStudentFee.pendingAmount}</strong></p>
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
