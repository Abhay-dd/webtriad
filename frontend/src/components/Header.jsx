import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { NAV, COMPANY } from "../data";

export default function Header() {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Main header bar ── */}
      <header
        data-testid="site-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "backdrop-blur-2xl bg-white/90 border-b border-[var(--line)] shadow-sm"
            : "bg-gradient-to-b from-black/55 to-transparent"
        }`}
      >
        <div className="container-x flex items-center justify-between px-5 lg:px-12 py-3.5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 z-10" data-testid="logo-link">
            <img
              src="/triad_logo.jpeg"
              alt="Triad Realty Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="leading-tight">
              <div
                className={`font-display text-[17px] tracking-tight transition-colors duration-300 ${
                  scrolled ? "text-[var(--ink)]" : "text-white"
                }`}
              >
                TRIAD
              </div>
              <div
                className={`overline text-[8px] -mt-0.5 transition-colors duration-300 ${
                  scrolled ? "text-[var(--muted)] opacity-60" : "text-white/50"
                }`}
              >
                REALTY · UAE
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `relative group text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300 ${
                    isActive
                      ? "text-[var(--gold-deep)]"
                      : scrolled
                      ? "text-[var(--ink)] hover:text-[var(--gold-deep)]"
                      : "text-white/85 hover:text-white"
                  }`
                }
                end={n.to === "/"}
              >
                {({ isActive }) => (
                  <>
                    {n.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-[1.5px] bg-[var(--gold)] transition-all duration-300 ease-out ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden xl:flex items-center gap-5">
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className={`text-[11px] tracking-[0.16em] uppercase whitespace-nowrap hidden 2xl:inline-block transition-colors duration-300 ${
                scrolled ? "text-[var(--ink)] hover:text-[var(--gold-deep)]" : "text-white/75 hover:text-white"
              }`}
              data-testid="header-phone"
            >
              {COMPANY.phone}
            </a>

            <Link
              to="/contact?type=consultation"
              className="btn-gold flex items-center gap-2"
              data-testid="header-cta"
            >
              Book Consultation
              <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`xl:hidden p-2 transition-colors duration-300 z-10 ${
              scrolled || open ? "text-[var(--ink)]" : "text-white"
            }`}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            data-testid="mobile-menu-toggle"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── Full-screen mobile menu overlay ── */}
      {open && (
        <div
          className="xl:hidden fixed inset-0 z-40 bg-[var(--ink)] flex flex-col"
          data-testid="mobile-menu"
        >
          {/* Logo in overlay */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
              <img src="/triad_logo.jpeg" alt="Triad Realty" className="h-9 w-auto object-contain" />
              <div className="font-display text-white text-base tracking-tight">TRIAD REALTY</div>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col justify-center px-8">
            {NAV.map((n, i) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 55}ms` }}
                className={({ isActive }) =>
                  `font-display text-3xl py-4 border-b border-white/8 transition-colors duration-200 animate-[fadeSlideIn_0.35s_ease_both] flex items-center justify-between group ${
                    isActive ? "text-[var(--gold)]" : "text-white/80 hover:text-[var(--gold)]"
                  }`
                }
                data-testid={`mobile-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {n.label}
                <ArrowUpRight
                  size={18}
                  className="text-white/20 group-hover:text-[var(--gold)] transition-colors"
                />
              </NavLink>
            ))}
          </nav>

          {/* Bottom CTA */}
          <div className="px-8 py-8 space-y-3">
            <Link
              to="/contact?type=consultation"
              onClick={() => setOpen(false)}
              className="btn-gold w-full text-center justify-center py-4 text-sm"
            >
              Book a Consultation
            </Link>
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors tracking-widest uppercase"
            >
              {COMPANY.phone}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
