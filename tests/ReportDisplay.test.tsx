import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReportDisplay } from '../client/src/components/ReportDisplay';

// Mock MathJax
global.MathJax = {
  Hub: {
    Queue: jest.fn(),
    Config: jest.fn(),
  },
};

describe('ReportDisplay', () => {
  const mockReport = {
    '2023': {
      heading: 'Tax Declaration of 2023',
      fields: [
        { name: 'GPM308P', value: 1000 },
        {
          name: 'GPM308F',
          subfields: [
            { name: 'F1', value: 500 },
            { name: 'F2', value: 200 },
            { name: 'F4', value: 300 },
          ],
        },
      ],
    },
  };

  const mockCalculationDetails = {
    2023: [
      {
        type: 'income',
        description: 'Income calculation',
        calculation: '1000 + 500 - 200',
        result: 1300,
      },
    ],
  };

  it('renders report data correctly', () => {
    render(<ReportDisplay report={mockReport} calculationDetails={mockCalculationDetails} />);

    expect(screen.getByText('Tax Declaration of 2023')).toBeInTheDocument();
    expect(screen.getByText('GPM308P')).toBeInTheDocument();
    expect(screen.getByText('1000.00')).toBeInTheDocument();
    expect(screen.getByText('GPM308F')).toBeInTheDocument();
    expect(screen.getByText('F1')).toBeInTheDocument();
    expect(screen.getByText('500.00')).toBeInTheDocument();
  });

  it('renders calculation details with MathJax', () => {
    render(<ReportDisplay report={mockReport} calculationDetails={mockCalculationDetails} />);

    expect(screen.getByText('Show Calculation Details')).toBeInTheDocument();
    expect(screen.getByText('Income calculation')).toBeInTheDocument();
    expect(screen.getByText('\\(1000 + 500 - 200 = 1300.00\\)')).toBeInTheDocument();
  });
});