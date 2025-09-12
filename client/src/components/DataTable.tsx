import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  renderTableHeader?: () => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  emptyMessage = 'אין נתונים להצגה',
  onRowClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
  renderTableHeader
}: DataTableProps<T>) {
  return (
    <div className="card">
      {renderTableHeader && (
        <div className="px-6 py-4 border-b border-gray-200">
          {renderTableHeader()}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' : column.align === 'left' ? 'text-left' : ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={`${
                    onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''
                  } transition-colors`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        column.align === 'center' ? 'text-center' : column.align === 'left' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {column.render
                        ? column.render(item)
                        : item[column.key as keyof T] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary flex items-center"
            >
              <ChevronRight className="h-4 w-4 ml-2" />
              הקודם
            </button>
            <span className="text-sm text-gray-700">
              עמוד {currentPage} מתוך {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary flex items-center"
            >
              הבא
              <ChevronLeft className="h-4 w-4 mr-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
