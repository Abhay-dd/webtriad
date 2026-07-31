import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { Helmet } from "react-helmet-async";
import axios from "axios";
import "./DubaiReport.css";

import {
  TrendingUp,
  BarChart2,
  Percent,
  Globe,
  Lock,
  Download,
  BookOpen,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Star,
  Shield,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";

// Preview page images extracted from the PDF
const PREVIEW_PAGES = Array.from({ length: 8 }, (_, i) => ({
  src: `/dubai_report_pages/page_${i + 1}.png`,
  alt: `Dubai Report page ${i + 1}`,
}));

const REPORT_PDF_URL = "/dubai_report.pdf";
import { useAuth } from "../context/AuthContext";
import { API_URL, SITE_URL, resolveMediaUrl } from "../config";
import Breadcrumbs from "../components/Breadcrumbs";

// ── Icon resolver ─────────────────────────────────────────────────────────────
const ICON_MAP = {
  "trending-up": TrendingUp,
  "bar-chart": BarChart2,
  percent: Percent,
  globe: Globe,
  "file-text": FileText,
  star: Star,
  shield: Shield,
  "check-circle": CheckCircle,
};

function HighlightIcon({ name, className }) {
  const Icon = ICON_MAP[name] || TrendingUp;
  return <Icon className={className} />;
}

// ── Animated counter reveal ────────────────────────────────────────────────────
function CounterValue({ value }) {
  const ref = useRef(null);
  const [displayed, setDisplayed] = useState("—");
  const observed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !observed.current) {
          observed.current = true;
          // Slight delay for stagger feel
          setTimeout(() => setDisplayed(value), 100);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={`dr-counter ${displayed !== "—" ? "dr-counter-visible" : ""}`}>
      {displayed}
    </span>
  );
}

// ── Country + dial code data ───────────────────────────────────────────────────
const COUNTRIES = [
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "Saudi Arabia", code: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "Qatar", code: "QA", dial: "+974", flag: "🇶🇦" },
  { name: "Kuwait", code: "KW", dial: "+965", flag: "🇰🇼" },
  { name: "Bahrain", code: "BH", dial: "+973", flag: "🇧🇭" },
  { name: "Oman", code: "OM", dial: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dial: "+92", flag: "🇵🇰" },
  { name: "Bangladesh", code: "BD", dial: "+880", flag: "🇧🇩" },
  { name: "Philippines", code: "PH", dial: "+63", flag: "🇵🇭" },
  { name: "Egypt", code: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "Jordan", code: "JO", dial: "+962", flag: "🇯🇴" },
  { name: "Lebanon", code: "LB", dial: "+961", flag: "🇱🇧" },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Netherlands", code: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "Switzerland", code: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Russia", code: "RU", dial: "+7", flag: "🇷🇺" },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Japan", code: "JP", dial: "+81", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", dial: "+82", flag: "🇰🇷" },
  { name: "Singapore", code: "SG", dial: "+65", flag: "🇸🇬" },
  { name: "Malaysia", code: "MY", dial: "+60", flag: "🇲🇾" },
  { name: "Indonesia", code: "ID", dial: "+62", flag: "🇮🇩" },
  { name: "Thailand", code: "TH", dial: "+66", flag: "🇹🇭" },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Brazil", code: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dial: "+52", flag: "🇲🇽" },
  { name: "Turkey", code: "TR", dial: "+90", flag: "🇹🇷" },
  { name: "Iran", code: "IR", dial: "+98", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", dial: "+964", flag: "🇮🇶" },
  { name: "New Zealand", code: "NZ", dial: "+64", flag: "🇳🇿" },
  { name: "Sri Lanka", code: "LK", dial: "+94", flag: "🇱🇰" },
  { name: "Nepal", code: "NP", dial: "+977", flag: "🇳🇵" },
  { name: "Sweden", code: "SE", dial: "+46", flag: "🇸🇪" },
  { name: "Norway", code: "NO", dial: "+47", flag: "🇳🇴" },
  { name: "Denmark", code: "DK", dial: "+45", flag: "🇩🇰" },
  { name: "Portugal", code: "PT", dial: "+351", flag: "🇵🇹" },
  { name: "Poland", code: "PL", dial: "+48", flag: "🇵🇱" },
  { name: "Belgium", code: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Austria", code: "AT", dial: "+43", flag: "🇦🇹" },
  { name: "Ireland", code: "IE", dial: "+353", flag: "🇮🇪" },
];

// ── Registration / Download form ───────────────────────────────────────────────
function RegistrationForm({ reportData, user, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "", dialCode: "+971" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.name || f.name,
        email: user.email || f.email,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  // When country dropdown changes, auto-set the dial code
  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const match = COUNTRIES.find((c) => c.name === selectedCountry);
    setForm((f) => ({
      ...f,
      country: selectedCountry,
      dialCode: match ? match.dial : f.dialCode,
    }));
    setError("");
  };

  // When dial code dropdown changes, auto-set the country
  const handleDialCodeChange = (e) => {
    const selectedDial = e.target.value;
    const match = COUNTRIES.find((c) => c.dial === selectedDial);
    setForm((f) => ({
      ...f,
      dialCode: selectedDial,
      country: match ? match.name : f.country,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Combine dial code + phone number for submission
      const fullPhone = form.phone ? `${form.dialCode} ${form.phone}` : "";
      await axios.post(`${API_URL}/dubai-report/register`, {
        name: form.name,
        email: form.email,
        phone: fullPhone,
        country: form.country,
      });
      onSuccess();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Deduplicated dial codes for the dropdown (some countries share codes like +1)
  const uniqueDialCodes = COUNTRIES.reduce((acc, c) => {
    if (!acc.find((x) => x.dial === c.dial)) acc.push(c);
    return acc;
  }, []);

  return (
    <form
      id="dubai-report-register-form"
      className="dr-reg-form"
      onSubmit={handleSubmit}
    >
      <div className="dr-reg-grid">
        <div className="dr-reg-field">
          <label htmlFor="dr-name">
            <User size={13} className="inline mr-1" />
            Full Name
          </label>
          <input
            id="dr-name"
            name="name"
            type="text"
            required
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange}
          />
        </div>
        <div className="dr-reg-field">
          <label htmlFor="dr-email">
            <Mail size={13} className="inline mr-1" />
            Email Address
          </label>
          <input
            id="dr-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="dr-reg-field">
          <label htmlFor="dr-phone">
            <Phone size={13} className="inline mr-1" />
            Phone Number
          </label>
          <div className="dr-phone-group">
            <select
              id="dr-dial-code"
              className="dr-dial-select"
              value={form.dialCode}
              onChange={handleDialCodeChange}
            >
              {uniqueDialCodes.map((c) => (
                <option key={c.code} value={c.dial}>
                  {c.flag} {c.dial}
                </option>
              ))}
            </select>
            <input
              id="dr-phone"
              name="phone"
              type="tel"
              placeholder="50 000 0000"
              value={form.phone}
              onChange={handleChange}
              className="dr-phone-input"
            />
          </div>
        </div>
        <div className="dr-reg-field">
          <label htmlFor="dr-country">
            <MapPin size={13} className="inline mr-1" />
            Country
          </label>
          <select
            id="dr-country"
            name="country"
            value={form.country}
            onChange={handleCountryChange}
            className="dr-country-select"
            required
          >
            <option value="" disabled>Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="dr-reg-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <button
        id="dubai-report-download-btn"
        type="submit"
        disabled={submitting}
        className="dr-download-btn"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Download size={16} />
            {reportData?.cta_button_label || "Download Full Report"}
          </>
        )}
      </button>
      <p className="dr-reg-note">
        <Shield size={12} className="inline mr-1" />
        Secure · Confidential · No spam.
      </p>
    </form>
  );
}

// ── Page Preview Carousel ──────────────────────────────────────────────────────
function PagePreviewCarousel() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  return (
    <section className="dr-page-preview" aria-label="Report page preview">
      <div className="dr-page-preview-inner">
        <div className="dr-page-preview-header">
          <div>
            <div className="dr-section-label">Report Preview</div>
            <h2 className="dr-page-preview-title">Browse the Report</h2>
          </div>
          <div className="dr-page-preview-nav">
            <button
              className="dr-carousel-btn"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous pages"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="dr-carousel-btn"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next pages"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="dr-page-carousel" ref={scrollRef}>
          {PREVIEW_PAGES.map((page, i) => (
            <div key={i} className="dr-page-slide">
              <img
                src={page.src}
                alt={page.alt}
                loading="lazy"
                className="dr-page-slide-img"
              />
              <div className="dr-page-slide-num">Page {i + 1}</div>
            </div>
          ))}
          {/* Fade-out card prompting download */}
          <div className="dr-page-slide dr-page-slide-cta">
            <div className="dr-page-cta-inner">
              <Lock size={28} className="text-[var(--gold)] mb-3" />
              <div className="dr-page-cta-text">Register to view all 45 pages</div>
              <a href="#dr-register" className="btn-gold !text-xs !py-2.5 !px-5 mt-4">
                <Download size={13} />
                Get Full Report
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DubaiReport() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const ctaRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/dubai-report`)
      .then((r) => setReport(r.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, []);

  const scrollToCTA = () => {
    ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (loading) {
    return (
      <div className="dr-loading">
        <Loader2 size={32} className="animate-spin text-[var(--gold)]" />
        <span>Loading Report…</span>
      </div>
    );
  }

  const heroImage =
    (report?.hero_image_url && resolveMediaUrl(report.hero_image_url)) ||
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=85";

  const brochureImage =
    (report?.brochure_image_url && resolveMediaUrl(report.brochure_image_url)) ||
    "/dubai_report_brochure.png";

  return (
    <>
      <Helmet>
        <title>Dubai Report 2003–2026 | Triad Realty</title>
        <meta
          name="description"
          content="Access The Dubai Market Report 2003–2026 — two decades of real estate data, price trend analysis, rental yield benchmarking, and expert forecasts by Triad Realty."
        />
        <meta property="og:title" content="The Dubai Market Report 2003–2026 | Triad Realty" />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`${SITE_URL}/dubai-report`} />
      </Helmet>

      <div className="dr-page">
        {/* Breadcrumbs */}
        <div className="dr-breadcrumbs-wrap">
          <Breadcrumbs
            crumbs={[
              { label: "Home", to: "/" },
              { label: "Dubai Report" },
            ]}
          />
        </div>

        {/* ══════════ HERO ══════════ */}
        <section
          className="dr-hero"
          style={{ "--hero-bg": `url("${heroImage}")` }}
          aria-label="Report hero"
        >
          <div className="dr-hero-overlay" />
          <div className="dr-hero-content">
            <div className="dr-hero-badge">
              <Star size={11} />
              {report?.edition || "2026 Edition"}
            </div>
            <h1 className="dr-hero-title">
              {report?.title || "The Dubai Market Report 2003–2026"}
            </h1>
            <p className="dr-hero-sub">
              {report?.subtitle ||
                "Two decades of real estate transformation — data-driven insights for the discerning investor."}
            </p>
            <div className="dr-hero-meta">
              <span>
                <BookOpen size={13} />
                100 Pages · Proprietary Research
              </span>
              <span className="dr-hero-meta-dot" aria-hidden="true">·</span>
              <span>
                <FileText size={13} />
                Published: {report?.published_date || "July 2026"}
              </span>
            </div>
            <div className="dr-hero-actions">
              <button
                id="dubai-report-hero-cta"
                className="btn-gold"
                onClick={scrollToCTA}
              >
                <Download size={14} />
                Download the Report
              </button>
              <a
                href="#dr-preview"
                className="dr-ghost-btn"
              >
                Preview Contents
                <ChevronRight size={14} />
              </a>
            </div>
          </div>
          <div className="dr-hero-scroll" aria-hidden="true">
            <div className="dr-hero-scroll-line" />
          </div>
        </section>

        {/* ══════════ KPI HIGHLIGHTS ══════════ */}
        <section className="dr-highlights" aria-label="Report highlights">
          <div className="dr-highlights-inner">
            {(report?.highlights || []).map((h, i) => (
              <div
                key={i}
                className="dr-highlight-card"
                id={`dr-highlight-${i}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="dr-highlight-icon">
                  <HighlightIcon name={h.icon} className="w-5 h-5" />
                </div>
                <div className="dr-highlight-value">
                  <CounterValue value={h.value} />
                </div>
                <div className="dr-highlight-label">{h.label}</div>
                <p className="dr-highlight-desc">{h.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ PREVIEW ══════════ */}
        <section id="dr-preview" className="dr-preview" aria-label="Report preview">
          <div className="dr-preview-inner">
            {/* Brochure image */}
            <div className="dr-preview-brochure">
              <div className="dr-brochure-wrap">
                <img
                  src={brochureImage}
                  alt="Dubai Market Report 2003–2026 brochure cover"
                  className="dr-brochure-img"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Contents */}
            <div className="dr-preview-right">
              <div className="dr-section-label">What's Inside</div>
              <h2 className="dr-preview-title">
                45 Pages of{" "}
                <span className="gold-text">Institutional-Grade</span> Research
              </h2>
              <p className="dr-preview-sub">
                From freehold inception to today's record transaction volumes — our analysts
                have mapped every significant market cycle, price correction, and growth
                catalyst across 23 years.
              </p>

              {(report?.key_insights || []).length > 0 && (
                <ul className="dr-insights-list">
                  {(report.key_insights || []).map((insight, i) => (
                    <li key={i} className="dr-insight-item">
                      <CheckCircle size={15} className="dr-insight-icon" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(report?.report_sections || []).length > 0 && (
                <div className="dr-sections-table">
                  <div className="dr-sections-header">Report Chapters</div>
                  {(report.report_sections || []).map((s, i) => (
                    <div key={i} className="dr-section-row" id={`dr-chapter-${i}`}>
                      <span className="dr-section-num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="dr-section-title">{s.title}</span>
                      <span className="dr-section-pages">{s.pages}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-gold mt-6"
                onClick={scrollToCTA}
                id="dubai-report-preview-cta"
              >
                Get Full Access
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ══════════ PAGE PREVIEW CAROUSEL ══════════ */}
        <PagePreviewCarousel />

        {/* ══════════ CTA / REGISTRATION ══════════ */}
        <section
          ref={ctaRef}
          className="dr-cta"
          id="dr-register"
          aria-label="Download registration"
        >
          <div className="dr-cta-bg" aria-hidden="true" />
          <div className="dr-cta-inner">
            {registered ? (
              <div className="dr-success">
                <div className="dr-success-icon">
                  <CheckCircle size={40} />
                </div>
                <h2 className="dr-success-title">Registration Successful</h2>
                <p className="dr-success-sub">
                  Thank you for registering. Your download should begin automatically.
                  If it didn't start, please click the button below to download the brochure.
                </p>
                <div className="dr-success-actions">
                  <a
                    href={report?.brochure_download_url ? resolveMediaUrl(report.brochure_download_url) : REPORT_PDF_URL}
                    download="Triad_Dubai_Market_Report_2003-2026.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-gold"
                  >
                    <Download size={14} />
                    Download Report
                  </a>
                  <Link to="/projects" className="dr-ghost-btn-dark">
                    Explore Our Projects
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="dr-cta-content">
                <div className="dr-cta-left">
                  <div className="dr-section-label dr-label-light">Exclusive Access</div>
                  <h2 className="dr-cta-title">
                    {report?.cta_heading || "Access the Full Report"}
                  </h2>
                  <p className="dr-cta-sub">
                    {report?.cta_subheading ||
                      "Register to download the complete 100-page report including proprietary market data, district maps, and analyst forecasts."}
                  </p>
                  <ul className="dr-cta-perks">
                    {[
                      "100-page PDF report — instant download",
                      "23 years of Dubai price data & charts",
                      "District-level rental yield analysis",
                      "2026–2028 market outlook by Triad analysts",
                    ].map((perk, i) => (
                      <li key={i}>
                        <CheckCircle size={14} className="text-[var(--gold)]" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="dr-cta-right">
                  <div className="dr-reg-card">
                    <div className="dr-reg-card-header">
                      <Download size={20} />
                      <span>Request Access</span>
                    </div>
                    <RegistrationForm
                      reportData={report}
                      user={user}
                      onSuccess={() => {
                        setRegistered(true);
                        const downloadUrl = report?.brochure_download_url
                          ? resolveMediaUrl(report.brochure_download_url)
                          : REPORT_PDF_URL;
                        const link = document.createElement("a");
                        link.href = downloadUrl;
                        link.setAttribute("download", "Triad_Dubai_Market_Report_2003-2026.pdf");
                        link.setAttribute("target", "_blank");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══════════ TRUST STRIP ══════════ */}
        <section className="dr-trust" aria-label="Trust indicators">
          <div className="dr-trust-inner">
            {[
              { Icon: Shield, label: "Secure & Confidential", desc: "Your data is never sold or shared." },
              { Icon: BarChart2, label: "Verified Research", desc: "All data sourced from DLD & REIDIN." },
              { Icon: Star, label: "Trusted by 80+ Investors", desc: "Triad Realty · Dubai, UAE" },
            ].map((t, i) => (
              <div key={i} className="dr-trust-item">
                <t.Icon size={22} className="text-[var(--gold)]" />
                <div>
                  <div className="dr-trust-label">{t.label}</div>
                  <div className="dr-trust-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
