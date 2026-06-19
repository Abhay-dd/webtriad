import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Instagram, Linkedin, Facebook, ArrowUpRight } from "lucide-react";
import axios from "axios";

import { API_URL as API, resolveMediaUrl } from "../config";

function toWhatsApp(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

const TIER_LABELS = {
  "co-founder": "Founders",
  "senior-portfolio-manager": "Senior Portfolio Managers",
  "portfolio-manager": "Portfolio Managers",
  "property-investment-consultant": "Property Investment Consultants",
  "none": "None / Unassigned",
};
const DEFAULT_TIER_ORDER = ["co-founder", "senior-portfolio-manager", "portfolio-manager", "property-investment-consultant"];

export default function TeamList() {
  const [team, setTeam] = useState([]);
  const [tierOrder, setTierOrder] = useState(DEFAULT_TIER_ORDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/team`),
      axios.get(`${API}/settings/team`),
    ]).then(([teamRes, settingsRes]) => {
      setTeam(teamRes.data.results || []);
      const order = settingsRes.data?.tier_order;
      if (Array.isArray(order) && order.length > 0) setTierOrder(order);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const renderCard = (t) => (
    <div key={t.id} className="group" data-testid={`about-team-${t.name.toLowerCase().replace(/\s+/g, "-")}`}>
      <Link to={`/team/${t.id}`} className="block group/link">
        <div className="aspect-[3/4] img-zoom bg-[var(--bg-alt)] relative">
          {t.photo ? (
            <img src={resolveMediaUrl(t.photo)} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--ink)] text-white">
              <span className="font-display text-6xl text-[var(--gold)]">
                {t.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-[var(--ink)]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             <span className="btn-gold !px-6 !py-3 border-none">View Profile</span>
          </div>
        </div>
        <h3 className="font-display text-2xl mt-5 text-[var(--ink)] group-hover/link:text-[var(--gold-deep)] transition-colors">{t.name}</h3>
        <div className="overline text-[var(--gold-deep)] mt-1">{t.role || "Property Consultant"}</div>
        {t.experience && <p className="text-sm mt-3 text-[var(--ink-2)]"><strong className="font-medium">Experience:</strong> {t.experience}</p>}
        {t.speaks && <p className="text-sm text-[var(--ink-2)]"><strong className="font-medium">Speaks:</strong> {t.speaks}</p>}
      </Link>
      
      <div className="flex gap-2.5 mt-4 relative z-10">
        {t.phone && (
          <a
            href={toWhatsApp(t.phone)}
            target="_blank"
            rel="noreferrer"
            title="WhatsApp"
            className="w-8 h-8 flex items-center justify-center border border-[var(--line)] hover:border-[var(--gold)] hover:text-[var(--gold-deep)] text-[var(--ink)] transition-colors"
          >
            <Phone size={13} />
          </a>
        )}
        {t.email && (
          <a
            href={`mailto:${t.email}`}
            title="Email"
            className="w-8 h-8 flex items-center justify-center border border-[var(--line)] hover:border-[var(--gold)] hover:text-[var(--gold-deep)] text-[var(--ink)] transition-colors"
          >
            <Mail size={13} />
          </a>
        )}
        {t.instagram && (
          <a
            href={t.instagram}
            target="_blank"
            rel="noreferrer"
            title="Instagram"
            className="w-8 h-8 flex items-center justify-center border border-[var(--line)] hover:border-[var(--gold)] hover:text-[var(--gold-deep)] text-[var(--ink)] transition-colors"
          >
            <Instagram size={13} />
          </a>
        )}
        {t.linkedin && (
          <a
            href={t.linkedin}
            target="_blank"
            rel="noreferrer"
            title="LinkedIn"
            className="w-8 h-8 flex items-center justify-center border border-[var(--line)] hover:border-[var(--gold)] hover:text-[var(--gold-deep)] text-[var(--ink)] transition-colors"
          >
            <Linkedin size={13} />
          </a>
        )}
        {t.facebook && (
          <a
            href={t.facebook}
            target="_blank"
            rel="noreferrer"
            title="Facebook"
            className="w-8 h-8 flex items-center justify-center border border-[var(--line)] hover:border-[var(--gold)] hover:text-[var(--gold-deep)] text-[var(--ink)] transition-colors"
          >
            <Facebook size={13} />
          </a>
        )}
      </div>
    </div>
  );

  // Group members by tier key; members without a tier default to senior-portfolio-manager
  const grouped = {};
  for (const key of tierOrder) {
    grouped[key] = team
      .filter((m) => (m.tier || "senior-portfolio-manager") === key)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  return (
    <>
      <section className="bg-[var(--ink)] text-white" data-testid="team-hero">
        {/* Header Banner Image (50vh) */}
        <div className="w-full h-[50vh] bg-white/5 overflow-hidden relative border-b border-white/10">
          <img
            src="/background.png"
            alt="Triad Realty Team Banner"
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 opacity-90 hover:opacity-100"
          />
        </div>
        <div className="container-x pt-20 pb-10">
          <div className="overline text-[var(--gold)]">Our Team</div>
          <h1 className="font-display text-5xl md:text-8xl leading-[0.95] mt-6 max-w-5xl">
            The consultants behind every <em className="text-[var(--gold)]">deal.</em>
          </h1>
          <p className="text-lg md:text-xl mt-8 max-w-2xl leading-relaxed text-white/80">
            A tight team of senior consultants who know every floor plan in our active list.
          </p>
        </div>
      </section>

      <section className="section-pad bg-white" data-testid="team-list">
        <div className="container-x">
          {loading ? (
            <div className="text-center py-20 opacity-50 uppercase tracking-widest text-sm">Loading team...</div>
          ) : (
            <div className="space-y-24">
              {tierOrder.map((tierKey) => {
                if (tierKey === "none") return null;
                const members = grouped[tierKey] || [];
                if (members.length === 0) return null;
                const label = TIER_LABELS[tierKey] || tierKey;
                return (
                  <div key={tierKey} data-testid={`tier-section-${tierKey}`}>
                    <div className="overline text-[var(--gold-deep)] mb-8">{label}</div>
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                      data-reveal
                    >
                      {members.map(renderCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 border-t border-[var(--line)] pt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-2xl">Want to work alongside this team?</p>
            <Link to="/careers" className="btn-gold">View Open Positions <ArrowUpRight size={14} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
