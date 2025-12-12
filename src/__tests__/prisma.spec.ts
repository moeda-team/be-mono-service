/**
 * Tests for src/lib/prisma.ts to achieve 100 % coverage on that file.
 * We mock external dependencies so the module can be required in isolation
 * and we can exercise both the success and error branches of its
 * shutdown handler.
 */

import { jest } from '@jest/globals';
import type { PrismaClient as PrismaClientType } from '@prisma/client';

// ---------- mocks ----------

// Mock the PrismaClient so no real DB connection is attempted
let disconnectMock: jest.Mock;
let prismaInstance: Partial<PrismaClientType> & { _options?: any };

jest.mock('@prisma/client', () => {
  disconnectMock = jest.fn();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – we are mocking JS here
  const PrismaClient = jest.fn().mockImplementation((options: any) => {
    prismaInstance = {
      $disconnect: disconnectMock,
      _options: options,
    } as any;
    return prismaInstance;
  });
  return { PrismaClient };
});

// Silence logger output and capture its calls
export const loggerInfoSpy = jest.fn();
jest.mock('@/utils/common/logger', () => ({
  logger: { info: (...args: any[]) => loggerInfoSpy(...args), error: jest.fn() },
}));

// ---------- helpers ----------

function importPrismaModule() {
  // Fresh module import for each test so that the module body (which registers
  // process.on listeners) runs again.
  jest.resetModules();
  // Relative path from this test file (src/__tests__) to the module
  // we want to test (src/lib/prisma.ts).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../lib/prisma').default as typeof prismaInstance;
}

// ---------- tests ----------

describe('prisma.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('instantiates PrismaClient with correct log options and registers shutdown listeners', async () => {
    const processOnSpy = jest.spyOn(process, 'on');
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as never);

    const prisma = importPrismaModule();

    // Assert PrismaClient instantiated with correct log levels
    expect(prisma._options).toEqual({ log: ['info', 'warn', 'error'] });

    // Three shutdown signals should be registered
    expect(processOnSpy).toHaveBeenCalledTimes(3);
    const registeredSignals = processOnSpy.mock.calls.map(call => call[0]);
    expect(registeredSignals).toEqual(expect.arrayContaining(['SIGTERM', 'SIGINT', 'SIGQUIT']));

    // Exercise the success path of the shutdown callback
    const shutdownCallback = processOnSpy.mock.calls.find(
      call => call[0] === 'SIGTERM',
    )![1] as () => Promise<void>;
    await shutdownCallback();

    expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    expect(processExitSpy).toHaveBeenCalledWith(0);

    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('logs an error when disconnecting fails but still exits gracefully', async () => {
    const processOnSpy = jest.spyOn(process, 'on');
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as never);

    const prisma = importPrismaModule();

    // Make $disconnect reject to hit the error branch
    (prisma.$disconnect as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('disconnect fail')),
    );

    const shutdownCallback = processOnSpy.mock.calls.find(
      call => call[0] === 'SIGTERM',
    )![1] as () => Promise<void>;
    await shutdownCallback();

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      'Error while disconnecting Prisma',
      expect.any(Error),
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);

    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
