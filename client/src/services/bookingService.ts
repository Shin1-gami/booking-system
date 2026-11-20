import { bookingService } from './api';

export const getResources = bookingService.getResources;
export const getCategories = bookingService.getCategories;
export const createBooking = bookingService.createBooking;
export const getMyBookings = bookingService.getMyBookings;

export { bookingService };
export default bookingService;