import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Clock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null); // Date when lock expires
  const [lockCountdown, setLockCountdown] = useState(0); // seconds remaining
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Countdown timer when account is locked
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(lockedUntil) - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining <= 0) {
        setLockedUntil(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      // Clear state so it doesn't show again on reload
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(email, password);
      if (userData.role === 'Attendee') {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.message || 'Login failed. Please check your credentials.';
      if (errData?.lockedUntil) {
        setLockedUntil(errData.lockedUntil);
      }
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Decorative blurred background shapes */}
      <div style={{ ...styles.blurShape, ...styles.shape1 }}></div>
      <div style={{ ...styles.blurShape, ...styles.shape2 }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={styles.card}
      >
        <div style={styles.logoContainer}>
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            style={styles.logoCircle}
          >
            ES
          </motion.div>
          <h2 style={styles.brandTitle}>EventSphere</h2>
          <p style={styles.brandSubtitle}>Welcome back! Please login to your account.</p>
        </div>

        {lockedUntil && lockCountdown > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            style={styles.errorAlert}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Clock size={16} />
              Account locked. Unlocks in: {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail style={styles.inputIcon} size={20} />
              <input 
                type="email" 
                style={styles.input} 
                placeholder="Ex: john@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ ...styles.inputWrapper, position: 'relative' }}>
              <Lock style={styles.inputIcon} size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                style={{ ...styles.input, paddingRight: '40px' }} 
                placeholder="Enter your password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Link to="/forgot-password" style={{ color: '#FF2A5F', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            {!loading && <ArrowRight size={20} style={{ marginLeft: '8px' }} />}
          </motion.button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Create one now
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden'
  },
  blurShape: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    zIndex: 0,
    opacity: 0.4
  },
  shape1: {
    width: '400px',
    height: '400px',
    backgroundColor: '#bae6fd',
    top: '-10%',
    left: '-10%'
  },
  shape2: {
    width: '500px',
    height: '500px',
    backgroundColor: '#d1fae5',
    bottom: '-20%',
    right: '-10%'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '3rem 2.5rem',
    borderRadius: '24px',
    boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)',
    width: '100%',
    maxWidth: '440px',
    border: '1px solid #e2e8f0',
    zIndex: 1,
    color: '#0F172A'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2.5rem'
  },
  logoCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    backgroundColor: '#1E3A8A',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.8rem',
    marginBottom: '1rem',
    boxShadow: '0 8px 16px rgba(30, 58, 138, 0.3)'
  },
  brandTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '0.5rem',
    letterSpacing: '-0.5px'
  },
  brandSubtitle: {
    fontSize: '0.95rem',
    color: '#475569',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: '4px'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#64748b'
  },
  input: {
    width: '100%',
    padding: '14px 14px 14px 48px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0F172A',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  submitBtn: {
    marginTop: '0.5rem',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: '#1E3A8A',
    color: '#fff',
    fontSize: '1.05rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(30, 58, 138, 0.2)'
  },
  errorAlert: {
    padding: '12px 16px',
    backgroundColor: '#fff1f2',
    borderLeft: '4px solid #F43F5E',
    color: '#be123c',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.9rem'
  },
  footerText: {
    marginTop: '2rem',
    textAlign: 'center',
    color: '#475569',
    fontSize: '0.95rem'
  },
  link: {
    color: '#3b82f6',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'color 0.2s'
  }
};

// Add global styles for autofill and animations
const styleEl = document.createElement('style');
styleEl.innerHTML = `
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #f8fafc inset !important;
    -webkit-text-fill-color: #0F172A !important;
    transition: background-color 5000s ease-in-out 0s;
  }
  input:focus {
    border-color: #1E3A8A !important;
    box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.2) !important;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleEl);
}

export default Login;
