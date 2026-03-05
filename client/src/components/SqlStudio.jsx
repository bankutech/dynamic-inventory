import React, { useState } from 'react';
import { Play, Terminal, Clock, Check, AlertCircle, FileCode, Database, Square, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api.js';

const TEMPLATES = [
  {
    name: 'Slide 10: Monthly Sales CTE with LAG() & Customer Ranking',
    fileName: 'monthly_sales_report.sql',
    query: `WITH monthly_sales AS (
    SELECT 
        s.customer_id,
        DATE_TRUNC('month', s.order_date) AS order_month,
        SUM(s.amount) AS total_sales
    FROM sales s
    WHERE s.order_date >= DATEADD('month', -12, GETDATE())
    GROUP BY s.customer_id, DATE_TRUNC('month', s.order_date)
),
ranked_sales AS (
    SELECT
        customer_id,
        order_month,
        total_sales,
        LAG(total_sales) OVER (PARTITION BY customer_id ORDER BY order_month) AS prev_month_sales,
        SUM(total_sales) OVER (PARTITION BY customer_id 
                               ORDER BY order_month 
                               ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_3mo_sales,
        RANK() OVER (PARTITION BY customer_id ORDER BY total_sales DESC) AS sales_rank
    FROM monthly_sales
)
SELECT
    customer_id,
    order_month,
    ROUND(total_sales, 2) AS total_sales,
    ROUND(prev_month_sales, 2) AS prev_month_sales,
    ROUND(rolling_3mo_sales, 2) AS rolling_3mo_sales,
    sales_rank
FROM ranked_sales
ORDER BY customer_id, order_month;`
  },
  {
    name: 'Slide 9: 7-Day Moving Avg (Window Function)',
    fileName: 'slide9_moving_avg.sql',
    query: `SELECT 
  Product_ID, 
  Sale_Date, 
  Quantity, 
  AVG(Quantity) OVER (
    PARTITION BY Product_ID 
    ORDER BY Sale_Date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS Moving_Avg_7_Days 
FROM sales 
WHERE Product_ID = 'prod_01' 
ORDER BY Sale_Date DESC 
LIMIT 15;`
  },
  {
    name: '30-Day Rolling Velocity & Cumulative Sales',
    fileName: 'rolling_velocity_30d.sql',
    query: `SELECT 
  Product_ID, 
  Sale_Date, 
  Quantity, 
  SUM(Quantity) OVER (
    PARTITION BY Product_ID 
    ORDER BY Sale_Date 
    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
  ) AS Rolling_30_Day_Sum,
  AVG(Quantity) OVER (
    PARTITION BY Product_ID 
    ORDER BY Sale_Date 
    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
  ) AS Moving_Avg_30_Days
FROM sales 
WHERE Product_ID = 'prod_02'
ORDER BY Sale_Date DESC 
LIMIT 15;`
  },
  {
    name: 'CTE: Demand Variance by Product',
    fileName: 'demand_variance_sigma.sql',
    query: `WITH AvgDemand AS (
  SELECT product_id, AVG(quantity) as mean_q
  FROM sales
  GROUP BY product_id
)
SELECT 
  s.product_id,
  ROUND(ad.mean_q, 2) AS mean_daily_demand,
  ROUND(SQRT(AVG((s.quantity - ad.mean_q) * (s.quantity - ad.mean_q))), 2) AS std_deviation_sigma
FROM sales s
JOIN AvgDemand ad ON s.product_id = ad.product_id
GROUP BY s.product_id;`
  },
  {
    name: 'Critical Stockout Risk (Deficit ROP)',
    fileName: 'stockout_risk_rop.sql',
    query: `SELECT 
  p.sku, 
  p.name, 
  p.current_stock, 
  p.reorder_point, 
  (p.reorder_point - p.current_stock) AS units_needed,
  s.name AS supplier_name,
  s.lead_time_days
FROM products p
JOIN suppliers s ON p.supplier_id = s.supplier_id
WHERE p.current_stock <= p.reorder_point;`
  }
];

export default function SqlStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [query, setQuery] = useState(TEMPLATES[0].query);
  const [activeTab, setActiveTab] = useState('results'); // results | messages
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connected');

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setQuery(tpl.query);
    setError(null);
  };

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.executeSql(query);
      setResult(res);
      setActiveTab('results');
    } catch (err) {
      setError(err.message);
      setResult(null);
      setActiveTab('messages');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* IDE Studio Window Frame (Slide 10 Authentic Design) */}
      <div className="bg-[#181A20] text-gray-200 border-2 border-black rounded-lg overflow-hidden shadow-2xl">
        {/* Top Window Header */}
        <div className="bg-[#101216] px-4 py-2.5 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* File Tab */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-[#1E222B] px-3 py-1.5 rounded-t border-t-2 border-emerald-400 text-white">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">{selectedTemplate.fileName}</span>
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-white cursor-pointer ml-1" />
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-gray-400">
            <span>Scripts</span>
            <span>&gt;</span>
            <span>Reports</span>
            <span>&gt;</span>
            <span className="text-gray-200">{selectedTemplate.fileName}</span>
          </div>

          {/* Connection & Actions Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{running ? 'Running...' : 'Run'}</span>
            </button>

            <button
              onClick={() => setRunning(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded text-xs flex items-center space-x-1"
            >
              <Square className="w-3 h-3 fill-current text-red-400" />
              <span>Cancel</span>
            </button>

            <div className="h-4 w-px bg-gray-700 mx-1"></div>

            <div className="flex items-center space-x-1.5 bg-[#14171E] border border-gray-700 px-2 py-0.5 rounded text-[11px]">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-gray-300 font-semibold">SalesDB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
            </div>
          </div>
        </div>

        {/* Template Buttons Bar */}
        <div className="bg-[#14161C] px-4 py-2 border-b border-gray-800 flex items-center space-x-2 overflow-x-auto text-[11px] font-mono">
          <span className="text-gray-400 font-bold uppercase shrink-0">Templates:</span>
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleSelectTemplate(tpl)}
              className={`px-2.5 py-1 rounded shrink-0 transition-all ${
                selectedTemplate.fileName === tpl.fileName
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold'
                  : 'bg-[#1C2028] text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {tpl.name}
            </button>
          ))}
        </div>

        {/* SQL Editor Area */}
        <div className="p-4 bg-[#14161E] font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-[10px] text-gray-400">
            <span>SQL QUERY EDITOR • ADVANCED SQL ENGINE</span>
            <span>WINDOW FUNCTIONS • LAG() • ROLLUP • CTEs SUPPORTED</span>
          </div>
          <textarea
            rows={12}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-[#22c55e] font-mono text-[13px] focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          ></textarea>
        </div>

        {/* Bottom Tab Bar (Results / Messages) */}
        <div className="bg-[#101216] border-t border-gray-800 px-4 py-1.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-2 py-1 font-bold transition-colors ${
                activeTab === 'results' ? 'text-white border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Results {result ? `(${result.rowCount})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-2 py-1 font-bold transition-colors ${
                activeTab === 'messages' ? 'text-white border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Messages {error ? '(1 Error)' : ''}
            </button>
          </div>

          {result && (
            <div className="flex items-center space-x-3 text-[11px] text-gray-400">
              <span className="flex items-center space-x-1 text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{result.executionTimeMs} ms</span>
              </span>
              <span>•</span>
              <span>{result.rowCount} rows retrieved</span>
            </div>
          )}
        </div>

        {/* Bottom Panel Content */}
        <div className="bg-[#161820] p-4 max-h-96 overflow-auto">
          {activeTab === 'messages' && (
            <div className="font-mono text-xs space-y-2">
              {error ? (
                <div className="text-red-400 bg-red-950/40 p-3 rounded border border-red-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Execution Failed:</span>
                    <span>{error}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">
                  Ready. Click "Run" or select a presentation template to execute.
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div>
              {result && result.data.length > 0 ? (
                <div className="overflow-x-auto border border-gray-700 rounded">
                  <table className="w-full text-left font-mono text-xs text-gray-200">
                    <thead className="bg-[#0D0F14] text-gray-400 uppercase text-[11px] border-b border-gray-700">
                      <tr>
                        {result.columns.map(col => (
                          <th key={col} className="p-2.5 border-r border-gray-700 font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-[#161820]">
                      {result.data.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-800/60 transition-colors">
                          {result.columns.map(col => (
                            <td key={col} className="p-2.5 border-r border-gray-800 text-gray-200">
                              {row[col] === null ? (
                                <span className="text-gray-500 italic">NULL</span>
                              ) : typeof row[col] === 'number' ? (
                                Number.isInteger(row[col]) ? row[col] : row[col].toFixed(2)
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs font-mono text-gray-500">
                  {running ? 'Executing query against SQLite database engine...' : 'Click "Run" to execute current SQL statement'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
