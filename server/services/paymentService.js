/**
 * Mock Payment Service Abstraction
 * Simulates registration fee payment processing.
 */
const processMockPayment = async ({ applicationId, amount = 500 }) => {
  // Simulate payment gateway response delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  const paymentId = `PAY_${randomString}`;
  const transactionId = `TXN_${Date.now()}`;

  return {
    success: true,
    paymentId,
    transactionId,
    paymentAmount: Number(amount),
    paymentDate: new Date(),
    paymentStatus: "SUCCESS",
    message: "Registration fee payment processed successfully.",
  };
};

module.exports = {
  processMockPayment,
};
