const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/tables', require('./routes/tables'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Restaurant Reservation API is running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant_reservation';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    // Seed tables on first run
    await seedTables();
    // Seed demo users on first run
    await seedUsers();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function seedTables() {
  const Table = require('./models/Table');
  const count = await Table.countDocuments();
  if (count === 0) {
    const tables = [
      { tableNumber: 1, capacity: 2 },
      { tableNumber: 2, capacity: 2 },
      { tableNumber: 3, capacity: 4 },
      { tableNumber: 4, capacity: 4 },
      { tableNumber: 5, capacity: 4 },
      { tableNumber: 6, capacity: 6 },
      { tableNumber: 7, capacity: 6 },
      { tableNumber: 8, capacity: 8 },
      { tableNumber: 9, capacity: 8 },
      { tableNumber: 10, capacity: 10 },
    ];
    await Table.insertMany(tables);
    console.log('Tables seeded successfully');
  }
}

async function seedUsers() {
  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count === 0) {
    const users = [
      { name: 'Demo Customer', email: 'customer@demo.com', password: 'password123', role: 'customer' },
      { name: 'Demo Admin', email: 'admin@demo.com', password: 'password123', role: 'admin' },
    ];
    await User.insertMany(users);
    console.log('Demo users seeded successfully');
  }
}
