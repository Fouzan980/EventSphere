import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Calendar, MapPin, Clock, Ticket, Info, X, Music } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const getCity = (location = '') => {
  const parts = location.split(',');
  return parts[parts.length - 2]?.trim() || parts[0]?.trim() || location;
};

const formatDate = (d) => {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const Orders = () => {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // expanded ticket

  useEffect(() => {
    if (!user) return;
    api.get('/tickets/my-tickets')
      .then(res => setTickets(res.data))
      .catch(err => console.error('Failed to fetch tickets', err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 72, borderRadius: 12, background: 'var(--bg-surface)', animation: 'pulse 1.4s ease-in-out infinite', border: '1px solid var(--border-color)' }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <style>{`
        .orders-row:hover { background: rgba(139,92,246,0.06) !important; }
        .orders-row { transition: background 0.18s; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.35); border-radius: 6px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.4rem,4vw,1.8rem)', margin: '0 0 0.4rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ticket size={26} color="#FF2A5F" /> My Orders & Tickets
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          {tickets.length} booking{tickets.length !== 1 ? 's' : ''} · click a row to view the event schedule
        </p>
      </div>

      {tickets.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', background: 'var(--bg-surface)', borderRadius: 16, border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <Info size={44} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No Tickets Yet</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Explore events and book your first ticket to see it here!</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-surface)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-color)' }}>
                  <th style={th}>Event</th>
                  <th style={th}>Date</th>
                  <th style={th}>City</th>
                  <th style={th}>Location</th>
                  <th style={th}>Ticket</th>
                  <th style={th}>Price</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const ev = ticket.event || {};
                  const isSelected = selected?._id === ticket._id;
                  return (
                    <React.Fragment key={ticket._id}>
                      <tr
                        className="orders-row"
                        style={{ borderBottom: '1px solid var(--border-color)', background: isSelected ? 'rgba(139,92,246,0.06)' : 'transparent' }}
                        onClick={() => setSelected(isSelected ? null : ticket)}
                      >
                        {/* Thumbnail + name */}
                        <td style={{ ...td, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {ev.poster
                                ? <img src={ev.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>{(ev.title || 'E')[0]}</span>}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.3 }}>{ev.title || 'Unknown Event'}</div>
                              <div style={{ fontSize: '0.76rem', color: '#8b5cf6', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{ev.category || 'Event'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.87rem' }}>
                            <Calendar size={13} color="#FF2A5F" />{formatDate(ev.date)}
                          </div>
                          {ev.time && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{ev.time}</div>}
                        </td>
                        <td style={{ ...td, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.87rem' }}>{getCity(ev.location)}</td>
                        <td style={{ ...td, maxWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                            <MapPin size={13} color="#FF2A5F" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ev.location || 'TBA'}</span>
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{ display: 'inline-block', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)', padding: '2px 10px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 700 }}>
                            {ticket.ticketType || 'Standard'}
                          </span>
                        </td>
                        <td style={{ ...td, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ticket.price === 0 ? <span style={{ color: '#10b981' }}>FREE</span> : `Rs. ${ticket.price}`}
                        </td>
                        <td style={td}>
                          <span style={{ display: 'inline-block', background: ticket.status === 'Booked' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: ticket.status === 'Booked' ? '#10b981' : '#ef4444', border: `1px solid ${ticket.status === 'Booked' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '2px 10px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 700 }}>
                            {ticket.status || 'Booked'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded schedule row */}
                      <AnimatePresence>
                        {isSelected && (
                          <tr>
                            <td colSpan={7} style={{ padding: 0, borderBottom: '1px solid var(--border-color)' }}>
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(139,92,246,0.04)' }}>
                                  {ev.sessions && ev.sessions.length > 0 ? (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                        📋 Event Schedule
                                      </div>
                                      <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                          <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                              <th style={{ ...th, background: 'transparent', fontSize: '0.72rem' }}>Time</th>
                                              <th style={{ ...th, background: 'transparent', fontSize: '0.72rem' }}>Session</th>
                                              <th style={{ ...th, background: 'transparent', fontSize: '0.72rem' }}>Speaker / Artist</th>
                                              <th style={{ ...th, background: 'transparent', fontSize: '0.72rem' }}>Venue / Stage</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {ev.sessions.map((s, i) => (
                                              <tr key={i} style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                                                <td style={{ ...td, fontWeight: 700, color: '#a855f7', fontSize: '0.83rem', whiteSpace: 'nowrap' }}>{s.time || '—'}</td>
                                                <td style={{ ...td, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.87rem' }}>{s.title || '—'}</td>
                                                <td style={{ ...td, color: 'var(--text-secondary)', fontSize: '0.84rem' }}>{s.speaker || '—'}</td>
                                                <td style={{ ...td, color: 'var(--text-secondary)', fontSize: '0.84rem', fontStyle: 'italic' }}>{s.location || '—'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </>
                                  ) : (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <Music size={16} /> No schedule has been published for this event yet.
                                    </div>
                                  )}

                                  {/* Extra event details */}
                                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    {ev.dressCode && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border-color)' }}>👔 {ev.dressCode}</span>}
                                    {ev.websiteLink && <a href={ev.websiteLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none', background: 'rgba(59,130,246,0.08)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.2)' }}>🌐 Event Website</a>}
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border-color)' }}>📅 Booked: {new Date(ticket.purchaseDate || ticket.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const th = {
  padding: '0.85rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  color: 'var(--text-secondary)',
  background: 'var(--bg-color)',
  whiteSpace: 'nowrap',
};
const td = { padding: '0.95rem 1rem', verticalAlign: 'middle' };

export default Orders;
