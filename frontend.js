import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const API = 'http://localhost:5000/api';
const SEATS = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'C5'];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [view, setView] = useState('movies'); // 'movies' | 'bookings' | 'auth'
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  const fetchMovies = async () => {
    const res = await axios.get(`${API}/movies`);
    setMovies(res.data);
    if (selectedMovie) {
      setSelectedMovie(res.data.find((m) => m._id === selectedMovie._id));
    }
  };

  const fetchMyBookings = async () => {
    if (!token) return;
    const res = await axios.get(`${API}/my-bookings`, {
      headers: { Authorization: token }
    });
    setMyBookings(res.data);
  };

  useEffect(() => {
    fetchMovies();
    if (token) fetchMyBookings();
  }, [token]);

  // Login / Register Submit
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const res = await axios.post(`${API}/auth/register`, formData);
        alert(res.data.message);
        setIsRegister(false);
      } else {
        const res = await axios.post(`${API}/auth/login`, formData);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
        setView('movies');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication Error');
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken('');
    setUser(null);
    setView('movies');
  };

  const addDemoMovie = async () => {
    const samples = [
      { title: 'Interstellar', genre: 'Sci-Fi', duration: '2h 49m', showtime: '07:30 PM', ticketPrice: 300, poster: 'https://unsplash.com' },
      { title: 'The Dark Knight', genre: 'Action', duration: '2h 32m', showtime: '10:15 PM', ticketPrice: 250, poster: 'https://unsplash.com' }
    ];
    const randomMovie = samples[Math.floor(Math.random() * samples.length)];
    await axios.post(`${API}/movies`, randomMovie);
    fetchMovies();
  };

  const toggleSeat = (seat) => {
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  const confirmBooking = async () => {
    if (!token) {
      alert('Ticket book karne ke liye pehle Login karein!');
      return setView('auth');
    }
    if (selectedSeats.length === 0) return alert('Kam se kam 1 seat select karein!');

    try {
      const res = await axios.post(
        `${API}/movies/${selectedMovie._id}/book`,
        { seats: selectedSeats },
        { headers: { Authorization: token } }
      );
      alert(res.data.message);
      setSelectedSeats([]);
      fetchMovies();
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Booking Failed');
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark px-4 mb-4">
        <span className="navbar-brand fw-bold" style={{ cursor: 'pointer' }} onClick={() => setView('movies')}>
          🎬 IMovies
        </span>
        <div className="d-flex gap-2 align-items-center">
          <button className="btn btn-outline-light btn-sm" onClick={() => setView('movies')}>Movies</button>
          {token ? (
            <>
              <button className="btn btn-outline-warning btn-sm" onClick={() => { fetchMyBookings(); setView('bookings'); }}>
                My Bookings ({myBookings.length})
              </button>
              <span className="text-light small mx-2">Hi, {user?.name}</span>
              <button className="btn btn-danger btn-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setView('auth')}>Login / Register</button>
          )}
        </div>
      </nav>

      <div className="container">
        {/* VIEW 1: LOGIN / REGISTER */}
        {view === 'auth' && (
          <div className="card p-4 mx-auto shadow" style={{ maxWidth: '400px' }}>
            <h4 className="mb-3">{isRegister ? 'Create Account' : 'User Login'}</h4>
            <form onSubmit={handleAuth}>
              {isRegister && (
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Full Name"
                  required
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              )}
              <input
                type="email"
                className="form-control mb-2"
                placeholder="Email"
                required
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Password"
                required
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button className="btn btn-primary w-100 mb-2">{isRegister ? 'Register' : 'Login'}</button>
            </form>
            <button className="btn btn-link btn-sm" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          </div>
        )}

        {/* VIEW 2: MOVIES & SEAT SELECTION */}
        {view === 'movies' && (
          <>
            <div className="d-flex justify-content-between mb-3">
              <h4>Now Showing</h4>
              <button className="btn btn-sm btn-outline-secondary" onClick={addDemoMovie}>+ Add Sample Movie</button>
            </div>

            <div className="row g-3 mb-4">
              {movies.map((m) => (
                <div className="col-md-4" key={m._id}>
                  <div className="card h-100 shadow-sm">
                    <img src={m.poster} alt={m.title} className="card-img-top" style={{ height: '180px', objectFit: 'cover' }} />
                    <div className="card-body">
                      <h5>{m.title}</h5>
                      <p className="text-muted small mb-1">{m.genre} • {m.duration}</p>
                      <p className="fw-bold">Show: {m.showtime} | ₹{m.ticketPrice}</p>
                      <button className="btn btn-primary w-100" onClick={() => { setSelectedMovie(m); setSelectedSeats([]); }}>
                        Book Seats
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedMovie && (
              <div className="card p-4 shadow mb-5">
                <h5>Select Seats for <span className="text-primary">{selectedMovie.title}</span> ({selectedMovie.showtime})</h5>
                <div className="d-flex flex-wrap gap-2 my-3" style={{ maxWidth: '330px' }}>
                  {SEATS.map((seat) => {
                    const booked = selectedMovie.bookedSeats.includes(seat);
                    const selected = selectedSeats.includes(seat);
                    return (
                      <button
                        key={seat}
                        disabled={booked}
                        onClick={() => toggleSeat(seat)}
                        style={{ width: '58px' }}
                        className={`btn btn-sm ${booked ? 'btn-danger' : selected ? 'btn-success' : 'btn-outline-secondary'}`}
                      >
                        {seat}
                      </button>
                    );
                  })}
                </div>
                <p className="fw-bold">Seats: {selectedSeats.join(', ') || 'None'} | Total: ₹{selectedSeats.length * selectedMovie.ticketPrice}</p>
                <button className="btn btn-success" style={{ width: '200px' }} onClick={confirmBooking}>
                  Confirm Booking
                </button>
              </div>
            )}
          </>
        )}

        {/* VIEW 3: MY BOOKINGS */}
        {view === 'bookings' && (
          <div>
            <h4 className="mb-3">My Ticket Bookings</h4>
            {myBookings.length === 0 ? (
              <p className="text-muted">Abhi tak koi ticket book nahi ki gayi hai.</p>
            ) : (
              <div className="row g-3">
                {myBookings.map((b) => (
                  <div className="col-md-6" key={b._id}>
                    <div className="card p-3 shadow-sm border-success">
                      <h5 className="text-success">{b.movieTitle}</h5>
                      <p className="mb-1"><strong>Showtime:</strong> {b.showtime}</p>
                      <p className="mb-1"><strong>Seats:</strong> {b.seats.join(', ')}</p>
                      <p className="mb-0"><strong>Amount Paid:</strong> ₹{b.totalPrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
