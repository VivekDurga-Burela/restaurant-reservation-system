const mongoose = require('mongoose');

const TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30',
];

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true, enum: TIME_SLOTS },
    numberOfGuests: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    specialRequests: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Compound index to prevent double bookings
reservationSchema.index({ table: 1, date: 1, timeSlot: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
module.exports.TIME_SLOTS = TIME_SLOTS;
