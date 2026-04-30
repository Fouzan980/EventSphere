import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import api from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMsg(data.message);
      setStatus('success');
      setTimeout(() => navigate('/login'), 4000);
    } catch (error) {
      setMsg(error.response?.data?.message || 'Failed to reset password');
      setStatus('error');
    }
  };

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.card}
      >
        <div style={styles.header}>
          <h2 style={styles.title}>Set New Password</h2>
          <p style={styles.subtitle}>Please enter your new strong password below.</p>
        </div>

        {status === 'success' ? (
          <div style={styles.successBox}>
            <CheckCircle size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F172A' }}>Password Reset Successful!</h3>
            <p style={{ margin: 0, color: '#64748b' }}>{msg}</p>
            <p style={{ margin: '1rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            {status === 'error' && <div style={styles.errorBox}>{msg}</div>}
            
            <div style={styles.formGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputGroup}>
                <Lock size={18} color="#64748b" style={styles.icon} />
                <input 
                  type="password" 
                  style={styles.input} 
                  placeholder="Min. 8 characters + symbols" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={status === 'loading'} style={styles.btn}>
              {status === 'loading' ? 'Resetting...' : 'Reset Password'} <ArrowRight size={18} />
            </button>
            
            <p style={styles.footerText}>
              Return to <Link to="/login" style={styles.link}>Sign In</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', padding: '1rem', backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 100%)' },
  card: { backgroundColor: '#fff', padding: '3rem', borderRadius: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  header: { marginBottom: '2rem', textAlign: 'center' },
  title: { margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#0f172a', fontWeight: '800' },
  subtitle: { margin: 0, color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '1rem' },
  input: { width: '100%', padding: '1rem 1rem 1rem 3rem', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  btn: { backgroundColor: '#FF2A5F', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'background-color 0.2s', width: '100%' },
  errorBox: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', textAlign: 'center' },
  successBox: { textAlign: 'center', padding: '2rem 1rem' },
  footerText: { textAlign: 'center', color: '#64748b', margin: '1rem 0 0 0', fontSize: '0.9rem' },
  link: { color: '#FF2A5F', textDecoration: 'none', fontWeight: 600 }
};

export default ResetPassword;
