import {
  type Client,
  type Service,
  type Renewal,
  type Activity,
  type InsertClient,
  type InsertService,
  type InsertRenewal,
  type InsertActivity,
  type RenewalWithRelations,
  type DashboardStats
} from '@shared/schema';
import { IStorage } from './storage';
import { db } from './db';

export class DatabaseStorage implements IStorage {
  // Client operations
  async getClients(): Promise<Client[]> {
    try {
      const clients = await db.query<Client[]>(`
        SELECT * FROM clients ORDER BY name ASC
      `);
      return clients;
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  async getClient(id: number): Promise<Client | undefined> {
    try {
      const [client] = await db.query<Client[]>(`
        SELECT * FROM clients WHERE id = ?
      `, [id]);
      return client;
    } catch (error) {
      console.error(`Error fetching client with id ${id}:`, error);
      return undefined;
    }
  }

  async createClient(client: InsertClient): Promise<Client> {
    try {
      const result = await db.query(`
        INSERT INTO clients 
        (name, email, phone, company, address, gst, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        client.name,
        client.email,
        client.phone || null,
        client.company || null,
        client.address || null,
        client.gst || null,
        client.notes || null
      ]);
      
      const insertId = result.insertId;
      
      const [newClient] = await db.query<Client[]>(`
        SELECT * FROM clients WHERE id = ?
      `, [insertId]);
      
      return newClient;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    try {
      // Create dynamic update query based on provided fields
      const fields: string[] = [];
      const values: any[] = [];
      
      if (clientData.name !== undefined) {
        fields.push('name = ?');
        values.push(clientData.name);
      }
      
      if (clientData.email !== undefined) {
        fields.push('email = ?');
        values.push(clientData.email);
      }
      
      if (clientData.phone !== undefined) {
        fields.push('phone = ?');
        values.push(clientData.phone);
      }
      
      if (clientData.company !== undefined) {
        fields.push('company = ?');
        values.push(clientData.company);
      }
      
      if (clientData.address !== undefined) {
        fields.push('address = ?');
        values.push(clientData.address);
      }
      
      if (clientData.gst !== undefined) {
        fields.push('gst = ?');
        values.push(clientData.gst);
      }
      
      if (clientData.notes !== undefined) {
        fields.push('notes = ?');
        values.push(clientData.notes);
      }
      
      if (fields.length === 0) {
        // No fields to update
        return this.getClient(id);
      }
      
      values.push(id); // Add id for WHERE clause
      
      await db.query(`
        UPDATE clients
        SET ${fields.join(', ')}
        WHERE id = ?
      `, values);
      
      return this.getClient(id);
    } catch (error) {
      console.error(`Error updating client with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      // Check if client exists
      const client = await this.getClient(id);
      if (!client) {
        return false;
      }
      
      // Check if client has related renewals
      const renewals = await this.getRenewalsByClient(id);
      if (renewals.length > 0) {
        throw new Error('Cannot delete client with active renewals. Please delete related renewals first.');
      }
      
      // Delete client
      await db.query(`
        DELETE FROM clients
        WHERE id = ?
      `, [id]);
      
      return true;
    } catch (error) {
      console.error(`Error deleting client with id ${id}:`, error);
      throw error;
    }
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    try {
      const services = await db.query<Service[]>(`
        SELECT * FROM services ORDER BY name ASC
      `);
      return services;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async getService(id: number): Promise<Service | undefined> {
    try {
      const [service] = await db.query<Service[]>(`
        SELECT * FROM services WHERE id = ?
      `, [id]);
      return service;
    } catch (error) {
      console.error(`Error fetching service with id ${id}:`, error);
      return undefined;
    }
  }

  async createService(service: InsertService): Promise<Service> {
    try {
      const result = await db.query(`
        INSERT INTO services 
        (name, description, defaultPrice, defaultDuration)
        VALUES (?, ?, ?, ?)
      `, [
        service.name,
        service.description || null,
        service.defaultPrice,
        service.defaultDuration
      ]);
      
      const insertId = result.insertId;
      
      const [newService] = await db.query<Service[]>(`
        SELECT * FROM services WHERE id = ?
      `, [insertId]);
      
      return newService;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    try {
      // Create dynamic update query based on provided fields
      const fields: string[] = [];
      const values: any[] = [];
      
      if (serviceData.name !== undefined) {
        fields.push('name = ?');
        values.push(serviceData.name);
      }
      
      if (serviceData.description !== undefined) {
        fields.push('description = ?');
        values.push(serviceData.description);
      }
      
      if (serviceData.defaultPrice !== undefined) {
        fields.push('defaultPrice = ?');
        values.push(serviceData.defaultPrice);
      }
      
      if (serviceData.defaultDuration !== undefined) {
        fields.push('defaultDuration = ?');
        values.push(serviceData.defaultDuration);
      }
      
      if (fields.length === 0) {
        // No fields to update
        return this.getService(id);
      }
      
      values.push(id); // Add id for WHERE clause
      
      await db.query(`
        UPDATE services
        SET ${fields.join(', ')}
        WHERE id = ?
      `, values);
      
      return this.getService(id);
    } catch (error) {
      console.error(`Error updating service with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteService(id: number): Promise<boolean> {
    try {
      // Check if service exists
      const service = await this.getService(id);
      if (!service) {
        return false;
      }
      
      // Check if service has related renewals
      const renewals = await this.getRenewalsByService(id);
      if (renewals.length > 0) {
        throw new Error('Cannot delete service with active renewals. Please delete related renewals first.');
      }
      
      // Delete service
      await db.query(`
        DELETE FROM services
        WHERE id = ?
      `, [id]);
      
      return true;
    } catch (error) {
      console.error(`Error deleting service with id ${id}:`, error);
      throw error;
    }
  }

  // Renewal operations
  async getRenewals(): Promise<Renewal[]> {
    try {
      const renewals = await db.query<Renewal[]>(`
        SELECT * FROM renewals ORDER BY endDate ASC
      `);
      return renewals;
    } catch (error) {
      console.error('Error fetching renewals:', error);
      return [];
    }
  }

  async getRenewal(id: number): Promise<Renewal | undefined> {
    try {
      const [renewal] = await db.query<Renewal[]>(`
        SELECT * FROM renewals WHERE id = ?
      `, [id]);
      return renewal;
    } catch (error) {
      console.error(`Error fetching renewal with id ${id}:`, error);
      return undefined;
    }
  }

  async getRenewalsByClient(clientId: number): Promise<Renewal[]> {
    try {
      const renewals = await db.query<Renewal[]>(`
        SELECT * FROM renewals WHERE clientId = ? ORDER BY endDate ASC
      `, [clientId]);
      return renewals;
    } catch (error) {
      console.error(`Error fetching renewals for client ${clientId}:`, error);
      return [];
    }
  }

  async getRenewalsByService(serviceId: number): Promise<Renewal[]> {
    try {
      const renewals = await db.query<Renewal[]>(`
        SELECT * FROM renewals WHERE serviceId = ? ORDER BY endDate ASC
      `, [serviceId]);
      return renewals;
    } catch (error) {
      console.error(`Error fetching renewals for service ${serviceId}:`, error);
      return [];
    }
  }

  async getRenewalsWithRelations(): Promise<RenewalWithRelations[]> {
    try {
      const renewals = await db.query<any[]>(`
        SELECT 
          r.*, 
          c.id as clientId, c.name as clientName, c.email as clientEmail, c.company as clientCompany,
          s.id as serviceId, s.name as serviceName
        FROM renewals r
        JOIN clients c ON r.clientId = c.id
        JOIN services s ON r.serviceId = s.id
        ORDER BY r.endDate ASC
      `);
      
      // Transform result to match RenewalWithRelations structure
      return renewals.map(row => ({
        id: row.id,
        clientId: row.clientId,
        serviceId: row.serviceId,
        startDate: row.startDate,
        endDate: row.endDate,
        amount: row.amount,
        isPaid: Boolean(row.isPaid),
        notificationSent: Boolean(row.isNotified),
        notes: row.notes,
        createdAt: row.createdAt,
        client: {
          id: row.clientId,
          name: row.clientName,
          email: row.clientEmail,
          company: row.clientCompany
        },
        service: {
          id: row.serviceId,
          name: row.serviceName
        }
      }));
    } catch (error) {
      console.error('Error fetching renewals with relations:', error);
      return [];
    }
  }

  async getRenewalWithRelations(id: number): Promise<RenewalWithRelations | undefined> {
    try {
      const [renewal] = await db.query<any[]>(`
        SELECT 
          r.*, 
          c.id as clientId, c.name as clientName, c.email as clientEmail, c.company as clientCompany,
          s.id as serviceId, s.name as serviceName
        FROM renewals r
        JOIN clients c ON r.clientId = c.id
        JOIN services s ON r.serviceId = s.id
        WHERE r.id = ?
      `, [id]);
      
      if (!renewal) {
        return undefined;
      }
      
      // Transform result to match RenewalWithRelations structure
      return {
        id: renewal.id,
        clientId: renewal.clientId,
        serviceId: renewal.serviceId,
        startDate: renewal.startDate,
        endDate: renewal.endDate,
        amount: renewal.amount,
        isPaid: Boolean(renewal.isPaid),
        notificationSent: Boolean(renewal.isNotified),
        notes: renewal.notes,
        createdAt: renewal.createdAt,
        client: {
          id: renewal.clientId,
          name: renewal.clientName,
          email: renewal.clientEmail,
          company: renewal.clientCompany
        },
        service: {
          id: renewal.serviceId,
          name: renewal.serviceName
        }
      };
    } catch (error) {
      console.error(`Error fetching renewal with relations for id ${id}:`, error);
      return undefined;
    }
  }

  async getUpcomingRenewals(days: number = 30): Promise<RenewalWithRelations[]> {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);
      
      const formattedToday = today.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const renewals = await db.query<any[]>(`
        SELECT 
          r.*, 
          c.id as clientId, c.name as clientName, c.email as clientEmail, c.company as clientCompany,
          s.id as serviceId, s.name as serviceName
        FROM renewals r
        JOIN clients c ON r.clientId = c.id
        JOIN services s ON r.serviceId = s.id
        WHERE r.endDate BETWEEN ? AND ?
        ORDER BY r.endDate ASC
      `, [formattedToday, formattedEndDate]);
      
      // Transform result to match RenewalWithRelations structure
      return renewals.map(row => ({
        id: row.id,
        clientId: row.clientId,
        serviceId: row.serviceId,
        startDate: row.startDate,
        endDate: row.endDate,
        amount: row.amount,
        isPaid: Boolean(row.isPaid),
        notificationSent: Boolean(row.isNotified),
        notes: row.notes,
        createdAt: row.createdAt,
        client: {
          id: row.clientId,
          name: row.clientName,
          email: row.clientEmail,
          company: row.clientCompany
        },
        service: {
          id: row.serviceId,
          name: row.serviceName
        }
      }));
    } catch (error) {
      console.error(`Error fetching upcoming renewals for next ${days} days:`, error);
      return [];
    }
  }

  async createRenewal(renewal: InsertRenewal): Promise<Renewal> {
    try {
      const result = await db.query(`
        INSERT INTO renewals 
        (clientId, serviceId, startDate, endDate, amount, isPaid, isNotified, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        renewal.clientId,
        renewal.serviceId,
        renewal.startDate,
        renewal.endDate,
        renewal.amount,
        renewal.isPaid || false,
        false, // isNotified default to false
        renewal.notes || null
      ]);
      
      const insertId = result.insertId;
      
      const [newRenewal] = await db.query<Renewal[]>(`
        SELECT * FROM renewals WHERE id = ?
      `, [insertId]);
      
      // Create activity for new renewal
      await this.createActivity({
        type: 'renewal_created',
        description: `New renewal created for service ending on ${new Date(renewal.endDate).toLocaleDateString()}`,
        metadata: JSON.stringify({
          renewalId: insertId,
          clientId: renewal.clientId,
          serviceId: renewal.serviceId,
          amount: renewal.amount
        })
      });
      
      return newRenewal;
    } catch (error) {
      console.error('Error creating renewal:', error);
      throw error;
    }
  }

  async updateRenewal(id: number, renewalData: Partial<InsertRenewal>): Promise<Renewal | undefined> {
    try {
      // Get original renewal for activity logging
      const originalRenewal = await this.getRenewal(id);
      if (!originalRenewal) {
        return undefined;
      }
      
      // Create dynamic update query based on provided fields
      const fields: string[] = [];
      const values: any[] = [];
      
      if (renewalData.clientId !== undefined) {
        fields.push('clientId = ?');
        values.push(renewalData.clientId);
      }
      
      if (renewalData.serviceId !== undefined) {
        fields.push('serviceId = ?');
        values.push(renewalData.serviceId);
      }
      
      if (renewalData.startDate !== undefined) {
        fields.push('startDate = ?');
        values.push(renewalData.startDate);
      }
      
      if (renewalData.endDate !== undefined) {
        fields.push('endDate = ?');
        values.push(renewalData.endDate);
      }
      
      if (renewalData.amount !== undefined) {
        fields.push('amount = ?');
        values.push(renewalData.amount);
      }
      
      if (renewalData.isPaid !== undefined) {
        fields.push('isPaid = ?');
        values.push(renewalData.isPaid);
        
        // If renewal is set as paid, create a payment received activity
        if (renewalData.isPaid && !originalRenewal.isPaid) {
          await this.createActivity({
            type: 'payment_received',
            description: `Payment of ${renewalData.amount || originalRenewal.amount} received for renewal`,
            metadata: JSON.stringify({
              renewalId: id,
              clientId: originalRenewal.clientId,
              amount: renewalData.amount || originalRenewal.amount
            })
          });
        }
      }
      
      if (renewalData.notes !== undefined) {
        fields.push('notes = ?');
        values.push(renewalData.notes);
      }
      
      if (fields.length === 0) {
        // No fields to update
        return originalRenewal;
      }
      
      values.push(id); // Add id for WHERE clause
      
      await db.query(`
        UPDATE renewals
        SET ${fields.join(', ')}
        WHERE id = ?
      `, values);
      
      // Create activity for renewal update
      await this.createActivity({
        type: 'renewal_updated',
        description: `Renewal #${id} updated`,
        metadata: JSON.stringify({
          renewalId: id,
          clientId: originalRenewal.clientId,
          serviceId: originalRenewal.serviceId,
          changes: Object.keys(renewalData).join(', ')
        })
      });
      
      return this.getRenewal(id);
    } catch (error) {
      console.error(`Error updating renewal with id ${id}:`, error);
      return undefined;
    }
  }

  async updateRenewalNotificationStatus(id: number, status: boolean): Promise<void> {
    try {
      await db.query(`
        UPDATE renewals
        SET isNotified = ?
        WHERE id = ?
      `, [status, id]);
      
      if (status) {
        // Create notification sent activity
        const renewal = await this.getRenewal(id);
        if (renewal) {
          await this.createActivity({
            type: 'notification_sent',
            description: `Notification sent for renewal due on ${new Date(renewal.endDate).toLocaleDateString()}`,
            metadata: JSON.stringify({
              renewalId: id,
              clientId: renewal.clientId,
              serviceId: renewal.serviceId
            })
          });
        }
      }
    } catch (error) {
      console.error(`Error updating notification status for renewal ${id}:`, error);
      throw error;
    }
  }

  async deleteRenewal(id: number): Promise<boolean> {
    try {
      // Check if renewal exists
      const renewal = await this.getRenewal(id);
      if (!renewal) {
        return false;
      }
      
      // Delete renewal
      await db.query(`
        DELETE FROM renewals
        WHERE id = ?
      `, [id]);
      
      // Create activity for deletion
      await this.createActivity({
        type: 'renewal_deleted',
        description: `Renewal #${id} deleted`,
        metadata: JSON.stringify({
          renewalId: id,
          clientId: renewal.clientId,
          serviceId: renewal.serviceId,
          amount: renewal.amount
        })
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting renewal with id ${id}:`, error);
      throw error;
    }
  }

  // Activity operations
  async getActivities(limit?: number): Promise<Activity[]> {
    try {
      let query = `SELECT * FROM activities ORDER BY createdAt DESC`;
      const params: any[] = [];
      
      if (limit) {
        query += ` LIMIT ?`;
        params.push(limit);
      }
      
      const activities = await db.query<Activity[]>(query, params);
      return activities;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    try {
      const [activity] = await db.query<Activity[]>(`
        SELECT * FROM activities WHERE id = ?
      `, [id]);
      return activity;
    } catch (error) {
      console.error(`Error fetching activity with id ${id}:`, error);
      return undefined;
    }
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    try {
      const result = await db.query(`
        INSERT INTO activities 
        (type, description, metadata)
        VALUES (?, ?, ?)
      `, [
        activity.type,
        activity.description,
        activity.metadata || null
      ]);
      
      const insertId = result.insertId;
      
      const [newActivity] = await db.query<Activity[]>(`
        SELECT * FROM activities WHERE id = ?
      `, [insertId]);
      
      return newActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  // Dashboard operations
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Total clients
      const [clientCount] = await db.query<[{count: number}]>(`
        SELECT COUNT(*) as count FROM clients
      `);
      
      // Total services
      const [serviceCount] = await db.query<[{count: number}]>(`
        SELECT COUNT(*) as count FROM services
      `);
      
      // Total revenue
      const [revenueResult] = await db.query<[{total: number}]>(`
        SELECT SUM(amount) as total FROM renewals
        WHERE isPaid = 1
      `);
      
      // Upcoming renewals (next 30 days)
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      const [upcomingCount] = await db.query<[{count: number}]>(`
        SELECT COUNT(*) as count FROM renewals
        WHERE endDate BETWEEN ? AND ?
      `, [
        today.toISOString().split('T')[0],
        thirtyDaysLater.toISOString().split('T')[0]
      ]);
      
      // Overdue renewals
      const [overdueCount] = await db.query<[{count: number}]>(`
        SELECT COUNT(*) as count FROM renewals
        WHERE endDate < ? AND isPaid = 0
      `, [today.toISOString().split('T')[0]]);
      
      // Calculate YTD revenue
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const [ytdResult] = await db.query<[{total: number}]>(`
        SELECT SUM(amount) as total FROM renewals
        WHERE isPaid = 1 AND endDate >= ?
      `, [startOfYear.toISOString().split('T')[0]]);
      
      // Calculate projected revenue (next 12 months)
      const endDateProjection = new Date();
      endDateProjection.setMonth(today.getMonth() + 12);
      
      const [projectedResult] = await db.query<[{total: number}]>(`
        SELECT SUM(amount) as total FROM renewals
        WHERE endDate BETWEEN ? AND ?
      `, [
        today.toISOString().split('T')[0],
        endDateProjection.toISOString().split('T')[0]
      ]);
      
      return {
        totalClients: clientCount.count,
        totalServices: serviceCount.count,
        totalRevenue: revenueResult.total || 0,
        upcomingRenewals: upcomingCount.count,
        overdueRenewals: overdueCount.count,
        revenueYTD: ytdResult.total || 0,
        projectedRevenue: projectedResult.total || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getMonthlyRevenue(months: number = 6): Promise<{month: string, amount: number}[]> {
    try {
      const today = new Date();
      const result: {month: string, amount: number}[] = [];
      
      // Generate last N months
      for (let i = 0; i < months; i++) {
        const currentMonth = new Date(today);
        currentMonth.setMonth(today.getMonth() - i);
        
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const [monthData] = await db.query<[{total: number}]>(`
          SELECT SUM(amount) as total FROM renewals
          WHERE isPaid = 1
          AND endDate BETWEEN ? AND ?
        `, [
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        ]);
        
        result.unshift({
          month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount: monthData.total || 0
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error fetching monthly revenue for last ${months} months:`, error);
      return [];
    }
  }
}