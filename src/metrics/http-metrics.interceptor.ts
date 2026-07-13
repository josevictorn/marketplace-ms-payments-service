import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Ignore metrics endpoint to prevent infinite loops
    if (request.path === '/metrics') {
      return next.handle();
    }

    const startTime = Date.now();
    const method = request.method;
    const route = request.route ? request.route.path : request.path;

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        const durationSeconds = (Date.now() - startTime) / 1000;

        this.metricsService.incrementHttpRequestsTotal(
          method,
          route,
          statusCode,
        );
        this.metricsService.recordHttpRequestDuration(
          method,
          route,
          statusCode,
          durationSeconds,
        );
      }),
    );
  }
}
