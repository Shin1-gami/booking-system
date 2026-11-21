import { isAxiosError } from 'axios';

/**
 * Централізовано витягує зрозуміле повідомлення про помилку з відповіді API або об'єкта Error.
 */
export function getErrorMessage(error: unknown, fallback = 'Виникла непередбачувана помилка'): string {
  if (isAxiosError(error)) {
    return error.response?.data?.error ?? error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}