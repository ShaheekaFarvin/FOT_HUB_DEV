import React, { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

/* Reusable full-screen image lightbox */
export const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition"
      >
        <X size={20} color="#fff"/>
      </button>
      <img
        src={src}
        alt={alt || 'Image'}
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      />
      <p className="absolute bottom-4 text-white/40 text-xs">Click outside or press ESC to close</p>
    </div>
  );
};

/* Clickable image wrapper — shows zoom icon on hover */
export const ClickableImage = ({ src, alt, className, style, containerClassName, containerStyle }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div
        className={`relative cursor-zoom-in group ${containerClassName || ''}`}
        style={containerStyle}
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt || ''} className={className} style={style}/>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-center justify-center rounded-inherit">
          <ZoomIn size={22} color="#fff" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg"/>
        </div>
      </div>
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)}/>}
    </>
  );
};

export default ImageLightbox;
