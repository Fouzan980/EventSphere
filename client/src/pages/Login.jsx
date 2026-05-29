import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Clock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null); // Date when lock expires
  const [lockCountdown, setLockCountdown] = useState(0); // seconds remaining
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);
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

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success(data.message || 'Verification link sent!');
      setUnverifiedEmail(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail(null);
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
      if (err.response?.status === 403 && errData?.isVerified === false) {
        setUnverifiedEmail(errData.email || email);
      }
      if (errData?.lockedUntil) {
        setLockedUntil(errData.lockedUntil);
      }
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative blurred background shapes */}
      <div className="auth-blur-shape auth-shape-1"></div>
      <div className="auth-blur-shape auth-shape-2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="auth-card"
      >
        <div className="auth-logo-container">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="auth-logo-circle"
          >
            ES
          </motion.div>
          <h2 className="auth-brand-title">EventSphere</h2>
          <p className="auth-brand-subtitle">Welcome back! Please login to your account.</p>
        </div>

        {lockedUntil && lockCountdown > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="auth-error-alert"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Clock size={16} />
              Account locked. Unlocks in: {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}
            </div>
          </motion.div>
        )}

        {unverifiedEmail && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="auth-error-alert"
            style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', borderLeft: '3px solid #FF2A5F', display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <div style={{ color: '#fda4af', fontWeight: 500, fontSize: '0.85rem' }}>
              Your email is not verified yet. Please check your inbox or request a new verification link.
            </div>
            <button 
              type="button" 
              onClick={handleResendVerification}
              disabled={resending}
              style={{
                background: 'linear-gradient(135deg, #FF2A5F, #8b5cf6)',
                color: '#fff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(255, 42, 95, 0.25)',
                width: 'fit-content'
              }}
            >
              {resending ? <Loader2 className="animate-spin" size={14} /> : null}
              {resending ? 'Resending...' : 'Resend Verification Email'}
            </button>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <div className="auth-input-wrapper">
              <input 
                type="email" 
                className="auth-input" 
                placeholder="Ex: john@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <Mail className="auth-input-icon" size={20} />
              <label className="auth-floating-label">Email Address</label>
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="auth-input"
                style={{ paddingRight: '40px' }} 
                placeholder="Enter your password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <Lock className="auth-input-icon" size={20} />
              <label className="auth-floating-label">Password</label>
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <Link to="/forgot-password" style={{ color: '#FF2A5F', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            {!loading && <ArrowRight size={20} style={{ marginLeft: '8px' }} />}
          </motion.button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Create one now
          </Link>
        </p>
      </motion.div>
</div>
  );
};

export default Login;
