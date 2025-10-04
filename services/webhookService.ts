import { WebhookConfig, IntegrationWebhook, WebhookEvent, WebhookDelivery } from '../types';
import { db } from './supabaseService';
import crypto from 'crypto';

export class WebhookService {
  private webhooks: Map<string, IntegrationWebhook> = new Map();

  /**
   * Create a new webhook for an integration
   */
  async createWebhook(
    integrationId: string,
    webhookConfig: WebhookConfig
  ): Promise<IntegrationWebhook> {
    try {
      // Validate webhook configuration
      this.validateWebhookConfig(webhookConfig);

      // Generate webhook secret if not provided
      const secret = webhookConfig.secret || this.generateSecret();

      const webhook: IntegrationWebhook = {
        id: crypto.randomUUID(),
        integrationId,
        url: webhookConfig.url,
        secret,
        events: webhookConfig.events || [],
        isActive: webhookConfig.isActive !== false,
        retryPolicy: {
          maxRetries: webhookConfig.retryPolicy?.maxRetries || 3,
          retryDelay: webhookConfig.retryPolicy?.retryDelay || 1000,
          backoffMultiplier: webhookConfig.retryPolicy?.backoffMultiplier || 2
        },
        headers: webhookConfig.headers || {},
        timeout: webhookConfig.timeout || 30000,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      await db.addIntegrationWebhook(webhook);

      // Store in memory for quick access
      this.webhooks.set(webhook.id, webhook);

      return webhook;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw new Error(`Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<WebhookConfig>
  ): Promise<IntegrationWebhook> {
    try {
      const existingWebhook = this.webhooks.get(webhookId);
      if (!existingWebhook) {
        throw new Error('Webhook not found');
      }

      // Validate updated configuration
      const updatedConfig = { ...existingWebhook, ...updates };
      this.validateWebhookConfig(updatedConfig);

      const updatedWebhook: IntegrationWebhook = {
        ...existingWebhook,
        ...updates,
        updatedAt: new Date()
      };

      // Update in database
      await db.updateIntegrationWebhook(webhookId, updatedWebhook);

      // Update in memory
      this.webhooks.set(webhookId, updatedWebhook);

      return updatedWebhook;
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw new Error(`Failed to update webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      // Remove from database
      await db.deleteIntegrationWebhook(webhookId);

      // Remove from memory
      this.webhooks.delete(webhookId);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw new Error(`Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all webhooks for an integration
   */
  async getWebhooksForIntegration(integrationId: string): Promise<IntegrationWebhook[]> {
    try {
      const webhooks = await db.getIntegrationWebhooks(integrationId);
      
      // Update memory cache
      webhooks.forEach(webhook => {
        this.webhooks.set(webhook.id, webhook);
      });

      return webhooks;
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw new Error(`Failed to fetch webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deliver a webhook event
   */
  async deliverWebhook(
    webhookId: string,
    event: WebhookEvent,
    payload: any
  ): Promise<WebhookDelivery> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || !webhook.isActive) {
      throw new Error('Webhook not found or inactive');
    }

    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      webhookId,
      event,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: webhook.retryPolicy.maxRetries,
      nextRetryAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Attempt delivery
    return await this.attemptDelivery(webhook, delivery);
  }

  /**
   * Attempt to deliver a webhook
   */
  private async attemptDelivery(
    webhook: IntegrationWebhook,
    delivery: WebhookDelivery
  ): Promise<WebhookDelivery> {
    try {
      delivery.attempts += 1;
      delivery.status = 'delivering';
      delivery.updatedAt = new Date();

      // Create signature
      const signature = this.createSignature(webhook.secret, delivery.payload);

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Signature': signature,
        'X-Webhook-Delivery-ID': delivery.id,
        'X-Webhook-Timestamp': delivery.createdAt.getTime().toString(),
        ...webhook.headers
      };

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(webhook.timeout)
      });

      if (response.ok) {
        delivery.status = 'delivered';
        delivery.responseStatus = response.status;
        delivery.responseHeaders = Object.fromEntries(response.headers.entries());
        delivery.deliveredAt = new Date();
      } else {
        delivery.status = 'failed';
        delivery.responseStatus = response.status;
        delivery.responseHeaders = Object.fromEntries(response.headers.entries());
        delivery.error = `HTTP ${response.status}: ${response.statusText}`;
      }

    } catch (error) {
      delivery.status = 'failed';
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
    }

    delivery.updatedAt = new Date();

    // Schedule retry if needed
    if (delivery.status === 'failed' && delivery.attempts < delivery.maxAttempts) {
      const retryDelay = webhook.retryPolicy.retryDelay * 
        Math.pow(webhook.retryPolicy.backoffMultiplier, delivery.attempts - 1);
      delivery.nextRetryAt = new Date(Date.now() + retryDelay);
      delivery.status = 'pending';
    }

    // Save delivery attempt
    await this.saveDeliveryAttempt(delivery);

    return delivery;
  }

  /**
   * Process pending webhook deliveries
   */
  async processPendingDeliveries(): Promise<void> {
    try {
      const pendingDeliveries = await this.getPendingDeliveries();
      
      for (const delivery of pendingDeliveries) {
        if (new Date() >= delivery.nextRetryAt) {
          const webhook = this.webhooks.get(delivery.webhookId);
          if (webhook) {
            await this.attemptDelivery(webhook, delivery);
          }
        }
      }
    } catch (error) {
      console.error('Error processing pending deliveries:', error);
    }
  }

  /**
   * Create webhook signature for verification
   */
  private createSignature(secret: string, payload: any): string {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(secret: string, payload: any, signature: string): boolean {
    const expectedSignature = this.createSignature(secret, payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Generate a secure random secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate webhook configuration
   */
  private validateWebhookConfig(config: WebhookConfig): void {
    if (!config.url) {
      throw new Error('Webhook URL is required');
    }

    try {
      new URL(config.url);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    if (config.events && !Array.isArray(config.events)) {
      throw new Error('Events must be an array');
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
      throw new Error('Timeout must be between 1 and 300 seconds');
    }
  }

  /**
   * Get pending webhook deliveries
   */
  private async getPendingDeliveries(): Promise<WebhookDelivery[]> {
    try {
      // Query database for pending deliveries
      const { data, error } = await db.supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('status', 'pending')
        .lt('next_retry_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending deliveries:', error);
        return [];
      }

      return (data || []).map(this.transformDatabaseDeliveryToDelivery);
    } catch (error) {
      console.error('Error fetching pending deliveries:', error);
      return [];
    }
  }

  /**
   * Save webhook delivery attempt
   */
  private async saveDeliveryAttempt(delivery: WebhookDelivery): Promise<void> {
    try {
      const deliveryData = {
        id: delivery.id,
        webhook_id: delivery.webhookId,
        event: delivery.event,
        payload: delivery.payload,
        status: delivery.status,
        attempts: delivery.attempts,
        max_attempts: delivery.maxAttempts,
        next_retry_at: delivery.nextRetryAt.toISOString(),
        delivered_at: delivery.deliveredAt?.toISOString(),
        response_status: delivery.responseStatus,
        response_headers: delivery.responseHeaders,
        error: delivery.error,
        created_at: delivery.createdAt.toISOString(),
        updated_at: delivery.updatedAt.toISOString()
      };

      const { error } = await db.supabase
        .from('webhook_deliveries')
        .upsert(deliveryData);

      if (error) {
        console.error('Error saving delivery attempt:', error);
      }
    } catch (error) {
      console.error('Error saving delivery attempt:', error);
    }
  }

  /**
   * Transform database delivery to WebhookDelivery
   */
  private transformDatabaseDeliveryToDelivery(data: any): WebhookDelivery {
    return {
      id: data.id,
      webhookId: data.webhook_id,
      event: data.event,
      payload: data.payload,
      status: data.status,
      attempts: data.attempts,
      maxAttempts: data.max_attempts,
      nextRetryAt: new Date(data.next_retry_at),
      deliveredAt: data.delivered_at ? new Date(data.delivered_at) : undefined,
      responseStatus: data.response_status,
      responseHeaders: data.response_headers,
      error: data.error,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const webhook = this.webhooks.get(webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook delivery'
      };

      const delivery = await this.deliverWebhook(webhookId, 'test', testPayload);
      
      return {
        success: delivery.status === 'delivered',
        error: delivery.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getWebhookStats(webhookId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    successRate: number;
  }> {
    // This would typically query the database for delivery statistics
    // For now, return mock data
    return {
      totalDeliveries: 100,
      successfulDeliveries: 95,
      failedDeliveries: 5,
      averageResponseTime: 250,
      successRate: 95
    };
  }
}

export const webhookService = new WebhookService();
