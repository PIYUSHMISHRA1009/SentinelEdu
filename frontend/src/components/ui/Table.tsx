import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

const baseStyles = `
  w-full border-collapse
  text-sm
`;

const tableVariants = {
  striped: `
    tbody tr:nth-child(even) { @apply bg-slate-800/50; }
  `,
  hoverable: `
    tbody tr { @apply transition-colors duration-150; }
    tbody tr:hover { @apply bg-slate-700/50; }
  `,
};

const compactStyles = `
  th, td { @apply px-3 py-2; }
`;

export const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    { striped = true, hoverable = true, compact = false, className = '', children, ...props },
    ref
  ) => {
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table
          ref={ref}
          className={clsx(
            baseStyles,
            striped && tableVariants.striped,
            hoverable && tableVariants.hoverable,
            compact && compactStyles,
            className
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = 'Table';

export const Thead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <thead ref={ref} className={clsx('bg-slate-900/80', className)} {...props}>
      {children}
    </thead>
  )
);
Thead.displayName = 'Thead';

export const Tbody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <tbody ref={ref} className={clsx('divide-y divide-slate-700/50', className)} {...props}>
      {children}
    </tbody>
  )
);
Tbody.displayName = 'Tbody';

export const Tr = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', children, ...props }, ref) => (
    <tr ref={ref} className={clsx('', className)} {...props}>
      {children}
    </tr>
  )
);
Tr.displayName = 'Tr';

export interface ThProps extends HTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export const Th = forwardRef<HTMLTableCellElement, ThProps>(
  ({ align = 'left', width, className = '', children, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      style={{ width }}
      className={clsx(
        'px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-xs',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
);
Th.displayName = 'Th';

export interface TdProps extends HTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const Td = forwardRef<HTMLTableCellElement, TdProps>(
  ({ align = 'left', className = '', children, ...props }, ref) => (
    <td
      ref={ref}
      className={clsx(
        'px-4 py-3 text-slate-100',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);
Td.displayName = 'Td';

export interface TableHeaderProps extends HTMLAttributes<HTMLTableCellElement> {}
export const TableHeader = forwardRef<HTMLTableCellElement, TableHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={clsx(
        'px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider text-xs',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
);
TableHeader.displayName = 'TableHeader';

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {}
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = '', children, ...props }, ref) => (
    <td ref={ref} className={clsx('px-4 py-3 text-slate-100', className)} {...props}>
      {children}
    </td>
  )
);
TableCell.displayName = 'TableCell';

export default Table;
