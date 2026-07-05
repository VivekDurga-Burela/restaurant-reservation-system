import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background"></div>
      <div className="auth-content fade-in-up">
        <div className="auth-card">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to manage your reservations</p>
          
          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="••••••••"
                required
              />
            </div>
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <p className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Register</Link>
          </p>
          
          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            <p className="demo-text">Customer: customer@demo.com / password123</p>
            <p className="demo-text">Admin: admin@demo.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
