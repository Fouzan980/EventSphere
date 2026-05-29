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
</div>
  );
};

export default Register;
