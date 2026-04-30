import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, Ticket, Globe, Mail, Phone, X, Star, Music, Mic2, Target, ChevronLeft, ChevronRight, Mic, Users, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import PublicNavbar from '../components/layout/PublicNavbar';
import { PageSkeleton } from '../components/Skeleton';
const getBrandLogo = (domain) => `https://cdn.brandfetch.io/domain/${domain}/w/140/h/140/logo?c=1idWm8TWPtdWnIGpbBE`;

const PARTNERS = [
  { name: 'ARY Digital', logo: getBrandLogo('aryzap.com'), color: '#e53e3e', bg: '#fff5f5' },
  { name: 'HUM TV', logo: 'https://cdn.brandfetch.io/domain/humsocialmediaawards.com/w/400/h/400?c=1idWm8TWPtdWnIGpbBE', color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'GEO TV', logo: getBrandLogo('geo.tv'), color: '#2b6cb0', bg: '#ebf8ff' },
  { name: 'Samaa TV', logo: getBrandLogo('samaa.tv'), color: '#2c7a7b', bg: '#e6fffa' },
  { name: 'DAWN', logo: getBrandLogo('dawn.com'), color: '#1a365d', bg: '#ebf8ff' },
  { name: 'Jazz', logo: getBrandLogo('jazz.com.pk'), color: '#744210', bg: '#fffff0' },
  { name: 'PTCL', logo: getBrandLogo('ptcl.com.pk'), color: '#2a4365', bg: '#ebf8ff' },
  { name: 'Telenor', logo: getBrandLogo('telenor.com.pk'), color: '#1a365d', bg: '#ebf8ff' },
  { name: 'K-Electric', logo: getBrandLogo('ke.com.pk'), color: '#e53e3e', bg: '#fff5f5' },
  { name: 'Stormfiber', logo: 'https://cdn.brandfetch.io/domain/stormfiber.com/w/820/h/242/logo?c=1idWm8TWPtdWnIGpbBE', color: '#1E3A8A', bg: '#eff6ff' },
];

// ─── Animated Counter Hook ─────────────────────────────────────────────────
const useCounter = (target, duration = 2000, startOnView = true) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) {
      animate();
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        animate();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const animate = () => {
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return { count, ref };
};

// ─── Single Stat Counter Item ──────────────────────────────────────────────
const StatCounter = ({ icon, target, suffix, label }) => {
  const { count, ref } = useCounter(target);
  return (
    <div ref={ref} style={{ padding: '1.5rem 1rem', textAlign: 'center', position: 'relative' }}>
      <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}>{icon}</div>
      <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
};

// ─── Feature cards with gradient graphics ─────────────────────────────────
const FEATURES = [
  {
    gradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
    icon: '⚡',
    title: 'Instant Booking',
    desc: 'Book tickets in under 60 seconds with our streamlined, friction-free checkout.',
    stat: '< 60s',
  },
  {
    gradient: 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)',
    icon: '🔒',
    title: 'Secure Payments',
    desc: 'End-to-end encrypted payments with PCI-DSS compliance and zero fraud guarantee.',
    stat: '100%',
  },
  {
    gradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
    icon: '🎙️',
    title: 'Top Artists',
    desc: "Access concerts by Pakistan's most celebrated musicians, from pop to sufiana.",
    stat: '50+ Artists',
  },
  {
    gradient: 'linear-gradient(135deg, #F09819 0%, #EDDE5D 100%)',
    icon: '📊',
    title: 'Organizer Tools',
    desc: 'Full management dashboard with analytics, booth control, speaker management and more.',
    stat: 'Real-time',
  },
  {
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    icon: '📱',
    title: 'Mobile Ready',
    desc: 'Fully responsive across all phones, tablets, and desktops with native-like experience.',
    stat: 'All Screens',
  },
  {
    gradient: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
    icon: '💬',
    title: '24/7 Support',
    desc: 'Dedicated support team always available via chat, email, or call — never left alone.',
    stat: '24/7',
  },
];

const Home = () => {
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const eventsRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [bookingState, setBookingState] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [ticketType, setTicketType] = useState('Standard');
  const [selectedArtist, setSelectedArtist] = useState(null);

  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const featuredEvents = events.filter(e => e.isFeatured);
  const bannerEvents = events.length > 0 ? events : [];

  useEffect(() => {
    if (bannerEvents.length <= 1) return;
    const t = setInterval(() => setBannerIndex(i => (i + 1) % bannerEvents.length), 3500);
    return () => clearInterval(t);
  }, [bannerEvents.length]);

  const handleBookTicket = async (event, type = 'Standard') => {
    if (!user) { navigate('/login'); return; }
    setBookingState(prev => ({ ...prev, [event._id]: 'loading' }));
    try {
      await api.post(`/tickets/book/${event._id}`, { ticketType: type });
      setBookingState(prev => ({ ...prev, [event._id]: 'booked' }));
      
      let bookedPrice = event.price;
      if (event.hasMultipleTickets && event.tickets?.length > 0) {
        const matchedTicket = event.tickets.find(t => t.name === type);
        bookedPrice = matchedTicket ? matchedTicket.price : 0;
      } else {
        bookedPrice = event.price * (type === 'VIP' ? 2 : type === 'Meet & Greet' ? 4 : 1);
      }

      setSuccessMsg({ title: event.title, date: event.date, location: event.location, price: bookedPrice, email: user.email });
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed';
      setBookingState(prev => ({ ...prev, [event._id]: 'error' }));
      toast.error(msg);
    }
  };

  // ─── City normalization: map known areas/districts to canonical city names
  const CITY_MAP = [
    // Karachi & Sindh
    { canonical: 'Karachi', keywords: ['karachi','dha karachi','gulshan','clifton','saddar','defence karachi','korangi','malir','north nazimabad','gulistan','orangi','lyari','pechs','bath island','zamzama','kda','khi'] },
    { canonical: 'Hyderabad', keywords: ['hyderabad','latifabad','qasimabad','hyd'] },
    { canonical: 'Sukkur', keywords: ['sukkur','rohri'] },
    { canonical: 'Larkana', keywords: ['larkana'] },
    // Lahore & Punjab
    { canonical: 'Lahore', keywords: ['lahore','dha lahore','gulberg','johar town','model town lahore','bahria lahore','cantt lahore','wapda town','iqbal town','garden town'] },
    { canonical: 'Faisalabad', keywords: ['faisalabad','lyallpur','satiana','chak jhumra'] },
    { canonical: 'Rawalpindi', keywords: ['rawalpindi','pindi','chaklala','bahria pindi'] },
    { canonical: 'Multan', keywords: ['multan','gulgasht','shah rukn-e-alam'] },
    { canonical: 'Gujranwala', keywords: ['gujranwala'] },
    { canonical: 'Sialkot', keywords: ['sialkot','wazirabad'] },
    // KPK
    { canonical: 'Peshawar', keywords: ['peshawar','hayatabad','university town peshawar'] },
    { canonical: 'Abbottabad', keywords: ['abbottabad','havelian'] },
    // Balochistan
    { canonical: 'Quetta', keywords: ['quetta','brewery road','satellite town quetta'] },
    // Islamabad / Rawalpindi
    { canonical: 'Islamabad', keywords: ['islamabad','f-6','f-7','f-8','f-10','g-9','g-10','g-11','blue area','dha islamabad','bahria islamabad','cbr','margalla'] },
  ];

  const normalizeCity = (location = '') => {
    const loc = location.toLowerCase();
    for (const { canonical, keywords } of CITY_MAP) {
      if (keywords.some(k => loc.includes(k))) return canonical;
    }
    // Fallback: first segment before comma
    return location.split(',')[0]?.trim() || location;
  };

  const filteredEvents = events.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q ||
      e.title.toLowerCase().includes(q) ||
      (e.speakers || []).some(sp => sp.name?.toLowerCase().includes(q));
    const normCity = normalizeCity(e.location);
    const matchCity = selectedCity ? normCity.toLowerCase() === selectedCity.toLowerCase() : true;
    const matchCat = selectedCategory ? e.category === selectedCategory : true;
    return matchQ && matchCity && matchCat;
  });

  // Speaker suggestions for the unified search dropdown
  const allSpeakers = [...new Set(
    events.flatMap(e => (e.speakers || []).map(sp => sp.name)).filter(Boolean)
  )].sort();
  const speakerSuggestions = searchQuery
    ? allSpeakers.filter(n => n.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4)
    : [];

  // Build canonical city list from events
  const pkCities = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad'];
  const eventCities = [...new Set(events.map(e => normalizeCity(e.location)).filter(Boolean))];
  const cities = [...new Set([...pkCities, ...eventCities])].sort();

  const scrollToEvents = () => eventsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const getGradient = (str) => {
    const colors = [
      'linear-gradient(135deg,#FF416C,#FF4B2B)', 'linear-gradient(135deg,#1A2980,#26D0CE)',
      'linear-gradient(135deg,#8E2DE2,#4A00E0)', 'linear-gradient(135deg,#F09819,#EDDE5D)',
      'linear-gradient(135deg,#00B4DB,#0083B0)', 'linear-gradient(135deg,#11998e,#38ef7d)',
    ];
    let s = 0; for (const c of str) s += c.charCodeAt(0);
    return colors[s % colors.length];
  };

  const CATS = [
    { label: 'All', icon: '🎯', cat: '' },
    { label: 'Concerts', icon: '🎵', cat: 'Concert' },
    { label: 'Expos', icon: '🏛️', cat: 'Expo' },
    { label: 'Workshops', icon: '🔨', cat: 'Workshop' },
    { label: 'Conferences', icon: '🎤', cat: 'Conference' },
    { label: 'Jobs', icon: '💼', cat: 'Recruitment Drive' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>

      <PublicNavbar />

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <header style={S.hero}>
        <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={S.heroBadge}>
            <span>🎉</span> Pakistan's #1 Event Discovery Platform
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={S.heroTitle}>
            Find your next<br /><span style={{ color: '#FF2A5F' }}>Live Experience</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={S.heroSub}>
            Discover concerts, expos, workshops, and corporate events near you. Book in seconds.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} style={S.searchWrap}>
          <div style={S.searchBar}>
            <div style={{ ...S.searchGrp, position: 'relative', flex: '2 1 200px' }}>
              <Search size={18} color="#64748b" style={{ flexShrink: 0 }} />
              <input type="text" placeholder="Search events or artists..." style={S.searchInput} value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && scrollToEvents()} />
              {searchQuery && speakerSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 600, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                  <div style={{ padding: '6px 12px 4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Artists & Speakers</div>
                  {speakerSuggestions.map(name => (
                    <div key={name} onMouseDown={() => { setSearchQuery(name); scrollToEvents(); }}
                      style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,42,95,0.06)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    ><Mic size={13} color="#FF2A5F" style={{ flexShrink: 0 }} />{name}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={S.searchDivider} />
            <div style={S.searchGrp}>
              <MapPin size={18} color="#64748b" style={{ flexShrink: 0 }} />
              <select style={S.selectInput} value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                <option value="">Any City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={S.searchDivider} />
            <div style={S.searchGrp}>
              <Calendar size={18} color="#64748b" style={{ flexShrink: 0 }} />
              <select style={S.selectInput} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="">Any Category</option>
                <option value="Concert">Concert</option>
                <option value="Expo">Expo</option>
                <option value="Workshop">Workshop</option>
                <option value="Conference">Conference</option>
                <option value="Recruitment Drive">Recruitment Drive</option>
              </select>
            </div>
            <button style={S.btnSearch} onClick={scrollToEvents}>Explore</button>
          </div>
        </motion.div>
      </header>

      <main style={{ backgroundColor: 'var(--bg-color)' }}>

        {/* ─── Animated Stats ─────────────────────────────────────────────── */}
        <section style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', padding: 'clamp(2rem,5vw,3.5rem) 5%' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <StatCounter icon="🎪" target={1200} suffix="+" label="Events Hosted" />
            <StatCounter icon="👥" target={85000} suffix="+" label="Happy Attendees" />
            <StatCounter icon="🌍" target={12} suffix="+" label="Cities Covered" />
            <StatCounter icon="🏢" target={50} suffix="+" label="Partner Companies" />
          </div>
        </section>

        {/* ─── Events Carousel (all events, no title) ──────────────────── */}
        {bannerEvents.length > 0 && (
          <section style={{ padding: 'clamp(2rem,5vw,3rem) 5%', backgroundColor: 'var(--bg-color)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem', gap: 8 }}>
                {bannerEvents.length > 1 && (
                  <>
                    <button onClick={() => setBannerIndex(i => (i - 1 + bannerEvents.length) % bannerEvents.length)} style={S.navBtn}><ChevronLeft size={20} /></button>
                    <button onClick={() => setBannerIndex(i => (i + 1) % bannerEvents.length)} style={S.navBtn}><ChevronRight size={20} /></button>
                  </>
                )}
              </div>
              <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                  {bannerEvents[bannerIndex] && (() => {
                    const ev = bannerEvents[bannerIndex];
                    return (
                      <motion.div key={bannerIndex}
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.45 }}
                        style={{ height: 'clamp(220px, 42vw, 400px)', background: (ev.banner || ev.poster) ? `url(${ev.banner || ev.poster}) center/cover` : getGradient(ev.title || ''), borderRadius: 24, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => setSelectedEventModal(ev)}
                      >
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(1rem,3vw,2rem)' }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ background: '#FF2A5F', color: '#fff', padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{ev.category}</span>
                            {ev.isFeatured && <span style={{ background: '#f59e0b', color: '#fff', padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>⭐ Featured</span>}
                          </div>
                          <h3 style={{ color: '#fff', fontSize: 'clamp(1.1rem,3.5vw,2rem)', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2 }}>{ev.title}</h3>
                          <div style={{ display: 'flex', gap: '1.25rem', color: '#cbd5e1', fontSize: 'clamp(0.75rem,2vw,0.9rem)', flexWrap: 'wrap', alignItems: 'center' }}>
                            {ev.date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                            {ev.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{ev.location.split(',').slice(0, 2).join(',')}</span>}
                            <span style={{ color: '#4ade80', fontWeight: 700 }}>
                              {ev.hasMultipleTickets && ev.tickets?.length > 0
                                ? (Math.min(...ev.tickets.map(t => t.price)) === 0 ? 'FREE' : `From Rs. ${Math.min(...ev.tickets.map(t => t.price))}`)
                                : (ev.price === 0 ? 'FREE' : `Rs. ${ev.price}`)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
                {bannerEvents.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                    {bannerEvents.map((_, i) => (
                      <button key={i} onClick={() => setBannerIndex(i)}
                        style={{ width: i === bannerIndex ? 24 : 8, height: 8, borderRadius: 4, background: i === bannerIndex ? '#FF2A5F' : 'rgba(100,116,139,0.3)', border: 'none', cursor: 'pointer', transition: '0.3s', padding: 0 }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}


        {/* ─── Category Filter Pills ─────────────────────────────────────── */}
        <section id="categories" style={{ padding: 'clamp(1.5rem,4vw,2.5rem) 5% 1rem', backgroundColor: 'var(--bg-color)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Mobile filter toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Browse by Category</h3>
              <button onClick={() => setShowFilters(f => !f)} style={{ ...S.btnSearch, padding: '6px 14px', fontSize: '0.8rem', display: 'none' }} className="filter-toggle-btn">
                {showFilters ? 'Hide' : 'Filters ▾'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
              {CATS.map(c => (
                <button key={c.label}
                  onClick={() => { setSelectedCategory(c.cat); setTimeout(scrollToEvents, 80); }}
                  style={{ ...S.catPill, background: selectedCategory === c.cat ? '#FF2A5F' : 'var(--bg-surface)', color: selectedCategory === c.cat ? '#fff' : 'var(--text-primary)', border: selectedCategory === c.cat ? 'none' : '1px solid var(--border-color)' }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Events Grid (Upcoming Events) ────────────────────────────── */}
        <section id="events" ref={eventsRef} style={{ padding: 'clamp(1rem,3vw,2rem) 5% clamp(3rem,6vw,5rem)', scrollMarginTop: '80px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={S.sectionTitle}>Upcoming Events</h2>
                <p style={{ color: '#64748b', fontSize: 'clamp(0.85rem,2vw,1rem)', marginTop: '0.25rem' }}>Don't miss out on the most anticipated experiences.</p>
              </div>
              {(searchQuery || selectedCategory || selectedCity) && (
                <button onClick={() => { setSearchQuery(''); setSelectedCity(''); setSelectedCategory(''); }} style={{ ...S.btnSearch, background: 'transparent', color: '#FF2A5F', border: '1px solid #FF2A5F', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                  Clear Filters
                </button>
              )}
            </div>
            {loading ? (
              <PageSkeleton />
            ) : filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
                <Ticket size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>No events found</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Try clearing your filters or check back later.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%),1fr))', gap: '1.5rem' }}>
                {filteredEvents.map((event, idx) => (
                  <motion.div key={event._id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: (idx % 10) * 0.07 }}
                    style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ height: 'clamp(170px,28vw,220px)', background: event.poster ? `url(${event.poster}) center/cover` : getGradient(event.title || ''), position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', borderRadius: '7px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{event.category || 'Event'}</div>
                      {event.isFeatured && <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#f59e0b', color: '#fff', padding: '4px 10px', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 800 }}>⭐ Featured</div>}
                      {event.discounts && !event.isFeatured && <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#FF2A5F', color: '#fff', padding: '4px 10px', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 800 }}>🔥 {event.discounts}</div>}
                    </div>
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <h4 style={{ fontSize: 'clamp(0.95rem,2.5vw,1.1rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.85rem', lineHeight: 1.4 }}>{event.title}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.87rem' }}>
                          <Calendar size={14} color="#FF2A5F" />{event.date ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'TBA'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.87rem' }}>
                          <MapPin size={14} color="#FF2A5F" /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location || 'Location TBA'}</span>
                        </div>
                        {event.speakers?.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', fontSize: '0.82rem' }}>
                            <Mic size={13} color="#8b5cf6" />{event.speakers.slice(0,2).map(s=>s.name).join(', ')}{event.speakers.length>2?` +${event.speakers.length-2}`:''}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 800, fontSize: 'clamp(1rem,2.5vw,1.15rem)', color: 'var(--text-primary)' }}>
                          {event.hasMultipleTickets && event.tickets?.length > 0 
                            ? (Math.min(...event.tickets.map(t => t.price)) === 0 ? 'FREE' : `From Rs. ${Math.min(...event.tickets.map(t => t.price))}`)
                            : (event.price === 0 ? 'FREE' : `Rs. ${event.price}`)}
                        </div>
                        {bookingState[event._id] === 'booked'
                          ? <button disabled style={{ ...S.btnBook, backgroundColor: '#10b981' }}>✓ Booked!</button>
                          : <button style={S.btnBook} onClick={() => setSelectedEventModal(event)}>View Details</button>
                        }
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Trending Horizontal Carousel ─────────────────────────────── */}
        {events.length > 0 && (
          <section style={{ padding: '0 5% 2.5rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h2 style={{ ...S.sectionTitle, marginBottom: '1.25rem' }}>🔥 Trending Now</h2>
              <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
                {events.slice(0, 10).map((evt, i) => (
                  <div key={i} onClick={() => setSelectedEventModal(evt)} style={{ minWidth: 'clamp(180px,28vw,250px)', height: 'clamp(240px,38vw,300px)', borderRadius: '20px', background: evt.poster ? `url(${evt.poster}) center/cover` : getGradient(evt.title || ''), flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', transition: 'transform 0.3s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top,rgba(0,0,0,0.9),transparent)', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div style={{ color: '#FF2A5F', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>{evt.category}</div>
                      <div style={{ color: '#fff', fontSize: 'clamp(0.9rem,2.5vw,1.1rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '4px' }}>{evt.title}</div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>{evt.date ? new Date(evt.date).toLocaleDateString() : 'TBA'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Partners Marquee ─────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(2.5rem,5vw,4.5rem) 0', backgroundColor: 'var(--bg-surface)', overflow: 'hidden', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '0 5%' }}>
            <h2 style={{ ...S.sectionTitle, color: 'var(--text-primary)', margin: 0 }}>Trusted by Pakistan's Best</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Leading media houses & telecoms trust EventSphere for their flagship events</p>
          </div>
          <div style={{ overflow: 'hidden', position: 'relative' }}>
            {/* Fade edges */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to right, var(--bg-surface,#f8fafc), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to left, var(--bg-surface,#f8fafc), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', gap: '1.5rem', animation: 'marquee 40s linear infinite', width: 'max-content', padding: '0.5rem 0' }}>
              {[...PARTNERS, ...PARTNERS].map((p, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '0.6rem', padding: '1.25rem 1.75rem',
                  backgroundColor: p.bg || '#fff',
                  borderRadius: '16px', border: '1px solid var(--border-color)',
                  minWidth: '155px', flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'; }}
                >
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={p.logo}
                      alt={p.name}
                      style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain', display: 'block' }}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback initial badge if image fails */}
                    <div style={{ display: 'none', width: '44px', height: '44px', borderRadius: '10px', backgroundColor: p.color, color: '#fff', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>
                      {p.name[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why EventSphere – Premium Feature Cards ──────────────────── */}
        <section style={{ padding: 'clamp(3rem,7vw,6rem) 5%' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem,4vw,3.5rem)' }}>
              <h2 style={S.sectionTitle}>Why EventSphere?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem', maxWidth: '500px', margin: '0.5rem auto 0' }}>
                Everything you need to discover, book, and organize unforgettable events.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px,100%),1fr))', gap: '1.5rem' }}>
              {FEATURES.map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                  style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                >
                  {/* Graphic header */}
                  <div style={{ height: '120px', background: f.gradient, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ position: 'absolute', bottom: '-30px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                    <div style={{ fontSize: '3.5rem', lineHeight: 1, position: 'relative', zIndex: 1 }}>{f.icon}</div>
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Highlights</div>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.25rem', lineHeight: 1 }}>{f.stat}</div>
                    </div>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.6rem' }}>{f.title}</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.65', margin: 0 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ─── Event Detail Modal ────────────────────────────────────────────── */}
      {selectedEventModal && (
        <div style={S.overlay} onClick={() => setSelectedEventModal(null)}>
          <motion.div style={{ ...S.modal, maxWidth: '620px', textAlign: 'left', padding: 0, maxHeight: '92vh', overflowY: 'auto' }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 'clamp(150px,32vw,250px)', background: selectedEventModal.poster ? `url(${selectedEventModal.poster}) center/cover` : getGradient(selectedEventModal.title), position: 'relative' }}>
              <button onClick={() => setSelectedEventModal(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 'clamp(1.25rem,4vw,2rem)' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#FF2A5F', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{selectedEventModal.category}</span>
                {selectedEventModal.isFeatured && <span style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>⭐ Featured</span>}
              </div>
              <h2 style={{ margin: '0 0 1rem', color: 'var(--text-primary)', fontSize: 'clamp(1.2rem,4vw,1.7rem)' }}>{selectedEventModal.title}</h2>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {selectedEventModal.date && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} />{new Date(selectedEventModal.date).toLocaleDateString()}</div>}
                {selectedEventModal.location && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} />{selectedEventModal.location}</div>}
                {selectedEventModal.time && <div>🕐 {selectedEventModal.time}</div>}
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '1.25rem' }}>{selectedEventModal.description || 'No description provided.'}</p>

              {selectedEventModal.speakers?.length > 0 && (
                <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Mic size={16} color="#8b5cf6" /> Speakers &amp; Performers</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {selectedEventModal.speakers.map(sp => (
                      <button
                        key={sp._id}
                        onClick={() => setSelectedArtist(sp)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.3)', cursor: 'pointer', transition: '0.2s', background: 'rgba(139,92,246,0.06)' }}
                        onMouseOver={e => { e.currentTarget.style.background='rgba(139,92,246,0.14)'; e.currentTarget.style.borderColor='rgba(139,92,246,0.6)'; }}
                        onMouseOut={e => { e.currentTarget.style.background='rgba(139,92,246,0.06)'; e.currentTarget.style.borderColor='rgba(139,92,246,0.3)'; }}
                        title={`View ${sp.name}'s profile`}
                      >
                        {sp.photo ? <img src={sp.photo} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#8E2DE2,#4A00E0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{sp.name[0]}</div>}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{sp.name}</div>
                          <div style={{ fontSize: '0.76rem', color: '#8b5cf6' }}>{sp.role}{sp.genre ? ` · ${sp.genre}` : ''}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedEventModal.sessions?.length > 0 && (
                <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>📋 Schedule</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {selectedEventModal.sessions.map((s, i) => (
                      <div key={i} style={{ backgroundColor: 'var(--bg-color)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.82rem' }}>{s.time}</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>{s.title}</div>
                        {(s.speaker || s.location) && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.speaker}{s.speaker && s.location ? ' · ' : ''}{s.location}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Select Ticket Type</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {(selectedEventModal.hasMultipleTickets && selectedEventModal.tickets?.length > 0 
                    ? selectedEventModal.tickets.map(t => ({ tier: t.name, price: t.price, soldOut: t.soldOut || false }))
                    : ['Standard', ...(selectedEventModal.category === 'Concert' ? ['VIP', 'Meet & Greet'] : [])].map(tier => ({
                        tier,
                        price: selectedEventModal.price * (tier === 'VIP' ? 2 : tier === 'Meet & Greet' ? 4 : 1),
                        soldOut: false,
                      }))
                  ).map(({tier, price, soldOut}) => (
                    <div
                      key={tier}
                      onClick={() => !soldOut && setTicketType(tier)}
                      style={{
                        padding: '11px 16px',
                        border: soldOut ? '1px solid var(--border-color)' : ticketType === tier ? '2px solid #FF2A5F' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        cursor: soldOut ? 'not-allowed' : 'pointer',
                        flex: '1 1 110px',
                        textAlign: 'center',
                        backgroundColor: soldOut ? 'rgba(0,0,0,0.03)' : ticketType === tier ? 'rgba(255,42,95,0.06)' : 'var(--bg-surface)',
                        opacity: soldOut ? 0.55 : 1,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {soldOut && (
                        <div style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sold Out</div>
                      )}
                      <div style={{ fontWeight: 700, color: soldOut ? 'var(--text-secondary)' : ticketType === tier ? '#FF2A5F' : 'var(--text-primary)', fontSize: '0.9rem' }}>{tier}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>{price === 0 ? 'FREE' : `Rs. ${price}`}</div>
                    </div>
                  ))}
                </div>
              </div>
              {(() => {
                const isSelectedSoldOut = selectedEventModal.hasMultipleTickets && selectedEventModal.tickets?.find(t => t.name === ticketType)?.soldOut;
                return (
                  <button
                    style={{ ...S.btnBook, width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '1.25rem', borderRadius: '12px', opacity: isSelectedSoldOut ? 0.5 : 1, cursor: isSelectedSoldOut ? 'not-allowed' : 'pointer' }}
                    disabled={!!isSelectedSoldOut}
                    onClick={() => { if (!isSelectedSoldOut) { handleBookTicket(selectedEventModal, ticketType); setSelectedEventModal(null); setTicketType('Standard'); } }}
                  >
                    {isSelectedSoldOut ? '🚫 This Tier is Sold Out' : `Confirm Booking — ${(() => {
                      if (selectedEventModal.hasMultipleTickets && selectedEventModal.tickets?.length > 0) {
                        const matchedTicket = selectedEventModal.tickets.find(t => t.name === ticketType);
                        const price = matchedTicket ? matchedTicket.price : 0;
                        return price === 0 ? 'FREE' : `Rs. ${price}`;
                      } else {
                        const price = selectedEventModal.price * (ticketType === 'VIP' ? 2 : ticketType === 'Meet & Greet' ? 4 : 1);
                        return price === 0 ? 'FREE' : `Rs. ${price}`;
                      }
                    })()}`}
                  </button>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Success Modal ─────────────────────────────────────────────────── */}
      {successMsg && (
        <div style={S.overlay} onClick={() => setSuccessMsg(null)}>
          <motion.div style={S.modal} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
            <h2 style={{ margin: '0 0 0.5rem', color: '#0F172A' }}>Booking Confirmed!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Email sent to <strong>{successMsg.email}</strong></p>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#0F172A', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.75rem', fontSize: '1rem' }}>{successMsg.title}</h3>
              <div style={S.tRow}><span>📅 Date</span><span>{successMsg.date ? new Date(successMsg.date).toLocaleDateString() : 'TBA'}</span></div>
              <div style={S.tRow}><span>📍 Venue</span><span>{successMsg.location || 'TBA'}</span></div>
              <div style={S.tRow}><span>💰 Price</span><span style={{ color: '#10b981', fontWeight: 700 }}>{successMsg.price === 0 ? 'FREE' : `Rs. ${successMsg.price}`}</span></div>
            </div>
            <button style={{ ...S.btnBook, width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '13px' }} onClick={() => setSuccessMsg(null)}>Close</button>
          </motion.div>
        </div>
      )}

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#0F172A', padding: 'clamp(3rem,6vw,5rem) 5% 0', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'space-between', paddingBottom: '3rem' }}>
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '1rem' }} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); }}>
              <Ticket size={22} color="#FF2A5F" />
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '1px', background: 'linear-gradient(45deg,#FF2A5F,#FF7B9B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EVENTSPHERE</h2>
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.65', maxWidth: '270px', margin: 0, fontWeight: '400' }}>Pakistan's leading event discovery and ticketing platform. Book, organize, and experience the extraordinary.</p>
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
              {[
                { svg: <svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor'><path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/></svg>, href: 'https://instagram.com', color: '#E1306C' },
                { svg: <svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor'><path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/></svg>, href: 'https://facebook.com', color: '#1877F2' },
                { svg: <svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor'><path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z'/></svg>, href: 'https://twitter.com', color: '#000000' },
                { svg: <svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor'><path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/></svg>, href: 'https://linkedin.com', color: '#0A66C2' },
              ].map((s, i) => (
                <a key={i} href={s.href} target='_blank' rel='noreferrer'
                  style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: '0.2s', textDecoration: 'none' }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = s.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </div>
          <div style={{ flex: '2 1 380px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '0.9rem' }}>Company</h4>
              {[['About Us','/about'],['Careers','/careers'],['Contact','/contact']].map(([l,h]) => <Link key={l} to={h} style={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.87rem', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.color='#FF2A5F'} onMouseOut={e => e.currentTarget.style.color='#ffffff'}>{l}</Link>)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '0.9rem' }}>Discover</h4>
              {[['Concerts','/concerts'],['Expos','/'],['Workshops','/']].map(([l,h]) => <Link key={l} to={h} style={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.87rem', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.color='#FF2A5F'} onMouseOut={e => e.currentTarget.style.color='#ffffff'}>{l}</Link>)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h4 style={{ color: '#fff', margin: 0, fontSize: '0.9rem' }}>Host Events</h4>
              {[['List Your Event','/register'],['Ticketing','/services']].map(([l,h]) => <Link key={l} to={h} style={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.87rem', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.color='#FF2A5F'} onMouseOut={e => e.currentTarget.style.color='#ffffff'}>{l}</Link>)}
            </div>
          </div>
        </div>
        {/* Palestine solidarity in footer too */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem 0', textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: '0.82rem', margin: '0 0 4px' }}>
            🇵🇸 We stand in solidarity with the people of Palestine — Free Palestine 🕊️
          </p>
          <p style={{ color: '#334155', fontSize: '0.8rem', margin: 0 }}>
            &copy; {new Date().getFullYear()} EventSphere. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ─── Artist Popup ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedArtist && (
          <>
            {/* Single backdrop — z-index above event modal (9999) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedArtist(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 20000,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px) brightness(0.4)',
                WebkitBackdropFilter: 'blur(10px) brightness(0.4)',
              }}
            />
            {/* Centering wrapper — uses flex, NOT transform, so no framer conflict */}
            <div style={{
              position: 'fixed', inset: 0, zIndex: 20001,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem', pointerEvents: 'none',
            }}>
              <motion.div
                initial={{ scale: 0.86, opacity: 0, y: 28 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.86, opacity: 0, y: 28 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                onClick={e => e.stopPropagation()}
                style={{
                  pointerEvents: 'auto',
                  width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto',
                  borderRadius: 24, position: 'relative',
                  background: 'linear-gradient(150deg,#1a1035 0%,#100820 100%)',
                  border: '1px solid rgba(139,92,246,0.45)',
                  boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 40px 90px rgba(0,0,0,0.75), 0 0 60px rgba(106,17,203,0.35)',
                }}
              >
                {/* Close */}
                <button
                  onClick={() => setSelectedArtist(null)}
                  style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 20,
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                  }}
                >
                  <X size={15} />
                </button>

                {/* Photo hero — rounded top corners only */}
                <div style={{
                  height: 'clamp(180px,38vw,240px)',
                  background: 'linear-gradient(135deg,#4c1d95,#7c3aed,#a855f7)',
                  position: 'relative', overflow: 'hidden',
                  borderRadius: '24px 24px 0 0',
                }}>
                  {selectedArtist.photo ? (
                    <img
                      src={selectedArtist.photo}
                      alt={selectedArtist.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: 96, height: 96, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.65)',
                      }}>
                        {selectedArtist.name[0]}
                      </div>
                    </div>
                  )}
                  {/* Bottom fade into card */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', background: 'linear-gradient(to top,#100820,transparent)' }} />
                  {/* Name overlaid on photo */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.85rem 1.25rem' }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.25rem,5vw,1.6rem)', fontWeight: 900, lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
                      {selectedArtist.name}
                    </h2>
                  </div>
                </div>

                {/* Info body */}
                <div style={{ padding: '1.1rem 1.35rem 1.6rem' }}>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {selectedArtist.role && (
                      <span style={{ background: 'rgba(139,92,246,0.18)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)', padding: '4px 12px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700 }}>
                        {selectedArtist.role}
                      </span>
                    )}
                    {selectedArtist.genre && (
                      <span style={{ background: 'rgba(255,42,95,0.14)', color: '#ff7b9b', border: '1px solid rgba(255,42,95,0.3)', padding: '4px 12px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700 }}>
                        🎵 {selectedArtist.genre}
                      </span>
                    )}
                    {selectedArtist.expertise && (
                      <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 12px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700 }}>
                        ⚡ {selectedArtist.expertise}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {selectedArtist.bio ? (
                    <p style={{ color: '#b8a9d4', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 1.2rem', borderLeft: '3px solid rgba(139,92,246,0.55)', paddingLeft: '0.8rem' }}>
                      {selectedArtist.bio}
                    </p>
                  ) : (
                    <p style={{ color: '#5b4e72', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 1.2rem' }}>No biography available.</p>
                  )}

                  {/* Social link */}
                  {selectedArtist.socialLink && (
                    <a
                      href={selectedArtist.socialLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(124,58,237,0.22)', border: '1px solid rgba(139,92,246,0.5)',
                        color: '#c4b5fd', padding: '10px 20px', borderRadius: 12,
                        textDecoration: 'none', fontWeight: 600, fontSize: '0.86rem', transition: '0.2s',
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.38)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.22)'; }}
                    >
                      🔗 View Full Profile
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        *{box-sizing:border-box;}
        html{scroll-behavior:smooth;scroll-padding-top:130px;}
        body{margin:0;padding:0;font-family:'Inter',sans-serif;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#0F172A;}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:4px;}
        .custom-loader{width:38px;height:38px;border:4px solid #334155;border-top-color:#FF2A5F;border-radius:50%;animation:spin 1s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes marquee{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
        @keyframes palScroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
        html{scroll-behavior:smooth;}
        /* Responsive */
        @media(max-width:680px){
          .filter-toggle-btn{display:flex !important;}
        }
        @media(max-width:480px){
          .search-grp-city,.search-grp-cat,.search-divider-hide{display:none !important;}
        }
      `}</style>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const S = {
  palBanner: { backgroundColor: '#006233', overflow: 'hidden', position: 'relative', zIndex: 200 },
  palInner: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '7px 5%' },
  palFlag: { fontSize: '1.1rem', flexShrink: 0 },
  palScroll: { overflow: 'hidden', flex: 1 },
  palText: { display: 'inline-block', whiteSpace: 'nowrap', animation: 'palScroll 25s linear infinite', color: '#fff', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.5px' },

  hero: { backgroundColor: 'var(--nav-bg,#0F172A)', backgroundImage: 'radial-gradient(circle at 80% 20%,#1e1b4b 0%,transparent 40%),radial-gradient(circle at 20% 80%,#2e1065 0%,transparent 40%)', minHeight: '30vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(7rem,12vw,8rem) 5% 3rem', position: 'relative', textAlign: 'center' },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,42,95,0.15)', color: '#FF2A5F', border: '1px solid rgba(255,42,95,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' },
  heroTitle: { fontSize: 'clamp(2rem,7vw,4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-1px' },
  heroSub: { fontSize: 'clamp(0.9rem,2vw,1.1rem)', color: '#94a3b8', maxWidth: '500px', margin: '0 auto', lineHeight: '1.5' },

  searchWrap: { width: '100%', display: 'flex', justifyContent: 'center', marginTop: '1.75rem', zIndex: 20 },
  searchBar: { backgroundColor: 'var(--bg-surface,#fff)', borderRadius: '16px', padding: '0.7rem', display: 'flex', alignItems: 'center', boxShadow: '0 20px 40px rgba(15,23,42,0.18)', width: '100%', maxWidth: '950px', gap: '0.4rem', flexWrap: 'wrap' },
  searchGrp: { display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 160px', minWidth: '140px', padding: '0.35rem 0.75rem' },
  searchDivider: { width: '1px', height: '32px', backgroundColor: 'var(--border-color,#e2e8f0)', flexShrink: 0 },
  searchInput: { border: 'none', outline: 'none', fontSize: '0.93rem', color: 'var(--text-primary)', width: '100%', backgroundColor: 'transparent' },
  selectInput: { border: 'none', outline: 'none', fontSize: '0.93rem', color: 'var(--text-primary)', width: '100%', backgroundColor: 'transparent', cursor: 'pointer' },
  btnSearch: { backgroundColor: '#FF2A5F', color: '#fff', border: 'none', padding: '0.85rem 1.75rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.93rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },

  sectionTitle: { fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
  sectionSub: { color: '#64748b', fontSize: '0.92rem', marginTop: '0.3rem' },
  navBtn: { width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catPill: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '30px', fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s', flexShrink: 0 },
  btnBook: { backgroundColor: '#0F172A', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '4px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
  modal: { backgroundColor: 'var(--bg-surface,#fff)', borderRadius: '24px', padding: '2.5rem', maxWidth: '460px', width: '100%', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', textAlign: 'center' },
  tRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#475569' },
};

export default Home;
