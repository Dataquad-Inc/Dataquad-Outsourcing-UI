/**
 * Date Utility Functions
 * Reusable functions for date formatting and manipulation
 */

/**
 * Format date to DD-MM-YYYY format for API requests
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string|null} Formatted date string or null if invalid
 */
export const formatDateForAPI = (dateString) => {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return null;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return null;
  }
};

/**
 * Format date to YYYY-MM-DD format for HTML date inputs
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
};

/**
 * Format date for display (e.g., "Dec 15, 2025")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date for display:", error);
    return "-";
  }
};

/**
 * Format date and time for display
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date-time:", error);
    return "-";
  }
};

/**
 * Parse DD-MM-YYYY format to Date object
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseDDMMYYYY = (dateString) => {
  if (!dateString) return null;

  try {
    const parts = dateString.split("-");
    if (parts.length !== 3) return null;

    const [day, month, year] = parts;
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime())) return null;
    return date;
  } catch (error) {
    console.error("Error parsing DD-MM-YYYY:", error);
    return null;
  }
};

/**
 * Get date range for common periods (today, this week, this month, etc.)
 * @param {string} period - Period name ("today", "week", "month", "year")
 * @returns {Object} Object with from and to dates in YYYY-MM-DD format
 */
export const getDateRange = (period) => {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  switch (period) {
    case "today":
      // Already set to today
      break;

    case "yesterday":
      from.setDate(from.getDate() - 1);
      to.setDate(to.getDate() - 1);
      break;

    case "week":
      from.setDate(from.getDate() - from.getDay()); // Start of week
      break;

    case "last7days":
      from.setDate(from.getDate() - 7);
      break;

    case "month":
      from.setDate(1); // Start of month
      break;

    case "last30days":
      from.setDate(from.getDate() - 30);
      break;

    case "year":
      from.setMonth(0, 1); // Start of year
      break;

    case "last90days":
      from.setDate(from.getDate() - 90);
      break;

    default:
      return { from: null, to: null };
  }

  return {
    from: formatDateForInput(from),
    to: formatDateForInput(to),
  };
};

/**
 * Check if date is valid
 * @param {string|Date} dateString - Date string or Date object
 * @returns {boolean} True if valid date
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;

  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Get number of days between two dates
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {number} Number of days
 */
export const getDaysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Add days to a date
 * @param {string|Date} dateString - Date string or Date object
 * @param {number} days - Number of days to add (can be negative)
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
export const addDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return formatDateForInput(date);
};

/**
 * Check if date is in the past
 * @param {string|Date} dateString - Date string or Date object
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if date is in the future
 * @param {string|Date} dateString - Date string or Date object
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};
