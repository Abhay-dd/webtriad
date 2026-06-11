import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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

  const content = (
    <img
      src={resolveMediaUrl(popupData.poster_image_url)}
      alt="Exclusive Launch Announcement"
      className="w-full h-auto max-h-[80vh] object-contain border border-[var(--gold)]/20 shadow-2xl hover:scale-[1.01] transition-transform duration-500 cursor-pointer"
    />
  );

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      data-testid="popup-poster-modal"
    >
      <div className="absolute inset-0" onClick={() => setShowPopup(false)} />

      <div className="relative w-full max-w-[420px] bg-transparent shadow-2xl z-10 flex flex-col">
        {popupData.project_link ? (
          <Link
            to={popupData.project_link}
            className="w-full h-auto block"
            onClick={() => setShowPopup(false)}
          >
            {content}
          </Link>
        ) : (
          <div className="w-full h-auto">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
