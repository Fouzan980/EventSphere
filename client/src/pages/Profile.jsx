import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
  User, Mail, Phone, Globe, Building2, Shield, BadgeCheck, FileText,
  Camera, Save, Lock, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { PageSkeleton } from '../components/Skeleton';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000/api';
const roleColors = { Organizer: '#f59e0b', Exhibitor: '#06b6d4', Attendee: '#a855f7' };
const roleEmojis = { Organizer: '🎯', Exhibitor: '🏢', Attendee: '🎟️' };

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)',
  borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box', transition: '0.2s',
};
const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontSize: '0.78rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '1px',
  color: 'var(--text-secondary)',
};
const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  borderRadius: '16px', padding: '28px',
  marginBottom: '24px',
};
const sectionTitle = {
  fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
  marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
};

// ─── Compress avatar to JPEG dataURL (max 300px, quality 0.75) ────────────────
const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 300;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 20px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      background: type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
      color: type === 'success' ? '#10b981' : '#ef4444',
      fontSize: '0.9rem', fontWeight: 600,
      animation: 'slideUp 0.3s ease',
    }}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      {msg}
    </div>
  );
};

// ─── Avatar Uploader ──────────────────────────────────────────────────────────
const AvatarUploader = ({ avatar, name, onAvatarChange }) => {
  const fileRef = useRef();
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      onAvatarChange(compressed);
    } catch {
      // fallback: raw dataURL
      const reader = new FileReader();
      reader.onload = (ev) => onAvatarChange(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', border: '3px solid rgba(139,92,246,0.5)',
        boxShadow: '0 0 24px rgba(139,92,246,0.4)',
      }}>
        {avatar
          ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>{initials}</span>
        }
      </div>
      <button
        type="button"
        onClick={() => fileRef.current.click()}
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6a11cb,#a855f7)',
          border: '2px solid var(--bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff',
        }}
        title="Change photo"
        aria-label="Change profile photo"
      >
        <Camera size={14} />
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const token = user?.token;

  const [form, setForm] = useState({
    name: '', bio: '', phone: '', website: '', companyName: '', avatar: '', niche: '', verificationStatus: 'None', isVerified: false,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [toast, setToast]       = useState(null);

  // Fetch profile on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setForm({
          name:        data.name        || '',
          bio:         data.bio         || '',
          phone:       data.phone       || '',
          website:     data.website     || '',
          companyName: data.companyName || '',
          avatar:      data.avatar      || '',
          niche:       data.niche       || '',
          verificationStatus: data.verificationStatus || 'None',
          isVerified: data.isVerified || false,
        });
      })
      .catch(() => showToast('Failed to load profile.', 'error'))
      .finally(() => setLoading(false));
  }, [token]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: updated } = await axios.put(`${API}/users/me`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sync ALL changed profile fields to AuthContext + localStorage
      updateUser({
        name:        updated.name        ?? form.name,
        avatar:      updated.avatar      ?? form.avatar,
        bio:         updated.bio         ?? form.bio,
        phone:       updated.phone       ?? form.phone,
        companyName: updated.companyName ?? form.companyName,
        niche:       updated.niche       ?? form.niche,
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Profile update error:', err.response?.data || err.message);
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return showToast('New passwords do not match.', 'error');
    }
    setPwSaving(true);
    try {
      await axios.put(
        `${API}/users/me/password`,
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Password changed! You\'ve been notified by email.', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Ask for Verification (Exhibitor) ──────────────────────────────────────
  const [verifFile, setVerifFile] = useState(null);
  const handleRequestVerification = async (e) => {
    e.preventDefault();
    if (!verifFile) return showToast('Please upload a document to verify your exhibition business.', 'error');
    setSaving(true);
    try {
      // Basic base64 conversion for the file
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await axios.post(`${API}/users/me/verification`, { document: reader.result }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setForm(f => ({ ...f, verificationStatus: 'Pending' }));
          updateUser({ verificationStatus: 'Pending' });
          showToast(res.data.message || 'Verification submitted!', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to request verification.', 'error');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(verifFile);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const roleColor = roleColors[user?.role] || '#a855f7';

  if (loading) return <PageSkeleton />;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 16px 40px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .profile-input:focus { border-color: rgba(168,85,247,0.7) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
        .profile-input::placeholder { color: #6b7280; }
        .save-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 10px 28px rgba(168,85,247,0.5) !important; }
        .save-btn { transition: all 0.2s; }
        @media (max-width: 600px) {
          .profile-grid-2 { grid-template-columns: 1fr !important; }
          .profile-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .pw-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header Card */}
      <div className="profile-header" style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, rgba(106,17,203,0.15) 0%, rgba(168,85,247,0.1) 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
        display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap',
      }}>
        <AvatarUploader
          avatar={form.avatar}
          name={form.name}
          onAvatarChange={(val) => setForm(f => ({ ...f, avatar: val }))}
        />
        <div style={{ flex: 1, minWidth: 180 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {form.name || 'Your Name'}
          </h1>
          <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user?.email}</p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: `${roleColor}18`, color: roleColor,
            border: `1px solid ${roleColor}44`,
            padding: '4px 14px', borderRadius: '20px',
            fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            {roleEmojis[user?.role]} {user?.role}
          </span>
          {form.isVerified && (
            <span style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <BadgeCheck size={16} /> VERIFIED
            </span>
          )}
        </div>
      </div>

      {/* ── Profile Details Form ─────────────────────────────────────────── */}
      <form onSubmit={handleSaveProfile}>
        <div style={cardStyle}>
          <div style={sectionTitle}><User size={18} color="#a855f7" /> Personal Information</div>
          <div className="profile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={labelStyle} htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name" name="name" className="profile-input"
                value={form.name} onChange={handleChange}
                style={inputStyle} placeholder="Your full name"
              />
            </div>
            {/* Phone */}
            <div>
              <label style={labelStyle} htmlFor="profile-phone">Phone Number</label>
              <input
                id="profile-phone" name="phone" className="profile-input"
                value={form.phone} onChange={handleChange}
                style={inputStyle} placeholder="+1 (555) 000-0000" type="tel"
              />
            </div>
            {/* Company — Exhibitor & Organizer */}
            {(user?.role === 'Exhibitor' || user?.role === 'Organizer') && (
              <div>
                <label style={labelStyle} htmlFor="profile-company">
                  {user.role === 'Organizer' ? 'Organization Name' : 'Company Name'}
                </label>
                <input
                  id="profile-company" name="companyName" className="profile-input"
                  value={form.companyName} onChange={handleChange}
                  style={inputStyle} placeholder="ACME Corp"
                />
              </div>
            )}
            {/* Website — Exhibitor & Organizer */}
            {(user?.role === 'Exhibitor' || user?.role === 'Organizer') && (
              <div>
                <label style={labelStyle} htmlFor="profile-website">Website</label>
                <input
                  id="profile-website" name="website" className="profile-input"
                  value={form.website} onChange={handleChange}
                  style={inputStyle} placeholder="https://yoursite.com" type="url"
                />
              </div>
            )}
            {/* Niche — Exhibitor Only */}
            {user?.role === 'Exhibitor' && (
              <div>
                <label style={labelStyle} htmlFor="profile-niche">Niche / Expertise</label>
                <input
                  id="profile-niche" name="niche" className="profile-input"
                  value={form.niche} onChange={handleChange}
                  style={inputStyle} placeholder="e.g. AI, Cyber Security, E-commerce"
                />
              </div>
            )}
            {/* Bio — full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle} htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio" name="bio" className="profile-input"
                value={form.bio} onChange={handleChange}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder={
                  user?.role === 'Organizer' ? 'Tell attendees about your organization…' :
                  user?.role === 'Exhibitor' ? 'Tell organizers about what you offer…' :
                  'Tell the community a bit about yourself…'
                }
                maxLength={500}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {form.bio.length}/500
              </p>
            </div>
          </div>

          {/* Role-specific info box */}
          {user?.role === 'Exhibitor' && (
            <div style={{
              marginTop: '20px', padding: '14px 18px',
              background: 'rgba(6,182,212,0.08)', borderRadius: '10px',
              border: '1px solid rgba(6,182,212,0.25)',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <Building2 size={16} color="#06b6d4" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#67e8f9', lineHeight: 1.6 }}>
                Your company name, niche, website, and bio will be visible to organizers and attendees in the Exhibitor Directory.
              </p>
            </div>
          )}
          {user?.role === 'Organizer' && (
            <div style={{
              marginTop: '20px', padding: '14px 18px',
              background: 'rgba(245,158,11,0.08)', borderRadius: '10px',
              border: '1px solid rgba(245,158,11,0.25)',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <Shield size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#fcd34d', lineHeight: 1.6 }}>
                Your organization details appear on event listings and are visible to all users.
              </p>
            </div>
          )}
        </div>

        {/* Read-only Account Info */}
        <div style={cardStyle}>
          <div style={sectionTitle}><Mail size={18} color="#a855f7" /> Account Information</div>
          <div className="profile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input value={user?.email || ''} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <input value={user?.role || ''} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Email and role cannot be changed. Contact an administrator if needed.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="save-btn"
          id="save-profile-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            color: '#fff', border: 'none', padding: '14px 32px',
            borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: '0 6px 20px rgba(168,85,247,0.35)',
          }}
        >
          {saving ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={18} />}
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      {/* ── Change Password ──────────────────────────────────────────────── */}
      <form onSubmit={handleChangePassword} style={{ marginTop: '8px' }}>
        <div style={cardStyle}>
          <div style={sectionTitle}><Lock size={18} color="#a855f7" /> Change Password</div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle} htmlFor="pw-current">Current Password</label>
              <input
                id="pw-current" type="password" className="profile-input"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                style={inputStyle} placeholder="Enter your current password" autoComplete="current-password"
              />
            </div>
            <div className="pw-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle} htmlFor="pw-new">New Password</label>
                <input
                  id="pw-new" type="password" className="profile-input"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  style={inputStyle} placeholder="Min 8 chars, mixed case" autoComplete="new-password"
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="pw-confirm">Confirm New Password</label>
                <input
                  id="pw-confirm" type="password" className="profile-input"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  style={{ ...inputStyle, borderColor: pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'rgba(239,68,68,0.6)' : undefined }}
                  placeholder="Re-enter new password" autoComplete="new-password"
                />
                {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#ef4444' }}>Passwords don't match</p>
                )}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '20px', padding: '14px 18px',
            background: 'rgba(239,68,68,0.06)', borderRadius: '10px',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <Shield size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '0.83rem', color: '#fca5a5', lineHeight: 1.6 }}>
              You'll receive an email notification whenever your password is changed. If you didn't initiate this, secure your account immediately.
            </p>
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="save-btn"
            id="change-password-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px',
              background: 'linear-gradient(135deg,#dc2626,#ef4444)',
              color: '#fff', border: 'none', padding: '13px 28px',
              borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700,
              cursor: pwSaving ? 'not-allowed' : 'pointer', opacity: pwSaving ? 0.7 : 1,
              boxShadow: '0 6px 20px rgba(239,68,68,0.3)',
            }}
          >
            {pwSaving ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Lock size={18} />}
            {pwSaving ? 'Updating…' : 'Change Password'}
          </button>
        </div>
      </form>

      {/* ── Exhibitor Verification Application ────────────────────────────── */}
      {user?.role === 'Exhibitor' && (
        <form onSubmit={handleRequestVerification} style={{ marginTop: '8px' }}>
          <div style={cardStyle}>
            <div style={{ ...sectionTitle, color: '#06b6d4' }}><BadgeCheck size={18} /> Request Verified Exhibitor Status</div>
            
            {form.isVerified ? (
              <div style={{ padding: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} /> You are a Verified Exhibitor!
              </div>
            ) : form.verificationStatus === 'Pending' ? (
              <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={20} className="animate-spin" /> Your verification request is pending review by organizers.
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Submit official company documents (like incorporation certificate, tax ID, or official business license) to earn a highly trusted "Verified" badge.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={labelStyle}>Business Document (PDF, Image)</label>
                  <input
                    type="file"
                    accept="image/*, .pdf"
                    onChange={e => setVerifFile(e.target.files[0])}
                    style={{ ...inputStyle, padding: '8px' }}
                    required
                  />
                  {form.verificationStatus === 'Rejected' && (
                    <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, margin: '4px 0 0' }}>Your previous request was rejected. Please submit valid documents.</p>
                  )}
                  <button
                    type="submit"
                    disabled={saving || !verifFile}
                    className="save-btn"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px', alignSelf: 'flex-start',
                      background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
                      color: '#fff', border: 'none', padding: '12px 24px',
                      borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700,
                      cursor: (saving || !verifFile) ? 'not-allowed' : 'pointer', opacity: (saving || !verifFile) ? 0.7 : 1,
                      boxShadow: '0 6px 20px rgba(6,182,212,0.3)',
                    }}
                  >
                    <FileText size={18} /> Submit for Verification
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
