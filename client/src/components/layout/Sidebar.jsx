import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Map,
  LogOut, X, UserCircle2, UserCog, Ticket,
} from 'lucide-react';

const Sidebar = ({ closeMenu, isMobile }) => {
  const { user, logout } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard',       path: '/dashboard',              icon: <LayoutDashboard size={20} />, roles: ['Organizer'] },
    { name: 'Events',          path: '/dashboard/events',       icon: <Calendar size={20} />,        roles: ['Organizer', 'Exhibitor', 'Attendee', undefined] },
    { name: 'Floor Plan',      path: '/dashboard/floor-plan',   icon: <Map size={20} />,             roles: ['Organizer', 'Exhibitor', undefined] },
    { name: 'Applications',    path: '/dashboard/applications', icon: <Users size={20} />,           roles: ['Organizer', 'Exhibitor', undefined] },
    { name: 'User Management', path: '/dashboard/users',        icon: <UserCircle2 size={20} />,     roles: ['Organizer'] },
    { name: 'My Orders',       path: '/dashboard/orders',       icon: <Ticket size={20} />,          roles: ['Attendee'] },
    { name: 'My Profile',      path: '/dashboard/profile',      icon: <UserCog size={20} />,         roles: ['Organizer', 'Exhibitor', 'Attendee', undefined] },
  ];

  const role = user ? user.role : undefined;
  const filteredLinks = navItems.filter(item => item.roles.includes(role));

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoCircle}>ES</div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>EventSphere</h2>
        {isMobile && (
          <button onClick={closeMenu} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        )}
      </div>

      <nav style={styles.nav}>
        {filteredLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            onClick={() => isMobile && closeMenu()}
            style={({ isActive }) => ({
              ...styles.link,
              backgroundColor: isActive ? 'var(--primary-dark)' : 'transparent',
              borderLeft:      isActive ? '4px solid var(--accent-color)' : '4px solid transparent',
            })}
          >
            {link.icon}
            <span style={{ marginLeft: '0.8rem' }}>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User card + logout */}
      <div style={styles.footer}>
        {user ? (
          <>
            <NavLink
              to="/dashboard/profile"
              onClick={() => isMobile && closeMenu()}
              style={({ isActive }) => ({
                ...styles.userCard,
                borderColor: isActive ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)',
                background:  isActive ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
              })}
            >
              <div style={styles.userAvatar}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.userName}>{user.name}</div>
                <div style={styles.userRole}>{user.role}</div>
              </div>
            </NavLink>
            <button onClick={logout} style={styles.logoutBtn} id="sidebar-logout-btn">
              <LogOut size={18} />
              <span style={{ marginLeft: '0.6rem' }}>Logout</span>
            </button>
          </>
        ) : (
          <NavLink to="/login" style={styles.logoutBtn}>
            <LogOut size={20} />
            <span style={{ marginLeft: '0.8rem' }}>Login</span>
          </NavLink>
        )}
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--nav-bg)',
    color: 'var(--nav-text)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'var(--transition-speed)',
    minHeight: '100vh',
    position: 'sticky',
    top: 0,
  },
  logo: {
    padding: '2rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logoCircle: {
    width: '40px', height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--nav-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: '1.2rem',
  },
  nav: {
    padding: '1.5rem 0',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  link: {
    display: 'flex', alignItems: 'center',
    padding: '0.8rem 1.5rem',
    color: 'var(--nav-text)',
    textDecoration: 'none',
    transition: '0.2s',
    fontWeight: 500,
  },
  footer: {
    padding: '1rem 1rem 1.5rem',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  userCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    textDecoration: 'none', cursor: 'pointer',
    transition: '0.2s',
  },
  userAvatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
  },
  userName: {
    fontSize: '0.85rem', fontWeight: 600,
    color: 'var(--nav-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)',
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center',
    width: '100%', padding: '9px 12px',
    background: 'rgba(239,68,68,0.1)', color: '#f87171',
    border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
    cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
    textDecoration: 'none', transition: '0.2s',
  },
};

export default Sidebar;
