/**
 * Utility helper functions
 */

// Date formatting
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// CSV export helper
export const exportToCSV = (data: unknown[], filename: string): void => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0] as object);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, unknown>)[header];
          return typeof value === 'string' ? `"${value}"` : value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Permission check helper
export const hasPermission = (userRole: string | null, allowedRoles: string[]): boolean => {
  return userRole ? allowedRoles.includes(userRole) : false;
};

// Number formatting
export const formatGPA = (gpa: number): string => {
  return gpa.toFixed(2);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
