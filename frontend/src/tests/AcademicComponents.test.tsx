import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/academic/MetricCard';
import { RiskBadge } from '@/components/academic/StatusBadges';

describe('MetricCard', () => {
  it('renders its metric label, value, and supporting text', () => {
    render(
      <MetricCard
        index="01"
        label="ENROLLED POPULATION"
        value={125}
        sublabel="Active student registrations"
      />
    );

    expect(screen.getByText('01 // ENROLLED POPULATION')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByText('Active student registrations')).toBeInTheDocument();
  });

  it('renders a neutral trend value', () => {
    render(
      <MetricCard
        index="02"
        label="ATTENDANCE"
        value="87%"
        trend={{ value: 'No change', isNeutral: true }}
      />
    );

    expect(screen.getByText('No change')).toHaveClass('text-slate-500');
  });
});

describe('RiskBadge', () => {
  it('normalizes the risk label and displays its score', () => {
    render(<RiskBadge level="HIGH" score={0.75} />);

    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('(0.75)')).toBeInTheDocument();
  });
});
