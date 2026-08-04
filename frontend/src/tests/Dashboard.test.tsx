/**
 * Sample test for Dashboard components
 */

import { render, screen } from '@testing-library/react';
import { GpaChart } from '@/features/dashboard/GpaChart';
import { AttendanceChart } from '@/features/dashboard/AttendanceChart';
import type { GpaTrend, AttendanceTrend } from '@/api/types';

describe('GpaChart', () => {
  const mockData: GpaTrend[] = [
    { semester: 'Sem 1', avgGpa: 3.2 },
    { semester: 'Sem 2', avgGpa: 3.4 },
    { semester: 'Sem 3', avgGpa: 3.3 },
  ];

  it('renders chart with data', () => {
    render(<GpaChart data={mockData} />);
    // Recharts renders SVG elements
    expect(screen.queryByText(/no data available/i)).not.toBeInTheDocument();
  });

  it('shows "no data" message when empty', () => {
    render(<GpaChart data={[]} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});

describe('AttendanceChart', () => {
  const mockData: AttendanceTrend[] = [
    { month: 'Aug', avgAttendance: 85 },
    { month: 'Sep', avgAttendance: 82 },
  ];

  it('renders chart with data', () => {
    render(<AttendanceChart data={mockData} />);
    expect(screen.queryByText(/no data available/i)).not.toBeInTheDocument();
  });

  it('shows "no data" message when empty', () => {
    render(<AttendanceChart data={[]} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});
