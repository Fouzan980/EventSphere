import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Ticket, Globe, Mail, Phone, ArrowRight, CheckCircle, Loader2, Send, MapPin } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import api from '../utils/api';
import PublicNavbar from '../components/layout/PublicNavbar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';

const customMarker = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// --- Reusable Mini Components ---

const CurvedImageCard = ({ src, alt }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
    style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', height: '400px', width: '100%' }}
  >
    <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </motion.div>
);

const PageSplit = ({ title, content, imageSrc, reverse }) => (
  <div style={{ display: 'flex', flexDirection: reverse ? 'row-reverse' : 'row', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
    <div style={{ flex: '1 1 300px', minWidth: 'min(100%, 280px)' }}>
      <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', color: 'var(--text-primary)', marginBottom: '1.5rem', fontWeight: 800 }}>{title}</h2>
      <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8' }}>{content}</div>
    </div>
    <div style={{ flex: '1 1 300px', minWidth: 'min(100%, 280px)' }}>
      <CurvedImageCard src={imageSrc} alt={title} />
    </div>
  </div>
);

// --- Dynamic Sections ---

const PageContact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/contact/subscribe', formData);
      setStatus('idle');
      toast.success('Successfully Subscribed! Check your email.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('idle');
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 300px', minWidth: 'min(100%, 280px)', display: 'flex' }}>
        <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', flex: 1, minHeight: '400px', width: '100%' }}>
          <MapContainer center={[24.8569, 67.0478]} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[24.8569, 67.0478]} icon={customMarker}>
              <Popup>
                <strong>EventSphere Office</strong><br />
                Shahrah-e-Faisal, Karachi
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
      <div style={{ flex: '1 1 300px', minWidth: 'min(100%, 280px)', backgroundColor: 'var(--bg-surface)', padding: 'clamp(1.5rem, 5vw, 3rem)', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '1.5rem', fontWeight: 800 }}>Get In Touch & Subscribe</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Subscribe to our newsletter to receive the latest updates directly from the system whenever a new event drops!</p>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }} onSubmit={handleSubmit}>
          <input 
            style={formStyles.input} placeholder="Your Name" required value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <input 
            style={formStyles.input} type="email" placeholder="Your Email Address" required value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <textarea 
            style={{ ...formStyles.input, minHeight: '120px', resize: 'vertical' }} placeholder="Optional Message..." value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
          />
          <button style={formStyles.btn} type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Subscribe & Send</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const PageEventsCategory = ({ category }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then(res => {
      // Filter dynamically or show random if category missing to ensure UI isn't empty
      let filtered = res.data.filter(e => e.category && (e.category.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(e.category.toLowerCase())));
      if (filtered.length === 0) filtered = res.data.slice(0, 3); // fallback
      setEvents(filtered);
      setLoading(false);
    });
  }, [category]);

  const images = {
    Concerts: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    Comedy: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80',
    Theater: 'https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=800&q=80'
  };

  return (
    <div>
      <PageSplit
        title={`Live ${category} Experiences`}
        content={`Discover breathtaking ${category} events curated for you. Never miss a moment of entertainment.`}
        imageSrc={images[category] || images.Concerts}
        reverse
      />
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Upcoming {category} Events</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={36} color="#FF2A5F" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {events.map((ev, i) => (
              <motion.div key={ev._id || i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.85rem', overflow: 'hidden' }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, background: ev.poster ? `url(${ev.poster}) center/cover` : 'linear-gradient(135deg,#FF2A5F,#a855f7)', overflow: 'hidden' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#FF2A5F', fontWeight: 600, marginTop: 2 }}>{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {ev.location || 'TBA'}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PageListEvent = () => {
  const [form, setForm] = useState({ email: '', company: '', eventName: '', date: '', location: '', details: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/contact/subscribe', {
        name: form.company,
        email: form.email,
        message: `Event Listing Inquiry\nEvent: ${form.eventName}\nDate: ${form.date}\nLocation: ${form.location}\nDetails: ${form.details}`,
      });
      toast.success('Inquiry sent! We will get back to you shortly.');
      setForm({ email: '', company: '', eventName: '', date: '', location: '', details: '' });
    } catch {
      toast.error('Failed to send. Please try again.');
    }
    setStatus('idle');
  };

  return (
    <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Left — info */}
      <div style={{ flex: '1 1 280px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF2A5F', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>For Organizers</div>
        <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 1rem', lineHeight: 1.2 }}>Host Like a Pro</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Empower your events with state-of-the-art management tools — real-time analytics, instant payouts, and custom floor plans. Fill the form and our team will reach out within 24 hours.
        </p>
        {[['🎯', 'Instant Ticketing', 'Go live in minutes with our setup wizard.'],
          ['📊', 'Real-Time Analytics', 'Track sales, check-ins and revenue live.'],
          ['💳', 'Fast Payouts', 'Get paid within 48 hours of your event.'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: '0.85rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right — compact form card */}
      <div style={{ flex: '1 1 300px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Submit an Inquiry</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input required placeholder="Your Email" type="email" style={formStyles.input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Company / Organizer Name" style={formStyles.input} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          <input required placeholder="Event Name" style={formStyles.input} value={form.eventName} onChange={e => setForm({ ...form, eventName: e.target.value })} />
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <input placeholder="Date (e.g. May 10)" style={{ ...formStyles.input, flex: 1 }} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input placeholder="City" style={{ ...formStyles.input, flex: 1 }} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <textarea required placeholder="Brief event details..." style={{ ...formStyles.input, minHeight: 80, resize: 'vertical' }} value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
          <button type="submit" disabled={status === 'loading'} style={{ ...formStyles.btn, marginTop: '0.25rem' }}>
            {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Send Inquiry</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const PageAboutUs = () => {
  const sections = [
    { icon: '🚀', title: 'How We Started',    text: 'Born in 2023 with one vision — unify live entertainment discovery and ticketing into a single seamless platform.',        accent: '#FF2A5F' },
    { icon: '🔍', title: 'The Problem We Saw', text: 'Fans faced crashing sites and hidden fees. Organizers juggled spreadsheets and manual validators just to run a concert.',   accent: '#a855f7' },
    { icon: '🛠️', title: 'The Journey',        text: 'Late-night sessions, live stress tests, and direct work with venue managers forged the robust ecosystem we built.',          accent: '#3b82f6' },
    { icon: '⚡', title: 'Where We Stand',      text: 'Thousands of secure transactions per minute, dynamic directories, and zero-friction hosting from workshops to global expos.', accent: '#10b981' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Header strip */}
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#0F172A)', borderRadius: 24, padding: 'clamp(2rem,5vw,3.5rem)', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF2A5F', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>Our Story</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: '#fff', margin: '0 0 1rem', fontWeight: 900, lineHeight: 1.15 }}>Built for the love<br />of <span style={{ color: '#FF2A5F' }}>live experiences</span></h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, margin: 0, fontSize: '1rem' }}>
            EventSphere was born from a simple belief — discovering and hosting a live event should be as exciting as the event itself. We built the platform we always wished existed.
          </p>
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[['2023', 'Founded'], ['50K+', 'Attendees'], ['1,200+', 'Events'], ['12', 'Cities']].map(([num, label]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 20px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FF2A5F' }}>{num}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Story cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {sections.map(({ icon, title, text, accent }) => (
          <div key={title}
            style={{ background: '#0F172A', border: `1px solid ${accent}30`, borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${accent}22`; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '1.5rem' }}>{icon}</div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.6', color: '#94a3b8' }}>{text}</p>
          </div>
        ))}
      </div>

      {/* Closing banner */}
      <div style={{ background: 'linear-gradient(135deg,#FF2A5F18,#a855f718)', border: '1px solid rgba(255,42,95,0.2)', borderRadius: 20, padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '2.5rem' }}>🌍🚀</div>
        <div>
          <h3 style={{ margin: '0 0 6px', color: '#f1f5f9', fontWeight: 800, fontSize: '1.2rem' }}>This is just the beginning.</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7 }}>
            We're continuously pushing boundaries — adding new cities, new features, and new ways to make every event unforgettable. The best is yet to come.
          </p>
        </div>
      </div>

    </div>
  );
};


const PagePricing = () => (
  <div>
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
      <h2 style={{ fontSize: '2.5rem', color: '#0F172A', fontWeight: 800 }}>Simple, Transparent Pricing</h2>
      <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Whether you're hosting a small meetup or a massive international festival, we have a plan for you.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
      {[
        { name: 'Starter', price: 'Free', desc: 'Perfect for small, local events.', features: ['Up to 100 tickets', 'Basic analytics', 'Email support'] },
        { name: 'Pro', price: '$49/mo', desc: 'For growing event organizers.', features: ['Unlimited tickets', 'Advanced dashboard', 'Priority support', 'Custom seating'], highlight: true },
        { name: 'Enterprise', price: 'Custom', desc: 'World-class scale and power.', features: ['Dedicated account manager', 'White-labeling', 'API Access', 'On-site team'] }
      ].map((plan, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          style={{ 
            backgroundColor: '#fff', borderRadius: '24px', padding: '3rem 2rem', 
            boxShadow: plan.highlight ? '0 20px 40px rgba(255, 42, 95, 0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
            border: plan.highlight ? '2px solid #FF2A5F' : '1px solid #e2e8f0',
            position: 'relative', overflow: 'hidden'
          }}
        >
          {plan.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#FF2A5F', color: '#fff', textAlign: 'center', padding: '6px', fontSize: '0.8rem', fontWeight: 700 }}>MOST POPULAR</div>}
          <h3 style={{ fontSize: '1.5rem', color: '#0F172A', margin: 0 }}>{plan.name}</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '1rem 0', color: plan.highlight ? '#FF2A5F' : '#0F172A' }}>{plan.price}</div>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>{plan.desc}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {plan.features.map((f, j) => (
              <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontWeight: 500 }}><CheckCircle size={18} color="#10b981" /> {f}</li>
            ))}
          </ul>
          <button style={{ ...formStyles.btn, backgroundColor: plan.highlight ? '#FF2A5F' : '#f1f5f9', color: plan.highlight ? '#fff' : '#0F172A' }}>Choose Plan</button>
        </motion.div>
      ))}
    </div>
  </div>
);

const PageCareers = () => {
  const [selectedJob, setSelectedJob] = useState(null);

  const jobs = [
    { title: 'Senior React Engineer', type: 'Remote', dept: 'Engineering', desc: 'Join our core team to build the future of event experiences using React and Node.js. 5+ years experience required.' },
    { title: 'Event Success Manager', type: 'Karachi, Pakistan', dept: 'Operations', desc: 'Ensure our top-tier events in Pakistan run flawlessly. You will collaborate directly with organizers, handle venue operations, and manage on-ground staff.' },
    { title: 'Product Designer (UI/UX)', type: 'Remote', dept: 'Design', desc: 'Design breathtaking and highly functional interfaces for our global user base.' },
  ];

  return (
    <div>
      <PageSplit 
        title="Join the EventSphere Team" 
        content="We are a group of passionate creators, engineers, and dreamers building the future of live experiences. We value diversity, creativity, and the relentless pursuit of excellence." 
        imageSrc="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80" 
      />
      <div style={{ marginTop: '3rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Open Positions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {jobs.map((job, i) => (
            <div key={i} onClick={() => setSelectedJob(job)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: '14px', transition: 'border-color 0.2s, background 0.2s', cursor: 'pointer', background: 'var(--bg-color)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF2A5F'; e.currentTarget.style.background = 'rgba(255,42,95,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-color)'; }}>
              <div>
                <h4 style={{ margin: '0 0 3px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{job.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{job.dept} • {job.type}</p>
              </div>
              <ArrowRight size={18} color="#FF2A5F" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Job Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '20px', maxWidth: '480px', width: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedJob.title}</h3>
              <p style={{ margin: '0 0 1rem', color: '#FF2A5F', fontSize: '0.88rem', fontWeight: 600 }}>{selectedJob.dept} • {selectedJob.type}</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.75rem', fontSize: '0.95rem' }}>{selectedJob.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <a href={`mailto:hello@eventsphere.com?subject=Application: ${selectedJob.title}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF2A5F', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                  <Mail size={16} /> Apply via Email
                </a>
                <button onClick={() => setSelectedJob(null)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Shell Component ---

const WebsitePage = ({ title, subtitle }) => {
  useContext(AuthContext);
  useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const renderContent = () => {
    switch (title) {
      case 'Contact Us': return <PageContact />;
      case 'Concerts': case 'Comedy': case 'Theater': return <PageEventsCategory category={title} />;
      case 'Pricing': return <PagePricing />;
      case 'Careers': return <PageCareers />;
      case 'List Your Event': return <PageListEvent />;
      case 'Ticketing Services': return <PageSplit title="Ticketing, Mastered" content="Our platform handles high-volume traffic with 99.9% uptime. Secure blockchain-verified tickets mean zero fraud and absolute peace of mind." imageSrc="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80" reverse />;
      case 'About Us': return <PageAboutUs />;
      default: return <PageSplit title={title} content="Welcome to the page!" imageSrc="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80" />;
    }
  };

  return (
    <div style={shellStyles.container}>
      <PublicNavbar />

      {/* Hero Section */}
      <header style={shellStyles.heroSection}>
        <div style={shellStyles.heroContent}>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={shellStyles.heroTitle}>
            {title}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={shellStyles.heroSubtitle}>
            {subtitle}
          </motion.p>
        </div>
      </header>

      {/* Main Dynamically Rendered Domain */}
      <main style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', padding: '6rem 5%', flexGrow: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer style={shellStyles.footer}>
        <div style={shellStyles.footerInner}>
          <div style={shellStyles.footerCol}>
            <div style={shellStyles.logo} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); }}>
              <Ticket size={24} color="#FF2A5F" />
              <h2 style={{...shellStyles.brandTitle, fontSize: '1.2rem', color: '#fff'}}>EVENTSPHERE</h2>
            </div>
            <p style={{color: '#94a3b8', fontSize: '0.9rem', marginTop: '1rem', lineHeight: '1.6', maxWidth: '300px'}}>
              The leading ticketing discovery platform for live experiences. We make booking easy, secure, and fast.
            </p>
            <div style={shellStyles.socialIcons}>
<a href='https://instagram.com' target='_blank' rel='noreferrer' style={{...shellStyles.iconCircle,textDecoration:'none'}} onMouseOver={e=>e.currentTarget.style.backgroundColor='#E1306C'} onMouseOut={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'}><svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor'><path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/></svg></a>
              <a href='https://facebook.com' target='_blank' rel='noreferrer' style={{...shellStyles.iconCircle,textDecoration:'none'}} onMouseOver={e=>e.currentTarget.style.backgroundColor='#1877F2'} onMouseOut={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'}><svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor'><path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/></svg></a>
              <a href='https://twitter.com' target='_blank' rel='noreferrer' style={{...shellStyles.iconCircle,textDecoration:'none'}} onMouseOver={e=>e.currentTarget.style.backgroundColor='#000'} onMouseOut={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'}><svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor'><path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z'/></svg></a>
              <a href='https://linkedin.com' target='_blank' rel='noreferrer' style={{...shellStyles.iconCircle,textDecoration:'none'}} onMouseOver={e=>e.currentTarget.style.backgroundColor='#0A66C2'} onMouseOut={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'}><svg viewBox='0 0 24 24' width='17' height='17' fill='currentColor'><path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/></svg></a>
            </div>
          </div>
          <div style={shellStyles.footerLinksGrid}>
             <div style={shellStyles.fCol}>
               <h4>Company</h4>
               <Link to="/about" style={shellStyles.footerLink}>About Us</Link>
               <Link to="/careers" style={shellStyles.footerLink}>Careers</Link>
               <Link to="/contact" style={shellStyles.footerLink}>Contact Us</Link>
             </div>
             <div style={shellStyles.fCol}>
               <h4>Discover</h4>
               <Link to="/concerts" style={shellStyles.footerLink}>Concerts</Link>
               <Link to="/comedy" style={shellStyles.footerLink}>Comedy</Link>
               <Link to="/theater" style={shellStyles.footerLink}>Theater</Link>
             </div>
             <div style={shellStyles.fCol}>
               <h4>Host Events</h4>
               <Link to="/list-event" style={shellStyles.footerLink}>List your event</Link>
               <Link to="/services" style={shellStyles.footerLink}>Ticketing Services</Link>
             </div>
          </div>
        </div>
        <div style={shellStyles.footerBottom}>
           <p>&copy; {new Date().getFullYear()} EventSphere. Revolutionizing live experiences.</p>
        </div>
      </footer>
    </div>
  );
};

const formStyles = {
  input: { width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', backgroundColor: '#f8fafc', color: '#0F172A', transition: 'border-color 0.2s', fontFamily: 'inherit' },
  btn: { width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#1E3A8A', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 0.2s, background-color 0.2s' }
};

const shellStyles = {
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden', fontFamily: "'Inter', sans-serif" },
  navbar: { backgroundColor: 'var(--nav-bg)', color: 'var(--nav-text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 5%', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logo: { display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' },
  brandTitle: { margin: 0, fontSize: '1.5rem', fontWeight: '900', letterSpacing: '1px', color: '#fff' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '2rem' },
  navDivider: { width: '1px', height: '24px', backgroundColor: '#334155' },
  link: { color: '#cbd5e1', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem', transition: 'color 0.2s' },
  btnPrimary: { backgroundColor: '#FF2A5F', color: '#fff', padding: '0.6rem 1.4rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem', boxShadow: '0 4px 10px rgba(255, 42, 95, 0.4)' },
  btnLogout: { backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', transition: '0.2s' },
  heroSection: { backgroundColor: 'var(--nav-bg)', backgroundImage: `radial-gradient(circle at 80% 20%, #1e1b4b 0%, transparent 40%), radial-gradient(circle at 20% 80%, #2e1065 0%, transparent 40%)`, minHeight: '35vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(7rem, 12vw, 9rem) 5% 4rem', textAlign: 'center' },
  heroTitle: { fontSize: '3.5rem', fontWeight: '900', color: '#fff', lineHeight: '1.1', margin: '0 0 1rem 0' },
  heroSubtitle: { fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' },
  footer: { backgroundColor: '#0F172A', padding: '5rem 5% 2rem 5%', color: '#f8fafc', marginTop: 'auto' },
  footerInner: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'space-between', marginBottom: '3rem' },
  footerCol: { flex: '1 1 300px' },
  socialIcons: { display: 'flex', gap: '1rem', marginTop: '1.5rem' },
  iconCircle: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: '0.2s' },
  footerLinksGrid: { flex: '2 1 500px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem' },
  fCol: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  footerLink: { color: '#ffffff', textDecoration: 'none', transition: 'color 0.2s', fontWeight: '500' },
  footerBottom: { textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.9rem' }
};

export default WebsitePage;
