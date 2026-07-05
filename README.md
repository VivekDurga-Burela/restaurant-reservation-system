# 🍽️ Restaurant Reservation Management System

A full-stack web application for managing restaurant table reservations with a dark luxury UI theme, built with React, Node.js, Express, MongoDB, and JWT authentication.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite, React Router, Axios, React Hot Toast |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Validation | express-validator |
| Styling | CSS Variables, Google Fonts (Playfair Display, Inter) |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend API URL
npm run dev
```

### Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/restaurant_reservation
JWT_SECRET=your_jwt_secret_key
ADMIN_SECRET=admin123
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
```

---

## 👥 User Roles

### Customer
- Register and login
- Create reservations (date, time slot, party size)
- View their own reservations
- Cancel their own reservations
- Filter reservations by status

### Admin
- View ALL reservations
- Filter reservations by date and status
- Cancel or update any reservation
- Manage tables (add, deactivate)
- Full dashboard with stats

### Creating an Admin Account
During registration, select "Administrator" role and enter the admin secret key (`admin123` by default, configurable via `ADMIN_SECRET` env variable).

---

## 🔒 Reservation & Availability Logic

### Double Booking Prevention
The system uses a compound MongoDB index on `{ table, date, timeSlot, status }`. Before creating any reservation, the backend queries for existing **confirmed** reservations for the same table + date + timeSlot combination. If one exists, the booking is rejected with a `409 Conflict` response.

### Capacity Validation
When a customer selects a party size and checks availability, the backend only returns tables where `capacity >= numberOfGuests`. If a customer somehow submits a booking for a table with insufficient capacity, the backend validates and rejects it with a clear error message.

### Date Validation
Reservations cannot be made for past dates. The backend compares the reservation date against today's date (normalized to midnight).

### Availability Check Flow
1. Customer selects date, time slot, and number of guests
2. Frontend calls `GET /api/tables/available?date=&timeSlot=&guests=`
3. Backend finds all confirmed reservations for that date + time slot
4. Returns only tables that are: (a) not already booked, and (b) have enough capacity
5. Customer selects from available tables only

### Assumptions
- Time slots are fixed (11:00-21:30 in 30-minute intervals)
- A table can only have one confirmed reservation per time slot
- Cancelled reservations do not block availability
- Table capacity is the maximum number of guests allowed

---

## 🔑 Role-Based Access Control

JWT tokens are issued on login/register containing the user's ID. The `protect` middleware verifies the token on every protected route. The `adminOnly` middleware additionally checks `user.role === 'admin'`.

| Endpoint | Customer | Admin |
|----------|----------|-------|
| Create reservation | ✅ Own | ✅ |
| View reservations | ✅ Own only | ✅ All |
| Cancel reservation | ✅ Own only | ✅ Any |
| Update reservation | ✅ Own only | ✅ Any |
| View tables | ✅ | ✅ |
| Add/manage tables | ❌ | ✅ |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Reservations
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reservations` | Get reservations (own/all) | ✅ |
| POST | `/api/reservations` | Create reservation | ✅ |
| GET | `/api/reservations/:id` | Get single reservation | ✅ |
| PUT | `/api/reservations/:id` | Update reservation | ✅ |
| DELETE | `/api/reservations/:id` | Cancel reservation | ✅ |
| GET | `/api/reservations/timeslots` | Get available time slots | ✅ |

### Tables
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tables` | Get all tables | ✅ |
| GET | `/api/tables/available` | Check availability | ✅ |
| POST | `/api/tables` | Add table | ✅ Admin |
| PUT | `/api/tables/:id` | Update table | ✅ Admin |
| DELETE | `/api/tables/:id` | Deactivate table | ✅ Admin |

### HTTP Status Codes
- `200 OK` - Successful GET/PUT/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Double booking attempt
- `500 Internal Server Error` - Server error

---

## 🗃️ Data Models

### User
```js
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: 'customer' | 'admin' (default: 'customer')
}
```

### Table
```js
{
  tableNumber: Number (required, unique),
  capacity: Number (required),
  isActive: Boolean (default: true)
}
```

### Reservation
```js
{
  user: ObjectId (ref: User, required),
  table: ObjectId (ref: Table, required),
  date: Date (required),
  timeSlot: String (required, enum),
  numberOfGuests: Number (required, min: 1),
  status: 'confirmed' | 'cancelled' (default: 'confirmed'),
  specialRequests: String (optional)
}
```

### Pre-seeded Data
The system automatically seeds on first run:
- **10 tables**: 2x (2 seats), 3x (4 seats), 2x (6 seats), 2x (8 seats), 1x (10 seats)
- **2 demo users**: customer@demo.com / password123, admin@demo.com / password123

---

## 🎨 UI Design

The application features a dark luxury restaurant theme with:
- **Colors**: Deep navy (#0D1B2A), Gold (#C9A84C), Dark background (#080F1A)
- **Fonts**: Playfair Display (headings), Inter (body text)
- **Effects**: Glass morphism, gold glow animations, smooth transitions
- **Responsive**: Mobile-friendly with hamburger menu

---

## 🚀 Deployment

### Backend — Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secure_jwt_secret
   ADMIN_SECRET=your_admin_secret
   ```
5. Deploy

### Frontend — Vercel

1. Push code to GitHub
2. Import project on Vercel
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
5. Deploy

---

## ⚠️ Known Limitations

- No email confirmation for reservations
- No real-time updates (polling not implemented)
- Single restaurant support only
- Time slots are fixed (not configurable from UI)
- No payment integration
- No reservation reminders
- No export functionality

---

## 🔮 Areas for Improvement

- Email notifications on booking confirmation/cancellation
- Real-time availability with WebSockets
- SMS reservation reminders
- Multi-restaurant support
- Advanced analytics dashboard for admin
- Export reservations to CSV/PDF
- Mobile app with React Native
- Configuration UI for time slots
- Payment integration
- Customer reviews and ratings
