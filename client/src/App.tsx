import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GuestOnlyRoute, ProtectedRoute } from './components/auth/ProtectedRoute';
import ToastContainer from './components/common/ToastContainer';
import DashboardLayout from './components/layout/DashboardLayout';
import Layout from './components/layout/Layout';
import AboutPage from './pages/AboutPage';
import BookingDetailsPage from './pages/bookings/BookingDetailsPage';
import BookingFormPage from './pages/bookings/BookingFormPage';
import BookingsListPage from './pages/bookings/BookingsListPage';
import CategoriesListPage from './pages/categories/CategoriesListPage';
import CategoryDetailsPage from './pages/categories/CategoryDetailsPage';
import CategoryFormPage from './pages/categories/CategoryFormPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';
import ResourceDetailsPage from './pages/resources/ResourceDetailsPage';
import ResourceFormPage from './pages/resources/ResourceFormPage';
import ResourcesListPage from './pages/resources/ResourcesListPage';
import { useAuthStore } from './stores/authStore';

export function App() {
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <BrowserRouter>
      <ToastContainer />

      <Routes>
        {/* Публічні маршрути */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/login"
            element={
              <GuestOnlyRoute>
                <LoginPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnlyRoute>
                <RegisterPage />
              </GuestOnlyRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Захищені маршрути панелі керування */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          {/* CRUD: Ресурси */}
          <Route path="resources" element={<ResourcesListPage />} />
          <Route
            path="resources/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ResourceFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="resources/:id" element={<ResourceDetailsPage />} />
          <Route
            path="resources/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ResourceFormPage />
              </ProtectedRoute>
            }
          />

          {/* CRUD: Бронювання */}
          <Route path="bookings" element={<BookingsListPage />} />
          <Route path="bookings/new" element={<BookingFormPage />} />
          <Route path="bookings/:id" element={<BookingDetailsPage />} />
          <Route path="bookings/:id/edit" element={<BookingFormPage />} />

          {/* CRUD: Категорії */}
          <Route path="categories" element={<CategoriesListPage />} />
          <Route
            path="categories/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CategoryFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="categories/:id" element={<CategoryDetailsPage />} />
          <Route
            path="categories/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CategoryFormPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;