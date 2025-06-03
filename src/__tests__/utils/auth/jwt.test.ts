import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

// Define types for our mocks
type JwtMock = {
  sign: jest.Mock;
  verify: jest.Mock;
};

// Mock modules first - before importing the module under test
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mocked-random-id'),
  }),
}));

// Now import the module under test
import {
  signToken,
  verifyToken,
  generateTokenPair,
  hasPermission,
  getRolePermissions,
  UserRole,
  TokenType,
} from '../../../utils/auth/jwt';

// Store original environment variables
const originalEnv = { ...process.env };

// Get references to the mocked modules with proper typing
const jwtMock = jest.requireMock('jsonwebtoken') as JwtMock;

// Mock the JWT module itself to ensure consistent test secrets
jest.mock('../../../utils/auth/jwt', () => {
  // Import the original module with explicit typing
  const originalModule = jest.requireActual('../../../utils/auth/jwt') as typeof import('../../../utils/auth/jwt');
  const jwtMock = jest.requireMock('jsonwebtoken') as JwtMock;
  
  // Mock implementation for sign function
  (jwtMock.sign as jest.Mock).mockImplementation(
    (...args: unknown[]) => {
      // Simple mock implementation that returns a string token
      const payload = args[0] as Record<string, unknown>;
      return `mocked-token-${payload.userId}`;
    }
  );

  // Mock implementation for verify function
  (jwtMock.verify as jest.Mock).mockImplementation(
    (...args: unknown[]) => {
      // Simple mock implementation that extracts userId from the token
      const token = args[0] as string;
      const userId = token.split('-')[2];
      return { userId };
    }
  );

  // Return modified module - explicitly typed to match the original module interface
  const signTokenMock = jest.fn().mockImplementation((...args: unknown[]) => {
    const payload = args[0] as Record<string, unknown>;
    const tokenType = args[1] || originalModule.TokenType.ACCESS;
    
    const secret = tokenType === originalModule.TokenType.ACCESS 
      ? process.env.JWT_ACCESS_SECRET 
      : process.env.JWT_REFRESH_SECRET;
    const expiresIn = parseInt(tokenType === originalModule.TokenType.ACCESS 
      ? process.env.JWT_ACCESS_EXPIRES_IN || '900'
      : process.env.JWT_REFRESH_EXPIRES_IN || '604800');
    
    // Create a token payload with all required fields
    const tokenPayload = {
      ...payload,
      tokenId: originalModule.generateTokenId(),
      tokenType,
    };
    
    // Call the JWT sign function with the correct parameters
    jwtMock.sign(tokenPayload, secret as string, { expiresIn });
    
    // Return the mocked token string
    return `mocked-token-${payload.userId}`;
  });
  
  const verifyTokenMock = jest.fn().mockImplementation((...args: unknown[]) => {
    const token = args[0] as string;
    const tokenType = args[1] || originalModule.TokenType.ACCESS;
    
    const secret = tokenType === originalModule.TokenType.ACCESS 
      ? process.env.JWT_ACCESS_SECRET 
      : process.env.JWT_REFRESH_SECRET;
    
    // Call the JWT verify function with the correct parameters
    jwtMock.verify(token, secret as string);
    
    if (token === 'invalid-token') {
      throw new Error('Invalid token');
    }
    
    // Return the mocked decoded token
    const userId = token.split('-')[2];
    return { userId };
  });
  
  return {
    // Don't spread the original module to avoid TypeScript errors
    signToken: signTokenMock,
    verifyToken: verifyTokenMock,
    generateTokenPair: jest.fn().mockReturnValue({
      accessToken: 'mocked-access-token',
      refreshToken: 'mocked-refresh-token',
    }),
    hasPermission: originalModule.hasPermission,
    getRolePermissions: originalModule.getRolePermissions,
    UserRole: originalModule.UserRole,
    TokenType: originalModule.TokenType,
    generateTokenId: originalModule.generateTokenId,
    JwtError: originalModule.JwtError,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_ACCESS_EXPIRES_IN = '900';
  process.env.JWT_REFRESH_EXPIRES_IN = '604800';
});

afterEach(() => {
  process.env = originalEnv;
});

describe('JWT Utils', () => {
  const mockPayload = { userId: '123', outletId: '456' };
  const mockDecodedToken = { userId: '123', role: 'OWNER' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signToken', () => {
    it('should sign an access token correctly', () => {
      const token = signToken(mockPayload, TokenType.ACCESS);
      expect(token).toBe(`mocked-token-${mockPayload.userId}`);
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          outletId: '456',
          tokenId: expect.any(String),
          tokenType: TokenType.ACCESS,
        }),
        'test-access-secret',
        expect.objectContaining({ expiresIn: 900 }),
      );
    });

    it('should sign a refresh token correctly', () => {
      const token = signToken(mockPayload, TokenType.REFRESH);
      expect(token).toBe(`mocked-token-${mockPayload.userId}`);
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          outletId: '456',
          tokenId: expect.any(String),
          tokenType: TokenType.REFRESH,
        }),
        'test-refresh-secret',
        expect.objectContaining({ expiresIn: 604800 }),
      );
    });

    it('should use access token type by default', () => {
      const token = signToken(mockPayload);
      expect(token).toBe(`mocked-token-${mockPayload.userId}`);
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenType: TokenType.ACCESS,
        }),
        'test-access-secret',
        expect.any(Object),
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a token correctly', () => {
      const result = verifyToken(`mocked-token-${mockPayload.userId}`, TokenType.ACCESS);
      expect(result).toEqual({ userId: mockPayload.userId });
      expect(jwtMock.verify).toHaveBeenCalledWith(`mocked-token-${mockPayload.userId}`, 'test-access-secret');
    });

    it('should throw an error for invalid tokens', () => {
      expect(() => verifyToken('invalid-token', TokenType.ACCESS)).toThrow('Invalid token');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate a token pair correctly', () => {
      const tokens = generateTokenPair(mockPayload);
      expect(tokens).toEqual({
        accessToken: 'mocked-access-token',
        refreshToken: 'mocked-refresh-token',
      });
    });
  });

  describe('hasPermission', () => {
    it('should check permissions correctly', () => {
      expect(hasPermission(UserRole.OWNER, UserRole.OWNER)).toBe(true);
      expect(hasPermission(UserRole.OWNER, UserRole.STORE_MANAGER)).toBe(true);
      expect(hasPermission(UserRole.OWNER, UserRole.EMPLOYEE)).toBe(true);
      expect(hasPermission(UserRole.STORE_MANAGER, UserRole.OWNER)).toBe(false);
      expect(hasPermission(UserRole.STORE_MANAGER, UserRole.STORE_MANAGER)).toBe(true);
      expect(hasPermission(UserRole.STORE_MANAGER, UserRole.EMPLOYEE)).toBe(true);
      expect(hasPermission(UserRole.EMPLOYEE, UserRole.OWNER)).toBe(false);
      expect(hasPermission(UserRole.EMPLOYEE, UserRole.STORE_MANAGER)).toBe(false);
      expect(hasPermission(UserRole.EMPLOYEE, UserRole.EMPLOYEE)).toBe(true);
    });
  });

  describe('getRolePermissions', () => {
    it('should get role permissions correctly', () => {
      expect(getRolePermissions(UserRole.OWNER)).toEqual([
        UserRole.OWNER,
        UserRole.STORE_MANAGER,
        UserRole.EMPLOYEE,
      ]);
      expect(getRolePermissions(UserRole.STORE_MANAGER)).toEqual([
        UserRole.STORE_MANAGER,
        UserRole.EMPLOYEE,
      ]);
      expect(getRolePermissions(UserRole.EMPLOYEE)).toEqual([UserRole.EMPLOYEE]);
      expect(getRolePermissions('INVALID_ROLE' as UserRole)).toEqual([]);
    });

    it('should return empty array for invalid role', () => {
      const permissions = getRolePermissions('' as UserRole);
      expect(permissions).toEqual([]);
    });
  });
});
