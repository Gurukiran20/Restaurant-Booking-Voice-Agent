const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars FIRST
dotenv.config();

const connectDB = require('./config/db');
const bookingRoutes = require('./routes/bookingRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Voice Agent API is running' });
});

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/voice', voiceRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
