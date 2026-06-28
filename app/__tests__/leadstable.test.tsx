import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { LeadsTable } from '@/app/(dashboard)/builder/leads/_components/LeadsTable'

const leads = [
  { id: '1', created_at: new Date().toISOString(), name: 'Alice', email: 'a@x.com', phone: '111', status: 'new', score: 7.1, source: 'organic', property: { title: 'Apt 101', location: 'Chennai' } },
]

test('renders table with rows', () => {
  render(<LeadsTable leads={leads as any} />)
  expect(screen.getByText('Name')).toBeInTheDocument()
  const row = screen.getByText('Alice').closest('tr')
  expect(row).toBeTruthy()
  expect(within(row as HTMLElement).getByText('Apt 101')).toBeInTheDocument()
})
