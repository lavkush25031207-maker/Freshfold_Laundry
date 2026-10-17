import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import OrdersPage from './pages/OrdersPage';
import TrackingPage from './pages/TrackingPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

export default function App() {
  return (
    <Suspense fallback={<div className="page-loader">Loading FreshFold…</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="book" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="track/:orderNumber" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
          <Route path="login" element={<LoginPage />} />
        </Route>
        <Route path="admin" element={<ProtectedRoute role="ADMIN"><AdminPage /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}
