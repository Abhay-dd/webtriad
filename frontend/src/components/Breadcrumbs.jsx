import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm font-medium text-[var(--muted)] mb-8 flex items-center gap-2 flex-wrap">
      <Link to="/" className="hover:text-[var(--gold-deep)] transition-colors">Home</Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-2">
            <ChevronRight size={12} className="opacity-40" />
            {isLast ? (
              <span className="text-[var(--ink)]" aria-current="page">{item.label}</span>
            ) : (
              <Link to={item.url} className="hover:text-[var(--gold-deep)] transition-colors">{item.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
