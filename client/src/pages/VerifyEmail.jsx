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
  }, [token]);

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

      {/* Embedded CSS for styling this layout in case global stylesheet isn't fully set up */}
      <style>{`
        .auth-container {
          min-height: 100dvh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 80% 20%, #1e1b4b 0%, #0F172A 50%, #020617 100%);
          position: relative;
          overflow: hidden;
          padding: 1rem;
          box-sizing: border-box;
        }

        .auth-blur-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          z-index: 0;
          opacity: 0.35;
          pointer-events: none;
        }

        .auth-shape-1 {
          width: min(40vw, 400px);
          height: min(40vw, 400px);
          background-color: #7c3aed;
          top: -5%;
          left: -5%;
        }

        .auth-shape-2 {
          width: min(50vw, 500px);
          height: min(50vw, 500px);
          background-color: #FF2A5F;
          bottom: -10%;
          right: -10%;
        }

        .auth-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 2.5rem;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 440px;
          max-height: 96dvh;
          z-index: 1;
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .auth-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.75rem;
          text-align: center;
        }

        .auth-logo-circle {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background: linear-gradient(135deg, #FF2A5F, #8b5cf6);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.6rem;
          margin-bottom: 0.75rem;
          box-shadow: 0 8px 20px rgba(255, 42, 95, 0.3);
        }

        .auth-brand-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.25rem;
          letter-spacing: -0.5px;
        }

        .auth-brand-subtitle {
          font-size: 0.85rem;
          color: #94a3b8;
          margin: 0;
        }

        .auth-status-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
        }

        .auth-status-icon {
          margin-bottom: 1.25rem;
        }

        .text-indigo {
          color: #8b5cf6;
        }

        .text-success {
          color: #10b981;
        }

        .text-danger {
          color: #f43f5e;
        }

        .auth-status-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .auth-status-text {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        .auth-divider {
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 1.5rem 0;
        }

        .auth-resend-heading {
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.75rem;
          align-self: flex-start;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .auth-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #cbd5e1;
          margin-left: 2px;
        }

        .auth-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .auth-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }

        .auth-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(15, 23, 42, 0.6);
          color: #ffffff;
          font-size: 0.95rem;
          transition: all 0.25s ease;
          outline: none;
          box-sizing: border-box;
        }

        .auth-input:focus {
          border-color: #FF2A5F !important;
          box-shadow: 0 0 0 3px rgba(255, 42, 95, 0.25) !important;
          background: rgba(15, 23, 42, 0.85);
        }

        .auth-submit-btn {
          margin-top: 0.4rem;
          padding: 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, #FF2A5F, #8b5cf6);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(255, 42, 95, 0.25);
          transition: all 0.25s ease;
        }

        .auth-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(255, 42, 95, 0.4);
          filter: brightness(1.1);
        }

        .auth-submit-btn:active {
          transform: translateY(1px);
        }

        .auth-footer-text {
          margin-top: 1.5rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .auth-link {
          color: #FF2A5F;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .auth-link:hover {
          color: #ff5e85;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 480px), (max-height: 720px) {
          .auth-container {
            padding: 0.5rem;
          }
          
          .auth-card {
            padding: 1.25rem;
            border-radius: 16px;
            max-height: 98dvh;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }
          
          .auth-logo-container {
            margin-bottom: 0.85rem;
          }
          
          .auth-logo-circle {
            width: 38px;
            height: 38px;
            font-size: 1.15rem;
            margin-bottom: 0.4rem;
            border-radius: 10px;
          }
          
          .auth-brand-title {
            font-size: 1.25rem;
          }
          
          .auth-brand-subtitle {
            font-size: 0.75rem;
            display: none;
          }
          
          .auth-form {
            gap: 0.65rem;
          }
          
          .auth-input-group {
            gap: 0.25rem;
          }
          
          .auth-label {
            font-size: 0.75rem;
          }
          
          .auth-input {
            padding: 10px 12px 10px 36px;
            font-size: 0.85rem;
            border-radius: 10px;
          }
          
          .auth-input-icon {
            left: 12px;
            width: 16px;
            height: 16px;
          }
          
          .auth-submit-btn {
            padding: 11px;
            font-size: 0.88rem;
            border-radius: 10px;
            margin-top: 0.2rem;
          }
          
          .auth-footer-text {
            margin-top: 1rem;
            font-size: 0.78rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
