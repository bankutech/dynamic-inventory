import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Skull, ArrowRight, ShoppingCart, RefreshCw } from 'lucide-react';

export default function InventoryTable({ items, loading, onSelectProduct, onCreatePo, onRefresh }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = items.filter(item => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REORDER':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-100 text-red-900 border border-red-900 font-mono text-[11px] font-bold">
            <AlertTriangle className="w-3 h-3 text-red-700" />
            <span>REORDER</span>
          </span>
        );
      case 'MONITOR':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-900 font-mono text-[11px] font-bold">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>MONITOR</span>
          </span>
        );
      case 'DEAD STOCK':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-900 font-mono text-[11px] font-bold">
            <Skull className="w-3 h-3 text-purple-700" />
            <span>DEAD STOCK</span>
          </span>
        );
      case 'HOLD':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-900 font-mono text-[11px] font-bold">
            <CheckCircle className="w-3 h-3 text-emerald-700" />
            <span>HOLD</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Formula Banner */}
      <div className="bg-white border-2 border-black p-5 brutal-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666666] font-bold">
              Dynamic Inventory Control Formula
            </span>
            <div className="font-mono text-sm sm:text-base font-bold text-black mt-0.5">
              ROP = (d̄ × L) + [ Z × √( L × σ_d² + d̄² × σ_L² ) ]
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              className="p-2 border border-black hover:bg-black hover:text-white transition-all font-mono text-xs flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recalculate SQL</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'REORDER', 'MONITOR', 'HOLD', 'DEAD STOCK'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border transition-all ${
                filter === status
                  ? 'bg-black text-white border-black brutal-shadow-sm'
                  : 'bg-white text-black border-black hover:bg-[#EBEBE6]'
              }`}
            >
              {status} ({status === 'ALL' ? items.length : items.filter(i => i.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Swiss Data Grid */}
      <div className="bg-white border-2 border-black brutal-shadow overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-black text-white uppercase text-[11px]">
            <tr>
              <th className="p-3.5 border-r border-gray-700">SKU / Item</th>
              <th className="p-3.5 border-r border-gray-700">Category</th>
              <th className="p-3.5 border-r border-gray-700 text-right">Current Stock</th>
              <th className="p-3.5 border-r border-gray-700 text-right">Dynamic ROP</th>
              <th className="p-3.5 border-r border-gray-700 text-right">Safety Stock (SS)</th>
              <th className="p-3.5 border-r border-gray-700 text-right">Daily Demand (d̄)</th>
              <th className="p-3.5 border-r border-gray-700 text-right">Lead Time (L)</th>
              <th className="p-3.5 border-r border-gray-700 text-center">Decision Status</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y border-t border-black">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-sm font-bold text-gray-500">
                  Executing CTEs and Window Functions on SQLite database...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-sm font-bold text-gray-500">
                  No records matching status '{filter}'
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.product_id} className="hover:bg-[#F9F9F6] transition-colors">
                  <td className="p-3.5 border-r border-gray-200">
                    <span className="font-bold text-black block">{item.sku}</span>
                    <span className="font-sans text-xs text-gray-700 line-clamp-1">{item.name}</span>
                  </td>
                  <td className="p-3.5 border-r border-gray-200 text-gray-600">
                    {item.category}
                  </td>
                  <td className="p-3.5 border-r border-gray-200 text-right font-bold text-sm">
                    <span className={item.current_stock <= item.dynamic_reorder_point ? 'text-red-700' : 'text-black'}>
                      {item.current_stock}
                    </span>
                  </td>
                  <td className="p-3.5 border-r border-gray-200 text-right font-bold text-black">
                    {item.dynamic_reorder_point}
                  </td>
                  <td className="p-3.5 border-r border-gray-200 text-right text-gray-600">
                    {item.dynamic_safety_stock}
                  </td>
                  <td className="p-3.5 border-r border-gray-200 text-right text-gray-800">
                    {item.avg_daily_demand}/day
                  </td>
                  <td className="p-3.5 border-r border-gray-200 text-right text-gray-800">
                    {item.lead_time_days} days
                  </td>
                  <td className="p-3.5 border-r border-gray-200 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="p-3.5 text-center">
                    {item.status === 'REORDER' || item.status === 'MONITOR' ? (
                      <button
                        onClick={() => onCreatePo(item)}
                        className="bg-black hover:bg-red-700 text-white px-2.5 py-1 text-[11px] font-bold uppercase transition-colors brutal-shadow-sm flex items-center space-x-1 mx-auto"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Order {item.reorder_quantity || 25}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectProduct(item)}
                        className="border border-black hover:bg-black hover:text-white px-2.5 py-1 text-[11px] font-bold uppercase transition-colors"
                      >
                        Inspect
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
