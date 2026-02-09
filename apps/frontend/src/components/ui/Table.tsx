import { ReactNode, HTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export const Table = ({ children, className = '', ...props }: TableProps) => {
  return (
    <div className="w-full overflow-x-auto">
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
    <thead className={`bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
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
    <tr className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`} {...props}>
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
      className={`px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 text-left ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export const TableCell = ({ children, className = '', ...props }: TableCellProps) => {
  return (
    <td className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${className}`} {...props}>
      {children}
    </td>
  );
};
