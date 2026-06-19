import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

import { API_URL as API, resolveMediaUrl } from '../config';

export default function PopupManager() {
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    let timer;

    axios.get(`${API}/settings/popup`)
      .then((r) => {
        const data = r.data;
        if (isMounted && data && data.active) {
          const type = data.popup_type || (data.poster_image_url ? 'image' : 'text');
          const hasRequired = type === 'image' ? !!data.poster_image_url : !!data.title;

          if (hasRequired) {
            setPopupData(data);
            timer = setTimeout(() => {
              if (isMounted) setShowPopup(true);
            }, 1500);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const isAdminPage = location.pathname.startsWith('/admin');
  if (!showPopup || !popupData || isAdminPage) return null;

  const isImagePopup = popupData.popup_type === 'image' || (popupData.popup_type !== 'text' && popupData.poster_image_url);

  if (isImagePopup) {
    const posterImage = (
      <div className="relative group">
        {/* Floating close button in top-right */}
        <button
          type="button"
          onClick={() => setShowPopup(false)}
          className="absolute -top-12 right-0 md:-top-4 md:-right-12 text-white/70 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full w-8 h-8 flex items-center justify-center border border-white/20 shadow-lg"
          aria-label="Close popup"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>
        <img
          src={resolveMediaUrl(popupData.poster_image_url)}
          alt="Exclusive Launch Announcement"
          className="block max-h-[80vh] max-w-[90vw] md:max-h-[90vh] w-auto h-auto border border-[var(--gold)]/20 shadow-2xl hover:scale-[1.01] transition-transform duration-500 cursor-pointer"
        />
      </div>
    );

    return (
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        data-testid="popup-poster-modal"
      >
        <div className="absolute inset-0" onClick={() => setShowPopup(false)} />
        <div className="relative z-10 flex-shrink-0">
          {popupData.project_link ? (
            <Link
              to={popupData.project_link}
              className="block"
              onClick={() => setShowPopup(false)}
            >
              {posterImage}
            </Link>
          ) : (
            posterImage
          )}
        </div>
      </div>
    );
  }

  // Text-based Hot Launch Card layout
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      data-testid="popup-text-modal"
    >
      <div className="absolute inset-0" onClick={() => setShowPopup(false)} />
      
      <div className="bg-[var(--ink)] text-white p-8 md:p-10 border border-[var(--gold)]/30 max-w-lg w-full relative shadow-2xl overflow-hidden rounded-sm popup-enter">
        {/* Ambient background gold glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[var(--gold)]/10 blur-3xl pointer-events-none" />
        <div className="grain absolute inset-0 pointer-events-none opacity-5" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setShowPopup(false)}
          className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center border border-white/10"
          aria-label="Close popup"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>

        <div className="relative z-10">
          {popupData.tag && (
            <div className="overline text-[var(--gold)] mb-3 tracking-widest text-[10px]">{popupData.tag}</div>
          )}
          <h3 className="font-display text-2xl md:text-3xl mt-1 leading-tight tracking-tight">
            {popupData.title}
          </h3>
          <p className="text-white/60 text-sm mt-4 leading-relaxed font-body">
            {popupData.description}
          </p>

          <div className="flex flex-wrap gap-4 mt-8 pt-4 border-t border-white/10">
            {popupData.btn1_label && popupData.btn1_link && (
              <Link
                to={popupData.btn1_link}
                onClick={() => setShowPopup(false)}
                className="btn-gold !px-5 !py-3 text-center flex-1 whitespace-nowrap"
              >
                {popupData.btn1_label}
              </Link>
            )}
            {popupData.btn2_label && popupData.btn2_link && (
              <Link
                to={popupData.btn2_link}
                onClick={() => setShowPopup(false)}
                className="btn-ghost-light !px-5 !py-3 text-center flex-1 whitespace-nowrap"
              >
                {popupData.btn2_label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
