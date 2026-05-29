import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
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
      setMsg(data.message || 'Password reset successfully.');
      setStatus('success');
      setTimeout(() => navigate('/login'), 4000);
    } catch (error) {
      setMsg(error.response?.data?.message || 'Failed to reset password');
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
          <h2 className="auth-brand-title">Set New Password</h2>
          <p className="auth-brand-subtitle">Please enter your new strong password below.</p>
        </div>

        {status === 'success' ? (
          <div className="auth-status-container">
            <CheckCircle className="auth-status-icon text-success animate-bounce" size={48} />
            <h3 className="auth-status-title">Password Reset Successful!</h3>
            <p className="auth-status-text">{msg}</p>
            <p style={{ margin: '1rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Redirecting to login...</p>
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
                  type="password" 
                  className="auth-input" 
                  placeholder="Min. 8 characters + symbols" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="auth-input-icon" size={20} />
                <label className="auth-floating-label">New Password</label>
              </div>
            </div>

            <button type="submit" disabled={status === 'loading'} className="auth-submit-btn">
              {status === 'loading' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Reset Password <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                </>
              )}
            </button>
            
            <p className="auth-footer-text">
              Return to <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </form>
        )}
      </motion.div>
</div>
  );
};

export default ResetPassword;
