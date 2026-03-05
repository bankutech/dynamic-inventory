import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import InventoryTable from './components/InventoryTable.jsx';
import MonthlySalesReportView from './components/MonthlySalesReportView.jsx';
import SqlStudio from './components/SqlStudio.jsx';
import SimulationPanel from './components/SimulationPanel.jsx';
import PurchaseOrdersView from './components/PurchaseOrdersView.jsx';
import ProductDetailModal from './components/ProductDetailModal.jsx';
import CreatePoModal from './components/CreatePoModal.jsx';
import { api } from './services/api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [items, setItems] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [poTargetProduct, setPoTargetProduct] = useState(null);

  const [livePolling, setLivePolling] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!livePolling) return;
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [livePolling]);

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const [reorderData, poData] = await Promise.all([
        api.getReorderAnalysis(),
        api.getPurchaseOrders().catch(() => [])
      ]);
      setItems(reorderData);
      setPurchaseOrders(poData);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  const urgentCount = items.filter(i => i.status === 'REORDER').length;

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#111111]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        urgentCount={urgentCount}
        livePolling={livePolling}
        onTogglePolling={() => setLivePolling(prev => !prev)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'inventory' && (
          <InventoryTable
            items={items}
            loading={loading}
            onSelectProduct={p => setSelectedProduct(p)}
            onCreatePo={p => setPoTargetProduct(p)}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'monthly_report' && (
          <MonthlySalesReportView />
        )}

        {activeTab === 'sql_studio' && (
          <SqlStudio />
        )}

        {activeTab === 'simulator' && (
          <SimulationPanel
            items={items}
            onSimulated={loadData}
          />
        )}

        {activeTab === 'purchase_orders' && (
          <PurchaseOrdersView
            purchaseOrders={purchaseOrders}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Modals */}
      <ProductDetailModal
        item={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onCreatePo={p => setPoTargetProduct(p)}
      />

      <CreatePoModal
        item={poTargetProduct}
        onClose={() => setPoTargetProduct(null)}
        onCreated={loadData}
      />

      {/* Footer */}
      <footer className="mt-16 border-t-2 border-black py-8 bg-white font-mono text-xs text-[#555555]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Dynamic Inventory &amp; Demand Analysis System — Advanced SQL Edition
          </p>
          <p>
            Autonomous Demand Intelligence &amp; Dynamic Reorder Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}
