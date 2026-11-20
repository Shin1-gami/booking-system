import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Про систему BookingSystem
      </h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        BookingSystem — це платформа онлайн-бронювання ресурсів із підтримкою real-time
        сповіщень, захисту від конфліктів розкладу та рольового розмежування доступу.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900 dark:text-white">
        Ролі користувачів у системі
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            USER
          </span>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Перегляд каталогу ресурсів і категорій, створення та скасування власних бронювань,
            керування списком обраного й отримання сповіщень.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            ADMIN
          </span>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Повне адміністрування категорій і ресурсів, модерація всіх бронювань у системі,
            розсилка системних сповіщень та доступ до метрик моніторингу.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;