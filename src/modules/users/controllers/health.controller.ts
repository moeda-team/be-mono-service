import { Request, Response } from 'express';
import { config } from '../../../config';
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
  systemMemory: {
    total: number;
    used: number;
    free: number;
    usage: string;
  };
}

import os from 'os';

export class HealthController extends BaseController {
  public check = (_req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();
    const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const freeMemoryMB = totalMemoryMB - usedMemoryMB;
    const memoryUsagePercentage = Math.round((usedMemoryMB / totalMemoryMB) * 100);

    // System-level memory
    const totalSystemMemoryMB = Math.round(os.totalmem() / 1024 / 1024);
    const freeSystemMemoryMB = Math.round(os.freemem() / 1024 / 1024);
    const usedSystemMemoryMB = totalSystemMemoryMB - freeSystemMemoryMB;
    const systemMemoryUsagePercentage = Math.round(
      (usedSystemMemoryMB / totalSystemMemoryMB) * 100,
    );

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
      systemMemory: {
        total: totalSystemMemoryMB,
        used: usedSystemMemoryMB,
        free: freeSystemMemoryMB,
        usage: `${systemMemoryUsagePercentage}%`,
      },
    };

    return this.sendSuccess(res, {
      message: 'API is healthy and operational',
      data: healthData,
    });
  };
}
