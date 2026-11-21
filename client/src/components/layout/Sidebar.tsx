import { NavLink } from 'react-router-dom';
import {
  Boxes,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Globe,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { APP_CONFIG } from '@/constants/config';
import { useUiStore } from '@/stores/uiStore';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Панель керування', icon: LayoutDashboard, end: true },
  { to: '/dashboard/resources', label: 'Ресурси', icon: Boxes, end: false },
  { to: '/dashboard/bookings', label: 'Бронювання', icon: CalendarCheck2, end: false },
  { to: '/dashboard/categories', label: 'Категорії', icon: FolderKanban, end: false },
];

export default function Sidebar() {
  const isMobileOpen = useUiStore((s) => s.isMobileSidebarOpen);
  const isCollapsed = useUiStore((s) => s.isDesktopSidebarCollapsed);
  const closeMobileSidebar = useUiStore((s) => s.closeMobileSidebar);
  const toggleDesktopSidebar = useUiStore((s) => s.toggleDesktopSidebar);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
    }`;

  const renderContent = (mobile: boolean) => (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <NavLink
            to="/dashboard"
            onClick={closeMobileSidebar}
            className="flex items-center gap-2.5 overflow-hidden font-bold text-primary-600 dark:text-primary-400"
          >
            <CalendarCheck2 className="h-6 w-6 shrink-0" />
            {(!isCollapsed || mobile) && (
              <span className="truncate text-lg">{APP_CONFIG.name}</span>
            )}
          </NavLink>

          {mobile ? (
            <button
              type="button"
              onClick={closeMobileSidebar}
              aria-label="Закрити меню"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              aria-label={isCollapsed ? 'Розгорнути панель' : 'Згорнути панель'}
              className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:inline-flex"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <nav aria-label="Меню панелі керування" className="space-y-1.5 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMobileSidebar}
              title={isCollapsed && !mobile ? label : undefined}
              className={linkClasses}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!isCollapsed || mobile) && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <NavLink
          to="/"
          onClick={closeMobileSidebar}
          title={isCollapsed && !mobile ? 'Публічний каталог' : undefined}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Globe className="h-5 w-5 shrink-0" />
          {(!isCollapsed || mobile) && <span className="truncate">Публічний каталог</span>}
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Десктопна бічна панель */}
      <aside
        className={`hidden shrink-0 border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 lg:block ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Мобільна висувна панель (Drawer) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white shadow-2xl dark:bg-slate-900">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}