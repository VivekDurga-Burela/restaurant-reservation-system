const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { protect, adminOnly } = require('../middleware/auth');
const { TIME_SLOTS } = require('../models/Reservation');

// Helper: check table availability
async function isTableAvailable(tableId, date, timeSlot, excludeReservationId = null) {
  const reservationDate = new Date(date);
  reservationDate.setHours(0, 0, 0, 0);

  const query = {
    table: tableId,
    date: reservationDate,
    timeSlot,
    status: 'confirmed',
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const existing = await Reservation.findOne(query);
  return !existing;
}

// GET /api/reservations/timeslots — get available time slots
router.get('/timeslots', protect, (req, res) => {
  res.json(TIME_SLOTS);
});

// GET /api/reservations — customer: own reservations | admin: all reservations
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query.user = req.user._id;
    }

    // Admin can filter by date
    if (req.user.role === 'admin' && req.query.date) {
      const filterDate = new Date(req.query.date);
      filterDate.setHours(0, 0, 0, 0);
      query.date = filterDate;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const reservations = await Reservation.find(query)
      .populate('user', 'name email')
      .populate('table', 'tableNumber capacity')
      .sort({ date: -1, timeSlot: 1 });

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reservations/:id — get single reservation
router.get('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'name email')
      .populate('table', 'tableNumber capacity');

    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Customer can only view their own
    if (req.user.role === 'customer' && reservation.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this reservation' });
    }

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reservations — create reservation
router.post(
  '/',
  protect,
  [
    body('date').notEmpty().isISO8601().withMessage('Valid date is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
    body('numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
    body('tableId').notEmpty().withMessage('Table selection is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { date, timeSlot, numberOfGuests, tableId, specialRequests } = req.body;

    try {
      // Validate time slot
      if (!TIME_SLOTS.includes(timeSlot)) {
        return res.status(400).json({ message: 'Invalid time slot' });
      }

      // Validate date is not in the past
      const reservationDate = new Date(date);
      reservationDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (reservationDate < today) {
        return res.status(400).json({ message: 'Reservation date cannot be in the past' });
      }

      // Validate table exists
      const table = await Table.findById(tableId);
      if (!table || !table.isActive) {
        return res.status(404).json({ message: 'Table not found or unavailable' });
      }

      // Validate capacity
      if (numberOfGuests > table.capacity) {
        return res.status(400).json({
          message: `Table ${table.tableNumber} only fits ${table.capacity} guests. You need ${numberOfGuests} seats.`,
        });
      }

      // Check availability — prevent double booking
      const available = await isTableAvailable(tableId, reservationDate, timeSlot);
      if (!available) {
        return res.status(409).json({
          message: `Table ${table.tableNumber} is already booked for ${timeSlot} on this date. Please choose another table or time.`,
        });
      }

      const reservation = await Reservation.create({
        user: req.user._id,
        table: tableId,
        date: reservationDate,
        timeSlot,
        numberOfGuests,
        specialRequests: specialRequests || '',
      });

      const populated = await reservation.populate([
        { path: 'user', select: 'name email' },
        { path: 'table', select: 'tableNumber capacity' },
      ]);

      res.status(201).json(populated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/reservations/:id — update reservation (admin or owner)
router.put('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Only admin or the owner can update
    if (req.user.role === 'customer' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update a cancelled reservation' });
    }

    const { date, timeSlot, numberOfGuests, tableId, specialRequests, status } = req.body;

    // If changing date/time/table — check availability
    const newTableId = tableId || reservation.table.toString();
    const newDate = date || reservation.date;
    const newTimeSlot = timeSlot || reservation.timeSlot;

    if (date || timeSlot || tableId) {
      const reservationDate = new Date(newDate);
      reservationDate.setHours(0, 0, 0, 0);

      const table = await Table.findById(newTableId);
      if (!table || !table.isActive) {
        return res.status(404).json({ message: 'Table not found' });
      }

      const guests = numberOfGuests || reservation.numberOfGuests;
      if (guests > table.capacity) {
        return res.status(400).json({
          message: `Table ${table.tableNumber} only fits ${table.capacity} guests`,
        });
      }

      const available = await isTableAvailable(newTableId, reservationDate, newTimeSlot, req.params.id);
      if (!available) {
        return res.status(409).json({ message: 'This table is already booked for the selected date and time' });
      }

      reservation.date = reservationDate;
      reservation.timeSlot = newTimeSlot;
      reservation.table = newTableId;
    }

    if (numberOfGuests) reservation.numberOfGuests = numberOfGuests;
    if (specialRequests !== undefined) reservation.specialRequests = specialRequests;
    if (status && req.user.role === 'admin') reservation.status = status;

    await reservation.save();
    const populated = await reservation.populate([
      { path: 'user', select: 'name email' },
      { path: 'table', select: 'tableNumber capacity' },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/reservations/:id — cancel reservation
router.delete('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Customer can only cancel their own
    if (req.user.role === 'customer' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Reservation is already cancelled' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.json({ message: 'Reservation cancelled successfully', reservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
