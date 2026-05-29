import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
  Activity, BarChart2, TrendingUp, Users, Clock, Info,
  Calendar, Ticket, DollarSign, Globe, Bookmark,
  ArrowUpRight, Star, CheckCircle, AlertCircle, Rocket,
  PenLine, Trash2, LogIn, FileText, Flame, Award, Target,
} from 'lucide-react';

/* ─── Mini bar chart (CSS only) ─────────────────────────────────────────── */
const BarChart = ({ data, valueKey, labelKey, color = 'var(--primary-color)', height = 120 }) => {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height, width: '100%' }}>
      {data.map((d, i) => {
        const pct = Math.round((d[valueKey] / max) * 100);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
            <div
              title={`${d[labelKey]}: ${d[valueKey]?.toLocaleString()}`}
              style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${Math.max(pct, 4)}%`,
                background: `linear-gradient(180deg, ${color}, ${color}88)`,
                transition: 'height 0.6s ease',
                cursor: 'default',
              }}
            />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textAlign: 'center' }}>
              {d[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Gauge (sell-through) ───────────────────────────────────────────────── */
const Gauge = ({ value, max = 100, color = '#10b981' }) => {
  const pct = Math.min(100, (value / max) * 100);
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="100" height="60" viewBox="0 0 100 60">
      <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="var(--border-color)" strokeWidth="10" strokeLinecap="round" />
      <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * 125.66} 125.66`} style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="50" y="52" textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{value}%</text>
    </svg>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, iconColor, borderColor, title, value, sub, trend }) => (
  <div style={{ ...S.card, borderTop: `3px solid ${borderColor}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={iconColor} />
      </div>
      {trend !== undefined && (
        <span style={{ fontSize: '0.75rem', color: trend >= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp size={12} /> {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{title}</p>
    <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</p>}
  </div>
);

/* ─── Section heading ────────────────────────────────────────────────────── */
const SectionHead = ({ icon: Icon, label, color = 'var(--primary-color)' }) => (
  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 1.25rem' }}>
    <Icon size={20} color={color} /> {label}
  </h2>
);

/* ─── Log action icon map ────────────────────────────────────────────────── */
const LOG_META = {
  'Event Created': { color: '#10b981', Icon: Rocket },
  'Event Updated': { color: '#3b82f6', Icon: PenLine },
  'Event Deleted': { color: '#ef4444', Icon: Trash2 },
  'Login':         { color: '#8b5cf6', Icon: LogIn },
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [bookmarks, setBookmarks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      try {
        const [logRes, bkRes] = await Promise.all([
          user.role !== 'Attendee' ? api.get('/logs').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          api.get('/bookmarks').catch(() => ({ data: [] })),
        ]);
        setLogs(logRes.data);
        setBookmarks(bkRes.data.length);

        if (user.role === 'Organizer') {
          const { data } = await api.get('/analytics/organizer');
          setAnalytics(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  if (!user) return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2 style={{ color: 'var(--primary-color)' }}>Welcome to EventSphere</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Please login to access your dashboard.</p>
    </div>
  );

  if (user.role === 'Attendee') return <Navigate to="/" />;

  const ov = analytics?.overview || {};

  /* ── type breakdown bars ── */
  const typeData = Object.entries(analytics?.typeBreakdown || {}).map(([k, v]) => ({ label: k, tickets: v }));
  /* ── category bars ── */
  const catData  = Object.entries(analytics?.categoryBreakdown || {}).map(([k, v]) => ({ label: k, count: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 'clamp(1.4rem,4vw,1.8rem)', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
          Welcome back, <span style={{ color: 'var(--primary-color)' }}>{user.name}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.93rem', margin: 0 }}>
          {user.role === 'Organizer'
            ? 'Your real-time organizer analytics — every number pulled live from the database.'
            : 'Here's your platform overview. Monitor performance and track recent activity.'}
        </p>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ ...S.card, height: 120, background: 'linear-gradient(90deg,var(--bg-surface) 25%,var(--border-color) 50%,var(--bg-surface) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 14 }} />
          ))}
          <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      )}

      {/* ── Organizer Analytics ── */}
      {!loading && user.role === 'Organizer' && analytics && (
        <>
          {/* Overview stat cards */}
          <div style={S.grid4}>
            <StatCard icon={Calendar}    iconColor="var(--primary-color)" borderColor="var(--primary-color)" title="Total Events"       value={ov.totalEvents ?? 0}        sub={`${ov.upcomingEvents ?? 0} upcoming · ${ov.pastEvents ?? 0} past`} />
            <StatCard icon={Ticket}      iconColor="#8b5cf6"              borderColor="#8b5cf6"              title="Tickets Sold"       value={(ov.totalTickets ?? 0).toLocaleString()}   sub="Active bookings" />
            <StatCard icon={DollarSign}  iconColor="#10b981"              borderColor="#10b981"              title="Total Revenue"      value={`Rs. ${(ov.totalRevenue ?? 0).toLocaleString()}`}  sub="Across all events" />
            <StatCard icon={Users}       iconColor="#f59e0b"              borderColor="#f59e0b"              title="Unique Attendees"   value={(ov.uniqueAttendees ?? 0).toLocaleString()}  sub="Distinct ticket holders" />
          </div>

          <div style={S.grid4}>
            <StatCard icon={Target}      iconColor="#ec4899"              borderColor="#ec4899"              title="Sell-Through Rate"  value={`${ov.sellThroughRate ?? 0}%`}  sub="Tickets sold vs capacity" />
            <StatCard icon={FileText}    iconColor="#3b82f6"              borderColor="#3b82f6"              title="Applications"       value={ov.totalApplications ?? 0}      sub="Booth applications received" />
            <StatCard icon={Bookmark}    iconColor="#f59e0b"              borderColor="#f59e0b"              title="Bookmarks"          value={ov.totalBookmarks ?? 0}         sub="Users saved your events" />
            <StatCard icon={Globe}       iconColor="#06b6d4"              borderColor="#06b6d4"              title="Events Upcoming"    value={ov.upcomingEvents ?? 0}         sub="Scheduled ahead" />
          </div>

          {/* Monthly Revenue + Tickets charts */}
          <div style={S.twoCol}>
            <div style={S.card}>
              <SectionHead icon={BarChart2} label="Monthly Revenue (Last 6 Months)" color="#10b981" />
              {(analytics.monthlyData || []).every(d => d.revenue === 0)
                ? <EmptyChart label="No revenue yet" />
                : <BarChart data={analytics.monthlyData} valueKey="revenue" labelKey="month" color="#10b981" height={130} />
              }
            </div>
            <div style={S.card}>
              <SectionHead icon={Ticket} label="Monthly Tickets Sold (Last 6 Months)" color="#8b5cf6" />
              {(analytics.monthlyData || []).every(d => d.tickets === 0)
                ? <EmptyChart label="No ticket sales yet" />
                : <BarChart data={analytics.monthlyData} valueKey="tickets" labelKey="month" color="#8b5cf6" height={130} />
              }
            </div>
          </div>

          {/* Top Events + Sell-Through Gauge */}
          <div style={S.twoCol}>
            <div style={S.card}>
              <SectionHead icon={Award} label="Top Events by Ticket Sales" color="#f59e0b" />
              {(analytics.topEvents || []).length === 0
                ? <EmptyChart label="No events created yet" />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {analytics.topEvents.map((ev, i) => {
                      const pct = ev.capacity > 0 ? Math.min(100, Math.round((ev.tickets / ev.capacity) * 100)) : 0;
                      return (
                        <div key={ev._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#f59e0b' : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: i === 0 ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                            <div style={{ height: 5, background: 'var(--border-color)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', borderRadius: 3, transition: 'width 0.8s ease' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{ev.tickets} / {ev.capacity}</span>
                          <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>Rs. {ev.revenue.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Sell-through gauge */}
              <div style={{ ...S.card, textAlign: 'center' }}>
                <SectionHead icon={Target} label="Overall Sell-Through" color="#ec4899" />
                <Gauge value={ov.sellThroughRate ?? 0} color="#ec4899" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                  {ov.totalTickets ?? 0} tickets sold of {(analytics.topEvents || []).reduce((s, e) => s + e.capacity, 0)} total capacity
                </p>
              </div>

              {/* Ticket type breakdown */}
              {typeData.length > 0 && (
                <div style={S.card}>
                  <SectionHead icon={Ticket} label="Ticket Type Breakdown" color="#8b5cf6" />
                  <BarChart data={typeData} valueKey="tickets" labelKey="label" color="#8b5cf6" height={80} />
                </div>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          {catData.length > 0 && (
            <div style={S.card}>
              <SectionHead icon={Flame} label="Events by Category" color="#f59e0b" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {catData.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(109,40,217,0.08)', border: '1px solid rgba(109,40,217,0.2)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)' }}>{c.count}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent ticket sales */}
          {(analytics.recentTickets || []).length > 0 && (
            <div style={S.card}>
              <SectionHead icon={ArrowUpRight} label="Recent Ticket Sales" color="#10b981" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analytics.recentTickets.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-color)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                    <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.eventTitle}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{t.ticketType}</div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', flexShrink: 0 }}>Rs. {t.price.toLocaleString()}</span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {new Date(t.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Non-organizer basic overview ── */}
      {!loading && user.role !== 'Organizer' && (
        <div style={S.grid4}>
          <StatCard icon={Bookmark} iconColor="#f59e0b" borderColor="#f59e0b" title="My Bookmarks" value={bookmarks} sub="Events saved to your list" />
        </div>
      )}

      {/* ── Activity Logs ── */}
      {!loading && user.role !== 'Attendee' && (
        <div style={S.card}>
          <SectionHead icon={Activity} label="Recent Activity Logs" />
          {logs.length === 0 ? (
            <div style={S.empty}>
              <Info size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No activities yet</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your activity will appear here once you start creating events.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.map(log => {
                const meta = LOG_META[log.action] || { color: '#64748b', Icon: FileText };
                const { color, Icon: LogIcon } = meta;
                return (
                  <div key={log._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 12, padding: '12px 16px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LogIcon size={16} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 2 }}>{log.action}</div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, wordBreak: 'break-word' }}>{log.details}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.73rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>
                      <Clock size={11} />
                      {new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EmptyChart = ({ label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, color: 'var(--text-secondary)', gap: 8 }}>
    <AlertCircle size={22} style={{ opacity: 0.4 }} />
    <span style={{ fontSize: '0.82rem' }}>{label}</span>
  </div>
);

const S = {
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem' },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem' },
  card: {
    background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-color)',
    padding: '1.4rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  empty: {
    padding: '2rem', textAlign: 'center', background: 'var(--bg-color)',
    borderRadius: 10, border: '1px dashed var(--border-color)', color: 'var(--text-secondary)',
  },
};

export default Dashboard;
