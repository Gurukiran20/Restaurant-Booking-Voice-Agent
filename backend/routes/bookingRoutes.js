const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { getWeatherForDate } = require('../services/weatherService');
const { v4: uuidv4 } = require('uuid');

// POST /api/bookings - Create a new booking
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      numberOfGuests,
      bookingDate,
      bookingTime,
      cuisinePreference,
      specialRequests,
      location,
      seatingPreference: seatingPreferenceFromClient,
    } = req.body;

    if (!customerName || !numberOfGuests || !bookingDate || !bookingTime) {
      return res
        .status(400)
        .json({ message: 'Name, guests, date and time are required' });
    }

    // Normalize booking date to midnight for consistent comparison
    const dateObj = new Date(bookingDate);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid bookingDate format' });
    }
    dateObj.setHours(0, 0, 0, 0);

    // 👉 Prevent double booking: same date + same time
    const existingBooking = await Booking.findOne({
      bookingDate: dateObj,
      bookingTime,
    });

    if (existingBooking) {
      return res.status(400).json({
        message:
          'That time slot is already booked on this date. Please choose another time.',
      });
    }

    // Fetch weather and seating suggestion
    const weatherInfo = await getWeatherForDate(dateObj, location);

    // Decide seating preference: client > weather suggestion
    let seatingPreference = seatingPreferenceFromClient;
    if (!seatingPreference && weatherInfo && weatherInfo.seatingSuggestion) {
      seatingPreference = weatherInfo.seatingSuggestion; // "indoor" / "outdoor"
    }

    const booking = new Booking({
      bookingId: uuidv4(),            // 🔹 generate unique bookingId
      customerName,
      numberOfGuests,
      bookingDate: dateObj,
      bookingTime,
      cuisinePreference,
      specialRequests,
      weatherInfo,
      seatingPreference: seatingPreference || 'indoor',
      status: 'pending',
      createdAt: new Date(),
      location
    });
    

    const saved = await booking.save();

    return res.status(201).json({
      message: 'Booking created successfully',
      voiceSuggestion:
        weatherInfo?.voiceSuggestion ||
        'Your booking has been created successfully.',
      booking: saved,
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ message: 'Server error creating booking' });
  }
});

// GET /api/bookings - all bookings OR filter by ?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const query = {};

    if (date) {
      const start = new Date(date);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query.bookingDate = { $gte: start, $lt: end };
      }
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

// GET /api/bookings/:id - Get specific booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ booking });
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ message: 'Server error fetching booking' });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ message: 'Server error deleting booking' });
  }
});

module.exports = router;
