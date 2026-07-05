import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', adminSecret: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role, form.adminSecret);
      toast.success(`Account created! Welcome, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background"></div>
      <div className="auth-content fade-in-up">
        <div className="auth-card">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us to start making reservations</p>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Account Type</label>
              <select
                className="form-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="customer">Customer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            {form.role === 'admin' && (
              <div className="form-field">
                <label className="form-label">Admin Secret Key</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.adminSecret}
                  onChange={(e) => setForm({ ...form, adminSecret: e.target.value })}
                  placeholder="Enter admin secret"
                />
                <small className="form-hint">Default: admin123</small>
              </div>
            )}
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <p className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
