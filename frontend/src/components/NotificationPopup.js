import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribePopup } from '../context/NotificationContext';
import { X, Bell, Megaphone, Search, MessageSquare } from 'lucide-react';

const TypeIcon = ({ type, color }) => {
  const s = { color, width: 18, height: 18 };
  if (type === 'announcement')    return <Megaphone style={s}/>;
  if (type === 'lost')            return <Bell style={s}/>;
  if (type === 'found')           return <Search style={s}/>;
  if (type === 'complaint')       return <MessageSquare style={s}/>;
  if (type === 'admin_complaint') return <MessageSquare style={s}/>;
  return <Bell style={s}/>;
};

const Toast = ({ notif, onClose, onNavigate }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);
  const DURATION = 5500;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => close(), DURATION);
    return () => clearTimeout(timerRef.current);
  }, []);

  const close = () => {
    setLeaving(true);
    setTimeout(() => onClose(notif._id), 380);
  };

  const handleClick = () => {
    clearTimeout(timerRef.current);
    onNavigate(notif.route);
    close();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '340px',
        maxWidth: 'calc(100vw - 32px)',
        background: 'rgba(10,20,36,0.97)',
        backdropFilter: 'blur(18px)',
        border: `1px solid ${notif.colorBorder}`,
        borderRadius: '16px',
        boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
        cursor: 'pointer',
        overflow: 'hidden',
        marginBottom: '10px',
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(115%) scale(0.96)',
        opacity: visible && !leaving ? 1 : 0,
        transition: leaving
          ? 'transform 0.38s cubic-bezier(0.4,0,1,1), opacity 0.3s ease'
          : 'transform 0.48s cubic-bezier(0.22,0.61,0.36,1), opacity 0.3s ease',
      }}
    >
      {/* Animated progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: '3px',
        background: `linear-gradient(to right, ${notif.color}, ${notif.colorBorder})`,
        borderRadius: '0 0 16px 0',
        animation: `notif_prog ${DURATION}ms linear forwards`,
      }}/>

      {/* Left color accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
        background: notif.color,
        opacity: 0.85,
      }}/>

      <div style={{ padding: '14px 12px 16px 18px', display: 'flex', gap: '11px', alignItems: 'flex-start' }}>

        {/* Icon bubble */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: notif.colorBg,
          border: `1px solid ${notif.colorBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TypeIcon type={notif.type} color={notif.color}/>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.09em', color: notif.color,
            }}>
              {notif.category}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.30)' }}>·</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>just now</span>
          </div>

          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#ffffff',
            lineHeight: 1.35, marginBottom: '4px',
            fontFamily: 'Playfair Display, serif',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {notif.title}
          </p>

          {notif.body && (
            <p style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.58)', lineHeight: 1.45,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {notif.body}
            </p>
          )}

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            marginTop: '7px', fontSize: '10px', fontWeight: 700,
            color: notif.color, opacity: 0.9,
          }}>
            View details →
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={e => { e.stopPropagation(); clearTimeout(timerRef.current); close(); }}
          style={{
            flexShrink: 0, width: '26px', height: '26px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X size={12} style={{ color: 'rgba(255,255,255,0.55)' }}/>
        </button>
      </div>
    </div>
  );
};

const NotificationPopup = () => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribePopup((notif) => {
      setToasts(prev => [...prev.slice(-3), notif]);
    });
    return unsub;
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t._id !== id));

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`@keyframes notif_prog { from { width:100% } to { width:0% } }`}</style>
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t._id} style={{ pointerEvents: 'all' }}>
            <Toast notif={t} onClose={remove} onNavigate={route => navigate(route)}/>
          </div>
        ))}
      </div>
    </>
  );
};

export default NotificationPopup;
