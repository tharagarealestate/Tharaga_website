import React from 'react'
import { render, screen } from '@testing-library/react'
import { LeadCard } from '@/app/(dashboard)/builder/leads/_components/LeadCard'

const lead = {
  id: '1',
  created_at: new Date().toISOString(),
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9999999999',
  status: 'new',
  score: 9.2,
  source: 'organic',
  budget: 12000000,
  property: { title: 'Luxury Villa', location: 'Bangalore' },
}

test('renders lead card with name and contact', () => {
  render(<LeadCard lead={lead as any} />)
  expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /john@example.com/i })).toHaveAttribute('href', 'mailto:john@example.com')
  expect(screen.getByRole('link', { name: /9999999999/i })).toHaveAttribute('href', 'tel:9999999999')
})
