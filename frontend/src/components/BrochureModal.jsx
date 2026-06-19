import { useEffect, useState } from "react";
import axios from "axios";
import { X, Download, Phone } from "lucide-react";
import { API_URL as API } from "../config";
import { DIAL_CODES, validatePhone } from "../utils/phoneValidation";

// ─── Field validators ─────────────────────────────────────────────────────────
const NAME_RE  = /^[A-Za-z\u00C0-\u024F\u0600-\u06FF\s'\-]{2,80}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateName(v)  { return NAME_RE.test(v.trim())  ? "" : "Enter a valid full name (letters only, 2–80 chars)."; }
function validateEmail(v) { return EMAIL_RE.test(v.trim()) ? "" : "Enter a valid email address."; }

// ─── Component ────────────────────────────────────────────────────────────────
export default function BrochureModal({ open, onClose, projectId, asset = "brochure", onSuccess, isGate }) {
  const [selectedCountry, setSelectedCountry] = useState(DIAL_CODES[0]); // UAE by default
  const [form, setForm]     = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({ name: "", email: "", phone: "" });
  const [touched, setTouched] = useState({ name: false, email: false, phone: false });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setForm({ name: "", email: "", phone: "" });
      setErrors({ name: "", email: "", phone: "" });
      setTouched({ name: false, email: false, phone: false });
      setStatus("idle");
    }
  }, [open]);

  // Re-validate phone when country code changes (if already touched)
  useEffect(() => {
    if (touched.phone) {
      setErrors((err) => ({
        ...err,
        phone: validatePhone(form.phone, selectedCountry.dial),
      }));
    }
  }, [selectedCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const validate = () => {
    const e = {
      name:  validateName(form.name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone, selectedCountry.dial),
    };
    setErrors(e);
    return !e.name && !e.email && !e.phone;
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true });
    if (!validate()) return;

    setStatus("submitting");
    try {
      await axios.post(`${API}/leads`, {
        name:        form.name.trim(),
        email:       form.email.trim().toLowerCase(),
        phone:       `${selectedCountry.dial}${form.phone.replace(/[\s\-()]/g, "")}`,
        project_id:  projectId || null,
        asset,
        source_page: typeof window !== "undefined" ? window.location.pathname : null,
      });
      // Gate modals: unlock & close immediately — no "You're in" screen so user
      // lands on the feature straight away. Regular modals show the success screen.
      if (isGate && onSuccess) {
        onSuccess();
        onClose();
      } else {
        setStatus("success");
        if (onSuccess) onSuccess();
      }
    } catch {
      setStatus("error");
    }
  };

  const isCallback = asset === "callback" || asset === "call back";

  // Get digit-length hint for the selected country
  const phoneHint = (() => {
    const country = selectedCountry.name;
    return `Enter your ${country} local number (no country code).`;
  })();

  return (
    <div
      data-testid="brochure-modal"
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-xl w-full p-8 md:p-12 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1"
          aria-label="close"
          data-testid="brochure-close"
        >
          <X size={20} />
        </button>

        {status === "success" ? (
          <div className="text-center py-6" data-testid="brochure-success">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--gold)]/15 flex items-center justify-center">
              <Download className="text-[var(--gold-deep)]" />
            </div>
            <h3 className="font-display text-3xl mt-6">You're in.</h3>
            <p className="text-sm text-[var(--muted)] mt-3 max-w-sm mx-auto">
              {isCallback
                ? "A consultant will reach out shortly to discuss your real estate goals."
                : `A consultant will reach out shortly. Your ${asset} is on its way to ${form.email}.`}
            </p>
            <button onClick={onClose} className="btn-ghost mt-8">Close</button>
          </div>
        ) : (
          <>
            <div className="overline text-[var(--gold-deep)]">
              {isCallback ? "Direct Consultation" : "Exclusive Access"}
            </div>
            <h3 className="font-display text-3xl md:text-4xl mt-3 leading-none">
              {isCallback ? "Request a Call Back" : `Download the ${asset}`}
            </h3>
            <p className="text-sm text-[var(--muted)] mt-3">
              {isCallback
                ? "Enter your contact details and our expert consultant will call you back shortly."
                : "Floor plans, payment plans, and unit pricing — sent to your inbox in minutes."}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>

              {/* Name */}
              <div>
                <input
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (touched.name) setErrors((err) => ({ ...err, name: validateName(e.target.value) }));
                  }}
                  onBlur={() => { touch("name"); setErrors((err) => ({ ...err, name: validateName(form.name) })); }}
                  className={`input-line ${touched.name && errors.name ? "border-red-400" : ""}`}
                  data-testid="brochure-name"
                  autoComplete="name"
                />
                {touched.name && errors.name && (
                  <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (touched.email) setErrors((err) => ({ ...err, email: validateEmail(e.target.value) }));
                  }}
                  onBlur={() => { touch("email"); setErrors((err) => ({ ...err, email: validateEmail(form.email) })); }}
                  className={`input-line ${touched.email && errors.email ? "border-red-400" : ""}`}
                  data-testid="brochure-email"
                  autoComplete="email"
                />
                {touched.email && errors.email && (
                  <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone with country code selector and per-country validation */}
              <div>
                <div
                  className={`flex border-b ${
                    touched.phone && errors.phone ? "border-red-400" : "border-[var(--line)]"
                  } focus-within:border-[var(--ink)]`}
                >
                  {/* Country dial-code picker */}
                  <div className="flex items-center gap-1 pr-3 shrink-0">
                    <Phone size={14} className="text-[var(--muted)]" />
                    <select
                      value={selectedCountry.code}
                      onChange={(e) => {
                        const country = DIAL_CODES.find((c) => c.code === e.target.value);
                        if (country) setSelectedCountry(country);
                      }}
                      className="bg-transparent text-sm text-[var(--ink)] focus:outline-none cursor-pointer py-2 pr-1 max-w-[160px]"
                      aria-label="Country dial code"
                      data-testid="brochure-dial-code"
                    >
                      {DIAL_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.dial})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Local number input */}
                  <input
                    required
                    type="tel"
                    placeholder="Local number"
                    value={form.phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d\s\-()]/g, "");
                      setForm({ ...form, phone: v });
                      if (touched.phone) {
                        setErrors((err) => ({
                          ...err,
                          phone: validatePhone(v, selectedCountry.dial),
                        }));
                      }
                    }}
                    onBlur={() => {
                      touch("phone");
                      setErrors((err) => ({
                        ...err,
                        phone: validatePhone(form.phone, selectedCountry.dial),
                      }));
                    }}
                    className="flex-1 bg-transparent text-sm py-2 focus:outline-none text-[var(--ink)] placeholder:text-[var(--muted)]"
                    data-testid="brochure-phone"
                    autoComplete="tel-national"
                    inputMode="tel"
                  />
                </div>

                {touched.phone && errors.phone ? (
                  <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>
                ) : (
                  <p className="text-[10px] text-[var(--muted)] mt-1">{phoneHint}</p>
                )}
              </div>

              {status === "error" && (
                <div className="text-sm text-red-600">Something went wrong. Please try again.</div>
              )}

              <button
                type="submit"
                className="btn-gold w-full justify-center"
                disabled={status === "submitting"}
                data-testid="brochure-submit"
              >
                {status === "submitting"
                  ? "Sending…"
                  : isCallback ? "Submit Request" : "Get the Brochure"}
              </button>

              <p className="text-[11px] text-[var(--muted)] text-center">
                By submitting, you agree to be contacted by a Triad consultant.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
