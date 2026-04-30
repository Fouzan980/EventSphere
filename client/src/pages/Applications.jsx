import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, XCircle, Clock, Plus, Building2, Map, Tag, Globe, Users, X } from 'lucide-react';
import { toast } from 'react-toastify';

const Applications = () => {
  const { user } = useContext(AuthContext);
  const [apps, setApps] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showApply, setShowApply] = useState(false);
  const [formData, setFormData] = useState({ 
    eventId: '', boothId: '', message: '',
    companyWebsite: '', productCategory: '', boothSizePreference: 'Standard (3x3)', expectedVisitors: ''
  });

  const fetchData = async () => {
    try {
      const [appRes, evRes] = await Promise.all([
        api.get('/applications'),
        api.get('/events')
      ]);
      setApps(appRes.data);
      setEvents(evRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // Fetch booths logic removed as Exhibitor no longer picks predefined booths

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/applications', formData);
      setShowApply(false);
      setFormData({ eventId: '', boothId: '', message: '', companyWebsite: '', productCategory: '', boothSizePreference: 'Standard (3x3)', expectedVisitors: '' });
      toast.success('Application submitted successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to apply: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/applications/${id}/status`, { status });
      toast.success(`Application ${status.toLowerCase()} successfully!`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (!user) return <div style={styles.container}>Please login.</div>;

  const getStatusConfig = (status) => {
    switch(status) {
      case 'Approved': return { color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={18} /> };
      case 'Rejected': return { color: '#e11d48', bg: '#ffe4e6', icon: <XCircle size={18} /> };
      default: return { color: '#d97706', bg: '#fef3c7', icon: <Clock size={18} /> };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Booth Applications</h1>
          <p style={styles.subtitle}>
            {user?.role === 'Organizer' 
              ? 'Review and manage incoming exhibitor requests for floor space.'
              : 'Secure prime floor space for your company at upcoming events.'}
          </p>
        </div>
        {user?.role === 'Exhibitor' && (
          <motion.button 
            whileTap={{ scale: 0.95 }}
            style={styles.btnAdd} 
            onClick={() => setShowApply(true)}
          >
            <Plus size={18} /> Reserve a Booth
          </motion.button>
        )}
      </div>

      <div style={styles.grid}>
        {loading ? (
          <p style={{color: 'var(--text-secondary)'}}>Loading robust applications data...</p>
        ) : apps.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
            <h3>No applications in the system yet.</h3>
            <p>Once you {user?.role === 'Organizer' ? 'receive' : 'submit'} a reservation request, it will appear here.</p>
          </div>
        ) : (
          <AnimatePresence>
            {apps.map(app => {
              const statusCfg = getStatusConfig(app.status);
              return (
                <motion.div 
                  key={app._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.card}
                >
                  <div style={styles.cardHeader}>
                    <div style={{...styles.statusBadge, backgroundColor: statusCfg.bg, color: statusCfg.color}}>
                      {statusCfg.icon}
                      {app.status}
                    </div>
                    {user?.role === 'Organizer' && app.status === 'Pending' && (
                      <div style={styles.actionBlock}>
                        <button style={styles.btnApprove} onClick={() => handleStatus(app._id, 'Approved')}>Approve</button>
                        <button style={styles.btnReject} onClick={() => handleStatus(app._id, 'Rejected')}>Reject</button>
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.cardBody}>
                    <h3 style={styles.eventName}>{app.eventId?.title || 'Unknown Event'}</h3>
                    {user?.role === 'Organizer' && (
                      <div style={styles.infoLine}>
                        <Building2 size={16} /> <strong>{app.exhibitorId?.companyName || 'Unknown Company'}</strong>
                      </div>
                    )}
                    
                    <div style={styles.infoLine}>
                      <Map size={16} /> Requested Space: <strong>{app.boothSizePreference || 'Standard'}</strong>
                    </div>

                    <div style={styles.messageBox}>
                      <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                        "{app.message || 'No additional comments provided.'}"
                      </p>
                    </div>
                    {app.productCategory && (
                      <div style={{...styles.infoLine, marginTop: '0.5rem'}}>
                        <Tag size={16} /> Product Category: <strong>{app.productCategory}</strong>
                      </div>
                    )}
                    {app.boothSizePreference && (
                      <div style={styles.infoLine}>
                        <Map size={16} /> Booth Size: <strong>{app.boothSizePreference}</strong>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Exhibitor Application Modal */}
      <AnimatePresence>
        {showApply && (
          <div style={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) setShowApply(false); }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={styles.modalContent}
            >
              <div style={styles.modalHeader}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'clamp(1rem, 4vw, 1.4rem)' }}>Reserve Floor Space</h2>
                <button
                  type="button"
                  onClick={() => setShowApply(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>
              <form onSubmit={handleApply} style={styles.modalBody} noValidate>
                <div style={styles.formGroup}>
                  <label style={styles.label}>1. Select Exhibition Event</label>
                  <select 
                    style={styles.input} 
                    value={formData.eventId} 
                    onChange={e => {
                      setFormData({...formData, eventId: e.target.value, boothId: ''});
                    }} 
                    required
                  >
                    <option value="">-- Choose an Event --</option>
                    {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                  </select>
                </div>
                
                {/* Removed Pick Available Booth Spot dropdown. Organizers will map manually. */}

                <div style={styles.formGroup}>
                  <label style={styles.label}>3. Product / Service Category</label>
                  <select 
                    style={styles.input} 
                    value={formData.productCategory} 
                    onChange={e => setFormData({...formData, productCategory: e.target.value})} 
                    required
                  >
                    <option value="">-- Select Category --</option>
                    <option value="Technology & Software">Technology & Software</option>
                    <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Food & Beverages">Food & Beverages</option>
                    <option value="Education & Training">Education & Training</option>
                    <option value="Finance & Banking">Finance & Banking</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>4. Booth Size Preference</label>
                  <select 
                    style={styles.input} 
                    value={formData.boothSizePreference} 
                    onChange={e => setFormData({...formData, boothSizePreference: e.target.value})}
                  >
                    <option value="Standard (3x3)">Standard (3x3)</option>
                    <option value="Medium (5x6)">Medium (5x6)</option>
                    <option value="Large (6x6)">Large (6x6)</option>
                    <option value="Premium Corner (9x6)">Premium Corner (9x6)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>5. Company Website</label>
                  <input 
                    type="url"
                    style={styles.input} 
                    placeholder="https://yourcompany.com" 
                    value={formData.companyWebsite} 
                    onChange={e => setFormData({...formData, companyWebsite: e.target.value})} 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>6. Expected Visitors at Your Booth</label>
                  <input 
                    type="number"
                    style={styles.input} 
                    placeholder="e.g. 200" 
                    min="1"
                    value={formData.expectedVisitors} 
                    onChange={e => setFormData({...formData, expectedVisitors: e.target.value})} 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>7. Additional Requests (Optional)</label>
                  <textarea 
                    style={{...styles.input, resize: 'vertical', minHeight: '80px'}} 
                    value={formData.message} 
                    onChange={e => setFormData({...formData, message: e.target.value})} 
                    placeholder="Special requirements, power outlets, signage clearance, etc."
                  />
                </div>
                
                <div style={styles.modalFooter}>
                  <button type="button" style={styles.btnCancel} onClick={() => setShowApply(false)}>Cancel</button>
                  <button type="submit" style={styles.btnSubmit}>Submit Application</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  container: { padding: '1rem' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  title: { fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: 'var(--text-primary)', fontWeight: 800, margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: 'clamp(0.8rem, 2vw, 1rem)' },
  btnAdd: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    backgroundColor: 'var(--primary-color)', color: '#fff',
    border: 'none', padding: '0.8rem 1.4rem', borderRadius: '10px',
    cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
    boxShadow: '0 4px 6px rgba(30, 58, 138, 0.2)', whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
    display: 'flex', flexDirection: 'column'
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem'
  },
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '6px 14px', borderRadius: '20px',
    fontSize: '0.85rem', fontWeight: 700
  },
  actionBlock: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  btnApprove: {
    backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px',
    borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'
  },
  btnReject: {
    backgroundColor: 'transparent', color: '#e11d48', border: '1px solid #e11d48',
    padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'
  },
  eventName: { fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' },
  infoLine: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)',
    marginBottom: '0.8rem', fontSize: '0.9rem', flexWrap: 'wrap'
  },
  messageBox: {
    marginTop: '1rem', padding: '1rem',
    backgroundColor: 'var(--bg-color)', borderRadius: '10px',
    borderLeft: '4px solid var(--border-color)'
  },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-color)' },
  modalBackdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: 'clamp(0.5rem, 3vw, 1.5rem)', overflowY: 'auto',
  },
  modalContent: {
    backgroundColor: 'var(--bg-surface)', borderRadius: '20px',
    width: '100%', maxWidth: '540px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex', flexDirection: 'column',
    maxHeight: '90vh', overflow: 'hidden',
    margin: 'auto',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'clamp(1rem, 3vw, 1.5rem)', borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
  },
  modalBody: {
    padding: 'clamp(1rem, 3vw, 1.5rem)',
    overflowY: 'auto', flex: 1,
  },
  formGroup: { marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '0.95rem', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.2rem', flexWrap: 'wrap' },
  btnCancel: { padding: '11px 22px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' },
  btnSubmit: { padding: '11px 22px', borderRadius: '10px', border: 'none', background: 'var(--primary-color)', color: '#fff', fontWeight: 600, cursor: 'pointer', flex: 1, minWidth: 140 }
};

export default Applications;
