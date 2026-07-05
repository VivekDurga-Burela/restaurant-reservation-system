import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reservations');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingReservation, setEditingReservation] = useState(null);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: '' });
  const { user } = useAuth();

  const fetchReservations = async () => {
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await api.get('/reservations', { params });
      setReservations(data);
    } catch (err) {
      toast.error('Failed to load reservations');
    }
  };

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data);
    } catch (err) {
      toast.error('Failed to load tables');
    }
  };

  useEffect(() => {
    Promise.all([fetchReservations(), fetchTables()]).finally(() => setLoading(false));
  }, [dateFilter, statusFilter]);

  const handleCancelReservation = async (id) => {
    if (!confirm('Cancel this reservation?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleAddTable = async () => {
    if (!newTable.tableNumber || !newTable.capacity) { toast.error('Fill in all fields'); return; }
    try {
      await api.post('/tables', { tableNumber: parseInt(newTable.tableNumber), capacity: parseInt(newTable.capacity) });
      toast.success('Table added!');
      setNewTable({ tableNumber: '', capacity: '' });
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add table');
    }
  };

  const handleDeactivateTable = async (id) => {
    if (!confirm('Deactivate this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success('Table deactivated');
      fetchTables();
    } catch (err) {
      toast.error('Failed to deactivate table');
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        <div className="admin-header fade-in-up">
          <div>
            <h1 className="admin-title">👑 Administrator Dashboard</h1>
            <p className="admin-subtitle">Restaurant Reservation Management</p>
          </div>
          <div className="admin-badge">
            <span className="crown-icon">👑</span>
            <span className="admin-label">{user?.name}</span>
          </div>
        </div>

        <div className="stats-grid fade-in-up">
          <div className="stat-card">
            <div className="stat-number">{reservations.length}</div>
            <div className="stat-label">Total Reservations</div>
          </div>
          <div className="stat-card confirmed">
            <div className="stat-number">{confirmedCount}</div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card cancelled">
            <div className="stat-number">{cancelledCount}</div>
            <div className="stat-label">Cancelled</div>
          </div>
          <div className="stat-card tables">
            <div className="stat-number">{tables.length}</div>
            <div className="stat-label">Active Tables</div>
          </div>
        </div>

        <div className="admin-tabs fade-in-up">
          <button 
            onClick={() => setActiveTab('reservations')} 
            className={`admin-tab ${activeTab === 'reservations' ? 'active' : ''}`}
          >
            📋 Reservations
          </button>
          <button 
            onClick={() => setActiveTab('tables')} 
            className={`admin-tab ${activeTab === 'tables' ? 'active' : ''}`}
          >
            🪑 Tables
          </button>
        </div>

        {activeTab === 'reservations' && (
          <div className="tab-content fade-in-up">
            <div className="filter-bar">
              <input 
                type="date" 
                className="filter-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <select 
                className="filter-input"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {(dateFilter || statusFilter !== 'all') && (
                <button className="clear-filters-btn" onClick={() => { setDateFilter(''); setStatusFilter('all'); }}>
                  Clear Filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="skeleton" style={{ height: '60px', marginBottom: '12px' }}></div>
                <div className="skeleton" style={{ height: '60px', marginBottom: '12px' }}></div>
                <div className="skeleton" style={{ height: '60px', marginBottom: '12px' }}></div>
                <div className="skeleton" style={{ height: '60px' }}></div>
              </div>
            ) : reservations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No reservations found</h3>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Table</th>
                      <th>Guests</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r, index) => (
                      <tr key={r._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td>
                          <div className="customer-name">{r.user?.name}</div>
                          <div className="customer-email">{r.user?.email}</div>
                        </td>
                        <td>{formatDate(r.date)}</td>
                        <td>{r.timeSlot}</td>
                        <td>Table {r.table?.tableNumber}</td>
                        <td>{r.numberOfGuests}</td>
                        <td>
                          <span className={`table-badge ${r.status}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === 'confirmed' && (
                            <button onClick={() => handleCancelReservation(r._id)} className="action-btn">
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="tab-content fade-in-up">
            <div className="add-table-card">
              <h3 className="section-heading">Add New Table</h3>
              <div className="add-table-form">
                <input 
                  type="number" 
                  className="filter-input"
                  placeholder="Table Number" 
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })} 
                />
                <input 
                  type="number" 
                  className="filter-input"
                  placeholder="Capacity (seats)" 
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })} 
                />
                <button className="add-table-btn" onClick={handleAddTable}>Add Table</button>
              </div>
            </div>

            <div className="tables-grid">
              {tables.map((t) => (
                <div key={t._id} className="admin-table-card">
                  <div className="table-icon">🪑</div>
                  <div className="table-number">Table {t.tableNumber}</div>
                  <div className="table-capacity">Capacity: {t.capacity} seats</div>
                  <span className={`table-badge ${t.isActive ? 'confirmed' : 'cancelled'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {t.isActive && (
                    <button onClick={() => handleDeactivateTable(t._id)} className="deactivate-btn">
                      Deactivate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

