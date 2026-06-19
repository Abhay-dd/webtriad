import { parsePhoneNumberFromString, AsYouType } from "libphonenumber-js";

/**
 * phoneValidation.js
 * Shared international phone number validation rules and helpers.
 * Integrated with libphonenumber-js.
 */

// ─── Country dial-code list ───────────────────────────────────────────────────
// Common GCC / high-traffic countries first, then alphabetical.
export const DIAL_CODES = [
  { code: "AE",  dial: "+971",  name: "UAE" },
  { code: "SA",  dial: "+966",  name: "Saudi Arabia" },
  { code: "QA",  dial: "+974",  name: "Qatar" },
  { code: "KW",  dial: "+965",  name: "Kuwait" },
  { code: "BH",  dial: "+973",  name: "Bahrain" },
  { code: "OM",  dial: "+968",  name: "Oman" },
  { code: "IN",  dial: "+91",   name: "India" },
  { code: "PK",  dial: "+92",   name: "Pakistan" },
  { code: "GB",  dial: "+44",   name: "United Kingdom" },
  { code: "US",  dial: "+1",    name: "United States" },
  { code: "CA",  dial: "+1",    name: "Canada" },
  { code: "AU",  dial: "+61",   name: "Australia" },
  { code: "DE",  dial: "+49",   name: "Germany" },
  { code: "FR",  dial: "+33",   name: "France" },
  { code: "RU",  dial: "+7",    name: "Russia" },
  { code: "CN",  dial: "+86",   name: "China" },
  { code: "JP",  dial: "+81",   name: "Japan" },
  { code: "SG",  dial: "+65",   name: "Singapore" },
  { code: "EG",  dial: "+20",   name: "Egypt" },
  { code: "NG",  dial: "+234",  name: "Nigeria" },
  { code: "ZA",  dial: "+27",   name: "South Africa" },
  { code: "BR",  dial: "+55",   name: "Brazil" },
  { code: "MX",  dial: "+52",   name: "Mexico" },
  { code: "TR",  dial: "+90",   name: "Turkey" },
  { code: "ID",  dial: "+62",   name: "Indonesia" },
  { code: "MY",  dial: "+60",   name: "Malaysia" },
  { code: "PH",  dial: "+63",   name: "Philippines" },
  { code: "BD",  dial: "+880",  name: "Bangladesh" },
  { code: "LK",  dial: "+94",   name: "Sri Lanka" },
  { code: "NP",  dial: "+977",  name: "Nepal" },
  { code: "GH",  dial: "+233",  name: "Ghana" },
  { code: "KE",  dial: "+254",  name: "Kenya" },
  { code: "JO",  dial: "+962",  name: "Jordan" },
  { code: "LB",  dial: "+961",  name: "Lebanon" },
  { code: "IQ",  dial: "+964",  name: "Iraq" },
  { code: "IR",  dial: "+98",   name: "Iran" },
  { code: "ET",  dial: "+251",  name: "Ethiopia" },
];

/**
 * Validate an international/national phone number based on its selected dial code.
 * Uses libphonenumber-js for parsing and validation.
 *
 * @param {string} rawValue - The number typed by the user (may contain spaces/dashes)
 * @param {string} dialCode - The selected dial code string (e.g. "+971")
 * @param {boolean} required - Whether an empty value is an error (default: true)
 * @returns {string} Empty string if valid, or a human-readable error message.
 */
export function validatePhone(rawValue, dialCode, required = true) {
  const cleaned = rawValue.trim();

  if (!cleaned) {
    return required ? "Phone number is required." : "";
  }

  // Find ISO country code corresponding to selected dial code
  const countryObj = DIAL_CODES.find((c) => c.dial === dialCode);
  const countryCode = countryObj ? countryObj.code : undefined;

  try {
    const phoneNumber = parsePhoneNumberFromString(cleaned, countryCode);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return "Invalid phone number for selected country.";
    }
  } catch (error) {
    return "Invalid phone number formatting.";
  }

  return "";
}

/**
 * Formats a phone number input string as the user types, tailored to the country code.
 *
 * @param {string} rawValue - User input value
 * @param {string} countryCode - ISO country code (e.g., "AE", "US")
 * @returns {string} Formatted number
 */
export function formatPhoneAsYouType(rawValue, countryCode) {
  if (!rawValue) return "";
  return new AsYouType(countryCode).input(rawValue);
}

/** Strip formatting characters from a phone string, keeping only digits. */
export function stripPhoneFormatting(v) {
  return v.replace(/[^\d]/g, "");
}
