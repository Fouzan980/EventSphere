import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(() => {
    // Handle redirect from GET /api/auth/verify-email/:token (Gmail link click)
    if (searchParams.get('success') === '1') return 'success';
    if (searchParams.get('error')) return 'error';
    return token ? 'verifying' : 'resend_only';
  });
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState(() => {
    const err = searchParams.get('error');
    if (err === 'invalid') return 'This verification link is invalid or has already expired. Request a new one below.';
    if (err === 'server') return 'A server error occurred. Please try again or request a new link.';
    return '';
  });
  const [successMessage, setSuccessMessage] = useState(() =>
    searchParams.get('success') === '1' ? 'Your email has been successfully verified! You can now log in.' : ''
  );

  useEffect(() => {
    // Already resolved via query params (GET redirect) — skip POST call
    if (!token || searchParams.get('success') || searchParams.get('error')) return;

    const verifyToken = async () => {
      try {
        const { data } = await api.post(`/auth/verify-email/${token}`);
        setSuccessMessage(data.message || 'Email successfully verified!');
        setStatus('success');
        toast.success(data.message || 'Email successfully verified!');
      } catch (error) {
        const msg = error.response?.data?.message || 'Verification link is invalid or has expired.';
        setErrorMessage(msg);
        setStatus('error');
        toast.error(msg);
      }
    };

    verifyToken();
  }, [token, searchParams]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setStatus('resending');
    try {
      const { data } = await api.post('/auth/resend-verification', { email });
      toast.success(data.message || 'Verification email sent!');
      setSuccessMessage(data.message || 'If an account exists with this email, a verification link has been sent.');
      setStatus('resend_success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to resend verification email.';
      toast.error(msg);
      setErrorMessage(msg);
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
          <h2 className="auth-brand-title">EventSphere</h2>
          <p className="auth-brand-subtitle">Email Verification Workflow</p>
        </div>

        {status === 'verifying' && (
          <div className="auth-status-container">
            <Loader2 className="animate-spin auth-status-icon text-indigo" size={48} />
            <h3 className="auth-status-title">Verifying your email...</h3>
            <p className="auth-status-text">Please wait while we confirm your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="auth-status-container">
            <CheckCircle className="auth-status-icon text-success animate-bounce" size={48} />
            <h3 className="auth-status-title">Verification Successful!</h3>
            <p className="auth-status-text">{successMessage}</p>
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', marginTop: '1.5rem', width: '100%' }}>
              Proceed to Sign In <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="auth-status-container">
            <XCircle className="auth-status-icon text-danger" size={48} />
            <h3 className="auth-status-title">Verification Failed</h3>
            <p className="auth-status-text">{errorMessage}</p>
            
            <div className="auth-divider"></div>
            
            <h4 className="auth-resend-heading">Need a new link?</h4>
            <form onSubmit={handleResend} className="auth-form" style={{ width: '100%', marginTop: '0.5rem' }}>
              <div className="auth-input-group">
                <div className="auth-input-wrapper">
                  <input 
                    type="email" 
                    className="auth-input" 
                    placeholder="john@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                  <Mail className="auth-input-icon" size={20} />
                  <label className="auth-floating-label">Email Address</label>
                </div>
              </div>
              <button type="submit" className="auth-submit-btn" style={{ width: '100%' }}>
                Request New Link
              </button>
            </form>
            <p className="auth-footer-text" style={{ marginTop: '1.25rem' }}>
              Back to <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </div>
        )}

        {status === 'resend_only' && (
          <div>
            <p className="auth-status-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              Enter your email below and we'll send you a verification link to activate your account.
            </p>
            <form onSubmit={handleResend} className="auth-form">
              <div className="auth-input-group">
                <div className="auth-input-wrapper">
                  <input 
                    type="email" 
                    className="auth-input" 
                    placeholder="john@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                  <Mail className="auth-input-icon" size={20} />
                  <label className="auth-floating-label">Email Address</label>
                </div>
              </div>
              <button type="submit" className="auth-submit-btn">
                Send Verification Link <ArrowRight size={20} style={{ marginLeft: '8px' }} />
              </button>
            </form>
            <p className="auth-footer-text">
              Already verified? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </div>
        )}

        {status === 'resending' && (
          <div className="auth-status-container">
            <Loader2 className="animate-spin auth-status-icon text-indigo" size={48} />
            <h3 className="auth-status-title">Sending verification link...</h3>
            <p className="auth-status-text">Please hold on while we process your request.</p>
          </div>
        )}

        {status === 'resend_success' && (
          <div className="auth-status-container">
            <CheckCircle className="auth-status-icon text-success" size={48} />
            <h3 className="auth-status-title">Email Sent!</h3>
            <p className="auth-status-text">{successMessage}</p>
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', marginTop: '1.5rem', width: '100%' }}>
              Return to Login
            </Link>
          </div>
        )}
      </motion.div>
</div>
  );
};

export default VerifyEmail;
