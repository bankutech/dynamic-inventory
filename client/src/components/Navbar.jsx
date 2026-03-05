import React from 'react';
import { Database, Activity, Terminal, ShoppingCart, BarChart3, AlertCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, urgentCount, livePolling = true, onTogglePolling }) {
  const tabs = [
    { id: 'inventory', label: 'Dynamic Reorder Matrix', icon: Activity },
    { id: 'monthly_report', label: 'Monthly Sales CTE (Slide 10)', icon: BarChart3 },
    { id: 'sql_studio', label: 'Advanced SQL Studio', icon: Terminal },
    { id: 'simulator', label: 'Demand Shock Simulator', icon: Database },
    { id: 'purchase_orders', label: 'Purchase Orders', icon: ShoppingCart }
  ];

  return (
    <header className="border-b-2 border-black bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('inventory')}>
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-mono font-bold text-lg brutal-shadow-sm">
              SQL
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-black uppercase">
                  Dynamic Inventory
                </span>
                <span className="bg-black text-white text-[10px] font-mono px-2 py-0.5 font-bold uppercase">
                  ASQL Engine
                </span>
              </div>
              <p className="text-xs text-[#555555] font-mono hidden sm:block">
                CTE &amp; Window Function Demand Analysis System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 border transition-all font-mono text-xs font-bold uppercase ${
                    isActive
                      ? 'bg-black text-white border-black brutal-shadow-sm'
                      : 'bg-white text-black border-transparent hover:border-black'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.id === 'inventory' && urgentCount > 0 && (
                    <span className="ml-1 bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-none">
                      {urgentCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Telemetry Indicator & Polling Heartbeat */}
          <div className="flex items-center space-x-3 font-mono text-xs">
            <span className="hidden lg:inline-block px-3 py-1 bg-[#EEF2FF] border border-indigo-900 text-indigo-950 font-bold">
              Z = 1.65 (95% SL)
            </span>
            <button
              onClick={onTogglePolling}
              title={livePolling ? 'Live Telemetry Active (10s polling). Click to pause.' : 'Live Telemetry Paused. Click to resume.'}
              className={`flex items-center space-x-1.5 px-3 py-1 border font-bold transition-all ${
                livePolling
                  ? 'bg-[#ECFDF5] border-emerald-900 text-emerald-950'
                  : 'bg-gray-100 border-gray-400 text-gray-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${livePolling ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'}`}></span>
              <span>{livePolling ? 'Live Sync (10s)' : 'Sync Paused'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
