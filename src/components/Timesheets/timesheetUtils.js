// Timesheets utility functions

// Utility function to get Monday of the week for any given date
export const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};




// Helper function to format date as YYYY-MM-DD consistently
export const formatDateToYMD = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};



// Get week dates and info
export const getWeekDates = (startDate) => {
  const start = new Date(startDate);
  const monday = getMondayOfWeek(start);
  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push(day);
  }
  return {
    start: monday,
    end,
    startString: formatDateToYMD(monday),
    endString: formatDateToYMD(end),
    weekDates: {
      monday: new Date(monday),
      tuesday: new Date(monday.getTime() + 24 * 60 * 60 * 1000),
      wednesday: new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000),
      thursday: new Date(monday.getTime() + 3 * 24 * 60 * 60 * 1000),
      friday: new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000),
      saturday: new Date(monday.getTime() + 5 * 24 * 60 * 60 * 1000),
      sunday: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)
    },
    weekDays
  };
};

// Get current week info
export const getCurrentWeek = () => {
  const today = new Date();
  return getWeekDates(today);
};

// Get week dates array for highlighting
export const getWeekDatesArray = (date) => {
  const weekInfo = getWeekDates(new Date(date));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekInfo.start);
    d.setDate(weekInfo.start.getDate() + i);
    dates.push(d);
  }
  return dates;
};

// Format date for display
export const formatDate = (date) => {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  });
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get color for percentage
export const getPercentageColor = (percentage) => {
  if (percentage >= 90) return 'success.main';
  if (percentage >= 70) return 'warning.main';
  return 'error.main';
};
