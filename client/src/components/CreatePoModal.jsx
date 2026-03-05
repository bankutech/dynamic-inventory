import React, { useState } from 'react';
import { X, ShoppingCart, Check } from 'lucide-react';
import { api } from '../services/api.js';

export default function CreatePoModal({ item, onClose, onCreated }) {
  const [orderQty, setOrderQty] = useState(item?.reorder_quantity || 25);
  const [notes, setNotes] = useState(`Dynamic deficit replenishment order for ${item?.sku}`);
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createPurchaseOrder(item.product_id, parseInt(orderQty), notes);
      alert('Purchase Order successfully generated and sent to supplier!');
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      alert('Error creating PO: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-none">
      <div className="bg-white border-2 border-black max-w-lg w-full brutal-shadow-lg p-6 space-y-5 font-mono text-xs">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <span className="text-[10px] text-gray-500 uppercase block">Dynamic Replenishment Engine</span>
            <h3 className="font-display text-xl font-bold uppercase text-black">Generate Supplier PO</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#FAF9F5] border border-black p-3 space-y-1">
            <p>SKU: <strong className="text-black">{item.sku}</strong></p>
            <p>Product: <strong className="text-black">{item.name}</strong></p>
            <p>Supplier: <strong className="text-black">{item.supplier_name}</strong> (Lead Time: {item.lead_time_days}d)</p>
            <p>Unit Cost: <strong className="text-black">${item.unit_cost?.toFixed(2)}</strong></p>
          </div>

          <div>
            <label className="block font-bold uppercase text-black mb-1">
              Order Quantity (Units)
            </label>
            <input
              type="number"
              min="1"
              required
              value={orderQty}
              onChange={e => setOrderQty(e.target.value)}
              className="w-full p-2.5 bg-white border-2 border-black font-bold text-sm"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Estimated Total PO Cost: <strong>${(orderQty * item.unit_cost).toFixed(2)}</strong>
            </p>
          </div>

          <div>
            <label className="block font-bold uppercase text-black mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 bg-white border-2 border-black text-xs"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-black hover:bg-gray-100 uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-black hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 border border-black font-bold uppercase brutal-shadow-sm"
            >
              {loading ? 'Transmitting...' : 'Dispatch PO to Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
