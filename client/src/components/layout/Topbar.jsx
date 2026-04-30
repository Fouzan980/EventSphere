import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Sun, Moon, Menu } from 'lucide-react';

const Topbar = ({ isMobile, toggleMenu }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header style={styles.topbar}>
      <div style={styles.left}>
        {isMobile && (
          <button onClick={toggleMenu} style={{ ...styles.iconBtn, border: 'none', marginRight: '1rem' }}>
            <Menu size={24} />
          </button>
        )}
        <h2 style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
          {user?.role || 'Guest'} Portal
        </h2>
      </div>

      <div style={styles.right}>
        <button onClick={toggleTheme} style={styles.iconBtn} aria-label="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Clickable profile — goes to /dashboard/profile */}
        <button
          id="topbar-profile-btn"
          onClick={() => navigate('/dashboard/profile')}
          title="My Profile"
          aria-label="Go to profile"
          style={styles.profileBtn}
        >
        <div style={styles.avatar}>
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
          </div>
          {!isMobile && (
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user ? user.name : 'Guest'}</span>
              <span style={styles.userRole}>{user ? user.role : 'Visitor'}</span>
            </div>
          )}
        </button>
      </div>
    </header>
  );
};

const styles = {
  topbar: {
    height: '70px',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem',
    position: 'sticky', top: 0, zIndex: 10,
    transition: 'var(--transition-speed)',
  },
  left: { display: 'flex', alignItems: 'center' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  iconBtn: {
    background: 'transparent',
    color: 'var(--text-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0.5rem', borderRadius: '50%', transition: '0.2s',
    border: '1px solid var(--border-color)', cursor: 'pointer',
  },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'transparent', border: '1px solid var(--border-color)',
    borderRadius: '40px', padding: '5px 14px 5px 5px',
    cursor: 'pointer', transition: '0.2s',
    color: 'var(--text-primary)',
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.75rem',
    boxShadow: '0 0 10px rgba(139,92,246,0.4)',
  },
  userInfo: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  userName: { fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' },
  userRole:  { fontSize: '0.72rem', color: 'var(--text-secondary)' },
};

export default Topbar;
