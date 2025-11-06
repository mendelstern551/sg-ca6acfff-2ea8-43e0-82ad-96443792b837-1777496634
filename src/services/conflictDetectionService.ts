
import { Booking } from "@/types/booking";

export interface DateConflict {
  hasConflict: boolean;
  conflictingBookings: Booking[];
  message?: string;
}

export const conflictDetectionService = {
  /**
   * Check if a date range conflicts with existing bookings
   */
  checkDateConflict(
    startDate: string,
    endDate: string,
    existingBookings: Booking[],
    excludeBookingId?: string
  ): DateConflict {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    const conflictingBookings = existingBookings.filter((booking) => {
      // Skip the booking being edited
      if (excludeBookingId && booking.id === excludeBookingId) {
        return false;
      }

      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);

      // Check for date overlap
      // Overlap occurs if: (newStart <= bookingEnd) AND (newEnd >= bookingStart)
      const hasOverlap = newStart <= bookingEnd && newEnd >= bookingStart;

      return hasOverlap && booking.confirmed;
    });

    if (conflictingBookings.length > 0) {
      const bookingNames = conflictingBookings
        .map((b) => `"${b.name}" (${b.contact_name})`)
        .join(", ");

      return {
        hasConflict: true,
        conflictingBookings,
        message: `⚠️ Date conflict detected with: ${bookingNames}`,
      };
    }

    return {
      hasConflict: false,
      conflictingBookings: [],
    };
  },

  /**
   * Get all bookings that overlap with a specific date range
   */
  getOverlappingBookings(
    startDate: string,
    endDate: string,
    bookings: Booking[]
  ): Booking[] {
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);

    return bookings.filter((booking) => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);

      return rangeStart <= bookingEnd && rangeEnd >= bookingStart;
    });
  },

  /**
   * Check if a booking exceeds venue capacity
   */
  checkCapacityWarning(
    numberOfGuests: number,
    startDate: string,
    endDate: string,
    bookings: Booking[],
    excludeBookingId?: string
  ): { hasWarning: boolean; message?: string; totalGuests?: number } {
    const MAX_CAPACITY = 150; // Adjust based on venue capacity

    const overlappingBookings = this.getOverlappingBookings(
      startDate,
      endDate,
      bookings
    ).filter((b) => b.id !== excludeBookingId && b.confirmed);

    if (overlappingBookings.length === 0) {
      if (numberOfGuests > MAX_CAPACITY) {
        return {
          hasWarning: true,
          message: `⚠️ Guest count (${numberOfGuests}) exceeds maximum venue capacity (${MAX_CAPACITY})`,
        };
      }
      return { hasWarning: false };
    }

    const totalGuests = overlappingBookings.reduce(
      (sum, b) => sum + b.number_of_guests,
      numberOfGuests
    );

    if (totalGuests > MAX_CAPACITY) {
      return {
        hasWarning: true,
        message: `⚠️ Combined guest count (${totalGuests}) exceeds venue capacity (${MAX_CAPACITY})`,
        totalGuests,
      };
    }

    return { hasWarning: false };
  },
};
