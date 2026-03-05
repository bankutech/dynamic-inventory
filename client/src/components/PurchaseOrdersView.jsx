import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, PackageCheck, Clock, Plus } from 'lucide-react';
import { api } from '../services/api.js';

export default function PurchaseOrdersView({ purchaseOrders, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleReceive = async (poId) => {
    setLoadingId(poId);
    try {
      await api.updatePoStatus(poId, 'RECEIVED');
      alert('PO received! SQLite trigger trg_po_received_update_stock automatically replenished product inventory.');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error updating PO: ' + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-black p-5 brutal-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase text-black">
            Automated Supplier Purchase Orders
          </h2>
          <p className="text-xs font-mono text-[#555555]">
            Replenishment orders linked with database triggers for automated stock re-induction
          </p>
        </div>

        <div className="font-mono text-xs px-3 py-1.5 bg-[#FAF9F5] border border-black font-bold">
          Total POs: {purchaseOrders.length}
        </div>
      </div>

      <div className="bg-white border-2 border-black brutal-shadow overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-black text-white uppercase text-[11px]">
            <tr>
              <th className="p-3.5 border-r border-gray-700">PO Number</th>
              <th className="p-3.5 border-r border-gray-700">SKU / Item</th>
              <th className="p-3.5 border-r border-gray-700">Supplier</th>
              <th className="p-3.5 border-r border-gray-700 text-right">Order Qty</th>
              <th className="p-3.5 border-r border-gray-700 text-right">Total Amount</th>
              <th className="p-3.5 border-r border-gray-700 text-center">Status</th>
              <th className="p-3.5 text-center">Trigger Action</th>
            </tr>
          </thead>
          <tbody className="divide-y border-t border-black">
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">
                  No purchase orders logged. Items reaching REORDER status will generate PO requests.
                </td>
              </tr>
            ) : (
              purchaseOrders.map(po => {
                const isReceived = po.status === 'RECEIVED';
                return (
                  <tr key={po.po_id} className="hover:bg-[#FAF9F5]">
                    <td className="p-3.5 border-r border-gray-200 font-bold text-black">
                      {po.po_id}
                    </td>
                    <td className="p-3.5 border-r border-gray-200">
                      <span className="font-bold block">{po.sku}</span>
                      <span className="font-sans text-xs text-gray-600">{po.product_name}</span>
                    </td>
                    <td className="p-3.5 border-r border-gray-200 text-gray-700">
                      {po.supplier_name}
                    </td>
                    <td className="p-3.5 border-r border-gray-200 text-right font-bold">
                      {po.order_quantity}
                    </td>
                    <td className="p-3.5 border-r border-gray-200 text-right font-bold text-black">
                      ${po.total_amount?.toFixed(2)}
                    </td>
                    <td className="p-3.5 border-r border-gray-200 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase ${
                        isReceived ? 'bg-emerald-100 text-emerald-900 border-emerald-800' :
                        po.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-900 border-blue-800' :
                        'bg-amber-100 text-amber-900 border-amber-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {!isReceived ? (
                        <button
                          disabled={loadingId === po.po_id}
                          onClick={() => handleReceive(po.po_id)}
                          className="bg-black hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1 font-mono text-[11px] font-bold uppercase transition-colors brutal-shadow-sm"
                        >
                          {loadingId === po.po_id ? 'Triggering...' : 'Receive & Restock'}
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Restocked via Trigger</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
