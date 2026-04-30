import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Building2, FileText, Search, UserCheck, UserX, ChevronDown, Trash2, ShieldCheck, Download, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageSkeleton } from '../components/Skeleton';

const TABS = ['All Users', 'Exhibitors', 'Applications', 'Verifications', 'Settings'];

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('All Users');
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [savingBanner, setSavingBanner] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersRes, appsRes, bannerRes] = await Promise.all([
          api.get('/users'),
          api.get('/applications'),
          api.get('/settings/globalBanner').catch(() => ({ data: { value: 'Free Palestine 🇵🇸 | Standing in Solidarity' } }))
        ]);
        setUsers(usersRes.data);
        setApplications(appsRes.data);
        setBannerText(bannerRes.data.value || '');
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'Organizer') loadData();
  }, [user]);

  const handleSaveBanner = async () => {
    setSavingBanner(true);
    try {
      await api.put('/settings/globalBanner', { value: bannerText });
      toast.success('Global banner updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update banner');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleVerificationUpdate = async (userId, status) => {
    try {
      const res = await api.put(`/users/${userId}/verification`, { status });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, verificationStatus: res.data.status, isVerified: res.data.isVerified } : u));
      toast.success('Verification updated');
    } catch (err) {
      toast.error('Failed to update verification: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to permanently delete this account? This action cannot be undone.")) {
      try {
        await api.delete(`/users/${userId}`);
        setUsers(prev => prev.filter(u => u._id !== userId));
        toast.success('User deleted');
      } catch (err) {
        toast.error("Failed to delete user: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const exhibitors = filteredUsers.filter(u => u.role === 'Exhibitor');
  const verifications = filteredUsers.filter(u => u.verificationStatus && u.verificationStatus !== 'None');
  const allUsers = filteredUsers;

  if (user?.role !== 'Organizer') {
    return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Access denied. Organizers only.</div>;
  }

  const getRoleBadge = (role) => {
    const map = {
      Organizer: { bg: '#dbeafe', color: '#1d4ed8' },
      Exhibitor: { bg: '#fef3c7', color: '#b45309' },
      Attendee: { bg: '#dcfce7', color: '#15803d' },
    };
    const style = map[role] || { bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ ...styles.badge, backgroundColor: style.bg, color: style.color }}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      Approved: { bg: '#dcfce7', color: '#15803d' },
      Rejected: { bg: '#ffe4e6', color: '#b91c1c' },
      Pending: { bg: '#fef3c7', color: '#b45309' },
    };
    const s = map[status] || map.Pending;
    return <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>{status}</span>;
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.subtitle}>Manage all users, exhibitors, and booth applications on the platform.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Users', value: users.length, icon: <Users size={24} />, color: '#1d4ed8' },
          { label: 'Exhibitors', value: users.filter(u => u.role === 'Exhibitor').length, icon: <Building2 size={24} />, color: '#b45309' },
          { label: 'Pending Verifs', value: users.filter(u => u.verificationStatus === 'Pending').length, icon: <ShieldCheck size={24} />, color: '#10b981' },
          { label: 'Applications', value: applications.length, icon: <FileText size={24} />, color: '#7c3aed' },
          { label: 'Pending Apps', value: applications.filter(a => a.status === 'Pending').length, icon: <ChevronDown size={24} />, color: '#d97706' },
        ].map(stat => (
          <div key={stat.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: stat.color + '20', color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p style={styles.statValue}>{stat.value}</p>
              <p style={styles.statLabel}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab}
            style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== 'Applications' && activeTab !== 'Settings' && (
        <div style={styles.searchBox}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search by name or email..."
            style={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <PageSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          {/* ALL USERS TAB */}
          {activeTab === 'All Users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Company</th>
                      <th style={styles.th}>Joined</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u._id} style={styles.tr}>
                        <td style={styles.td}><strong>{u.name}</strong></td>
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>{getRoleBadge(u.role)}</td>
                        <td style={styles.td}>{u.companyName || '—'}</td>
                        <td style={styles.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          {user._id !== u._id && (
                            <button onClick={() => handleDeleteUser(u._id)} style={styles.btnDelete} title="Delete User">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allUsers.length === 0 && <div style={styles.empty}>No users found.</div>}
              </div>
            </motion.div>
          )}

          {/* EXHIBITORS TAB */}
          {activeTab === 'Exhibitors' && (
            <motion.div key="exhibitors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={styles.grid}>
                {exhibitors.map(ex => (
                  <div key={ex._id} style={styles.exhibitorCard}>
                    <div style={styles.exhibitorAvatar}>
                      {ex.name?.charAt(0).toUpperCase() || 'E'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={styles.exName}>{ex.name}</h4>
                      <p style={styles.exEmail}>{ex.email}</p>
                      {ex.companyName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#64748b', fontSize: '0.85rem' }}>
                          <Building2 size={14} /> {ex.companyName}
                        </div>
                      )}
                    </div>
                    <div>{getRoleBadge(ex.role)}</div>
                    <div>
                      <button onClick={() => handleDeleteUser(ex._id)} style={styles.btnDelete} title="Delete Exhibitor">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {exhibitors.length === 0 && <div style={styles.empty}>No exhibitors found.</div>}
              </div>
            </motion.div>
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'Applications' && (
            <motion.div key="apps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Exhibitor</th>
                      <th style={styles.th}>Company</th>
                      <th style={styles.th}>Event</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Booth Size</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app._id} style={styles.tr}>
                        <td style={styles.td}><strong>{app.exhibitorId?.name || '—'}</strong></td>
                        <td style={styles.td}>{app.exhibitorId?.companyName || '—'}</td>
                        <td style={styles.td}>{app.eventId?.title || '—'}</td>
                        <td style={styles.td}>{app.productCategory || '—'}</td>
                        <td style={styles.td}>{app.boothSizePreference || '—'}</td>
                        <td style={styles.td}>{getStatusBadge(app.status)}</td>
                        <td style={styles.td}>
                          {app.status === 'Pending' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button style={styles.btnApprove} onClick={() => handleStatusUpdate(app._id, 'Approved')}>
                                <UserCheck size={14} /> Approve
                              </button>
                              <button style={styles.btnReject} onClick={() => handleStatusUpdate(app._id, 'Rejected')}>
                                <UserX size={14} /> Reject
                              </button>
                            </div>
                          )}
                          {app.status !== 'Pending' && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>— reviewed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {applications.length === 0 && <div style={styles.empty}>No applications yet.</div>}
              </div>
            </motion.div>
          )}

          {/* VERIFICATIONS TAB */}
          {activeTab === 'Verifications' && (
            <motion.div key="verifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Exhibitor Name</th>
                      <th style={styles.th}>Company</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Document</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.map(u => (
                      <tr key={u._id} style={styles.tr}>
                        <td style={styles.td}><strong>{u.name}</strong></td>
                        <td style={styles.td}>{u.companyName || '—'}</td>
                        <td style={styles.td}>{getStatusBadge(u.verificationStatus)}</td>
                        <td style={styles.td}>
                          {u.verificationDocument ? (
                            <a href={u.verificationDocument} download="Verification_Document" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', textDecoration: 'none', fontSize: '0.85rem' }}>
                              <Download size={16} /> View/Download
                            </a>
                          ) : 'No Document'}
                        </td>
                        <td style={styles.td}>
                          {u.verificationStatus === 'Pending' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button style={styles.btnApprove} onClick={() => handleVerificationUpdate(u._id, 'Verified')}>
                                <UserCheck size={14} /> Verify
                              </button>
                              <button style={styles.btnReject} onClick={() => handleVerificationUpdate(u._id, 'Rejected')}>
                                <UserX size={14} /> Reject
                              </button>
                            </div>
                          )}
                          {u.verificationStatus === 'Verified' && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Verified Exhibitor</span>}
                          {u.verificationStatus === 'Rejected' && <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>Rejected</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {verifications.length === 0 && <div style={styles.empty}>No verification requests found.</div>}
              </div>
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'Settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={styles.statCard}>
                <div style={{ flex: 1, width: '100%' }}>
                  <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Settings size={20} color="#3b82f6" /> Platform Settings
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '600px' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Global Public Banner Text</label>
                    <input 
                      type="text" 
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="e.g. Free Palestine 🇵🇸 | Standing in Solidarity or Flash Sale!"
                      style={{ padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <button 
                      onClick={handleSaveBanner}
                      disabled={savingBanner}
                      style={{ padding: '0.8rem', borderRadius: '10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, marginTop: '0.5rem', cursor: savingBanner ? 'not-allowed' : 'pointer', opacity: savingBanner ? 0.7 : 1 }}
                    >
                      {savingBanner ? 'Saving...' : 'Update Banner Text'}
                    </button>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Leave this empty to hide the top banner completely.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '1rem' },
  headerRow: { marginBottom: '2rem' },
  title: { fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.5rem' },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
  },
  statIcon: {
    width: '52px', height: '52px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  statValue: { fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
  statLabel: { color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 },
  tabBar: {
    display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
    borderBottom: '2px solid var(--border-color)', paddingBottom: '0'
  },
  tabBtn: {
    padding: '0.75rem 1.5rem', border: 'none', backgroundColor: 'transparent',
    color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem',
    cursor: 'pointer', borderRadius: '8px 8px 0 0', transition: '0.2s'
  },
  tabBtnActive: {
    backgroundColor: 'var(--primary-color)', color: '#fff'
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
    borderRadius: '10px', padding: '0.6rem 1rem', maxWidth: '400px', marginBottom: '1.5rem'
  },
  searchInput: {
    border: 'none', backgroundColor: 'transparent', outline: 'none',
    fontSize: '0.95rem', color: 'var(--text-primary)', width: '100%'
  },
  tableWrapper: { overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border-color)' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--bg-surface)' },
  th: {
    padding: '1rem 1.2rem', textAlign: 'left',
    fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
    color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)'
  },
  tr: { borderBottom: '1px solid var(--border-color)', transition: '0.15s' },
  td: { padding: '1rem 1.2rem', color: 'var(--text-primary)', fontSize: '0.9rem' },
  badge: {
    padding: '4px 10px', borderRadius: '20px',
    fontSize: '0.75rem', fontWeight: 700
  },
  grid: {
    display: 'flex', flexDirection: 'column', gap: '1rem'
  },
  exhibitorCard: {
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
    borderRadius: '14px', padding: '1.2rem 1.5rem',
    display: 'flex', alignItems: 'center', gap: '1rem'
  },
  exhibitorAvatar: {
    width: '48px', height: '48px', borderRadius: '12px',
    backgroundColor: 'var(--primary-color)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '1.3rem', flexShrink: 0
  },
  exName: { margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' },
  exEmail: { margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' },
  btnApprove: {
    display: 'flex', alignItems: 'center', gap: '4px',
    backgroundColor: '#10b981', color: '#fff', border: 'none',
    padding: '5px 10px', borderRadius: '6px', fontWeight: 600,
    fontSize: '0.78rem', cursor: 'pointer'
  },
  btnReject: {
    display: 'flex', alignItems: 'center', gap: '4px',
    backgroundColor: 'transparent', color: '#e11d48',
    border: '1px solid #e11d48', padding: '5px 10px',
    borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer'
  },
  btnDelete: {
    backgroundColor: '#ffe4e6', color: '#e11d48',
    border: 'none', padding: '6px',
    borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  empty: { padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }
};

export default UserManagement;
