const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/tables — get all tables (authenticated)
router.get('/', protect, async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tables/available?date=&timeSlot=&guests= — check availability
router.get('/available', protect, async (req, res) => {
  const { date, timeSlot, guests } = req.query;

  if (!date || !timeSlot || !guests) {
    return res.status(400).json({ message: 'date, timeSlot, and guests are required' });
  }

  try {
    const reservationDate = new Date(date);
    reservationDate.setHours(0, 0, 0, 0);

    // Find all confirmed reservations for this date and time slot
    const bookedReservations = await Reservation.find({
      date: reservationDate,
      timeSlot,
      status: 'confirmed',
    }).select('table');

    const bookedTableIds = bookedReservations.map((r) => r.table.toString());

    // Find tables that are not booked and have enough capacity
    const availableTables = await Table.find({
      isActive: true,
      capacity: { $gte: parseInt(guests) },
      _id: { $nin: bookedTableIds },
    }).sort({ capacity: 1 });

    res.json(availableTables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tables — admin: add a table
router.post('/', protect, adminOnly, async (req, res) => {
  const { tableNumber, capacity } = req.body;
  if (!tableNumber || !capacity) {
    return res.status(400).json({ message: 'tableNumber and capacity are required' });
  }
  try {
    const table = await Table.create({ tableNumber, capacity });
    res.status(201).json(table);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tables/:id — admin: update a table
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tables/:id — admin: deactivate a table
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json({ message: 'Table deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
