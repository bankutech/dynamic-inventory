import React, { useState } from 'react';
import { Zap, AlertTriangle, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { api } from '../services/api.js';

export default function SimulationPanel({ items, onSimulated }) {
  const [selectedProductId, setSelectedProductId] = useState(items[0]?.product_id || 'prod_01');
  const [spikeVolume, setSpikeVolume] = useState(30);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState(null);

  const selectedItem = items.find(i => i.product_id === selectedProductId) || items[0];

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.simulateSurge(selectedProductId, spikeVolume);
      setLog(res.message);
      if (onSimulated) onSimulated();
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-black p-6 brutal-shadow space-y-6">
        <div className="flex items-center space-x-3 border-b border-black pb-4">
          <div className="w-10 h-10 bg-amber-400 text-black border border-black flex items-center justify-center font-bold brutal-shadow-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-black">
              Demand Shock &amp; Bullwhip Simulator
            </h2>
            <p className="text-xs font-mono text-[#555555]">
              Stress test dynamic safety stock formulas against sudden multi-unit transaction bursts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
                Target Inventory SKU
              </label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 bg-white border-2 border-black font-mono text-xs font-bold"
              >
                {items.map(item => (
                  <option key={item.product_id} value={item.product_id}>
                    {item.sku} — {item.name} (Stock: {item.current_stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono font-bold mb-1">
                <span>Demand Surge Magnitude:</span>
                <span className="text-red-700 font-bold">{spikeVolume} Units</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={spikeVolume}
                onChange={e => setSpikeVolume(parseInt(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                <span>5 Units (Mild)</span>
                <span>40 Units (Quarterly Peak)</span>
                <span>80 Units (Supply Shock)</span>
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-black text-white p-3 font-mono text-xs font-bold uppercase border-2 border-black brutal-shadow transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              {loading ? 'Simulating Peak Shock...' : `Inject ${spikeVolume}-Unit Surge into Database`}
            </button>
          </div>

          {/* Current SKU Telemetry Card */}
          {selectedItem && (
            <div className="bg-[#FAF9F5] border-2 border-black p-5 space-y-4 font-mono text-xs">
              <span className="text-[10px] font-bold uppercase text-gray-600 block">
                Target SKU Live Physics
              </span>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Current On-Hand Stock:</span>
                  <span className="font-bold text-sm">{selectedItem.current_stock} units</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Dynamic Reorder Point (ROP):</span>
                  <span className="font-bold text-sm text-black">{selectedItem.dynamic_reorder_point}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Dynamic Safety Stock (SS):</span>
                  <span className="font-bold">{selectedItem.dynamic_safety_stock}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Supplier Lead Time:</span>
                  <span>{selectedItem.lead_time_days} days</span>
                </div>
                <div className="flex justify-between pt-1 font-bold">
                  <span>Current Inventory Status:</span>
                  <span className="px-2 py-0.5 text-white text-[10px]" style={{ backgroundColor: selectedItem.status_color }}>
                    {selectedItem.status}
                  </span>
                </div>
              </div>

              {log && (
                <div className="p-3 bg-emerald-50 border border-emerald-700 text-emerald-950 text-[11px] font-bold">
                  ✓ {log}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
