import React, { useState, useEffect, useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthContext } from '../../context/AuthContext';

const SIDEBAR_W = 256;

const Layout = () => {
  const { user } = useContext(AuthContext);

  const mobile = () => window.innerWidth < 768;
  const [sidebarOpen, setSidebarOpen] = useState(!mobile());
  const [isMobile, setIsMobile]       = useState(mobile());

  useEffect(() => {
    const onResize = () => {
      const m = mobile();
      setIsMobile(m);
      setSidebarOpen(!m);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const toggle = () => setSidebarOpen(o => !o);

  return (
    <div style={{
      display: 'flex',
      height: '100dvh',
      width: '100vw',
      overflow: 'hidden',
      background: 'var(--bg-color)',
      position: 'relative',
    }}>

      {/* ── Backdrop (mobile only) ─────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={toggle}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 200,
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0, left: 0, bottom: 0,
          height: '100dvh',
          width: SIDEBAR_W,
          flexShrink: 0,
          transform: sidebarOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
          transition: 'transform 0.26s cubic-bezier(.4,0,.2,1)',
          zIndex: 201,
          willChange: 'transform',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Sidebar closeMenu={() => setSidebarOpen(false)} isMobile={isMobile} />
      </aside>

      {/* ── Main area ──────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          overflow: 'hidden',
          minWidth: 0,          // critical: prevents flex children overflow
          maxWidth: '100%',
        }}
      >
        <Topbar isMobile={isMobile} toggleMenu={toggle} menuOpen={sidebarOpen} />

        {/* Scrollable content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            padding: 'clamp(0.75rem, 3vw, 2rem) clamp(0.75rem, 4vw, 2rem)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
