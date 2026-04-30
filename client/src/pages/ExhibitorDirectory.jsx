import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Filter, BadgeCheck, X, Mail } from 'lucide-react';
import api from '../utils/api';
import PublicNavbar from '../components/layout/PublicNavbar';

const BIO_LIMIT = 130;

const ExhibitorDirectory = () => {
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);

  const toggleExpand = (id) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  useEffect(() => {
    const fetchExhibitors = async () => {
      try {
        const { data } = await api.get('/users/exhibitors');
        setExhibitors(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExhibitors();
  }, []);

  const filteredExhibitors = exhibitors.filter(e => {
    const term = searchQuery.toLowerCase();
    const nameMatch = (e.companyName || e.name).toLowerCase().includes(term);
    const bioMatch = e.bio?.toLowerCase().includes(term);
    return nameMatch || bioMatch;
  });

  return (
    <div style={styles.container}>
      <PublicNavbar />
      
      <main style={{ padding: '2rem 5% 4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem', alignItems: 'center', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
              Explore <span style={{ color: '#FF2A5F' }}>Exhibitors</span>
            </h1>
            
            {/* Search Bar */}
            <div style={{ ...styles.searchBar, width: '100%', maxWidth: '700px', margin: '0 auto', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
              <div style={styles.searchInputGroup}>
                <Search size={22} color="#94a3b8" />
                <input
                  style={styles.searchInput}
                  type="text"
                  placeholder="Search by company name, keywords, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <Search size={18} style={{ opacity: 0 }} />
                  </button>
                )}
              </div>
              <button style={styles.btnSearch}>Search</button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
               <div className="custom-loader"></div>
            </div>
          ) : filteredExhibitors.length === 0 ? (
            <div style={styles.emptyState}>
              <Filter size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
              <h3 style={{color: 'var(--text-primary)'}}>No exhibitors found.</h3>
              <p style={{color: 'var(--text-secondary)'}}>Try adjusting your search terms.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredExhibitors.map((exhibitor, index) => (
                <motion.div 
                  key={exhibitor._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  style={styles.card}
                >
                  <div style={styles.cardHeader}>
                    {exhibitor.avatar ? (
                      <img src={exhibitor.avatar} alt={exhibitor.companyName || exhibitor.name} style={styles.avatar} />
                    ) : (
                      <div style={styles.avatarFallback}>{(exhibitor.companyName || exhibitor.name).charAt(0)}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.2rem' }}>
                        <h4 style={styles.companyName} className="text-truncate">{exhibitor.companyName || exhibitor.name}</h4>
                        {exhibitor.isVerified && <BadgeCheck size={18} color="#10b981" fill="#d1fae5" title="Verified Exhibitor" style={{ flexShrink: 0 }} />}
                      </div>
                      {exhibitor.companyName && <div style={styles.contactName} className="text-truncate">{exhibitor.name}</div>}
                      {exhibitor.niche && (
                        <div style={{ ...styles.badge, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'inline-block', marginTop: '8px' }}>
                          {exhibitor.niche}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={styles.cardBody}>
                    {(() => {
                      const bio = exhibitor.bio || 'This exhibitor has not provided a bio yet.';
                      const isLong = bio.length > BIO_LIMIT;
                      const isExpanded = expandedIds.has(exhibitor._id);
                      return (
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ ...styles.bio, marginBottom: '0.25rem' }}>
                            {isLong && !isExpanded ? bio.slice(0, BIO_LIMIT) + '…' : bio}
                          </p>
                          {isLong && (
                            <button onClick={() => toggleExpand(exhibitor._id)}
                              style={{ background: 'none', border: 'none', color: '#FF2A5F', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}>
                              {isExpanded ? 'View Less ▲' : 'View More ▼'}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    <div style={styles.footerFlex}>
                      {exhibitor.website && (
                        <a href={exhibitor.website.startsWith('http') ? exhibitor.website : `https://${exhibitor.website}`} target="_blank" rel="noopener noreferrer" style={styles.linkObj}>
                          <Globe size={16} /> Website
                        </a>
                      )}
                      <button onClick={() => setSelectedExhibitor(exhibitor)}
                        style={{ marginLeft: 'auto', background: '#FF2A5F', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Full Profile
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Full Profile Modal ── */}
      <AnimatePresence>
        {selectedExhibitor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedExhibitor(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2001,
                width: 'min(520px, 94vw)', maxHeight: '88vh', overflowY: 'auto',
                background: 'var(--bg-surface)', borderRadius: 20, padding: '2rem',
                border: '1px solid var(--border-color)', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
              <button onClick={() => setSelectedExhibitor(null)}
                style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(100,116,139,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>

              {/* Avatar + name */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                {selectedExhibitor.avatar
                  ? <img src={selectedExhibitor.avatar} alt="" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', border: '2px solid rgba(255,42,95,0.2)', flexShrink: 0 }} />
                  : <div style={{ width: 80, height: 80, borderRadius: 16, background: 'linear-gradient(135deg,#FF416C,#FF4B2B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{(selectedExhibitor.companyName || selectedExhibitor.name).charAt(0)}</div>}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedExhibitor.companyName || selectedExhibitor.name}</h2>
                    {selectedExhibitor.isVerified && <BadgeCheck size={20} color="#10b981" fill="#d1fae5" />}
                  </div>
                  {selectedExhibitor.companyName && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{selectedExhibitor.name}</div>}
                  {selectedExhibitor.niche && <span style={{ display: 'inline-block', marginTop: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '3px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700 }}>{selectedExhibitor.niche}</span>}
                </div>
              </div>

              {/* Bio */}
              {selectedExhibitor.bio && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', marginBottom: 6 }}>About</div>
                  <p style={{ margin: 0, fontSize: '0.93rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selectedExhibitor.bio}</p>
                </div>
              )}

              {/* Links */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {selectedExhibitor.website && (
                  <a href={selectedExhibitor.website.startsWith('http') ? selectedExhibitor.website : `https://${selectedExhibitor.website}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}>
                    <Globe size={15} /> Visit Website
                  </a>
                )}
                {selectedExhibitor.email && (
                  <a href={`mailto:${selectedExhibitor.email}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,42,95,0.1)', color: '#FF2A5F', padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}>
                    <Mail size={15} /> Email
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-loader { width: 40px; height: 40px; border: 4px solid #334155; border-top-color: #FF2A5F; border-radius: 50%; animation: spin 1s infinite linear; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    backgroundColor: 'var(--bg-color)', paddingTop: '130px'
  },
  searchBar: {
    backgroundColor: 'var(--bg-surface)', borderRadius: '16px', padding: '0.6rem', display: 'flex', alignItems: 'center',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '800px', gap: '0.5rem',
  },
  searchInputGroup: {
    display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, padding: '0.5rem 1rem', minWidth: 0
  },
  searchInput: {
    border: 'none', outline: 'none', fontSize: '1rem', color: 'var(--text-primary)', width: '100%', backgroundColor: 'transparent'
  },
  btnSearch: {
    backgroundColor: '#FF2A5F', color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap'
  },
  sectionHeader: {
    marginBottom: '3rem'
  },
  sectionTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem'
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'clamp(1rem, 3vw, 2rem)'
  },
  card: {
    backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  cardHeader: {
    padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', position: 'relative'
  },
  avatar: {
    width: '75px', height: '75px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,42,95,0.1)', backgroundColor: 'var(--bg-color)', flexShrink: 0
  },
  avatarFallback: {
    width: '75px', height: '75px', borderRadius: '16px', background: 'linear-gradient(135deg, #FF416C, #FF4B2B)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '800', flexShrink: 0
  },
  companyName: {
    fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.2rem 0'
  },
  contactName: {
    fontSize: '0.85rem', color: 'var(--text-secondary)'
  },
  cardBody: {
    padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1
  },
  bio: {
    fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem', flexGrow: 1
  },
  footerFlex: {
    display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto'
  },
  linkObj: {
    display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600'
  },
  badge: {
    backgroundColor: 'rgba(255, 42, 95, 0.1)', color: '#FF2A5F', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800'
  },
  emptyState: {
    textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-color)'
  }
};

export default ExhibitorDirectory;
