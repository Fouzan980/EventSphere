import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg(data.message || 'Verification link sent to your email.');
      setStatus('success');
    } catch (error) {
      setMsg(error.response?.data?.message || 'Failed to send reset link');
      setStatus('error');
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
          <h2 className="auth-brand-title">Reset Password</h2>
          <p className="auth-brand-subtitle">Enter your email to receive a password reset link.</p>
        </div>

        {status === 'success' ? (
          <div className="auth-status-container">
            <CheckCircle className="auth-status-icon text-success animate-bounce" size={48} />
            <h3 className="auth-status-title">Check your email</h3>
            <p className="auth-status-text" style={{ marginBottom: '1.5rem' }}>{msg}</p>
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', width: '100%' }}>
              Return to Login <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {status === 'error' && (
              <div className="auth-error-alert">
                {msg}
              </div>
            )}
            
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="auth-input-icon" size={20} />
                <label className="auth-floating-label">Email Address</label>
              </div>
            </div>

            <button type="submit" disabled={status === 'loading'} className="auth-submit-btn">
              {status === 'loading' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Send Reset Link <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                </>
              )}
            </button>
            
            <p className="auth-footer-text">
              Remembered your password? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </form>
        )}
      </motion.div>
</div>
  );
};

export default ForgotPassword;
