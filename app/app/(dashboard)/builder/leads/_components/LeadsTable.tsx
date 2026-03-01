"use client"

import * as React from 'react'
import { useMemo } from 'react'
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { Lead } from './LeadCard'

interface LeadsTableProps {
  leads?: Lead[]
  selectedLeads?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export function LeadsTable({ leads = [] as Lead[], selectedLeads = [], onSelectionChange }: LeadsTableProps) {
  const data = useMemo(() => leads, [leads])

  const rowSelection = useMemo(() => {
    const selection: RowSelectionState = {}
    selectedLeads.forEach(id => {
      selection[id] = true
    })
    return selection
  }, [selectedLeads])

  const columns = useMemo<ColumnDef<Lead>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="w-4 h-4 text-[#6e0d25] border-gray-300 rounded focus:ring-[#6e0d25]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 text-[#6e0d25] border-gray-300 rounded focus:ring-[#6e0d25]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    { 
      header: 'Name', 
      cell: ({ row }) => row.original.full_name || row.original.name || 'Unknown'
    },
    { 
      header: 'Contact', 
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{row.original.email}</div>
          {row.original.phone && (
            <div className="text-xs text-gray-500">{row.original.phone}</div>
          )}
        </div>
      )
    },
    { 
      header: 'Property', 
      cell: ({ row }) => {
        const viewedProps = row.original.viewed_properties
        if (viewedProps && viewedProps.length > 0) {
          return (
            <div>
              <div className="text-sm font-medium">{viewedProps[0].property_title}</div>
              <div className="text-xs text-gray-500">{viewedProps.length} propert{viewedProps.length === 1 ? 'y' : 'ies'}</div>
            </div>
          )
        }
        return (
          <div>
            <div className="text-sm font-medium">{row.original.property?.title || '-'}</div>
            <div className="text-xs text-gray-500">{row.original.property?.location || ''}</div>
          </div>
        )
      }
    },
    { 
      header: 'Score', 
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.score.toFixed(1)}</div>
          <div className="text-xs text-gray-500">{row.original.category || 'N/A'}</div>
        </div>
      )
    },
    { 
      header: 'Activity', 
      cell: ({ row }) => (
        <div>
          {row.original.total_views !== undefined && (
            <div className="text-sm">{row.original.total_views} views</div>
          )}
          {row.original.total_interactions !== undefined && row.original.total_interactions > 0 && (
            <div className="text-xs text-gray-500">{row.original.total_interactions} interactions</div>
          )}
        </div>
      )
    },
    { 
      header: 'Budget', 
      cell: ({ row }) => {
        if (!row.original.budget_min && !row.original.budget_max) return '-'
        const formatCurrency = (n: number) => {
          try {
            return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
          } catch {
            return String(n)
          }
        }
        if (row.original.budget_min && row.original.budget_max) {
          return `₹${formatCurrency(row.original.budget_min)} - ₹${formatCurrency(row.original.budget_max)}`
        }
        return row.original.budget_max 
          ? `Up to ₹${formatCurrency(row.original.budget_max)}`
          : `From ₹${formatCurrency(row.original.budget_min!)}`
      }
    },
  ], [])

  const table = useReactTable({ 
    data, 
    columns, 
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      const selectedIds = Object.keys(newSelection).filter(key => newSelection[key])
      onSelectionChange?.(selectedIds)
    },
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white -mx-4 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="min-w-full text-sm" style={{ minWidth: '640px' }}>
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
