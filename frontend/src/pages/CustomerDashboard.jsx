import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function CustomerDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  const fetchReservations = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/reservations', { params });
      setReservations(data);
    } catch (err) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, [filter]);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filtered = reservations.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header fade-in-up">
          <div className="header-content">
            <h1 className="dashboard-title">{getGreeting()}, {user?.name}</h1>
            <p className="dashboard-subtitle">Manage your table bookings</p>
          </div>
          <Link to="/new-reservation" className="new-reservation-btn">+ New Reservation</Link>
        </div>

        <div className="filter-tabs fade-in-up">
          {['all', 'confirmed', 'cancelled'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`filter-tab ${filter === f ? 'active' : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="skeleton" style={{ height: '120px', marginBottom: '20px' }}></div>
            <div className="skeleton" style={{ height: '120px', marginBottom: '20px' }}></div>
            <div className="skeleton" style={{ height: '120px' }}></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state fade-in-up">
            <div className="empty-icon">🍽️</div>
            <h3>No reservations found</h3>
            <p>Start by making your first reservation</p>
            <Link to="/new-reservation" className="new-reservation-btn">Make your first booking</Link>
          </div>
        ) : (
          <div className="reservations-grid fade-in-up">
            {filtered.map((r) => (
              <div key={r._id} className={`reservation-card ${r.status === 'cancelled' ? 'cancelled' : ''}`}>
                <div className="card-header">
                  <span className="table-number">Table {r.table?.tableNumber}</span>
                  <span className={`status-badge ${r.status}`}>
                    {r.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span>{formatDate(r.date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">🕐</span>
                    <span>{r.timeSlot}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">👥</span>
                    <span>{r.numberOfGuests} Guest{r.numberOfGuests > 1 ? 's' : ''}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">🪑</span>
                    <span>Capacity: {r.table?.capacity} seats</span>
                  </div>
                  {r.specialRequests && (
                    <div className="special-requests">
                      <span className="detail-icon">📝</span>
                      <span>{r.specialRequests}</span>
                    </div>
                  )}
                </div>
                {r.status === 'confirmed' && (
                  <button onClick={() => handleCancel(r._id)} className="cancel-btn">
                    Cancel Reservation
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
