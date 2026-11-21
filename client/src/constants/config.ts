const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const derivedSocketUrl = rawApiUrl.replace(/\/api\/?$/, '');

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'BookingSystem',
  apiUrl: rawApiUrl,
  socketUrl: import.meta.env.VITE_SOCKET_URL || derivedSocketUrl || 'http://localhost:3000',
  uploadsUrl: `${derivedSocketUrl || 'http://localhost:3000'}/uploads`,
  env: import.meta.env.VITE_APP_ENV || 'development',
  contactEmail: 'support@bookingsystem.ua',
  contactPhone: '+380 (44) 123-45-67',
} as const;

export const STORAGE_KEYS = {
  accessToken: 'accessToken',
  theme: 'theme',
} as const;