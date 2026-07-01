import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, Phone, MapPin, MessageCircle, ArrowUpRight } from "lucide-react";
import { COMPANY, NAV } from "../data";
import axios from "axios";
import { API_URL as API } from "../config";

const SERVICES = [
  "Off-Plan Investment",
  "Resale Advisory",
  "Portfolio Management",
  "Market Research",
  "International Buyers",
  "Family Residences",
];

export default function Footer() {
  const [contact, setContact] = useState({
    address: COMPANY.address,
    phone: COMPANY.phone,
    email: COMPANY.email,
    whatsapp: COMPANY.whatsapp,
    instagram: COMPANY.instagram,
    linkedin: COMPANY.linkedin,
  });

  useEffect(() => {
    axios.get(`${API}/settings/homepage`)
      .then((res) => {
        if (res.data) {
          setContact({
            address: res.data.company_address || COMPANY.address,
            phone: res.data.company_phone || COMPANY.phone,
            email: res.data.company_email || COMPANY.email,
            whatsapp: res.data.company_whatsapp || COMPANY.whatsapp,
            instagram: res.data.company_instagram || COMPANY.instagram,
            linkedin: res.data.company_linkedin || COMPANY.linkedin,
          });
        }
      })
      .catch(() => {/* use defaults */});
  }, []);

  return (
    <footer data-testid="site-footer" className="bg-[var(--ink)] text-white relative overflow-hidden">
      {/* Gold accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: "var(--gold-gradient)" }}
      />

      {/* Subtle dot-grid watermark */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="container-x relative pt-20 pb-10 px-5 lg:px-12">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Col 1-2: Brand + contact */}
          <div className="lg:col-span-5">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/triad_logo.jpeg"
                alt="Triad Realty Logo"
                className="h-12 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div>
                <div className="font-display text-xl tracking-tight">TRIAD REALTY</div>
                <div className="overline text-[8px] opacity-50 mt-0.5">UAE · Investment Consultants</div>
              </div>
            </Link>

            <p className="font-display text-2xl md:text-3xl leading-snug mt-8 max-w-sm text-white/90">
              Property as a craft.<br />
              <span className="text-[var(--gold)]">Investment</span> as a relationship.
            </p>

            {/* Contact info */}
            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3 text-sm text-white/65">
                <MapPin size={14} className="mt-0.5 text-[var(--gold)] flex-shrink-0" />
                <span>{contact.address}</span>
              </div>
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 text-sm text-white/65 hover:text-[var(--gold)] transition-colors"
                data-testid="footer-phone"
              >
                <Phone size={14} className="text-[var(--gold)] flex-shrink-0" />
                {contact.phone}
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 text-sm text-white/65 hover:text-[var(--gold)] transition-colors"
                data-testid="footer-email"
              >
                <Mail size={14} className="text-[var(--gold)] flex-shrink-0" />
                {contact.email}
              </a>
            </div>

            {/* Social icons */}
            <div className="mt-8 flex gap-3">
              {contact.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:border-[var(--gold)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all duration-300"
                  data-testid="footer-instagram"
                  aria-label="Instagram"
                >
                  <Instagram size={15} />
                </a>
              )}
              {contact.linkedin && (
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:border-[var(--gold)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all duration-300"
                  data-testid="footer-linkedin"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={15} />
                </a>
              )}
              {contact.whatsapp && (
                <a
                  href={contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:border-[var(--gold)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all duration-300"
                  data-testid="footer-whatsapp"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={15} />
                </a>
              )}
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <span className="overline text-white/35">Navigation</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <ul className="space-y-2.5">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className="text-sm text-white/55 hover:text-[var(--gold)] transition-colors duration-200 flex items-center gap-1.5 group"
                    data-testid={`footer-link-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span className="w-0 h-px bg-[var(--gold)] group-hover:w-3 transition-all duration-300" />
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Services */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <span className="overline text-white/35">Services</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <ul className="space-y-2.5">
              {SERVICES.map((s) => (
                <li key={s}>
                  <Link
                    to="/contact"
                    className="text-sm text-white/55 hover:text-[var(--gold)] transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 h-px bg-[var(--gold)] group-hover:w-3 transition-all duration-300" />
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Get in Touch CTAs */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-5">
              <span className="overline text-white/35">Get in Touch</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="space-y-3">
              <a
                href={contact.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-3 border border-white/10 px-4 py-3.5 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all duration-300 rounded-sm"
                data-testid="footer-whatsapp-cta"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle size={16} className="text-[var(--gold)] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">WhatsApp Us</p>
                    <p className="text-xs text-white/40 mt-0.5">{contact.phone}</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-white/20 group-hover:text-[var(--gold)] transition-colors flex-shrink-0" />
              </a>

              <a
                href={`mailto:${contact.email}`}
                className="group flex items-center justify-between gap-3 border border-white/10 px-4 py-3.5 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all duration-300 rounded-sm"
                data-testid="footer-email-cta"
              >
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[var(--gold)] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Email Us</p>
                    <p className="text-xs text-white/40 mt-0.5">{contact.email}</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-white/20 group-hover:text-[var(--gold)] transition-colors flex-shrink-0" />
              </a>

              <Link
                to="/contact?type=consultation"
                className="group flex items-center justify-center gap-2 w-full py-3 mt-2 text-xs uppercase tracking-[0.2em] border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] hover:border-[var(--gold)] transition-all duration-300 rounded-sm font-medium"
              >
                Book a Consultation
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 mt-16 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {new Date().getFullYear()} Triad Realty LLC. All rights reserved.</span>
          <span className="tracking-[0.22em] uppercase">RERA Registered · Dubai Land Department</span>
        </div>
      </div>
    </footer>
  );
}
