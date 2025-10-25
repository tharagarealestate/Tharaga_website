"use client"

import * as React from 'react'
import { useMemo } from 'react'
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table'
import { Lead } from './LeadCard'

export function LeadsTable({ leads = [] as Lead[] }) {
  const data = useMemo(() => leads, [leads])

  const columns = useMemo<ColumnDef<Lead>[]>(() => [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Contact', cell: ({ row }) => (
      <div>
        <div className="text-sm">{row.original.email}</div>
        <div className="text-xs text-gray-500">{row.original.phone}</div>
      </div>
    ) },
    { header: 'Property', cell: ({ row }) => (
      <div>
        <div className="text-sm font-medium">{row.original.property?.title || '-'}</div>
        <div className="text-xs text-gray-500">{row.original.property?.location || ''}</div>
      </div>
    ) },
    { header: 'Score', accessorKey: 'score' },
    { header: 'Source', accessorKey: 'source' },
    { header: 'Status', accessorKey: 'status' },
  ], [])

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id} className="px-3 py-2 text-left font-semibold">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(r => (
            <tr key={r.id} className="border-t border-gray-100">
              {r.getVisibleCells().map(c => (
                <td key={c.id} className="px-3 py-2">
                  {flexRender(c.column.columnDef.cell ?? c.column.columnDef.header, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={columns.length}>No leads found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
