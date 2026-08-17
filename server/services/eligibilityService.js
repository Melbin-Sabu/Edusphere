const AdmissionCriteria = require("../models/AdmissionCriteria");

/**
 * Evaluate admission eligibility dynamically based on database criteria.
 * @param {Object} applicationData - The application object containing student details.
 * @returns {Promise<Object>} { status: "ELIGIBLE" | "NOT_ELIGIBLE" | "NEEDS_REVIEW", reasons: Array<String>, failedCriteria: Array<String> }
 */
const evaluateEligibility = async (applicationData) => {
  const {
    courseId,
    tenthPercentage,
    twelfthPercentage,
    tenthCertificate,
    twelfthCertificate,
    dateOfBirth,
  } = applicationData;

  const reasons = [];
  const failedCriteria = [];

  // Fetch admission criteria for the requested course
  let criteria = null;
  if (courseId) {
    criteria = await AdmissionCriteria.findOne({ courseId, isActive: true });
  }

  // Fallback to default baseline criteria if course criteria not explicitly configured yet
  const minTenth = criteria?.minimumTenthPercentage ?? 50;
  const minTwelfth = criteria?.minimumTwelfthPercentage ?? 50;
  const minAge = criteria?.minimumAge ?? 15;
  const maxAge = criteria?.maximumAge ?? 35;

  // 1. Check 10th percentage requirement
  if (tenthPercentage === undefined || tenthPercentage === null || tenthPercentage < minTenth) {
    reasons.push(`10th percentage (${tenthPercentage}%) is below minimum required (${minTenth}%).`);
    failedCriteria.push("minimumTenthPercentage");
  }

  // 2. Check 12th percentage requirement
  if (twelfthPercentage === undefined || twelfthPercentage === null || twelfthPercentage < minTwelfth) {
    reasons.push(`12th percentage (${twelfthPercentage}%) is below minimum required (${minTwelfth}%).`);
    failedCriteria.push("minimumTwelfthPercentage");
  }

  // 3. Check document uploads
  if (!tenthCertificate) {
    reasons.push("10th mark list/certificate is missing.");
    failedCriteria.push("tenthCertificate");
  }
  if (!twelfthCertificate) {
    reasons.push("12th mark list/certificate is missing.");
    failedCriteria.push("twelfthCertificate");
  }

  // 4. Check age requirement if DOB provided
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age < minAge || age > maxAge) {
      reasons.push(`Applicant age (${age} years) is outside allowed range (${minAge}-${maxAge} years).`);
      failedCriteria.push("ageRequirement");
    }
  }

  // Determine overall status
  if (failedCriteria.includes("minimumTenthPercentage") || failedCriteria.includes("minimumTwelfthPercentage")) {
    return {
      status: "NOT_ELIGIBLE",
      reasons,
      failedCriteria,
    };
  }

  if (failedCriteria.includes("tenthCertificate") || failedCriteria.includes("twelfthCertificate")) {
    return {
      status: "NEEDS_REVIEW",
      reasons,
      failedCriteria,
    };
  }

  if (reasons.length > 0) {
    return {
      status: "NEEDS_REVIEW",
      reasons,
      failedCriteria,
    };
  }

  return {
    status: "ELIGIBLE",
    reasons: ["Meets all basic eligibility requirements."],
    failedCriteria: [],
  };
};

module.exports = {
  evaluateEligibility,
};
