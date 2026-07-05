import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function NewReservation() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ date: '', timeSlot: '', numberOfGuests: 1, specialRequests: '' });
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reservations/timeslots').then(({ data }) => setTimeSlots(data));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const checkAvailability = async () => {
    if (!form.date || !form.timeSlot || !form.numberOfGuests) {
      toast.error('Please fill in all fields');
      return;
    }
    setCheckingAvailability(true);
    try {
      const { data } = await api.get('/tables/available', {
        params: { date: form.date, timeSlot: form.timeSlot, guests: form.numberOfGuests },
      });
      setAvailableTables(data);
      setStep(2);
      if (data.length === 0) {
        toast.error('No tables available for this date, time, and party size');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTable) { toast.error('Please select a table'); return; }
    setLoading(true);
    try {
      await api.post('/reservations', {
        date: form.date,
        timeSlot: form.timeSlot,
        numberOfGuests: parseInt(form.numberOfGuests),
        tableId: selectedTable._id,
        specialRequests: form.specialRequests,
      });
      toast.success('Reservation confirmed! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservation-page">
      <div className="reservation-container">
        <div className="reservation-card fade-in-up">
          <h1 className="reservation-title">New Reservation</h1>

          <div className="step-indicator">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Date & Time</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Select Table</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Confirm</div>
            </div>
          </div>

          {step === 1 && (
            <div className="step-content">
              <div className="form-field">
                <label className="form-label">Date *</label>
                <input 
                  type="date" 
                  className="form-input"
                  min={today} 
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label className="form-label">Time Slot *</label>
                <select 
                  className="form-input"
                  value={form.timeSlot}
                  onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                >
                  <option value="">Select a time</option>
                  <optgroup label="Lunch">
                    {timeSlots.filter(t => parseInt(t) < 15).map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="Dinner">
                    {timeSlots.filter(t => parseInt(t) >= 15).map(t => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                </select>
              </div>
              
              <div className="form-field">
                <label className="form-label">Number of Guests *</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="1" 
                  max="20" 
                  value={form.numberOfGuests}
                  onChange={(e) => setForm({ ...form, numberOfGuests: e.target.value })} 
                />
              </div>
              
              <div className="form-field">
                <label className="form-label">Special Requests (optional)</label>
                <textarea 
                  className="form-input textarea"
                  value={form.specialRequests}
                  onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                  placeholder="Allergies, birthday setup, high chair needed, etc."
                />
              </div>
              
              <button 
                className="primary-btn" 
                onClick={checkAvailability} 
                disabled={checkingAvailability}
              >
                {checkingAvailability ? 'Checking Availability...' : 'Check Availability →'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <div className="booking-summary">
                <div className="summary-item">
                  <span className="summary-icon">📅</span>
                  <span>{new Date(form.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">🕐</span>
                  <span>{form.timeSlot}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">👥</span>
                  <span>{form.numberOfGuests} Guest{form.numberOfGuests > 1 ? 's' : ''}</span>
                </div>
              </div>

              {availableTables.length === 0 ? (
                <div className="no-tables-state">
                  <div className="no-tables-icon">😔</div>
                  <h3>No tables available</h3>
                  <p>Try a different date, time, or party size</p>
                  <button className="secondary-btn" onClick={() => setStep(1)}>← Try Different Date/Time</button>
                </div>
              ) : (
                <>
                  <h3 className="section-heading">Select a Table</h3>
                  <div className="table-selection-grid">
                    {availableTables.map((table) => (
                      <div 
                        key={table._id}
                        onClick={() => setSelectedTable(table)}
                        className={`table-card ${selectedTable?._id === table._id ? 'selected' : ''}`}
                      >
                        <div className="table-icon">🪑</div>
                        <div className="table-number">Table {table.tableNumber}</div>
                        <div className="table-capacity">Seats up to {table.capacity}</div>
                        {selectedTable?._id === table._id && <div className="selected-indicator">✓</div>}
                      </div>
                    ))}
                  </div>
                  <div className="action-buttons">
                    <button className="secondary-btn" onClick={() => setStep(1)}>← Back</button>
                    <button 
                      className="primary-btn" 
                      onClick={() => selectedTable && setStep(3)} 
                      disabled={!selectedTable}
                    >
                      Continue →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h3 className="section-heading">Confirm Your Reservation</h3>
              <div className="confirmation-receipt">
                <div className="receipt-row">
                  <span className="receipt-label">📅 Date</span>
                  <span className="receipt-value">{new Date(form.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">🕐 Time</span>
                  <span className="receipt-value">{form.timeSlot}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">👥 Guests</span>
                  <span className="receipt-value">{form.numberOfGuests}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">🪑 Table</span>
                  <span className="receipt-value">Table {selectedTable?.tableNumber} (seats {selectedTable?.capacity})</span>
                </div>
                {form.specialRequests && (
                  <div className="receipt-row">
                    <span className="receipt-label">📝 Requests</span>
                    <span className="receipt-value">{form.specialRequests}</span>
                  </div>
                )}
              </div>
              <div className="action-buttons">
                <button className="secondary-btn" onClick={() => setStep(2)}>← Back</button>
                <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Confirming...' : '✅ Confirm Reservation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
