import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, resolveMediaUrl } from "../config";

export default function Intro() {
  const [stage, setStage] = useState("loading"); // loading | exit | done
  const [logoUrl, setLogoUrl] = useState("https://res.cloudinary.com/dhxttgpfj/image/upload/v1783444277/logo_ciuljv.png");

  useEffect(() => {
    if (sessionStorage.getItem("triad_intro")) {
      setStage("done");
      return;
    }

    axios.get(`${API_URL}/settings/homepage`)
      .then((res) => {
        if (res.data?.intro_logo_url) {
          setLogoUrl(resolveMediaUrl(res.data.intro_logo_url));
        }
      })
      .catch(() => {});

    const timer = setTimeout(() => setStage("exit"), 1800);
    const doneTimer = setTimeout(() => {
      setStage("done");
      sessionStorage.setItem("triad_intro", "1");
    }, 2800);

    return () => {
      clearTimeout(timer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (stage === "done") return null;

  return (
    <div
      data-testid="intro-screen"
      className={`fixed inset-0 z-[200] bg-black flex items-center justify-center p-8 transition-all duration-[1100ms] ease-[cubic-bezier(0.86,0,0.07,1)] ${
        stage === "exit" ? "translate-y-[-100%]" : ""
      }`}
    >
      <div className="grain absolute inset-0 opacity-20 pointer-events-none" />

      <div className="relative flex flex-col items-center text-center animate-fade-in px-4">
        {/* Building Towers Icon */}
        <img
          src={logoUrl}
          alt="Triad Realty LLC"
          className="h-32 sm:h-44 md:h-52 w-auto object-contain mb-6 drop-shadow-[0_4px_25px_rgba(197,160,89,0.25)]"
        />

        {/* TRIAD Title */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl tracking-[0.25em] text-[var(--gold)] font-medium leading-none pl-[0.25em]">
          TRIAD
        </h1>

        {/* Gold Horizontal Line */}
        <div className="w-48 sm:w-64 md:w-72 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent my-3.5 opacity-80" />

        {/* REALTY LLC Subtitle */}
        <div className="text-[10px] sm:text-xs md:text-sm tracking-[0.45em] text-[var(--gold)]/90 uppercase font-light pl-[0.45em]">
          REALTY LLC
        </div>
      </div>
    </div>
  );
}
