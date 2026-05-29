import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Building, Layers, ArrowRight, Loader2, CheckCircle, XCircle, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';

// Password strength algorithm
const getPasswordStrength = (pwd) => {
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length;
  let label = 'Very Weak', color = '#ef4444';
  if (score >= 5) { label = 'Strong'; color = '#10b981'; }
  else if (score >= 4) { label = 'Good'; color = '#22c55e'; }
  else if (score >= 3) { label = 'Medium'; color = '#f59e0b'; }
  else if (score >= 2) { label = 'Weak'; color = '#f97316'; }
  return { score, label, color, checks };
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'Attendee', companyName: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (formData.password !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      setLoading(false);
      return;
    }
    const pwStrength = getPasswordStrength(formData.password);
    if (pwStrength.score < 2) {
      toast.error("Password is too weak. Please make it stronger.");
      setLoading(false);
      return;
    }
    try {
      await register(formData);
      toast.success("Account successfully created! Redirecting...");
      setTimeout(() => {
        navigate('/login', { state: { message: "Registration successful. Please log in." } });
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <h2 className="auth-brand-title">Join EventSphere</h2>
          <p className="auth-brand-subtitle">Create your account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-grid-row">
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <input 
                  type="text" 
                  name="name" 
                  className="auth-input"
                  placeholder="Ex: John Doe"
                  value={formData.name}
                  onChange={handleChange} 
                  required 
                />
                <User className="auth-input-icon" size={20} />
                <label className="auth-floating-label">Full Name</label>
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <input 
                  type="email" 
                  name="email" 
                  className="auth-input"
                  placeholder="Ex: john@example.com"
                  value={formData.email}
                  onChange={handleChange} 
                  required 
                />
                <Mail className="auth-input-icon" size={20} />
                <label className="auth-floating-label">Email Address</label>
              </div>
            </div>
          </div>

          <div className="auth-grid-row">
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  className="auth-input"
                  style={{ paddingRight: '40px' }} 
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => { handleChange(e); setShowStrength(true); }}
                  onFocus={() => setShowStrength(true)}
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
            </div>

            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  className="auth-input"
                  style={{ paddingRight: '40px' }} 
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
                <Lock className="auth-input-icon" size={20} />
                <label className="auth-floating-label">Confirm Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          {showStrength && formData.password.length > 0 && (() => {
            const s = getPasswordStrength(formData.password);
            return (
              <div className="auth-strength-container" style={{ marginTop: '-0.25rem', background: 'rgba(15, 23, 42, 0.35)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '4px', borderRadius: '3px',
                      backgroundColor: i <= s.score ? s.color : 'rgba(255,255,255,0.15)',
                      transition: 'background-color 0.3s'
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: s.color }}>
                    Strength: {s.label}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                  {[
                    ['8+ chars', s.checks.length],
                    ['Uppercase', s.checks.upper],
                    ['Lowercase', s.checks.lower],
                    ['Number (0-9)', s.checks.number],
                    ['Special char', s.checks.special],
                  ].map(([label, passed]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: passed ? '#10b981' : '#94a3b8' }}>
                      {passed ? <CheckCircle size={10} style={{ color: '#10b981' }} /> : <XCircle size={10} style={{ color: '#ef4444' }} />} {label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className={formData.role === 'Exhibitor' ? "auth-grid-row" : "auth-form-full-width"}>
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <Layers className="auth-input-icon" size={20} />
                <select 
                  name="role" 
                  className="auth-input auth-select" 
                  value={formData.role} 
                  onChange={handleChange}
                >
                  <option value="Attendee">Attendee</option>
                  <option value="Exhibitor">Exhibitor</option>
                  <option value="Organizer">Organizer</option>
                </select>
                <ChevronDown className="auth-select-icon" size={16} />
                <label className="auth-floating-label">I am joining as</label>
              </div>
            </div>

            <AnimatePresence>
              {formData.role === 'Exhibitor' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="auth-input-group"
                >
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      name="companyName" 
                      className="auth-input" 
                      placeholder="Company Name"
                      value={formData.companyName}
                      onChange={handleChange} 
                      required 
                    />
                    <Building className="auth-input-icon" size={20} />
                    <label className="auth-floating-label">Company Name</label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            {!loading && <ArrowRight size={20} style={{ marginLeft: '8px' }} />}
          </motion.button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in instead
          </Link>
        </p>
      </motion.div>

      {/* Global CSS Styles for auth pages */}
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
          padding: 2.25rem;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 540px;
          max-height: 98dvh;
          z-index: 1;
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
        }
        .auth-card::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }

        .auth-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.25rem;
          text-align: center;
        }

        .auth-logo-circle {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: linear-gradient(135deg, #FF2A5F, #8b5cf6);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          box-shadow: 0 8px 20px rgba(255, 42, 95, 0.3);
        }

        .auth-brand-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.2rem;
          letter-spacing: -0.5px;
        }

        .auth-brand-subtitle {
          font-size: 0.85rem;
          color: #94a3b8;
          margin: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-grid-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .auth-form-full-width {
          width: 100%;
        }

        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .auth-label {
          font-size: 0.8rem;
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
          padding: 11px 14px 11px 42px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(15, 23, 42, 0.6);
          color: #ffffff;
          font-size: 0.92rem;
          transition: all 0.25s ease;
          outline: none;
          box-sizing: border-box;
        }

        .auth-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: none !important;  /* suppress global SVG arrow */
          padding-right: 42px !important;
          cursor: pointer;
        }

        .auth-select option {
          background-color: #0f172a;
          color: #ffffff;
        }

        .auth-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #0f172a inset !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .auth-input:focus {
          border-color: #FF2A5F !important;
          box-shadow: 0 0 0 3px rgba(255, 42, 95, 0.25) !important;
          background: rgba(15, 23, 42, 0.85);
        }

        .auth-submit-btn {
          margin-top: 0.4rem;
          padding: 13px;
          border-radius: 12px;
          background: linear-gradient(135deg, #FF2A5F, #8b5cf6);
          color: #fff;
          font-size: 0.92rem;
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
          margin-top: 1.25rem;
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

        @media (max-width: 640px) {
          .auth-grid-row {
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }
        }

        @media (max-width: 480px), (max-height: 720px) {
          .auth-container {
            padding: 0.4rem;
          }
          
          .auth-card {
            padding: 1.15rem;
            border-radius: 16px;
            max-height: 99dvh;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }
          
          .auth-logo-container {
            margin-bottom: 0.75rem;
          }
          
          .auth-logo-circle {
            width: 36px;
            height: 36px;
            font-size: 1.1rem;
            margin-bottom: 0.35rem;
            border-radius: 10px;
          }
          
          .auth-brand-title {
            font-size: 1.2rem;
          }
          
          .auth-brand-subtitle {
            font-size: 0.75rem;
            display: none;
          }
          
          .auth-form {
            gap: 0.65rem;
          }
          
          .auth-input-group {
            gap: 0.2rem;
          }
          
          .auth-label {
            font-size: 0.75rem;
          }
          
          .auth-input {
            padding: 9px 12px 9px 36px;
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
            margin-top: 0.85rem;
            font-size: 0.78rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
