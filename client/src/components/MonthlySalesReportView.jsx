import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Award, Users, BarChart3, Code2, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';

export default function MonthlySalesReportView() {
  const [reportData, setReportData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('101');
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [selectedCustomer]);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await api.getMonthlySalesReport(selectedCustomer === 'ALL' ? null : selectedCustomer);
      setReportData(res.data || []);
      setCustomers(res.customers || ['101', '102', '103']);
      setTotalVolume(res.totalVolume || 0);
    } catch (err) {
      console.error('Failed to load monthly sales report:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics
  const maxSaleMonth = reportData.reduce((prev, curr) => (curr.total_sales > (prev?.total_sales || 0) ? curr : prev), null);
  const latestMonth = reportData[reportData.length - 1];
  const momGrowth = (latestMonth && latestMonth.prev_month_sales)
    ? ((latestMonth.total_sales - latestMonth.prev_month_sales) / latestMonth.prev_month_sales * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Explainer */}
      <div className="bg-white border-2 border-black p-6 brutal-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-black text-white px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest font-bold">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Slide 10 CTE &amp; Window Function Specification</span>
            </div>
            <h2 className="font-display text-2xl font-bold uppercase text-black">
              Monthly Sales &amp; Customer Ranking Engine
            </h2>
            <p className="text-xs font-mono text-[#555555]">
              Executes multi-stage SQL Common Table Expressions (CTEs), inter-period LAG() velocity analysis, 3-month rolling windows, and sales rank partitioning.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadReport}
              className="bg-[#FAF9F5] hover:bg-black hover:text-white border-2 border-black px-3 py-1.5 font-mono text-xs font-bold uppercase flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Customer Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-mono font-bold uppercase text-gray-700 mr-2 flex items-center space-x-1">
            <Users className="w-3.5 h-3.5" />
            <span>Customer Account:</span>
          </span>
          {['101', '102', '103', 'ALL'].map(cId => (
            <button
              key={cId}
              onClick={() => setSelectedCustomer(cId)}
              className={`px-3 py-1 font-mono text-xs font-bold uppercase border-2 border-black transition-all ${
                selectedCustomer === cId
                  ? 'bg-black text-white brutal-shadow-sm'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {cId === 'ALL' ? 'All Customers (Aggregated)' : `Customer #${cId} ${cId === '101' ? '(Slide 10 Benchmark)' : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-black p-4 brutal-shadow space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">
            Peak Month Sales
          </span>
          <div className="font-mono text-2xl font-black text-black">
            ${maxSaleMonth ? maxSaleMonth.total_sales.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[11px] font-mono text-gray-600 block">
            Month: {maxSaleMonth?.order_month || 'N/A'} (Rank #1)
          </span>
        </div>

        <div className="bg-white border-2 border-black p-4 brutal-shadow space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">
            Latest Month (LAG Comparison)
          </span>
          <div className="font-mono text-2xl font-black text-black">
            ${latestMonth ? latestMonth.total_sales.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="flex items-center space-x-1 text-[11px] font-mono">
            {momGrowth !== null ? (
              parseFloat(momGrowth) >= 0 ? (
                <span className="text-emerald-700 font-bold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{momGrowth}% MoM
                </span>
              ) : (
                <span className="text-red-700 font-bold flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> {momGrowth}% MoM
                </span>
              )
            ) : (
              <span className="text-gray-400">Baseline month</span>
            )}
            <span className="text-gray-500">vs prev</span>
          </div>
        </div>

        <div className="bg-white border-2 border-black p-4 brutal-shadow space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">
            Rolling 3-Mo Velocity
          </span>
          <div className="font-mono text-2xl font-black text-emerald-700">
            ${latestMonth ? latestMonth.rolling_3mo_sales.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[11px] font-mono text-gray-600 block">
            Cumulative 90-day volume
          </span>
        </div>

        <div className="bg-white border-2 border-black p-4 brutal-shadow space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">
            Total Report Volume
          </span>
          <div className="font-mono text-2xl font-black text-black">
            ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] font-mono text-gray-600 block">
            {reportData.length} monthly billing cycles
          </span>
        </div>
      </div>

      {/* Main Table (Slide 10 Exact Replication) */}
      <div className="bg-white border-2 border-black brutal-shadow overflow-hidden">
        <div className="p-4 bg-[#F4F4F0] border-b-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-black" />
            <h3 className="font-mono text-sm font-bold uppercase text-black tracking-wider">
              Output Table: [monthly_sales_report.sql]
            </h3>
          </div>
          <div className="font-mono text-xs text-gray-600">
            Window Spec: <code className="bg-gray-200 px-1 py-0.5 border border-gray-400 text-black">ROWS BETWEEN 2 PRECEDING AND CURRENT ROW</code>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-black text-white uppercase text-[11px] border-b border-black">
              <tr>
                <th className="p-3 border-r border-gray-700">customer_id</th>
                <th className="p-3 border-r border-gray-700">order_month</th>
                <th className="p-3 border-r border-gray-700 text-right">total_sales ($)</th>
                <th className="p-3 border-r border-gray-700 text-right">prev_month_sales ($)</th>
                <th className="p-3 border-r border-gray-700 text-right">rolling_3mo_sales ($)</th>
                <th className="p-3 text-center">sales_rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {reportData.map((row, idx) => (
                <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-3 border-r border-gray-200 font-bold text-black">
                    #{row.customer_id}
                  </td>
                  <td className="p-3 border-r border-gray-200 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{row.order_month}</span>
                    </div>
                  </td>
                  <td className="p-3 border-r border-gray-200 text-right font-bold text-black">
                    ${row.total_sales?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 border-r border-gray-200 text-right text-gray-700">
                    {row.prev_month_sales !== null ? (
                      `$${row.prev_month_sales?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    ) : (
                      <span className="text-gray-400 italic">NULL</span>
                    )}
                  </td>
                  <td className="p-3 border-r border-gray-200 text-right font-bold text-emerald-800">
                    ${row.rolling_3mo_sales?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        row.sales_rank === 1
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : row.sales_rank === 2
                          ? 'bg-gray-100 text-gray-800 border-gray-300'
                          : row.sales_rank === 3
                          ? 'bg-orange-50 text-orange-800 border-orange-300'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {row.sales_rank === 1 && <Award className="w-3 h-3 text-amber-600" />}
                      <span>Rank #{row.sales_rank}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Logic Architecture Callout */}
      <div className="bg-[#FAF9F5] border-2 border-black p-5 brutal-shadow space-y-3 font-mono text-xs">
        <h4 className="font-bold uppercase text-black flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-emerald-700" />
          <span>Advanced SQL Architectural Breakdown (Slide 10 Engineering Notes)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800 text-[11px] leading-relaxed">
          <div className="p-3 bg-white border border-black">
            <span className="font-bold text-black block mb-1">1. Common Table Expression (CTE):</span>
            Aggregates transactions into monthly partitions using <code className="text-emerald-700">DATE_TRUNC('month', order_date)</code> filtered by the last 12 calendar months.
          </div>
          <div className="p-3 bg-white border border-black">
            <span className="font-bold text-black block mb-1">2. Inter-Period LAG() Window:</span>
            Pulls prior month sales <code className="text-emerald-700">LAG(total_sales) OVER (PARTITION BY customer_id ORDER BY order_month)</code> to calculate sequential growth deltas without self-joins.
          </div>
          <div className="p-3 bg-white border border-black">
            <span className="font-bold text-black block mb-1">3. Rolling Window &amp; Ranking:</span>
            Computes a moving 3-month sales accumulation via <code className="text-emerald-700">ROWS BETWEEN 2 PRECEDING AND CURRENT ROW</code> and ranks monthly revenue via <code className="text-emerald-700">RANK() OVER (ORDER BY total_sales DESC)</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
