import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL as API, resolveMediaUrl } from "../config";
import { Film, Star, Quote, X, Play } from "lucide-react";
import { REVIEWS } from "../data";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/reviews`)
      .then((res) => {
        setReviews(res.data?.results || []);
      })
      .catch((err) => {
        console.error("Error loading reviews:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getVideoThumbnail = (url) => {
    if (!url) return null;
    const videoId = getYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  };

  const getYouTubeId = (value) => {
    if (!value || typeof value !== "string") return null;
    const iframeSrc = value.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
    const candidate = iframeSrc || value;
    try {
      const url = new URL(candidate.startsWith("//") ? `https:${candidate}` : candidate);
      const host = url.hostname.replace(/^www\./, "");
      if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
      if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || null;
        return url.searchParams.get("v");
      }
    } catch {
      const match = candidate.match(/(?:youtu\.be\/|embed\/|watch\?v=|[?&]v=)([A-Za-z0-9_-]{11})/);
      return match?.[1] || null;
    }
    return null;
  };

  const getEmbedElement = (youtubeCode) => {
    if (!youtubeCode) return null;

    const videoId = getYouTubeId(youtubeCode);
    if (videoId) {
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title="YouTube Video Review"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      );
    }

    if (youtubeCode.includes("<iframe")) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white/70 text-sm">
          Unsupported video embed
        </div>
      );
    }

    // Direct video upload fallback
    return (
      <video
        src={resolveMediaUrl(youtubeCode)}
        autoPlay
        controls
        className="absolute inset-0 w-full h-full object-contain"
      />
    );
  };

  return (
    <>
      <section className="pt-40 pb-12 section-pad bg-white" data-testid="reviews-hero">
        <div className="container-x px-5 lg:px-12">
          <div className="overline text-[var(--gold-deep)]">Client Testimonials</div>
          <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.95]">
            Real stories, <em className="text-[var(--gold-deep)]">real trust.</em>
          </h1>
          <p className="text-lg mt-6 max-w-2xl text-[var(--ink-2)]">
            Listen to video reviews and experiences shared by international and local buyers who acquired properties through Triad.
          </p>
        </div>
      </section>

      <section className="px-5 lg:px-12 pb-24 bg-white" data-testid="reviews-grid">
        <div className="container-x">
          {loading ? (
            <div className="text-center py-20 text-[var(--muted)] border border-[var(--line)] bg-[var(--bg-alt)]">
              Loading video reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 border border-[var(--line)] bg-[var(--bg-alt)]">
              <Film className="mx-auto text-[var(--gold)] mb-4" size={32} />
              <p className="font-display text-2xl text-[var(--ink)]">No video reviews posted yet.</p>
              <p className="text-sm text-[var(--muted)] mt-2">
                Our team will add video testimonials soon. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((rev) => {
                const hasVideo = !!rev.youtubeCode;
                const ytThumb = getVideoThumbnail(rev.youtubeCode);
                const isDirectVideo = hasVideo && !rev.youtubeCode.includes("<iframe") && !ytThumb;

                return (
                  <div
                    key={rev.id}
                    className="bg-white border border-[var(--line)] rounded flex flex-col group overflow-hidden hover:shadow-lg transition-all duration-300"
                    data-testid={`review-card-${rev.id}`}
                  >
                    {/* Video Block */}
                    {hasVideo && (
                      <div 
                        className="relative aspect-video w-full overflow-hidden bg-black border-b border-[var(--line)] cursor-pointer"
                        onClick={() => setActiveVideo(rev.youtubeCode)}
                      >
                        {ytThumb ? (
                          <img
                            src={ytThumb}
                            alt=""
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                          />
                        ) : isDirectVideo ? (
                          <video
                            src={resolveMediaUrl(rev.youtubeCode)}
                            className="w-full h-full object-cover opacity-70"
                            preload="metadata"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--ink-2)]" />
                        )}
                        {/* Play Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/25 transition-colors">
                          <div className="w-14 h-14 rounded-full border-2 border-[var(--gold)] flex items-center justify-center text-[var(--gold)] transform group-hover:scale-110 transition-transform bg-black/40 shadow-lg">
                            <Play size={20} fill="currentColor" className="ml-1" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Profile Info */}
                        <div className="flex items-center gap-4 mb-4">
                          {rev.avatar ? (
                            <img
                              src={resolveMediaUrl(rev.avatar)}
                              alt={rev.name}
                              className="w-12 h-12 rounded-full object-cover border border-[var(--gold)]/20 shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 text-[var(--gold-deep)] flex items-center justify-center font-display text-lg font-semibold border border-[var(--gold)]/20 flex-shrink-0">
                              {(rev.name || "V").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-base text-[var(--ink)] leading-snug truncate">
                              {rev.name || "Verified Client"}
                            </h3>
                            <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                              {rev.role || "Client"} {rev.country ? `· ${rev.country}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-1 mb-4">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} size={14} className="text-[var(--gold)] fill-[var(--gold)]" />
                          ))}
                        </div>

                        {/* Quote Text */}
                        <div className="relative">
                          <Quote className="text-[var(--gold)]/15 absolute -top-3 -left-3" size={32} />
                          <p className="text-[var(--ink-2)] text-[15px] leading-relaxed italic relative pl-4">
                            "{rev.description}"
                          </p>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      <div className="mt-6 pt-4 border-t border-[var(--line)] flex justify-between items-center text-xs text-[var(--muted)]">
                        <span className="overline tracking-wider text-[var(--gold-deep)] font-medium">Verified Review</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CLIENT TESTIMONIALS (REDESIGNED) */}
      <section className="section-pad bg-[var(--ink)] text-white relative overflow-hidden" data-testid="client-testimonials-section">
        <div className="grain absolute inset-0 opacity-20 pointer-events-none" />
        <div className="container-x relative px-5 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Left Rating Summary Column */}
            <div className="lg:col-span-4 lg:sticky lg:top-32" data-reveal>
              <span className="text-xs uppercase tracking-[0.25em] text-[var(--gold)] font-medium">Client Testimonials</span>
              <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
                Trusted advice,<br />
                <span className="italic text-[var(--gold)]">clear outcomes.</span>
              </h2>
              
              <div className="mt-10 p-8 bg-white/5 border border-white/10 backdrop-blur-sm rounded-sm flex flex-col items-center text-center">
                <div className="font-display text-7xl md:text-8xl text-[var(--gold)] font-light leading-none">4.9</div>
                <div className="flex gap-1.5 mt-4 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={20} className="text-[var(--gold)] fill-[var(--gold)]" />
                  ))}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">Average Client Rating</div>
              </div>
            </div>

            {/* Right Testimonial Cards Column */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6" data-reveal>
              {REVIEWS.slice(0, 4).map((r) => (
                <div 
                  key={r.name} 
                  className="bg-white/5 border border-white/10 p-8 hover:border-[var(--gold)]/40 hover:bg-white/10 hover:-translate-y-1 transition-all duration-500 relative flex flex-col justify-between group rounded-sm"
                  data-testid={`review-${r.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div>
                    <Quote className="text-[var(--gold)] opacity-40 group-hover:opacity-100 transition-opacity duration-300 mb-6" size={24} />
                    <p className="font-display text-xl leading-relaxed text-white/95 font-light italic">
                      "{r.quote}"
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="font-medium text-white text-base tracking-wide">{r.name}</div>
                    <div className="text-xs text-[var(--gold)]/80 mt-1 tracking-wider uppercase font-medium">
                      {r.role} · {r.country}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Video Modal Player */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 text-white hover:text-[var(--gold)] transition-colors"
            title="Close Modal"
          >
            <X size={24} />
          </button>
          <div
            className="w-full max-w-4xl aspect-video relative bg-black border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {getEmbedElement(activeVideo)}
          </div>
        </div>
      )}
    </>
  );
}
