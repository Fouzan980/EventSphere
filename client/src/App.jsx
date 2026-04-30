import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WebsitePage from './pages/WebsitePage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ExhibitorDirectory from './pages/ExhibitorDirectory';

import Events from './pages/Events';
import Applications from './pages/Applications';
import Schedule from './pages/Schedule';
import FloorPlan from './pages/FloorPlan';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Orders from './pages/Orders';

function App() {
  return (
    <Router>
      <ToastContainer 
        position="top-right" 
        autoClose={4000} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="light" 
      />
      <Routes>
        {/* Public Website/Landing Page */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/exhibitors" element={<ExhibitorDirectory />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Generic Website Pages */}
        <Route path="/about" element={<WebsitePage title="About Us" subtitle="Discover our story, our mission, and what drives EventSphere forward." />} />
        <Route path="/careers" element={<WebsitePage title="Careers" subtitle="Join our team and help shape the future of live events." />} />
        <Route path="/contact" element={<WebsitePage title="Contact Us" subtitle="We're here to help. Reach out with any questions or support requests." />} />
        <Route path="/concerts" element={<WebsitePage title="Concerts" subtitle="Experience the best live music events taking place near you." />} />
        <Route path="/comedy" element={<WebsitePage title="Comedy" subtitle="Find top comedy shows and laugh out loud with your favorite comedians." />} />
        <Route path="/theater" element={<WebsitePage title="Theater" subtitle="Discover breathtaking plays, musicals, and artistic performances." />} />
        <Route path="/list-event" element={<WebsitePage title="List Your Event" subtitle="Get your event in front of thousands of potential attendees today." />} />
        <Route path="/services" element={<WebsitePage title="Ticketing Services" subtitle="Robust tools designed for seamless ticket sales and audience management." />} />
        <Route path="/pricing" element={<WebsitePage title="Pricing" subtitle="Transparent and scalable pricing for events of any size." />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="applications" element={<Applications />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="floor-plan" element={<FloorPlan />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<Orders />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
