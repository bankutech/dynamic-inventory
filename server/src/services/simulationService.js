import { db } from '../db/connection.js';
import { salesRepository } from '../repositories/salesRepository.js';

export class SimulationService {
  simulateDemandSurge(productId, spikeVolume = 35) {
    const today = new Date().toISOString().slice(0, 10);
    const result = salesRepository.recordSale(productId, spikeVolume, 'Simulated Demand Shock', '101', true);
    return {
      message: `Injected demand surge of ${spikeVolume} units into product ${productId}. Current stock updated.`,
      result
    };
  }

  simulateLeadTimeChange(supplierId, newLeadTimeDays) {
    const stmt = db.prepare('UPDATE suppliers SET lead_time_days = ? WHERE supplier_id = ?');
    stmt.run(newLeadTimeDays, supplierId);
    return {
      message: `Supplier lead time updated to ${newLeadTimeDays} days. Dynamic safety stock will adjust automatically.`,
      supplier_id: supplierId,
      new_lead_time: newLeadTimeDays
    };
  }
}

export const simulationService = new SimulationService();
