import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getAnnouncements, getLostFound, getMyComplaints, adminGetComplaints } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

/* ─── popup notification bus ─────────────────────────── */
let popupListeners = [];
export const subscribePopup = (fn) => {
  popupListeners.push(fn);
  return () => { popupListeners = popupListeners.filter(l => l !== fn); };
};
const emitPopup = (notif) => popupListeners.forEach(fn => fn(notif));

/* ─── helpers ────────────────────────────────────────── */
const STORAGE_KEY   = 'fot_read_notifs';
const SEEN_KEY      = 'fot_seen_ids';        // ids we've already popped
const POLL_MS       = 30_000;                // poll every 30s

const loadSet  = (key) => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } };
const saveSet  = (key, s) => localStorage.setItem(key, JSON.stringify([...s]));

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [items,   setItems]   = useState([]);   // all notifications (announcements + lf + complaints)
  const [readIds, setReadIds] = useState(() => loadSet(STORAGE_KEY));

  const seenIdsRef  = useRef(loadSet(SEEN_KEY));   // ids already shown as popup
  const itemsRef    = useRef(items);
  const readIdsRef  = useRef(readIds);

  useEffect(() => { itemsRef.current   = items;   }, [items]);
  useEffect(() => { readIdsRef.current = readIds; }, [readIds]);

  /* ── fetch all three sources and merge ─────────────── */
  const fetchAll = useCallback(async () => {
    try {
      const isAdmin = user?.role === 'admin';

      const [annRes, lfRes, compRes, adminCompRes] = await Promise.allSettled([
        getAnnouncements(),
        getLostFound(),
        isAdmin ? Promise.resolve({ data: [] }) : getMyComplaints(),
        isAdmin ? adminGetComplaints() : Promise.resolve({ data: [] }),
      ]);

      const anns = (annRes.status  === 'fulfilled' ? annRes.value?.data  : null) || [];
      const lf   = (lfRes.status   === 'fulfilled' ? lfRes.value?.data   : null) || [];
      const comp = (compRes.status === 'fulfilled' ? compRes.value?.data : null) || [];
      const adminComp = (adminCompRes.status === 'fulfilled' ? adminCompRes.value?.data : null) || [];

      const normalized = [
        ...anns.map(a => ({
          _id:       a._id,
          type:      'announcement',
          title:     a.title,
          body:      a.content?.slice(0, 100) || '',
          category:  a.category || 'General',
          priority:  a.priority || 'normal',
          createdAt: a.createdAt,
          icon:      '📢',
          color:     '#c9a84c',
          colorBg:   'rgba(201,168,76,0.12)',
          colorBorder:'rgba(201,168,76,0.30)',
          route:     '/announcements',
        })),
        ...lf.map(l => ({
          _id:       l._id,
          type:      l.type === 'found' ? 'found' : 'lost',
          title:     l.type === 'found'
                       ? `Found: ${l.title}`
                       : `Lost: ${l.title}`,
          body:      l.description?.slice(0, 100) || '',
          category:  l.type === 'found' ? 'Found Item' : 'Lost Item',
          priority:  'normal',
          createdAt: l.createdAt,
          icon:      l.type === 'found' ? '🔎' : '🚨',
          color:     l.type === 'found' ? '#22c55e' : '#ef4444',
          colorBg:   l.type === 'found' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          colorBorder: l.type === 'found' ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.30)',
          route:     '/lost-found',
        })),
        ...comp.map(c => ({
          _id:       c._id + '_status',
          type:      'complaint',
          title:     `Complaint ${c.status === 'resolved' ? 'Resolved' : c.status === 'in-progress' ? 'In Progress' : 'Updated'}: ${c.title}`,
          body:      c.adminReply || c.description?.slice(0, 100) || '',
          category:  'Complaint',
          priority:  c.status === 'resolved' ? 'high' : 'normal',
          createdAt: c.updatedAt || c.createdAt,
          icon:      c.status === 'resolved' ? '✅' : c.status === 'in-progress' ? '🔄' : '💬',
          color:     c.status === 'resolved' ? '#22c55e' : c.status === 'in-progress' ? '#3b82f6' : '#c9a84c',
          colorBg:   c.status === 'resolved' ? 'rgba(34,197,94,0.12)' : c.status === 'in-progress' ? 'rgba(59,130,246,0.12)' : 'rgba(201,168,76,0.12)',
          colorBorder: c.status === 'resolved' ? 'rgba(34,197,94,0.30)' : c.status === 'in-progress' ? 'rgba(59,130,246,0.30)' : 'rgba(201,168,76,0.30)',
          route:     '/complaints',
          // only show if not pending (no real update yet)
          skip:      c.status === 'pending',
        })),
        // New complaints addressed to this admin (already filtered server-side
        // to only what this admin type — or super_admin — is allowed to see).
        ...adminComp.map(c => ({
          _id:       c._id + '_new_complaint',
          type:      'admin_complaint',
          title:     `New Complaint: ${c.title}`,
          body:      c.description?.slice(0, 100) || '',
          category:  'Complaint',
          priority:  'normal',
          createdAt: c.createdAt,
          icon:      '📨',
          color:     '#c9a84c',
          colorBg:   'rgba(201,168,76,0.12)',
          colorBorder:'rgba(201,168,76,0.30)',
          route:     '/admin/complaints',
        })),
      ]
      .filter(n => !n.skip)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      /* ── detect NEW items to popup ──────────────────── */
      const prevSeen = seenIdsRef.current;
      const newOnes  = normalized.filter(n => !prevSeen.has(n._id));

      if (newOnes.length > 0 && prevSeen.size > 0) {
        // Only popup if we had data before (not first load)
        newOnes.slice(0, 3).forEach((n, i) => {
          setTimeout(() => emitPopup(n), i * 600);
        });
      }

      // Mark all as seen
      const updatedSeen = new Set([...prevSeen, ...normalized.map(n => n._id)]);
      seenIdsRef.current = updatedSeen;
      saveSet(SEEN_KEY, updatedSeen);

      setItems(normalized);
    } catch (_) {}
  }, [user]);

  /* ── initial load + polling ─────────────────────────── */
  useEffect(() => {
    if (!user) return;          // don't poll when not logged in
    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll, user]);

  const unreadCount = items.filter(i => !readIds.has(i._id)).length;

  const markAllRead = useCallback(() => {
    const allIds  = itemsRef.current.map(i => i._id);
    const updated = new Set([...readIdsRef.current, ...allIds]);
    setReadIds(updated);
    saveSet(STORAGE_KEY, updated);
  }, []);

  const markRead = useCallback((id) => {
    const updated = new Set([...readIdsRef.current, id]);
    setReadIds(updated);
    saveSet(STORAGE_KEY, updated);
  }, []);

  return (
    <NotificationContext.Provider value={{ items, unreadCount, markAllRead, markRead, fetchItems: fetchAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
