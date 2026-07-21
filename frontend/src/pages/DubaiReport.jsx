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

// ── Registration / Download form ───────────────────────────────────────────────
function RegistrationForm({ reportData, user, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "" });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await axios.post(`${API_URL}/dubai-report/register`, form);
      onSuccess();
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };


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
          <input
            id="dr-phone"
            name="phone"
            type="tel"
            placeholder="+971 50 000 0000"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <div className="dr-reg-field">
          <label htmlFor="dr-country">
            <MapPin size={13} className="inline mr-1" />
            Country
          </label>
          <input
            id="dr-country"
            name="country"
            type="text"
            placeholder="United Arab Emirates"
            value={form.country}
            onChange={handleChange}
          />
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
    resolveMediaUrl(report?.hero_image_url) ||
    "https://images.unsplash.com/photo-1546412414-e1885e51cfa5?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85";

  const brochureImage =
    resolveMediaUrl(report?.brochure_image_url) ||
    "https://res.cloudinary.com/dhxttgpfj/image/upload/v1784023538063/dubai_report_brochure.png";

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
                <div className="dr-brochure-badge">
                  <Lock size={12} />
                  Full Report — Members Only
                </div>
              </div>
            </div>

            {/* Contents */}
            <div className="dr-preview-right">
              <div className="dr-section-label">What's Inside</div>
              <h2 className="dr-preview-title">
                100 Pages of{" "}
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
                  {report?.brochure_download_url && (
                    <a
                      href={resolveMediaUrl(report.brochure_download_url)}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="btn-gold"
                    >
                      <Download size={14} />
                      Download Brochure
                    </a>
                  )}
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
                        if (report?.brochure_download_url) {
                          const downloadUrl = resolveMediaUrl(report.brochure_download_url);
                          const link = document.createElement("a");
                          link.href = downloadUrl;
                          link.setAttribute("download", "");
                          link.setAttribute("target", "_blank");
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
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
