import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface PaymentGatewayResult {
  approved: boolean;
  transactionId: string;
  rejectionReason?: string;
}

@Injectable()
export class FakePaymentGatewayService {
  private readonly logger = new Logger(FakePaymentGatewayService.name);

  async processPayment(
    amount: number,
    paymentMethod: string,
  ): Promise<PaymentGatewayResult> {
    this.logger.log(
      `Simulating payment processing for amount ${amount} via ${paymentMethod}...`,
    );

    // Simulate network latency between 500ms and 2000ms
    const latency = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
    await new Promise((resolve) => setTimeout(resolve, latency));

    const transactionId = randomUUID();

    // Rejection rule 1: Amount > 10000
    if (amount > 10000) {
      this.logger.log('Payment rejected: Limit exceeded');
      return {
        approved: false,
        transactionId,
        rejectionReason: 'Limite excedido',
      };
    }

    // Rejection rule 2: Amount ending in .99
    // Due to floating point precision, we can use string formatting or modulo
    const amountStr = amount.toFixed(2);
    if (amountStr.endsWith('.99')) {
      this.logger.log('Payment rejected: Card declined by operator');
      return {
        approved: false,
        transactionId,
        rejectionReason: 'Cartão recusado pela operadora',
      };
    }

    // Otherwise, approved
    this.logger.log('Payment approved successfully');
    return {
      approved: true,
      transactionId,
    };
  }
}
