import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { User, Mail, Lock, Building, Layers, ArrowRight, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
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
          <h2 style={styles.brandTitle}>Join EventSphere</h2>
          <p style={styles.brandSubtitle}>Create your account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <User style={styles.inputIcon} size={20} />
              <input 
                type="text" 
                name="name" 
                style={styles.input} 
                placeholder="Ex: John Doe"
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail style={styles.inputIcon} size={20} />
              <input 
                type="email" 
                name="email" 
                style={styles.input} 
                placeholder="Ex: john@example.com"
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={{...styles.inputWrapper, position: 'relative'}}>
              <Lock style={styles.inputIcon} size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                style={{...styles.input, paddingRight: '40px'}} 
                placeholder="Create a secure password"
                onChange={(e) => { handleChange(e); setShowStrength(true); }}
                onFocus={() => setShowStrength(true)}
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
            {/* Password Strength Meter */}
            {showStrength && formData.password.length > 0 && (() => {
              const s = getPasswordStrength(formData.password);
              return (
                <div style={{ marginTop: '0.5rem' }}>
                  {/* Bar */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '5px', borderRadius: '3px',
                        backgroundColor: i <= s.score ? s.color : '#e2e8f0',
                        transition: 'background-color 0.3s'
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: s.color, marginBottom: '6px' }}>
                    Password Strength: {s.label}
                  </div>
                  {/* Checklist */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {[
                      ['8+ characters', s.checks.length],
                      ['Uppercase letter', s.checks.upper],
                      ['Lowercase letter', s.checks.lower],
                      ['Number (0-9)', s.checks.number],
                      ['Special character (!@#...)', s.checks.special],
                    ].map(([label, passed]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: passed ? '#10b981' : '#94a3b8' }}>
                        {passed ? <CheckCircle size={12} /> : <XCircle size={12} />} {label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={{...styles.inputWrapper, position: 'relative'}}>
              <Lock style={styles.inputIcon} size={20} />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                style={{...styles.input, paddingRight: '40px'}} 
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>I am joining as an</label>
            <div style={styles.inputWrapper}>
              <Layers style={styles.inputIcon} size={20} />
              <select 
                name="role" 
                style={styles.select} 
                value={formData.role} 
                onChange={handleChange}
              >
                <option value="Attendee">Attendee</option>
                <option value="Exhibitor">Exhibitor</option>
                <option value="Organizer">Organizer</option>
              </select>
            </div>
          </div>

          <AnimatePresence>
            {formData.role === 'Exhibitor' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{...styles.inputGroup, marginTop: '8px'}}>
                  <label style={styles.label}>Company Name</label>
                  <div style={styles.inputWrapper}>
                    <Building style={styles.inputIcon} size={20} />
                    <input 
                      type="text" 
                      name="companyName" 
                      style={styles.input} 
                      placeholder="Your Company Ltd."
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            {!loading && <ArrowRight size={20} style={{ marginLeft: '8px' }} />}
          </motion.button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in instead
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
    padding: '2rem 1rem',
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
    top: '10%',
    right: '-10%'
  },
  shape2: {
    width: '500px',
    height: '500px',
    backgroundColor: '#d1fae5',
    bottom: '-10%',
    left: '-10%'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '3rem 2.5rem',
    borderRadius: '24px',
    boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)',
    width: '100%',
    maxWidth: '480px',
    border: '1px solid #e2e8f0',
    zIndex: 1,
    color: '#0F172A'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2rem'
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
    gap: '1.2rem'
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
  select: {
    width: '100%',
    padding: '14px 14px 14px 48px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0F172A',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    appearance: 'none',
    outline: 'none',
    cursor: 'pointer'
  },
  submitBtn: {
    marginTop: '0.8rem',
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
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  footerText: {
    marginTop: '1.5rem',
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

// Insert basic styles snippet into document head via code
const styleEl = document.createElement('style');
styleEl.innerHTML = `
  select option {
    background-color: #fff;
    color: #0F172A;
  }
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #f8fafc inset !important;
    -webkit-text-fill-color: #0F172A !important;
    transition: background-color 5000s ease-in-out 0s;
  }
  input:focus, select:focus {
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

export default Register;
