import { ReactNode, HTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export const Table = ({ children, className = '', ...props }: TableProps) => {
  return (
    <div className="w-full overflow-x-auto border-2 border-ink dark:border-gray-500 rounded-sm">
      <table
        className={`w-full border-collapse text-left text-base ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableHeader = ({ children, className = '', ...props }: TableHeaderProps) => {
  return (
    <thead className={`bg-warm-50 dark:bg-gray-900 border-b-2 border-ink dark:border-gray-500 ${className}`} {...props}>
      {children}
    </thead>
  );
};

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableBody = ({ children, className = '', ...props }: TableBodyProps) => {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
};

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export const TableRow = ({ children, className = '', ...props }: TableRowProps) => {
  return (
    <tr className={`border-b border-ink/40 dark:border-gray-600 last:border-b-0 hover:bg-warm-50/70 dark:hover:bg-gray-800 ${className}`} {...props}>
      {children}
    </tr>
  );
};

interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export const TableHead = ({ children, className = '', ...props }: TableHeadProps) => {
  return (
    <th
      className={`px-4 py-3 font-bold uppercase tracking-[0.05em] text-xs text-ink dark:text-gray-100 text-left ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  colSpan?: number;
}

export const TableCell = ({ children, className = '', colSpan, ...props }: TableCellProps) => {
  return (
    <td className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${className}`} colSpan={colSpan} {...props}>
      {children}
    </td>
  );
};
