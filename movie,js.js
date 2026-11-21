const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  movieTitle: { type: String, required: true },
  showtime: { type: String, required: true },
  seats: { type: [String], required: true },
  totalPrice: { type: Number, required: true },
  bookedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
