const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  numberOfGuests: {
    type: Number,
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  bookingTime: {
    type: String,
    required: true,
  },
  cuisinePreference: {
    type: String,
    required: true,
  },
  specialRequests: {
    type: String,
    default: '',
  },
  weatherInfo: {
    type: Object,
    default: {},
  },
  seatingPreference: {
    type: String,
    default: 'indoor',
  },

  // ⭐ NEW FIELD ADDED  
  location: {
    type: String,
    required: true,
    default: 'Bangalore, IN',
  },

  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
