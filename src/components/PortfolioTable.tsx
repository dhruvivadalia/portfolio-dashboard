import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { StockData } from '../types/portfolio';
import { fetchPortfolio } from '../lib/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import '@/styles/globals.css';


const columnHelper = createColumnHelper<StockData>();

const columns = [
  columnHelper.accessor('name', { header: 'Stock' }),
  columnHelper.accessor('exchange', { header: 'Stock Name' }),
  columnHelper.accessor('quantity', { header: 'Qty' }),
  columnHelper.accessor('purchasePrice', { header: 'Buy Price' }),
  columnHelper.accessor('cmp', { header: 'CMP' }),
  columnHelper.accessor('investment', { header: 'Investment' }),
  columnHelper.accessor('presentValue', { header: 'Present Value' }),
  columnHelper.accessor('gainLoss', {
    header: 'Gain/Loss',
    cell: (info) => (
      <span className={`$info.getValue() >= 0 ? '!text-green-500' : '!text-red-500' font-semibold`}>
        {info.getValue().toFixed(2)}
      </span>
    ),
  }),
  columnHelper.accessor('peRatio', { header: 'P/E Ratio' }),
  columnHelper.accessor('latestEarnings', { header: 'Latest Earnings' }),
];

export default function PortfolioTable() {
  const [data, setData] = useState<StockData[]>([]);

  const fetchAndSet = async () => {
    const portfolio = await fetchPortfolio();
    setData(portfolio);
  };

  useEffect(() => {
    fetchAndSet();
    const interval = setInterval(fetchAndSet, 15000);
    return () => clearInterval(interval);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const groupedBySector = data.reduce((acc, stock) => {
    if (!acc[stock.sector]) {
        acc[stock.sector] = {
        purchasePrice: 0,
        investment: 0,
        presentValue: 0,
        gainLoss: 0,
      };
    }
    acc[stock.sector].investment += stock.investment;
    acc[stock.sector].presentValue += stock.presentValue;
    acc[stock.sector].purchasePrice += stock.purchasePrice;
    acc[stock.sector].gainLoss += stock.gainLoss;
    return acc;
}, {} as Record<string, {
    purchasePrice: number; investment: number; presentValue: number; gainLoss: number 
}>);

    const chartData = Object.entries(groupedBySector).map(([sector, summary]) => ({
        name: sector,
        investment: summary.investment,
        purchasePrice: summary.purchasePrice,
        presentValue: summary.presentValue,
        gainLoss: summary.gainLoss,
    }));

    const COLORS = ['#6366f1', '#22c55e', '#f97316', '#e11d48', '#0ea5e9', '#F4C2C2'];
    
  return (
    
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2 text-center">Portfolio Details</h2>
      <table className="min-w-full table-auto border text-center">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-4 py-2 border-b">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-2 border-b">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
        <h2 className="text-xl font-semibold mb-2 text-center">Sector Summary</h2>
          <table className="min-w-full table-auto border">
            <thead className="bg-gray-100 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 border-b">Sector</th>
                <th className="px-4 py-2 border-b">Purchase Price</th>
                <th className="px-4 py-2 border-b">Investment</th>
                <th className="px-4 py-2 border-b">Present Value</th>
                <th className="px-4 py-2 border-b">Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedBySector).map(([sector, summary], idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2 border-b text-center">{sector}</td>
                <td className="px-4 py-2 border-b text-center">{summary.purchasePrice.toFixed(2)}</td>
                <td className="px-4 py-2 border-b text-center">{summary.investment.toFixed(2)}</td>
                <td className="px-4 py-2 border-b text-center">{summary.presentValue.toFixed(2)}</td>
                <td className="px-4 py-2 border-b font-medium text-center">
                  <span className={summary.gainLoss >= 0 ? '!text-green-500' : '!text-red-500'}>
                    {summary.gainLoss.toFixed(2)}
                  </span>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
          <h2 className="text-xl font-semibold mb-2 text-center">Pie-Chart for Sector Summary</h2>
          <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="investment"
              nameKey="name"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

    </div>
  );
}
