import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GuestOnlyRoute, ProtectedRoute } from './components/auth/ProtectedRoute';
import Loading from './components/common/Loading';
import ToastContainer from './components/common/ToastContainer';
import DashboardLayout from './components/layout/DashboardLayout';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuthStore } from './stores/authStore';

// Кожна відкладена сторінка потрапляє в окремий JS-chunk
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BookingsListPage = lazy(() => import('./pages/bookings/BookingsListPage'));
const BookingDetailsPage = lazy(() => import('./pages/bookings/BookingDetailsPage'));
const BookingFormPage = lazy(() => import('./pages/bookings/BookingFormPage'));
const CategoriesListPage = lazy(() => import('./pages/categories/CategoriesListPage'));
const CategoryDetailsPage = lazy(() => import('./pages/categories/CategoryDetailsPage'));
const CategoryFormPage = lazy(() => import('./pages/categories/CategoryFormPage'));
const ResourcesListPage = lazy(() => import('./pages/resources/ResourcesListPage'));
const ResourceDetailsPage = lazy(() => import('./pages/resources/ResourceDetailsPage'));
const ResourceFormPage = lazy(() => import('./pages/resources/ResourceFormPage'));

export function App() {
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <BrowserRouter>
      <ToastContainer />

      <Suspense fallback={<Loading fullScreen text="Завантаження сторінки..." />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;