import { supabase } from './supabase';
import type { Payment, PaymentMethodType } from '@types/index';

export interface InitiatePaymentParams {
  orderId: string;
  userId: string;
  amount: number;
  currency?: string;
  method: PaymentMethodType;
}

export interface PaymentSheetParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerId?: string;
}

export const paymentService = {
  async createPaymentIntent(params: PaymentSheetParams): Promise<{
    paymentIntent: string;
    ephemeralKey: string;
    customer: string;
    publishableKey: string;
  }> {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: params,
    });
    if (error) throw error;
    return data;
  },

  async recordPayment(params: InitiatePaymentParams & { stripePaymentIntentId?: string }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: params.orderId,
        user_id: params.userId,
        stripe_payment_intent_id: params.stripePaymentIntentId,
        amount: params.amount,
        currency: params.currency ?? 'usd',
        method: params.method,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async updatePaymentStatus(
    paymentId: string,
    status: Payment['status'],
    stripeRefundId?: string
  ) {
    const { data, error } = await supabase
      .from('payments')
      .update({ status, stripe_refund_id: stripeRefundId })
      .eq('id', paymentId)
      .select()
      .single();
    if (error) throw error;
    return data as Payment;
  },

  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Payment | null;
  },

  async initiateRefund(paymentId: string, amount: number, reason: string) {
    const { data, error } = await supabase.functions.invoke('process-refund', {
      body: { paymentId, amount, reason },
    });
    if (error) throw error;
    return data;
  },
};
