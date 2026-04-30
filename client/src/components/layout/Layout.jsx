import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthContext } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Controlled by State on Mobile */}
      <div 
        style={{
          position: isMobile ? 'fixed' : 'sticky',
          left: isMobile ? (mobileMenuOpen ? 0 : '-100%') : 0,
          top: 0,
          height: '100vh',
          zIndex: 100,
          transition: 'left 0.3s ease-in-out'
        }}
      >
        <Sidebar closeMenu={() => setMobileMenuOpen(false)} isMobile={isMobile} />
      </div>

      {/* Main Content Area */}
      <div className="main-content" style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Topbar isMobile={isMobile} toggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="content-area" style={{ flexGrow: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
