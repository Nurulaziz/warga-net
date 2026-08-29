import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { HealthService } from './health.service';

@Controller('health')
@AllowAnonymous()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.check();
  }

  @Get('detailed')
  async detailedCheck() {
    return this.healthService.detailedCheck();
  }
}
