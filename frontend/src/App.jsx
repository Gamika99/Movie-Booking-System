
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

// Public Pages
import Home from './pages/public/Home';
import Movies from './pages/public/Movies';
import MovieDetails from './pages/public/MovieDetails';
import Theaters from './pages/public/Theaters';
import About from './pages/public/About';
import Contact from './pages/public/Contact';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// User Pages
import Profile from './pages/user/Profile';
import MyBookings from './pages/user/MyBookings';
import BookingDetails from './pages/user/BookingDetails';

// Booking Pages
import SelectSeats from './pages/booking/SelectSeats';
import Checkout from './pages/booking/Checkout';
import Payment from './pages/booking/Payment';
import BookingSuccess from './pages/booking/BookingSuccess';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import MoviesManagement from './pages/admin/MoviesManagement';
import TheatersManagement from './pages/admin/TheatersManagement';
import ScreensManagement from './pages/admin/ScreensManagement';
import ShowsManagement from './pages/admin/ShowsManagement';
import BookingsManagement from './pages/admin/BookingsManagement';
import UsersManagement from './pages/admin/UsersManagement';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';

// Route Guards
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';

// Theme
import { toggleTheme } from './store/slices/uiSlice';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.ui);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            <Route path="/theaters" element={<Theaters />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
          </Route>

          {/* User Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<UserLayout />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/booking/:bookingId" element={<BookingDetails />} />
              <Route path="/select-seats/:showId" element={<SelectSeats />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/booking-success/:bookingId" element={<BookingSuccess />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/movies" element={<MoviesManagement />} />
              <Route path="/admin/theaters" element={<TheatersManagement />} />
              <Route path="/admin/screens" element={<ScreensManagement />} />
              <Route path="/admin/shows" element={<ShowsManagement />} />
              <Route path="/admin/bookings" element={<BookingsManagement />} />
              <Route path="/admin/users" element={<UsersManagement />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/reports" element={<Reports />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;