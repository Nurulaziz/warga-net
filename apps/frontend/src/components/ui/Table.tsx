import { ReactNode, HTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export const Table = ({ children, className = '', ...props }: TableProps) => {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-left text-sm" {...props}>
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
    <thead className={`border-y-2 border-ink bg-[#ead7b7] dark:border-gray-400 dark:bg-[#382f22] ${className}`} {...props}>
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
    <tr
      className={`border-b border-ink/8 dark:border-gray-700 last:border-b-0 hover:bg-warm-50/50 dark:hover:bg-gray-800/50 transition-colors ${className}`}
      {...props}
    >
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
      className={`border-b-0 px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.09em] text-ink dark:text-gray-100 ${className}`}
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
    <td
      className={`px-4 py-3 text-sm text-ink dark:text-gray-300 ${className}`}
      colSpan={colSpan}
      {...props}
    >
      {children}
    </td>
  );
};
