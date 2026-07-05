import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">TableReserve</Link>
        </div>
        
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
          {user ? (
            <>
              <span className="role-badge">
                {user.role === 'admin' ? '👑' : '👤'} {user.name}
                <span className="role-label">{user.role === 'admin' ? 'Administrator' : 'Customer'}</span>
              </span>
              {user.role === 'admin' ? (
                <Link to="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              ) : (
                <>
                  <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>My Reservations</Link>
                  <Link to="/new-reservation" className="nav-link" onClick={() => setMobileMenuOpen(false)}>+ New Booking</Link>
                </>
              )}
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
