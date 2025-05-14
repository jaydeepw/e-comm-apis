import { Injectable } from '@nestjs/common';

interface MockPaymentIntent {
  id: string;
  client_secret: string;
  status: 'succeeded' | 'failed' | 'processing';
  amount: number;
  currency: string;
  metadata: Record<string, any>;
  last_payment_error?: { message: string };
}

interface MockRefund {
  id: string;
  status: 'succeeded' | 'failed';
  payment_intent: string;
  amount: number;
}

@Injectable()
export class MockStripeService {
  private paymentIntents: Map<string, MockPaymentIntent> = new Map();
  private refunds: Map<string, MockRefund> = new Map();

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    payment_method_types: string[];
    metadata: Record<string, any>;
  }): Promise<MockPaymentIntent> {
    const paymentIntent: MockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `secret_${Date.now()}`,
      status: 'processing',
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
    };

    this.paymentIntents.set(paymentIntent.id, paymentIntent);
    return paymentIntent;
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<MockPaymentIntent> {
    const paymentIntent = this.paymentIntents.get(paymentIntentId);
    if (!paymentIntent) {
      throw new Error(`Payment intent ${paymentIntentId} not found`);
    }

    // Simulate payment processing
    // 90% success rate, 10% failure rate
    if (Math.random() < 0.9) {
      paymentIntent.status = 'succeeded';
    } else {
      paymentIntent.status = 'failed';
      paymentIntent.last_payment_error = { message: 'Mock payment failed' };
    }

    return paymentIntent;
  }

  async createRefund(params: { payment_intent: string }): Promise<MockRefund> {
    const paymentIntent = this.paymentIntents.get(params.payment_intent);
    if (!paymentIntent) {
      throw new Error(`Payment intent ${params.payment_intent} not found`);
    }

    const refund: MockRefund = {
      id: `re_mock_${Date.now()}`,
      status: 'succeeded',
      payment_intent: params.payment_intent,
      amount: paymentIntent.amount,
    };

    this.refunds.set(refund.id, refund);
    return refund;
  }
}
