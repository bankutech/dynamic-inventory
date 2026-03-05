import React, { useState, useEffect } from 'react';
import { X, TrendingUp, ShoppingCart, Clock, Check } from 'lucide-react';
import { api } from '../services/api.js';

export default function ProductDetailModal({ item, onClose, onCreatePo }) {
  const [movingAvgData, setMovingAvgData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (item) {
      api.getMovingAverages(item.product_id)
        .then(data => setMovingAvgData(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-none">
      <div className="bg-white border-2 border-black max-w-2xl w-full brutal-shadow-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b-2 border-black bg-black text-white flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-gray-400 block uppercase">Product Telemetry &amp; Window Functions</span>
            <h3 className="font-display text-xl font-bold">{item.sku} — {item.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto font-mono text-xs">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-black p-3 bg-[#FAF9F5]">
              <span className="text-[10px] text-gray-500 uppercase block">Current Stock</span>
              <span className="text-xl font-bold text-black">{item.current_stock}</span>
            </div>
            <div className="border border-black p-3 bg-[#FAF9F5]">
              <span className="text-[10px] text-gray-500 uppercase block">Dynamic ROP</span>
              <span className="text-xl font-bold text-red-700">{item.dynamic_reorder_point}</span>
            </div>
            <div className="border border-black p-3 bg-[#FAF9F5]">
              <span className="text-[10px] text-gray-500 uppercase block">Safety Stock</span>
              <span className="text-xl font-bold text-black">{item.dynamic_safety_stock}</span>
            </div>
            <div className="border border-black p-3 bg-[#FAF9F5]">
              <span className="text-[10px] text-gray-500 uppercase block">Lead Time</span>
              <span className="text-xl font-bold text-black">{item.lead_time_days}d</span>
            </div>
          </div>

          {/* Window Function Data */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-black uppercase">
                7-Day Moving Average Telemetry (Past 10 Days)
              </span>
              <span className="text-[10px] text-gray-500">AVG() OVER Window</span>
            </div>

            {loading ? (
              <div className="p-4 text-center border border-black bg-[#FAF9F5]">Loading window calculations...</div>
            ) : (
              <div className="border border-black max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 uppercase border-b border-black text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-gray-300">Sale Date</th>
                      <th className="p-2 border-r border-gray-300 text-right">Daily Qty</th>
                      <th className="p-2 text-right">7-Day Moving Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movingAvgData.slice(-10).reverse().map((m, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 border-r border-gray-200">{m.Sale_Date}</td>
                        <td className="p-2 border-r border-gray-200 text-right font-bold">{m.Quantity}</td>
                        <td className="p-2 text-right font-bold text-black">{m.Moving_Avg_7_Days?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex items-center justify-between border-t border-black pt-4">
            <span className="text-gray-600">Supplier: <strong className="text-black">{item.supplier_name}</strong></span>
            <button
              onClick={() => {
                onClose();
                onCreatePo(item);
              }}
              className="bg-black hover:bg-red-700 text-white px-4 py-2 font-bold uppercase border border-black brutal-shadow-sm flex items-center space-x-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Create Replenishment Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
