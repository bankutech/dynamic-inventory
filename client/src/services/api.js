const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

export const api = {
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const json = await res.json();
    return json.data;
  },

  async getReorderAnalysis() {
    const res = await fetch(`${API_BASE}/analytics/reorder-analysis`);
    if (!res.ok) throw new Error('Failed to fetch reorder analysis');
    const json = await res.json();
    return json.data;
  },

  async getMovingAverages(productId) {
    const res = await fetch(`${API_BASE}/analytics/moving-averages/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch moving averages');
    const json = await res.json();
    return json.data;
  },

  async getMonthlySalesReport(customerId = null) {
    const url = customerId ? `${API_BASE}/analytics/monthly-sales-report?customerId=${customerId}` : `${API_BASE}/analytics/monthly-sales-report`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch monthly sales report');
    return await res.json();
  },

  async getSalesHistory(productId = null) {
    const url = productId ? `${API_BASE}/sales?productId=${productId}` : `${API_BASE}/sales`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch sales history');
    const json = await res.json();
    return json.data;
  },

  async recordSale(productId, quantity, channel, customerId = '101') {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity, channel, customer_id: customerId })
    });
    if (!res.ok) throw new Error('Failed to record sale');
    const json = await res.json();
    return json.data;
  },

  async simulateSurge(productId, volume) {
    const res = await fetch(`${API_BASE}/sales/simulate-surge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, volume })
    });
    if (!res.ok) throw new Error('Failed to simulate demand shock');
    const json = await res.json();
    return json.data;
  },

  async getPurchaseOrders() {
    const res = await fetch(`${API_BASE}/purchase-orders`);
    if (!res.ok) throw new Error('Failed to fetch purchase orders');
    const json = await res.json();
    return json.data;
  },

  async createPurchaseOrder(productId, orderQuantity, notes) {
    const res = await fetch(`${API_BASE}/purchase-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, order_quantity: orderQuantity, notes })
    });
    if (!res.ok) throw new Error('Failed to create purchase order');
    const json = await res.json();
    return json.data;
  },

  async updatePoStatus(poId, status) {
    const res = await fetch(`${API_BASE}/purchase-orders/${poId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update PO status');
    const json = await res.json();
    return json.data;
  },

  async executeSql(query) {
    const res = await fetch(`${API_BASE}/sql/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'SQL execution failed');
    return json;
  }
};
