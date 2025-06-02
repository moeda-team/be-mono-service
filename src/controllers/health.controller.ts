import { Request, Response } from 'express';
import { config } from '../config';
import { BaseController } from './base.controller';

interface HealthStatus {
  uptime: number;
  timestamp: string;
  environment: string;
  memory: {
    used: number;
    total: number;
    free: number;
    usage: string;
  };
}

export class HealthController extends BaseController {
  public check = (_req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();
    const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const freeMemoryMB = totalMemoryMB - usedMemoryMB;
    const memoryUsagePercentage = Math.round((usedMemoryMB / totalMemoryMB) * 100);

    const healthData: HealthStatus = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      memory: {
        used: usedMemoryMB,
        total: totalMemoryMB,
        free: freeMemoryMB,
        usage: `${memoryUsagePercentage}%`,
      },
    };

    return this.sendSuccess(res, {
      message: 'API is healthy and operational',
      data: healthData,
    });
  };
}
