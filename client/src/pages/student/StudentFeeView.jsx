import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import api from "../../api/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Receipt, Download, CreditCard, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import PaymentModal from "../../components/common/PaymentModal";

function StudentFeeView() {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentContext, setPaymentContext] = useState({ type: null, id: null, amount: 0 });

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    try {
      const res = await api.get("/fees/my-fees");
      setFees(res.data.myFees);
      setPayments(res.data.payments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = (type, id, amount) => {
    setPaymentContext({ type, id, amount });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (receiptData) => {
    try {
      if (paymentContext.type === "INSTALLMENT") {
        await api.post(`/fees/installments/${paymentContext.id}/pay`);
      } else if (paymentContext.type === "FULL") {
        await api.post(`/fees/${paymentContext.id}/pay-full`);
      }
      alert("Fee Payment recorded successfully!");
      loadFees();
    } catch (err) {
      alert(err.response?.data?.message || "Payment processed but failed to update fee record.");
    } finally {
      setIsPaymentModalOpen(false);
    }
  };

  const isInstallmentPayable = (inst, allInstallments) => {
    if (inst.status === 'PAID') return false;

    // Check if any previous installment is unpaid
    const hasPreviousUnpaid = allInstallments.some(
      prev => prev.installmentNumber < inst.installmentNumber && prev.status !== 'PAID'
    );
    if (hasPreviousUnpaid) return false;

    // Check if due date has arrived (or is today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(inst.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate > today) return false;

    return true;
  };

  const generateReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/fees/payments/${paymentId}/receipt`);
      const payment = res.data.payment;
      const student = payment.studentId;
      const feeStruct = payment.studentFeeId.feeStructureId;

      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(107, 70, 193);
      doc.text("EduSphere Platform", 105, 20, null, null, "center");
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Official Fee Receipt", 105, 30, null, null, "center");

      doc.setFontSize(10);
      doc.text(`Receipt No: ${payment.receiptNumber}`, 15, 45);
      doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 150, 45);
      doc.text(`Student Name: ${student.fullName}`, 15, 55);
      doc.text(`Admission No: ${student.admissionNumber}`, 150, 55);
      doc.text(`Course: ${student.course}`, 15, 65);
      doc.text(`Batch: ${student.batch}`, 150, 65);
      doc.text(`Academic Year: ${feeStruct.academicYear}`, 15, 75);

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
      doc.setTextColor(34, 197, 94);
      doc.text(`Total Amount Paid: Rs. ${payment.amount}`, 15, finalY + 15);

      doc.save(`Receipt_${payment.receiptNumber}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to download receipt. See console for details.");
    }
  };

  return (
    <AdminLayout title="My Fees">
      {loading ? (
        <div className="text-center p-4 text-xs text-slate-500">Loading fee details...</div>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto">
          {fees.length === 0 ? (
            <Card padding="p-8" className="text-center border-dashed">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No Fee Records Found</h3>
              <p className="text-xs text-slate-500 mt-2">You currently have no fee structures assigned to your profile.</p>
            </Card>
          ) : (
            fees.map(fee => (
              <Card key={fee._id} padding="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Academic Year: {fee.feeStructureId?.academicYear}</h3>
                    <p className="text-xs text-slate-500">Overall Due Date: {new Date(fee.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                    fee.status === "PAID" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                    fee.status === "OVERDUE" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                    "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {fee.status === "PAID" && <CheckCircle2 className="w-4 h-4" />}
                    {fee.status === "OVERDUE" && <AlertTriangle className="w-4 h-4" />}
                    {(fee.status === "PENDING" || fee.status === "PARTIALLY_PAID") && <Clock className="w-4 h-4" />}
                    {fee.status.replace("_", " ")}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Fee</p>
                    <p className="text-xl font-extrabold text-slate-900">₹{fee.totalAmount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Paid Amount</p>
                    <p className="text-xl font-extrabold text-emerald-700">₹{fee.paidAmount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-center">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Pending Balance</p>
                    <p className="text-xl font-extrabold text-rose-700">₹{fee.pendingAmount}</p>
                  </div>
                </div>

                {fee.installments && fee.installments.length > 0 ? (
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-800">Installment Schedule</h4>
                      {fee.pendingAmount > 0 && (
                        <button 
                          onClick={() => initiatePayment('FULL', fee._id, fee.pendingAmount)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" /> Pay Full (₹{fee.pendingAmount})
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {fee.installments.map(inst => (
                        <div key={inst._id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm hover:shadow-md transition">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">Installment {inst.installmentNumber}</span>
                            <span className="text-xs text-slate-500">Due: {new Date(inst.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-sm font-extrabold text-slate-900">₹{inst.amount}</span>
                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                              inst.status === 'PAID' ? 'text-emerald-600' :
                              inst.status === 'OVERDUE' ? 'text-rose-600' :
                              inst.status === 'UPCOMING' ? 'text-blue-600' : 'text-amber-600'
                            }`}>
                              {inst.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="w-32 flex justify-end">
                            {['UPCOMING', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(inst.status) && (
                              <button 
                                disabled={!isInstallmentPayable(inst, fee.installments)}
                                onClick={() => initiatePayment('INSTALLMENT', inst._id, inst.pendingAmount)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition flex items-center gap-2 ${
                                  isInstallmentPayable(inst, fee.installments)
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                                title={!isInstallmentPayable(inst, fee.installments) ? "Cannot pay yet. Ensure previous installments are paid and the due date has arrived." : ""}
                              >
                                <CreditCard className="w-3 h-3" /> Pay ₹{inst.pendingAmount}
                              </button>
                            )}
                            {inst.status === 'PAID' && (
                              <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4"/> Paid
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  fee.status !== "PAID" && (
                    <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-purple-900">Outstanding Dues</h4>
                        <p className="text-xs text-purple-700 mt-1">Please pay your pending amount of ₹{fee.pendingAmount} before {new Date(fee.dueDate).toLocaleDateString()} to avoid penalties.</p>
                      </div>
                      <button onClick={() => initiatePayment('FULL', fee._id, fee.pendingAmount)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Pay Now
                      </button>
                    </div>
                  )
                )}
              </Card>
            ))
          )}

          {payments.length > 0 && (
            <Card padding="p-6" className="mt-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Payment History</h3>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Receipt No.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td className="py-3 px-4 text-purple-700 font-mono">{p.receiptNumber}</td>
                      <td className="py-3 px-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">₹{p.amount}</td>
                      <td className="py-3 px-4">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => generateReceipt(p._id)}
                          className="flex items-center justify-center gap-1 mx-auto px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                        >
                          <Download className="w-3 h-3" /> Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Modern Payment Gateway Modal Integration */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        userEmail="student@edusphere.com"
        applicationId="FEE-PAYMENT"
        amount={paymentContext.amount}
        onSuccess={handlePaymentSuccess}
      />
    </AdminLayout>
  );
}

export default StudentFeeView;
