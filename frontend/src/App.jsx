import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewReservation from './pages/NewReservation';

const ProtectedRoute = ({ children, adminRequired = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminRequired && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/new-reservation" element={<ProtectedRoute><NewReservation /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminRequired><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(13, 27, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#F5F0E8',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '0.95rem',
              fontWeight: '500',
            },
            success: {
              style: {
                border: '1px solid rgba(39, 174, 96, 0.5)',
              },
              iconTheme: {
                primary: '#27AE60',
                secondary: '#F5F0E8',
              },
            },
            error: {
              style: {
                border: '1px solid rgba(192, 57, 43, 0.5)',
              },
              iconTheme: {
                primary: '#C0392B',
                secondary: '#F5F0E8',
              },
            },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
