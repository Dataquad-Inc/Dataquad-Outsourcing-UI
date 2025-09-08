// Get Monday of the week for any given date
export const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate how many days to shift back to Monday
  // If Sunday (0), go back 6 days; else subtract (day - 1)
  const diff = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Format date as YYYY-MM-DD
export const formatDateToYMD = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get full week info from a given date
export const getWeekDates = (startDate) => {
  const monday = getMondayOfWeek(startDate);

  const weekDays = [];
  const weekDates = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push(day);

    // Correct mapping: monday should be first
    weekDates[days[i]] = new Date(day);
  }

  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: monday,
    end,
    startString: formatDateToYMD(monday),
    endString: formatDateToYMD(end),
    weekDates,
    weekDays
  };
};

// Get date for a specific day in the week (relative to Monday start)
export const getDateForDay = (weekStartDate, dayName) => {
  const days = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6
  };

  const dayOffset = days[dayName.toLowerCase()];
  if (dayOffset === undefined) return null;

  const weekStart = getMondayOfWeek(weekStartDate); // always normalize to Monday
  const targetDate = new Date(weekStart);
  targetDate.setDate(weekStart.getDate() + dayOffset);

  return targetDate;
};

// Get current week info
export const getCurrentWeek = () => {
  const today = new Date();
  return getWeekDates(today);
};

// Get current month start and end
export const getCurrentMonth = () => {
  const today = new Date();

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    startOfMonth,
    endOfMonth,
    startString: formatDateToYMD(startOfMonth),
    endString: formatDateToYMD(endOfMonth)
  };
};

// Get array of week dates (for highlighting UI)
export const getWeekDatesArray = (date) => {
  const monday = getMondayOfWeek(date);
  const dates = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }

  return dates;
};

// Format date for UI display
export const formatDate = (date) => {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  });
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get percentage color
export const getPercentageColor = (percentage) => {
  if (percentage >= 90) return 'success.main';
  if (percentage >= 70) return 'warning.main';
  return 'error.main';
};
