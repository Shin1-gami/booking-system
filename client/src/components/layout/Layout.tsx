import { Outlet } from 'react-router';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8 sm:px-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}