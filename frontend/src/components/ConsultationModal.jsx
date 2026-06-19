import { useState, useEffect } from "react";
import axios from "axios";
import { X, Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { API_URL as API } from "../config";
import { DIAL_CODES, validatePhone } from "../utils/phoneValidation";

// ─── Available time slots ──────────────────────────────────────────────────────
const TIME_SLOTS = [
  "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "1:00 PM",  "1:30 PM",
  "2:00 PM",  "2:30 PM",
  "3:00 PM",  "3:30 PM",
  "4:00 PM",  "4:30 PM",
  "5:00 PM",
];

// ─── Mini calendar helpers ─────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function startWeekday(y, m) { return new Date(y, m, 1).getDay(); }
function toIso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function parseIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}
function isWeekend(y, m, d) { const day = new Date(y, m, d).getDay(); return day === 0 || day === 6; }
function isBeforeToday(y, m, d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(y, m, d) < today;
}
function displayDate(iso) {
  if (!iso) return "";
  const { y, m, d } = parseIso(iso);
  return `${MONTHS[m]} ${d}, ${y}`;
}

// ─── Mini calendar component ───────────────────────────────────────────────────
function MiniCalendar({ selected, onChange }) {
  const today = new Date();
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());

  const total = daysInMonth(viewY, viewM);
  const start = startWeekday(viewY, viewM);
  const cells = Array.from({ length: start + total }, (_, i) => (i < start ? null : i - start + 1));

  const prev = () => { if (viewM === 0) { setViewM(11); setViewY(y => y - 1); } else setViewM(m => m - 1); };
  const next = () => { if (viewM === 11) { setViewM(0); setViewY(y => y + 1); } else setViewM(m => m + 1); };

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prev} className="p-1.5 rounded hover:bg-[var(--bg-alt)] transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="font-display text-sm font-semibold">{MONTHS[viewM]} {viewY}</span>
        <button type="button" onClick={next} className="p-1.5 rounded hover:bg-[var(--bg-alt)] transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-[var(--muted)] uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} />;
          const iso = toIso(viewY, viewM, d);
          const past    = isBeforeToday(viewY, viewM, d);
          const weekend = isWeekend(viewY, viewM, d);
          const isSel   = selected === iso;
          const disabled = past || weekend;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(iso)}
              className={`text-xs py-2 rounded transition-colors ${
                isSel
                  ? "bg-[var(--gold)] text-[var(--ink)] font-semibold"
                  : disabled
                    ? "text-[var(--muted)]/40 cursor-not-allowed"
                    : "hover:bg-[var(--gold)]/15 text-[var(--ink)] cursor-pointer"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-[var(--muted)] mt-2 text-center">Weekdays only · UAE Business Hours</p>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function ConsultationModal({ open, onClose }) {
  const [step, setStep] = useState(1); // 1=date+time, 2=details, 3=success
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(DIAL_CODES[0]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [phoneError, setPhoneError] = useState("");
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedDate("");
      setSelectedTime("");
      setForm({ name: "", email: "", phone: "", notes: "" });
      setPhoneError("");
      setErrors({});
      setStatus("idle");
    }
  }, [open]);

  if (!open) return null;

  const canProceed = selectedDate && selectedTime;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = "Valid email required.";
    if (form.phone) {
      const pe = validatePhone(form.phone, selectedCountry.dial, false);
      if (pe) e.phone = pe;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      await axios.post(`${API}/consultations`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone ? `${selectedCountry.dial}${form.phone.replace(/[\s\-()]/g, "")}` : "",
        date: selectedDate,
        time_slot: selectedTime,
        notes: form.notes.trim(),
      });
      setStep(3);
    } catch {
      setStatus("error");
    }
    setStatus("idle");
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl relative overflow-hidden shadow-2xl animate-[fadeSlideIn_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--ink)] text-white px-8 py-6 flex items-start justify-between">
          <div>
            <div className="overline text-[var(--gold)] mb-1">Triad Realty</div>
            <h2 className="font-display text-2xl md:text-3xl">Book a Consultation</h2>
            <p className="text-white/60 text-sm mt-1">One-on-one with a senior investment consultant</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors mt-1">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex border-b border-[var(--line)]">
            {["Date & Time", "Your Details"].map((label, i) => (
              <div
                key={label}
                className={`flex-1 text-center text-[11px] uppercase tracking-widest py-3 font-medium transition-colors ${
                  step === i + 1 ? "text-[var(--gold-deep)] border-b-2 border-[var(--gold)]" : "text-[var(--muted)]"
                }`}
              >
                {i + 1}. {label}
              </div>
            ))}
          </div>
        )}

        <div className="p-8">

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="font-display text-3xl mt-5">Booking Confirmed!</h3>
              <p className="text-[var(--muted)] mt-3 text-sm max-w-sm mx-auto">
                Your consultation is scheduled for <strong>{displayDate(selectedDate)}</strong> at <strong>{selectedTime}</strong>.
                A consultant will confirm your appointment shortly.
              </p>
              <div className="mt-6 p-4 bg-[var(--bg-alt)] text-sm text-left space-y-1 max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <Calendar size={14} className="text-[var(--gold-deep)]" />
                  {displayDate(selectedDate)}
                </div>
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <Clock size={14} className="text-[var(--gold-deep)]" />
                  {selectedTime} (UAE Time)
                </div>
              </div>
              <button onClick={onClose} className="btn-gold mt-8">Close</button>
            </div>
          )}

          {/* ── Step 1: Date & Time picker ── */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-[var(--gold-deep)]" />
                  <span className="overline text-[var(--muted)]">Select Date</span>
                </div>
                <MiniCalendar selected={selectedDate} onChange={setSelectedDate} />
                {selectedDate && (
                  <div className="mt-3 text-xs font-medium text-[var(--gold-deep)] flex items-center gap-1">
                    <CheckCircle2 size={12} /> {displayDate(selectedDate)}
                  </div>
                )}
              </div>

              {/* Time slots */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-[var(--gold-deep)]" />
                  <span className="overline text-[var(--muted)]">Select Time (GST +4)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`text-xs py-2.5 px-3 border transition-all duration-150 text-center ${
                        selectedTime === slot
                          ? "bg-[var(--gold)] border-[var(--gold)] text-[var(--ink)] font-semibold"
                          : "border-[var(--line)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={!canProceed}
              onClick={() => setStep(2)}
              className="btn-gold w-full justify-center mt-8 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          )}

          {/* ── Step 2: Contact details ── */}
          {step === 2 && (
            <form onSubmit={submit} className="space-y-5" noValidate>
              {/* Summary of selected slot */}
              <div className="bg-[var(--bg-alt)] p-4 flex gap-6 text-sm">
                <div className="flex items-center gap-2 text-[var(--ink)]">
                  <Calendar size={14} className="text-[var(--gold-deep)]" />
                  {displayDate(selectedDate)}
                </div>
                <div className="flex items-center gap-2 text-[var(--ink)]">
                  <Clock size={14} className="text-[var(--gold-deep)]" />
                  {selectedTime}
                </div>
                <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-[var(--muted)] underline">
                  Change
                </button>
              </div>

              {/* Name */}
              <div>
                <input
                  required
                  placeholder="Full Name *"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={`input-line w-full ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  required
                  type="email"
                  placeholder="Email Address *"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={`input-line w-full ${errors.email ? "border-red-400" : ""}`}
                />
                {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
              </div>

              {/* Phone with dial code */}
              <div>
                <div className={`flex border-b ${errors.phone ? "border-red-400" : "border-[var(--line)]"} focus-within:border-[var(--ink)]`}>
                  <select
                    value={selectedCountry.code}
                    onChange={e => {
                      const c = DIAL_CODES.find(x => x.code === e.target.value);
                      if (c) setSelectedCountry(c);
                    }}
                    className="bg-transparent text-sm py-2 pr-2 focus:outline-none cursor-pointer max-w-[150px] text-[var(--ink)]"
                  >
                    {DIAL_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.name} ({c.dial})</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={e => {
                      const v = e.target.value.replace(/[^\d\s\-()]/g, "");
                      setForm({ ...form, phone: v });
                    }}
                    className="flex-1 bg-transparent text-sm py-2 focus:outline-none text-[var(--ink)] placeholder:text-[var(--muted)]"
                    inputMode="tel"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>}
              </div>

              {/* Notes */}
              <textarea
                rows={3}
                placeholder="Any specific topics or questions? (optional)"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-[var(--line)] p-3 text-sm focus:outline-none focus:border-[var(--ink)] resize-none"
              />

              {status === "error" && (
                <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
              )}

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="btn-gold flex-1 justify-center"
                >
                  {status === "submitting" ? "Booking…" : "Book Now"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
