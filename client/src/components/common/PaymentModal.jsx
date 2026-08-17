import React, { useState, useEffect } from "react";
import api from "../../api/api";
import {
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  X,
  Copy,
  Check,
  Lock,
  Smartphone,
  Zap,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

/**
 * Modern Interactive Razorpay Gateway Payment Modal
 * Supports:
 * 1. Card Payment (Inputs for card number, expiry, CVV, holder name, Auto-fill Test Card)
 * 2. UPI / QR Payment (Dynamic UPI QR generation, UPI ID copy, UPI apps, manual VPA)
 * 3. NetBanking Payment (Popular banks selection)
 */
function PaymentModal({
  isOpen,
  onClose,
  userEmail,
  applicationId,
  amount = 500,
  onSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' | 'upi' | 'netbanking'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // UPI Form State
  const [upiIdInput, setUpiIdInput] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // NetBanking State
  const [selectedBank, setSelectedBank] = useState("HDFC");

  const merchantUpiId = "edusphere.razorpay@icici";
  const displayEmail = userEmail || "student@edusphere.edu";

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setPaymentCompleted(false);
      setPaymentReceipt(null);
      setErrorMsg("");
      setIsProcessing(false);
      setProcessingStep("");
      // Reset card inputs to clean state
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardName("");
      setUpiIdInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    let formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleCardExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Format CVV (3 or 4 digits)
  const handleCardCvvChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvv(raw);
  };

  // Auto-fill Test Card Details
  const handleAutoFillTestCard = () => {
    setCardNumber("4111 1111 1111 1111");
    setCardExpiry("12/28");
    setCardCvv("123");
    setCardName("Test Student");
    setErrorMsg("");
  };

  // Detect Card Brand Logo based on prefix
  const getCardBrand = () => {
    const cleanNum = cardNumber.replace(/\s/g, "");
    if (cleanNum.startsWith("4")) return { name: "VISA", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
    if (/^(5[1-5]|2[2-7])/.test(cleanNum)) return { name: "Mastercard", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    if (/^6/.test(cleanNum)) return { name: "RuPay", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (/^3[47]/.test(cleanNum)) return { name: "AMEX", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" };
    return { name: "Card", color: "text-slate-400 bg-slate-800 border-slate-700" };
  };

  // Copy UPI ID to Clipboard
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Execute Razorpay Payment Transaction
  const handleExecutePayment = async () => {
    setErrorMsg("");

    // Validate inputs depending on payment method
    if (paymentMethod === "card") {
      const cleanNum = cardNumber.replace(/\s/g, "");
      if (cleanNum.length < 15) {
        setErrorMsg("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setErrorMsg("Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setErrorMsg("Please enter a valid 3 or 4-digit CVV.");
        return;
      }
    } else if (paymentMethod === "upi" && upiIdInput.trim()) {
      if (!upiIdInput.includes("@")) {
        setErrorMsg("Please enter a valid UPI ID (e.g. user@upi).");
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStep("Creating Razorpay Payment Order...");

    try {
      const identifier = userEmail || applicationId;

      // Step 1: Create Razorpay Order
      const orderRes = await api.post("/payment/razorpay/create-order", {
        identifier,
        email: userEmail,
        applicationId,
        amount,
      });

      const { orderId } = orderRes.data;

      setProcessingStep(
        paymentMethod === "card"
          ? "Authorizing Card Details with Gateway..."
          : paymentMethod === "upi"
            ? "Verifying UPI QR Payment Signal..."
            : `Connecting to ${selectedBank} NetBanking...`
      );

      // Brief delay for user visual feedback
      await new Promise((res) => setTimeout(res, 900));

      setProcessingStep("Verifying Transaction Signature with Backend...");

      // Generate Test Payment Signature & ID
      const mockPaymentId = `pay_rzp_${Math.random().toString(36).substring(2, 10)}`;
      const mockSignature = `sig_rzp_${Math.random().toString(36).substring(2, 14)}`;

      // Step 2: Verify Razorpay Payment Signature
      const verifyRes = await api.post("/payment/razorpay/verify-payment", {
        razorpayOrderId: orderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature,
        identifier,
        email: userEmail,
        applicationId,
        amount,
        paymentMethod,
      });

      if (verifyRes.data.success) {
        const receiptData = {
          paymentId: mockPaymentId,
          orderId: orderId,
          amount: amount,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          method:
            paymentMethod === "card"
              ? `${getCardBrand().name} ending in ${cardNumber.slice(-4) || "1111"}`
              : paymentMethod === "upi"
                ? `UPI QR (${upiIdInput.trim() || merchantUpiId})`
                : `NetBanking (${selectedBank} Bank)`,
        };

        setPaymentCompleted(true);
        setPaymentReceipt(receiptData);

        // Notify parent callback
        if (onSuccess) {
          onSuccess(receiptData, verifyRes.data);
        }
      } else {
        setErrorMsg(verifyRes.data.message || "Payment verification failed.");
      }
    } catch (err) {
      console.error("Razorpay Modal Payment Error:", err);
      setErrorMsg(
        err.response?.data?.message || "Razorpay Payment transaction failed. Please check details and try again."
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // Generate UPI QR Code URL
  const upiPayload = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=EduSphere%20ERP&am=${amount}&cu=INR`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    upiPayload
  )}`;

  const cardBrand = getCardBrand();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-[480px] bg-[#0C1017] text-white border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl font-sans overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center tracking-tighter shadow-md shadow-blue-600/30">
              RZP
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                Razorpay <span className="text-blue-400 text-xs font-normal">Checkout</span>
              </h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encrypted Payment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full">
              TEST GATEWAY
            </span>
            {onClose && !paymentCompleted && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!paymentCompleted ? (
          <>
            {/* Order Summary Header Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2 relative z-10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Merchant Name:</span>
                <span className="font-bold text-white">EduSphere ERP Systems</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Payer / Applicant:</span>
                <span className="font-mono text-purple-300 font-semibold text-[11px] truncate max-w-[210px]">
                  {displayEmail}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-sm">
                <span className="font-bold text-slate-300">Total Registration Fee:</span>
                <span className="font-extrabold text-emerald-400 text-lg">₹ {amount}.00</span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="mb-5 relative z-10">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Select Razorpay Payment Method:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("card");
                    setErrorMsg("");
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${paymentMethod === "card"
                      ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                >
                  <CreditCard className={`w-4 h-4 ${paymentMethod === "card" ? "text-blue-400" : "text-slate-400"}`} />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("upi");
                    setErrorMsg("");
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${paymentMethod === "upi"
                      ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                >
                  <QrCode className={`w-4 h-4 ${paymentMethod === "upi" ? "text-purple-400" : "text-slate-400"}`} />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("netbanking");
                    setErrorMsg("");
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${paymentMethod === "netbanking"
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                >
                  <Building2
                    className={`w-4 h-4 ${paymentMethod === "netbanking" ? "text-emerald-400" : "text-slate-400"}`}
                  />
                  <span>NetBanking</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: CREDIT / DEBIT CARD */}
            {paymentMethod === "card" && (
              <div className="space-y-4 mb-5 animate-fadeIn">
                {/* Visual Card Widget */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-4 text-white shadow-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Test Card Preview</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cardBrand.color}`}>
                      {cardBrand.name}
                    </span>
                  </div>
                  <div className="font-mono text-base tracking-widest text-white font-bold my-2">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-300 font-mono mt-3">
                    <div>
                      <span className="text-[9px] block text-slate-400 uppercase">Cardholder</span>
                      <span>{cardName || "EDUSPHERE STUDENT"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] block text-slate-400 uppercase">Expires</span>
                      <span>{cardExpiry || "MM/YY"}</span>
                    </div>
                  </div>
                </div>

                {/* Auto-fill test helper button */}
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Card Payment Details:</span>
                  <button
                    type="button"
                    onClick={handleAutoFillTestCard}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    ⚡ Auto-fill Test Card
                  </button>
                </div>

                {/* Card Number Input */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4111 1111 1111 1111"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Expiry & CVV Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={handleCardExpiryChange}
                      placeholder="MM/YY"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">CVV / CVC</label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={handleCardCvvChange}
                        placeholder="123"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-center tracking-widest"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Cardholder Name Input */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Full Name on Card"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: UPI / QR CODE */}
            {paymentMethod === "upi" && (
              <div className="space-y-4 mb-5 text-center animate-fadeIn">
                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                  <p className="text-xs text-slate-300 font-semibold flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-purple-400" />
                    Scan QR Code using any UPI App
                  </p>

                  {/* Generated Dynamic Payment QR Box */}
                  <div className="relative w-48 h-48 mx-auto p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-purple-500/30 group">
                    <img
                      src={qrApiUrl}
                      alt="Razorpay Payment UPI QR Code"
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        // Fallback SVG QR pattern if image service unavailable
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                    {/* Center Brand Badge */}
                    <div className="absolute inset-0 m-auto w-10 h-10 bg-slate-950 text-purple-400 border border-purple-500/50 rounded-xl flex items-center justify-center font-black text-[10px] shadow-lg pointer-events-none">
                      RZP
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-300 font-medium">
                    Accepted Apps: <strong className="text-white">Google Pay &bull; PhonePe &bull; Paytm &bull; BHIM</strong>
                  </p>

                  {/* Merchant UPI ID Copy Row */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-left font-mono">
                      <span className="text-[10px] text-slate-400 block">Merchant UPI VPA ID:</span>
                      <strong className="text-purple-300 text-xs">{merchantUpiId}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-purple-400" /> Copy VPA
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional Manual UPI ID Input */}
                <div className="text-left">
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                    Or Enter Your Personal UPI ID (VPA):
                  </label>
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="e.g. yourname@okicici / mobile@paytm"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: NETBANKING */}
            {paymentMethod === "netbanking" && (
              <div className="space-y-4 mb-5 animate-fadeIn">
                <label className="block text-[11px] text-slate-400 font-semibold">Select Popular Bank:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "HDFC", name: "HDFC Bank", color: "border-blue-500/40 text-blue-300" },
                    { id: "SBI", name: "State Bank of India", color: "border-cyan-500/40 text-cyan-300" },
                    { id: "ICICI", name: "ICICI Bank", color: "border-amber-500/40 text-amber-300" },
                    { id: "AXIS", name: "Axis Bank", color: "border-rose-500/40 text-rose-300" },
                    { id: "KOTAK", name: "Kotak Mahindra", color: "border-red-500/40 text-red-300" },
                    { id: "PNB", name: "Punjab National", color: "border-emerald-500/40 text-emerald-300" },
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition ${selectedBank === bank.id
                          ? `bg-slate-800 border-emerald-500 text-white shadow-md`
                          : `bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200`
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{bank.name}</span>
                      </div>
                      {selectedBank === bank.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Feedback Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Execute Payment Main Action Button */}
            <button
              type="button"
              onClick={handleExecutePayment}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
                  <span className="text-xs">{processingStep || "Processing Razorpay Payment..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    Pay ₹{amount}.00 via{" "}
                    {paymentMethod === "card"
                      ? "Card Gateway"
                      : paymentMethod === "upi"
                        ? "UPI QR Code"
                        : `${selectedBank} NetBanking`}
                  </span>
                </>
              )}
            </button>
          </>
        ) : (
          /* SUCCESSFUL PAYMENT RECEIPT DISPLAY */
          <div className="text-center py-4 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">Razorpay Payment Verified!</h3>
              <p className="text-xs text-emerald-300 mt-1">₹{paymentReceipt?.amount}.00 Fee Successfully Paid & Verified</p>
            </div>

            {/* Digital Receipt Card */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-left text-xs font-mono space-y-2 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment ID:</span>
                <strong className="text-blue-400 text-xs">{paymentReceipt?.paymentId}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Order Ref:</span>
                <strong className="text-slate-300 text-xs">{paymentReceipt?.orderId}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Paid Via:</span>
                <span className="text-purple-300 font-semibold">{paymentReceipt?.method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Date & Time:</span>
                <span className="text-slate-300">{paymentReceipt?.date} {paymentReceipt?.time}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px]">
                  SUCCESS (Captured)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Continue to ERP Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
