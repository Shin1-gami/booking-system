import React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import { authService, tokenStorage } from './services/api';

const Navbar: React.FC = () => {
  useLocation();
  const user = tokenStorage.getUser();
  const isAuthenticated = Boolean(tokenStorage.getAccessToken());

  const handleLogout = async () => {
    await authService.logout();
    window.location.assign('/login');
  };

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          BookingSystem
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">
            Каталог
          </Link>
          <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400">
            Про проєкт
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {user ? `${user.name} (${user.role})` : 'Авторизовано'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Вийти
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-white hover:bg-blue-700"
            >
              Увійти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;