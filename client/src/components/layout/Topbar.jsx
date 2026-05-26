import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { Sun, Moon, Menu, LogOut, X } from 'lucide-react';

const Topbar = ({ isMobile, toggleMenu, menuOpen }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header style={styles.bar}>
      {/* Left: hamburger + title */}
      <div style={styles.left}>
        <button
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={styles.iconBtn}
        >
          {menuOpen && !isMobile ? <X size={20} /> : <Menu size={20} />}
        </button>

        <h1 style={styles.title}>
          <span style={styles.brandDot}>●</span>
          {user?.role || 'Guest'} Portal
        </h1>
      </div>

      {/* Right: theme + profile + logout */}
      <div style={styles.right}>
        <button onClick={toggleTheme} style={styles.iconBtn} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          onClick={() => navigate('/dashboard/profile')}
          style={styles.profileBtn}
          title="My Profile"
        >
          <div style={styles.avatar}>
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
          </div>
          {!isMobile && (
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={styles.userName}>{user?.name || 'Guest'}</div>
              <div style={styles.userRole}>{user?.role || 'User'}</div>
            </div>
          )}
        </button>

        {isMobile && (
          <button onClick={logout} style={styles.logoutBtn} aria-label="Logout">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

const styles = {
  bar: {
    height: 60,
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.25rem',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 1px 0 var(--border-color)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  brandDot: {
    color: '#7c3aed',
    fontSize: '0.55rem',
    lineHeight: 1,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexShrink: 0,
  },
  iconBtn: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: 24,
    padding: '4px 10px 4px 4px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'background 0.15s',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.7rem',
    flexShrink: 0,
  },
  userName: {
    fontWeight: 600,
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
  },
  userRole: {
    fontSize: '0.68rem',
    color: 'var(--text-secondary)',
  },
  logoutBtn: {
    background: 'rgba(239,68,68,0.08)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8,
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.15s',
  },
};

export default Topbar;
