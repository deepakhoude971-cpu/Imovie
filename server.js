const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Movie = require('./models/Movie');
const Booking = require('./models/Booking');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.log('MongoDB Connection Error:', err));

// --- JWT Middleware ---
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Login required!' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Registration successful! Please login.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Movie Routes ---
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

app.post('/api/movies', async (req, res) => {
  const newMovie = new Movie(req.body);
  await newMovie.save();
  res.status(201).json(newMovie);
});

// --- Booking Routes (Protected by JWT) ---
app.post('/api/movies/:id/book', verifyToken, async (req, res) => {
  try {
    const { seats } = req.body;
    const movie = await Movie.findById(req.params.id);

    const alreadyBooked = seats.some((s) => movie.bookedSeats.includes(s));
    if (alreadyBooked) {
      return res.status(400).json({ message: 'Selected seats are already booked!' });
    }

    movie.bookedSeats.push(...seats);
    await movie.save();

    const booking = new Booking({
      userEmail: req.user.email,
      movieTitle: movie.title,
      showtime: movie.showtime,
      seats,
      totalPrice: seats.length * movie.ticketPrice
    });
    await booking.save();

    res.json({ message: 'Ticket Booked Successfully!', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/my-bookings', verifyToken, async (req, res) => {
  const bookings = await Booking.find({ userEmail: req.user.email }).sort({ bookedAt: -1 });
  res.json(bookings);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
