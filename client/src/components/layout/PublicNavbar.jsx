import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Ticket, Moon, Sun, LogOut, Menu, X, User, Lock, Phone, Camera, Save, Loader2 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import './PublicNavbar.css';

const API = 'http://localhost:5000/api';

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 300;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

const PublicNavbar = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketTab, setTicketTab] = useState('upcoming');
  const [bannerMessages, setBannerMessages] = useState(['Free Palestine 🇵🇸', 'Peace and Justice 🕊️', 'Standing in Solidarity 🌿']);
  const fileRef = useRef();

  // Profile form state
  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
    setProfileOpen(false);
    setTicketsOpen(false);
  }, [pathname]);

  // Fetch tickets when sidebar opens
  useEffect(() => {
    if (!ticketsOpen || !user?.token) return;
    setTicketsLoading(true);
    fetch(`${API}/tickets/my-tickets`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json()).then(d => setTickets(Array.isArray(d) ? d : [])).catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));
  }, [ticketsOpen, user]);

  useEffect(() => {
    fetch(`${API}/settings/globalBanner`)
      .then(res => res.json())
      .then(data => {
        if (data?.value) {
          const msgs = data.value.split('|').map(s => s.trim()).filter(Boolean);
          setBannerMessages(msgs.length > 0 ? msgs : []);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Sync form with user when sidebar opens
  useEffect(() => {
    if (profileOpen && user) {
      setForm({ name: user.name || '', phone: user.phone || '', avatar: user.avatar || '' });
    }
  }, [profileOpen, user]);

  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setForm(f => ({ ...f, avatar: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, avatar: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.token) return;
    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/users/me`, form, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      updateUser({ name: data.name, avatar: data.avatar, phone: data.phone });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setPwSaving(true);
    try {
      await axios.put(`${API}/users/me/password`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const hasBanner = bannerMessages.length > 0;
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <>
      {/* Top Banner */}
      {hasBanner && (
        <div className="banner-marquee-container" style={styles.topBanner}>
          <div className="banner-marquee">
            <div className="marquee-content">
              {bannerMessages.map((msg, i) => <span key={i} style={{ paddingRight: '4rem' }}>{msg}</span>)}
            </div>
            <div className="marquee-content">
              {bannerMessages.map((msg, i) => <span key={i} style={{ paddingRight: '4rem' }}>{msg}</span>)}
            </div>
          </div>
          <style>{`
            .banner-marquee-container { overflow: hidden; width: 100%; display: flex; }
            .banner-marquee { display: flex; width: max-content; animation: banner-scroll 45s linear infinite; }
            .marquee-content { display: flex; flex-shrink: 0; }
            @keyframes banner-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .banner-marquee:hover { animation-play-state: paused; }
          `}</style>
        </div>
      )}

      <nav style={{ ...styles.navbar, top: hasBanner ? '32px' : 0 }}>
        <div style={styles.logo} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); }} role="button">
          <Ticket size={28} color="#FF2A5F" />
          <h2 style={styles.brandTitle}>EVENTSPHERE</h2>
        </div>

        {/* Desktop Links */}
        <div className="public-nav-links" style={styles.navLinks}>
          <Link to="/" style={styles.link}>Home</Link>
          <a href="/#events" style={styles.link}>Events</a>
          <a href="/#categories" style={styles.link}>Categories</a>
          <Link to="/exhibitors" style={styles.link}>Exhibitors</Link>
          <div style={styles.navDivider}></div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user.role !== 'Attendee' && (
                <Link to="/dashboard" style={styles.link}>Dashboard</Link>
              )}
              {/* Tickets pill — inside nav, no overlap */}
              {user.role === 'Attendee' && (
                <button
                  onClick={() => setTicketsOpen(true)}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'#FF2A5F', border:'none', color:'#fff', padding:'7px 14px', borderRadius:20, fontWeight:600, fontSize:'0.85rem', cursor:'pointer', boxShadow:'0 3px 10px rgba(255,42,95,0.4)' }}
                >
                  <Ticket size={15}/> My Tickets
                </button>
              )}
              <button onClick={toggleTheme} style={styles.btnLogout}>
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {user.role === 'Attendee' ? (
                <button onClick={() => setProfileOpen(true)} style={styles.avatarBtn} title="My Profile">
                  <div style={styles.avatarCircle}>
                    {user.avatar ? <img src={user.avatar} alt="av" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{color:'#fff',fontWeight:700,fontSize:'0.85rem'}}>{initials}</span>}
                  </div>
                  <span style={{fontWeight:600,color:'#fff',fontSize:'0.95rem'}}>{user.name}</span>
                </button>
              ) : (
                <Link to="/dashboard/profile" style={{display:'flex',alignItems:'center',gap:'8px',textDecoration:'none'}}>
                  <div style={styles.avatarCircle}>
                    {user.avatar ? <img src={user.avatar} alt="av" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{color:'#fff',fontWeight:700,fontSize:'0.85rem'}}>{initials}</span>}
                  </div>
                  <span style={{fontWeight:600,color:'#fff',fontSize:'0.95rem'}}>{user.name}</span>
                </Link>
              )}
              <button onClick={logout} style={styles.btnLogout} title="Logout"><LogOut size={16}/></button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={toggleTheme} style={styles.btnLogout}>
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <Link to="/login" style={styles.link}>Sign In</Link>
              <Link to="/register" style={styles.btnPrimary}>Sign Up</Link>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="hamburger-btn"
          onClick={() => setIsMenuOpen(true)}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* pill removed — now inside navbar */}

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ top: hasBanner ? '32px' : 0, height: hasBanner ? 'calc(100vh - 32px)' : '100vh' }}
          >
            <button className="close-btn" onClick={() => setIsMenuOpen(false)}><X size={32} /></button>

            {user && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{ textAlign: 'center', marginBottom: '1rem', width: '100%' }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>Logged in as</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{user.email}</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', padding: '2px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                  🎟️ {user.role?.toUpperCase()}
                </span>
              </motion.div>
            )}

            <div style={{ height: '1px', width: '100%', maxWidth: 300, background: 'linear-gradient(to right, transparent, #334155, transparent)', marginBottom: '1rem' }} />

            <div className="mobile-menu-links" style={{ marginBottom: '0.75rem' }}>
              {[['Home', '/'], ['Events', '/#events'], ['Categories', '/#categories'], ['Exhibitors', '/exhibitors']].map(([label, href], i) => (
                <motion.a key={label} href={href}
                  className="mobile-link"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ textDecoration: 'none' }}
                >{label}</motion.a>
              ))}
            </div>

            <div style={{ height: '1px', width: '100%', maxWidth: 300, background: 'linear-gradient(to right, transparent, #334155, transparent)', marginBottom: '0.75rem' }} />

            {user ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
              >
                {user.role === 'Attendee' ? (
                  <div className="mobile-menu-links" style={{ marginBottom: '1rem' }}>
                    <button onClick={() => { setIsMenuOpen(false); setProfileOpen(true); }} className="mobile-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Profile</button>
                    <button onClick={() => { setIsMenuOpen(false); setTicketsOpen(true); }} className="mobile-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>My Tickets</button>
                  </div>
                ) : (
                  <Link to="/dashboard" className="mobile-link" onClick={() => setIsMenuOpen(false)} style={{ marginBottom: '1rem' }}>Dashboard</Link>
                )}
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <button onClick={toggleTheme} style={styles.btnLogout}>
                    {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                  </button>
                  <button onClick={logout} style={{ ...styles.btnLogout, color: '#FF2A5F' }}><LogOut size={22} /></button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', width: '100%' }}
              >
                <button onClick={toggleTheme} style={styles.btnLogout}>
                  {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                </button>
                <Link to="/login" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                <Link to="/register" style={{ ...styles.btnPrimary, width: '100%', textAlign: 'center', maxWidth: '200px' }} onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Attendee Profile Sidebar ──────────────────────────────────────── */}
      <AnimatePresence>
        {profileOpen && user?.role === 'Attendee' && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 1100,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)'
              }}
            />
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1101,
                width: 'min(400px, 100vw)',
                background: '#0F172A',
                borderLeft: '1px solid rgba(139,92,246,0.25)',
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#e2d9f3', fontWeight: 700 }}>My Profile</h2>
                <button onClick={() => setProfileOpen(false)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Avatar section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', width: 90, height: 90 }}>
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(139,92,246,0.5)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
                      {form.avatar
                        ? <img src={form.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>{initials}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current.click()}
                      style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6a11cb,#a855f7)', border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    >
                      <Camera size={13} />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#e2d9f3', fontSize: '1rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#7c6a96' }}>{user.email}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>🎟️ ATTENDEE</span>
                  </div>
                </div>

                {/* Profile form */}
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={sb.section}>
                    <User size={14} color="#a855f7" /> <span style={sb.sectionLabel}>Personal Info</span>
                  </div>
                  <div>
                    <label style={sb.label}>Full Name</label>
                    <input style={sb.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                  </div>
                  <div>
                    <label style={sb.label}>Phone</label>
                    <input style={sb.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92 300 0000000" type="tel" />
                  </div>
                  <button type="submit" disabled={saving} style={sb.btn}>
                    {saving ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={15} />}
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>

                {/* Password form */}
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={sb.section}>
                    <Lock size={14} color="#a855f7" /> <span style={sb.sectionLabel}>Change Password</span>
                  </div>
                  <div>
                    <label style={sb.label}>Current Password</label>
                    <input style={sb.input} type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Current password" />
                  </div>
                  <div>
                    <label style={sb.label}>New Password</label>
                    <input style={sb.input} type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="New password" />
                  </div>
                  <div>
                    <label style={sb.label}>Confirm New Password</label>
                    <input style={{ ...sb.input, borderColor: pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'rgba(239,68,68,0.6)' : undefined }} type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm new password" />
                  </div>
                  <button type="submit" disabled={pwSaving} style={{ ...sb.btn, background: 'linear-gradient(135deg,#dc2626,#ef4444)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
                    {pwSaving ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Lock size={15} />}
                    {pwSaving ? 'Updating...' : 'Change Password'}
                  </button>
                </form>

                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={() => { logout(); setProfileOpen(false); }} style={{ width: '100%', padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem' }}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Tickets Sidebar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {ticketsOpen && user?.role === 'Attendee' && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setTicketsOpen(false)}
              style={{position:'fixed',inset:0,zIndex:1100,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)'}}/>
            <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
              transition={{type:'spring',stiffness:280,damping:30}}
              style={{position:'fixed',top:0,right:0,bottom:0,zIndex:1101,width:'min(480px,100vw)',background:'#0F172A',borderLeft:'1px solid rgba(139,92,246,0.25)',display:'flex',flexDirection:'column',overflowY:'auto'}}>
              <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                <div>
                  <h2 style={{margin:0,fontSize:'1.1rem',color:'#e2d9f3',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
                    <Ticket size={18} color="#FF2A5F"/> My Tickets
                  </h2>
                  <p style={{margin:'2px 0 0',fontSize:'0.78rem',color:'#7c6a96'}}>{user.name} · {tickets.length} booking{tickets.length!==1?'s':''}</p>
                </div>
                <button onClick={() => setTicketsOpen(false)} style={{background:'none',border:'none',color:'#a78bfa',cursor:'pointer'}}><X size={22}/></button>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'1rem'}}>
                {/* Tabs */}
                {!ticketsLoading && (
                  <div style={{display:'flex',gap:6,marginBottom:'1rem',background:'rgba(139,92,246,0.08)',borderRadius:10,padding:4}}>
                    {[['upcoming','🗓 Upcoming'],['history','🕘 History']].map(([tab,label])=>(
                      <button key={tab} onClick={()=>setTicketTab(tab)}
                        style={{flex:1,padding:'7px 0',borderRadius:8,border:'none',fontWeight:700,fontSize:'0.82rem',cursor:'pointer',
                          background:ticketTab===tab?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                          color:ticketTab===tab?'#fff':'#7c6a96',transition:'all 0.18s'}}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {ticketsLoading ? (
                  <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                    {[1,2,3].map(i=><div key={i} style={{height:90,borderRadius:12,background:'rgba(139,92,246,0.08)',animation:'sbpulse 1.4s ease-in-out infinite'}}/>)}
                  </div>
                ) : (() => {
                  const now = new Date();
                  const list = tickets.filter(t => {
                    const d = t.event?.date ? new Date(t.event.date) : null;
                    return ticketTab === 'upcoming' ? (d && d > now) : (!d || d <= now);
                  });
                  if (list.length === 0) return (
                    <div style={{textAlign:'center',padding:'3rem 1rem',color:'#5b4e72'}}>
                      <Ticket size={40} style={{marginBottom:'1rem',opacity:0.3}}/>
                      <p style={{margin:0,fontWeight:600}}>{ticketTab==='upcoming'?'No upcoming events.':'No past tickets yet.'}</p>
                      <p style={{margin:'0.5rem 0 0',fontSize:'0.8rem',opacity:0.7}}>{ticketTab==='upcoming'?'Book a ticket to see it here!':'Your attended events will appear here.'}</p>
                    </div>
                  );
                  return (
                    <div style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
                      {list.map(t => {
                        const ev = t.event || {};
                        const evDate = ev.date ? new Date(ev.date) : null;
                        const isPast = ticketTab === 'history';
                        return (
                          <div key={t._id} style={{background: isPast ? 'rgba(100,116,139,0.06)' : 'rgba(139,92,246,0.07)', border:`1px solid ${isPast?'rgba(100,116,139,0.15)':'rgba(168,85,247,0.3)'}`, borderRadius:14, overflow:'hidden', opacity: isPast ? 0.82 : 1}}>
                            <div style={{display:'flex',gap:'0.85rem',padding:'0.9rem'}}>
                              <div style={{width:52,height:52,borderRadius:10,flexShrink:0,overflow:'hidden',background: isPast ? 'linear-gradient(135deg,#475569,#64748b)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                                {ev.poster ? <img src={ev.poster} alt="" style={{width:'100%',height:'100%',objectFit:'cover',filter:isPast?'grayscale(60%)':'none'}}/> : <span style={{color:'#fff',fontWeight:700,fontSize:'1.1rem'}}>{(ev.title||'E')[0]}</span>}
                                {isPast && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>✓</div>}
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:700,color: isPast ? '#94a3b8' : '#e2d9f3',fontSize:'0.92rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title||'Unknown Event'}</div>
                                <div style={{fontSize:'0.76rem',color: isPast ? '#475569' : '#8b5cf6',fontWeight:600,marginTop:2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{ev.category||'Event'}</div>
                                <div style={{fontSize:'0.8rem',color:'#7c6a96',marginTop:4,display:'flex',flexWrap:'wrap',gap:'0.6rem'}}>
                                  {evDate && <span>📅 {evDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>}
                                  {ev.time && <span>🕐 {ev.time}</span>}
                                </div>
                                {ev.location && <div style={{fontSize:'0.78rem',color:'#7c6a96',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>📍 {ev.location}</div>}
                              </div>
                              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                                <span style={{fontSize:'0.68rem',fontWeight:700,padding:'3px 8px',borderRadius:10,background: isPast ? 'rgba(100,116,139,0.2)' : 'rgba(168,85,247,0.15)',color: isPast ? '#94a3b8' : '#a855f7'}}>{isPast ? 'ATTENDED' : 'UPCOMING'}</span>
                                <span style={{fontSize:'0.75rem',fontWeight:700,color:t.price===0?'#10b981':'#e2d9f3'}}>{t.price===0?'FREE':`Rs.${t.price}`}</span>
                                <span style={{fontSize:'0.68rem',padding:'2px 7px',borderRadius:8,background:'rgba(139,92,246,0.15)',color:'#c4b5fd'}}>{t.ticketType||'Standard'}</span>
                              </div>
                            </div>
                            {!isPast && ev.sessions?.length > 0 && (
                              <div style={{borderTop:'1px solid rgba(139,92,246,0.15)',padding:'0.7rem 0.9rem'}}>
                                <div style={{fontSize:'0.72rem',fontWeight:700,color:'#a855f7',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'0.5rem'}}>📋 Schedule</div>
                                {ev.sessions.slice(0,3).map((s,i)=>(
                                  <div key={i} style={{display:'flex',gap:'0.6rem',fontSize:'0.78rem',color:'#b8a9d4',marginBottom:'0.35rem'}}>
                                    <span style={{color:'#a855f7',fontWeight:600,minWidth:45,flexShrink:0}}>{s.time||'—'}</span>
                                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.title}</span>
                                  </div>
                                ))}
                                {ev.sessions.length > 3 && <div style={{fontSize:'0.72rem',color:'#5b4e72',marginTop:4}}>+{ev.sessions.length-3} more sessions</div>}
                              </div>
                            )}
                            {isPast && (
                              <div style={{borderTop:'1px solid rgba(100,116,139,0.12)',padding:'0.55rem 0.9rem',display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontSize:'0.74rem',color:'#475569'}}>Booked on {new Date(t.purchaseDate||t.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <style>{`@keyframes sbpulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Sidebar internal styles
const sb = {
  label: { display: 'block', marginBottom: 4, fontSize: '0.73rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#7c6a96' },
  input: { width: '100%', padding: '10px 12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 9, color: '#e2d9f3', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', padding: '11px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(168,85,247,0.35)', marginTop: 4 },
  section: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 2 },
  sectionLabel: { fontSize: '0.82rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.8px' },
};

const styles = {
  topBanner: { position: 'fixed', top: 0, left: 0, width: '100%', height: '32px', backgroundColor: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.5px', zIndex: 1001, overflow: 'hidden' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 5%', backgroundColor: '#0F172A', color: '#fff', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, borderBottom: '1px solid #1E293B' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  brandTitle: { fontSize: '1.3rem', fontWeight: 800, letterSpacing: '1px', margin: 0, background: 'linear-gradient(45deg, #FF2A5F, #FF7B9B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  navLinks: { alignItems: 'center', gap: '2rem' },
  link: { color: '#cbd5e1', textDecoration: 'none', fontWeight: 500, fontSize: '1rem', transition: '0.2s' },
  navDivider: { height: '24px', width: '1px', backgroundColor: '#334155' },
  btnLogout: { background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', transition: '0.2s' },
  btnPrimary: { padding: '10px 24px', backgroundColor: '#FF2A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', textDecoration: 'none', transition: '0.3s' },
  avatarBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 },
  avatarCircle: { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid rgba(168,85,247,0.5)' },
};

export default PublicNavbar;
