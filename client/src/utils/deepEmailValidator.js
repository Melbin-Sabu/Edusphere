// Deep Email Validator Utility
// Performs syntax structure validation, TLD check, disposable email blocking, and domain typo detection.

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "fakeinbox.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "sharklasers.com",
  "mytemp.email",
  "tempmail.net",
  "emailondeck.com",
  "crazymailing.com",
  "mohmal.com",
  "generator.email",
  "inboxalias.com",
]);

const DOMAIN_TYPOS = {
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.co": "gmail.com",
  "gmal.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yaho.in": "yahoo.co.in",
  "outlok.com": "outlook.com",
  "outook.com": "outlook.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "icloud.co": "icloud.com",
};

/**
 * Validates an email address deeply.
 * @param {string} email 
 * @returns {{ isValid: boolean, error?: string, suggestion?: string }}
 */
export function validateDeepEmail(email) {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email address is required" };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic length limits
  if (trimmed.length < 5 || trimmed.length > 254) {
    return { isValid: false, error: "Email length must be between 5 and 254 characters" };
  }

  // Check single '@' symbol
  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Email must contain exactly one '@' symbol" };
  }

  const [localPart, domainPart] = parts;

  // Local part validation
  if (!localPart || localPart.length > 64) {
    return { isValid: false, error: "Invalid username portion before '@'" };
  }

  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return { isValid: false, error: "Username cannot start or end with a dot" };
  }

  if (localPart.includes("..")) {
    return { isValid: false, error: "Username cannot contain consecutive dots" };
  }

  // Local part character regex
  const localPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!localPartRegex.test(localPart)) {
    return { isValid: false, error: "Username contains invalid characters" };
  }

  // Domain part validation
  if (!domainPart || domainPart.length > 253) {
    return { isValid: false, error: "Invalid domain portion after '@'" };
  }

  if (domainPart.startsWith("-") || domainPart.endsWith("-") || domainPart.startsWith(".")) {
    return { isValid: false, error: "Domain cannot start or end with a hyphen or dot" };
  }

  const domainParts = domainPart.split(".");
  if (domainParts.length < 2) {
    return { isValid: false, error: "Email domain must include a top-level extension (e.g., .com, .edu, .in)" };
  }

  const tld = domainParts[domainParts.length - 1].toLowerCase();
  if (tld.length < 2) {
    return { isValid: false, error: "Invalid domain extension" };
  }

  // Check Disposable Domain Blacklist
  if (DISPOSABLE_DOMAINS.has(domainPart)) {
    return { 
      isValid: false, 
      error: "Disposable / temporary throwaway email addresses are not allowed. Please use your genuine email." 
    };
  }

  // Check Domain Typo Suggestion
  if (DOMAIN_TYPOS[domainPart]) {
    const suggested = `${localPart}@${DOMAIN_TYPOS[domainPart]}`;
    return {
      isValid: false,
      error: `Did you mean ${suggested}? Please verify your email domain.`,
      suggestion: suggested,
    };
  }

  // Strict Email Regex Verification
  const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!strictEmailRegex.test(trimmed)) {
    return { isValid: false, error: "Invalid email syntax format" };
  }

  return { isValid: true };
}
