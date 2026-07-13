import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal: promClient.Counter<string>;
  private readonly httpRequestDurationSeconds: promClient.Histogram<string>;

  readonly paymentsProcessedTotal: promClient.Counter<string>;
  readonly paymentsApprovedTotal: promClient.Counter<string>;
  readonly paymentsRejectedTotal: promClient.Counter<string>;

  constructor() {
    promClient.collectDefaultMetrics();

    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDurationSeconds = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5, 10],
    });

    this.paymentsProcessedTotal = new promClient.Counter({
      name: 'payments_processed_total',
      help: 'Total number of payments processed',
    });

    this.paymentsApprovedTotal = new promClient.Counter({
      name: 'payments_approved_total',
      help: 'Total number of approved payments',
    });

    this.paymentsRejectedTotal = new promClient.Counter({
      name: 'payments_rejected_total',
      help: 'Total number of rejected payments',
      labelNames: ['reason'],
    });
  }

  async getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }

  getMetricsContentType(): string {
    return promClient.register.contentType;
  }

  incrementHttpRequestsTotal(
    method: string,
    route: string,
    statusCode: number,
  ): void {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  recordHttpRequestDuration(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    this.httpRequestDurationSeconds.observe(
      { method, route, status_code: statusCode },
      durationSeconds,
    );
  }
}
