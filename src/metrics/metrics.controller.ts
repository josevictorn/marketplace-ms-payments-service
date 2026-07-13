import { Controller, Get, Header, SetMetadata } from '@nestjs/common';
import { MetricsService } from './metrics.service';

// Use SetMetadata to explicitly mark this route as public in case there's any global auth guard.
export const Public = () => SetMetadata('isPublic', true);

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
