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
        if (isMounted && data && data.active && data.poster_image_url) {
          setPopupData(data);
          timer = setTimeout(() => {
            if (isMounted) setShowPopup(true);
          }, 1500);
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

  /**
   * The image is displayed at its natural dimensions, bounded only by the
   * viewport. No fixed container width or aspect-ratio cropping is applied.
   * max-h-[90vh] max-w-[90vw] ensure it never overflows the screen while
   * w-auto h-auto lets the browser preserve the image's native ratio.
   */
  const posterImage = (
    <img
      src={resolveMediaUrl(popupData.poster_image_url)}
      alt="Exclusive Launch Announcement"
      className="block max-h-[90vh] max-w-[90vw] w-auto h-auto border border-[var(--gold)]/20 shadow-2xl hover:scale-[1.01] transition-transform duration-500 cursor-pointer"
    />
  );

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      data-testid="popup-poster-modal"
    >
      {/* Click-outside to dismiss */}
      <div className="absolute inset-0" onClick={() => setShowPopup(false)} />

      {/* Image container — size is driven entirely by the image itself */}
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
