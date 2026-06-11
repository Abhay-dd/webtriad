import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { COMPANY, NAV } from "../data";
import axios from "axios";
import { API_URL as API } from "../config";

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
      <div className="grain absolute inset-0" />
      <div className="container-x relative section-pad pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <img
                src="/triad_logo.jpeg"
                alt="Triad Realty Logo"
                className="h-14 w-auto object-contain"
              />
              <div>
                <div className="font-display text-2xl">TRIAD REALTY</div>
                <div className="overline opacity-60">UAE · Investment Consultants</div>
              </div>
            </div>
            <p className="font-display text-3xl md:text-4xl leading-tight mt-10 max-w-md">
              Property as a craft. Investment as a relationship.
            </p>
            <div className="mt-10 space-y-3 text-sm opacity-80">
              <div className="flex items-start gap-3"><MapPin size={16} className="mt-1 text-[var(--gold)] flex-shrink-0" /><span>{contact.address}</span></div>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 link-gold text-white" data-testid="footer-phone"><Phone size={16} className="text-[var(--gold)]" />{contact.phone}</a>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 link-gold text-white" data-testid="footer-email"><Mail size={16} className="text-[var(--gold)]" />{contact.email}</a>
            </div>
            <div className="mt-8 flex gap-4">
              {contact.instagram && (
                <a href={contact.instagram} target="_blank" rel="noreferrer" className="w-11 h-11 border border-white/30 flex items-center justify-center hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all" data-testid="footer-instagram"><Instagram size={16} /></a>
              )}
              {contact.linkedin && (
                <a href={contact.linkedin} target="_blank" rel="noreferrer" className="w-11 h-11 border border-white/30 flex items-center justify-center hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all" data-testid="footer-linkedin"><Linkedin size={16} /></a>
              )}
              {contact.whatsapp && (
                <a href={contact.whatsapp} target="_blank" rel="noreferrer" className="w-11 h-11 border border-white/30 flex items-center justify-center hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all" data-testid="footer-whatsapp"><MessageCircle size={16} /></a>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="overline opacity-50 mb-5">Quick Links</div>
            <ul className="space-y-3">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-sm opacity-85 hover:text-[var(--gold)] transition-colors" data-testid={`footer-link-${n.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="overline opacity-50 mb-5">Get In Touch</div>
            <div className="space-y-4">
              <a
                href={contact.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 border border-white/20 rounded px-4 py-3 hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all"
                data-testid="footer-whatsapp-cta"
              >
                <MessageCircle size={18} className="text-[var(--gold)] group-hover:text-[var(--ink)] transition-colors flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">WhatsApp Us</p>
                  <p className="text-xs opacity-60 group-hover:opacity-80 mt-0.5">{contact.phone}</p>
                </div>
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="group flex items-center gap-3 border border-white/20 rounded px-4 py-3 hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all"
                data-testid="footer-email-cta"
              >
                <Mail size={18} className="text-[var(--gold)] group-hover:text-[var(--ink)] transition-colors flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Email Us</p>
                  <p className="text-xs opacity-60 group-hover:opacity-80 mt-0.5">{contact.email}</p>
                </div>
              </a>
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 border border-white/20 rounded px-4 py-3 hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)] transition-all"
                data-testid="footer-instagram-cta"
              >
                <Instagram size={18} className="text-[var(--gold)] group-hover:text-[var(--ink)] transition-colors flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Follow on Instagram</p>
                  <p className="text-xs opacity-60 group-hover:opacity-80 mt-0.5">@triadrealty.ae</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row gap-3 justify-between text-xs opacity-50">
          <div>© {new Date().getFullYear()} Triad Realty LLC. All rights reserved.</div>
          <div className="tracking-[0.22em] uppercase">RERA Registered · Dubai Land Department</div>
        </div>
      </div>
    </footer>
  );
}
