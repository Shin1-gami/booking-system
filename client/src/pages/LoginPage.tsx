import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, extractApiErrorMessage } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await authService.register(name, email, password);
      } else {
        await authService.login(email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        {isRegister ? 'Реєстрація в BookingSystem' : 'Вхід у систему'}
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {isRegister
          ? 'Створіть обліковий запис для бронювання ресурсів'
          : 'Увійдіть, щоб керувати своїми бронюваннями'}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Імʼя
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Олександр Коваленко"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Пароль
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Завантаження...' : isRegister ? 'Зареєструватися' : 'Увійти'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        {isRegister ? 'Вже маєте акаунт?' : 'Ще немає облікового запису?'}{' '}
        <button
          type="button"
          onClick={() => {
            setIsRegister((prev) => !prev);
            setError(null);
          }}
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {isRegister ? 'Увійти' : 'Зареєструватися'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;