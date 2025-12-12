import jwt from 'jsonwebtoken';
import {
  signToken,
  verifyToken,
  generateTokenPair,
  hasPermission,
  getRolePermissions,
  JwtError,
  TokenType,
  UserRole,
} from '../../../utils/auth/jwt';

// Mock jsonwebtoken module
jest.mock('jsonwebtoken');

describe('JWT Utilities', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup test environment variables
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '3600';
    process.env.JWT_REFRESH_EXPIRES_IN = '604800';

    // Mock crypto.randomBytes which is used in generateTokenId
    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);

    // Setup default mocks
    (jwt.sign as jest.Mock).mockImplementation((_payload, _secret, _options) => {
      return 'mocked-token-' + (_payload.tokenType === TokenType.ACCESS ? 'access' : 'refresh');
    });

    (jwt.verify as jest.Mock).mockImplementation((token, _secret) => {
      if (token === 'invalid-token') {
        throw new Error('Invalid token');
      }

      return {
        userId: 'test-user-id',
        outletId: 'test-outlet-id',
        role: 'ADMIN',
        tokenType: token.includes('refresh') ? TokenType.REFRESH : TokenType.ACCESS,
        tokenId: 'test-token-id',
        iat: Math.floor(Date.now() / 1000),
      };
    });
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  describe('signToken', () => {
    it('should sign an access token correctly', () => {
      // Arrange
      const payload = {
        userId: '123',
        outletId: '456',
        role: 'ADMIN',
      };

      // Act
      const token = signToken(payload, TokenType.ACCESS);

      // Assert
      expect(token).toBe('mocked-token-access');
      // Don't check the exact parameters as they include dynamic values like tokenId and iat
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          outletId: '456',
          role: 'ADMIN',
          tokenType: TokenType.ACCESS,
        }),
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should sign a refresh token correctly', () => {
      // Arrange
      const payload = {
        userId: '123',
        outletId: '456',
        role: 'ADMIN',
      };

      // Act
      const token = signToken(payload, TokenType.REFRESH);

      // Assert
      expect(token).toBe('mocked-token-refresh');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          outletId: '456',
          role: 'ADMIN',
          tokenType: TokenType.REFRESH,
        }),
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should use access token type by default', () => {
      // Arrange
      const payload = {
        userId: '123',
        outletId: '456',
        role: 'ADMIN',
      };

      // Act
      const token = signToken(payload);

      // Assert
      expect(token).toBe('mocked-token-access');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenType: TokenType.ACCESS,
        }),
        expect.any(String),
        expect.any(Object),
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify an access token correctly', () => {
      // Arrange
      const token = 'test-token';

      // Act
      const result = verifyToken(token, TokenType.ACCESS);

      // Assert
      expect(result).toEqual({
        userId: 'test-user-id',
        outletId: 'test-outlet-id',
        role: 'ADMIN',
        tokenType: TokenType.ACCESS,
        tokenId: 'test-token-id',
        iat: expect.any(Number),
      });

      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    it('should verify a refresh token correctly', () => {
      // Arrange
      const token = 'refresh-token';

      // Act
      const result = verifyToken(token, TokenType.REFRESH);

      // Assert
      expect(result).toEqual({
        userId: 'test-user-id',
        outletId: 'test-outlet-id',
        role: 'ADMIN',
        tokenType: TokenType.REFRESH,
        tokenId: 'test-token-id',
        iat: expect.any(Number),
      });

      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    it('should throw JwtError when jwt.verify throws an error', () => {
      // Arrange
      const token = 'invalid-token';
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      expect(() => verifyToken(token)).toThrow(JwtError);
      expect(() => verifyToken(token)).toThrow('Invalid or expired token');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      // Arrange
      const payload = {
        userId: '123',
        outletId: '456',
        role: 'ADMIN',
      };

      // Our mock already returns different tokens based on token type

      // Act
      const tokenPair = generateTokenPair(payload);

      // Assert
      expect(tokenPair).toEqual({
        accessToken: 'mocked-token-access',
        refreshToken: 'mocked-token-refresh',
      });

      // Verify that jwt.sign was called correctly for both token types
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('JwtError', () => {
    it('should create a JwtError with correct name and message', () => {
      // Arrange & Act
      const error = new JwtError('Test error message');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('JwtError');
      expect(error.message).toBe('Test error message');
    });
  });

  describe('hasPermission', () => {
    it('should check permissions correctly for owner role', () => {
      // Act & Assert
      expect(hasPermission(UserRole.OWNER, UserRole.OWNER)).toBe(true);
      expect(hasPermission(UserRole.OWNER, UserRole.STORE_MANAGER)).toBe(true);
      expect(hasPermission(UserRole.OWNER, UserRole.EMPLOYEE)).toBe(true);
    });

    it('should check permissions correctly for store manager role', () => {
      // Act & Assert
      expect(hasPermission(UserRole.STORE_MANAGER, UserRole.OWNER)).toBe(false);
      expect(hasPermission(UserRole.STORE_MANAGER, UserRole.STORE_MANAGER)).toBe(true);
      expect(hasPermission(UserRole.STORE_MANAGER, UserRole.EMPLOYEE)).toBe(true);
    });

    it('should check permissions correctly for employee role', () => {
      // Act & Assert
      expect(hasPermission(UserRole.EMPLOYEE, UserRole.OWNER)).toBe(false);
      expect(hasPermission(UserRole.EMPLOYEE, UserRole.STORE_MANAGER)).toBe(false);
      expect(hasPermission(UserRole.EMPLOYEE, UserRole.EMPLOYEE)).toBe(true);
    });

    it('should return false for invalid roles', () => {
      // Act & Assert
      expect(hasPermission('' as UserRole, UserRole.EMPLOYEE)).toBe(false);
      expect(hasPermission(UserRole.OWNER, '' as UserRole)).toBe(false);
      expect(hasPermission('INVALID_ROLE' as UserRole, UserRole.EMPLOYEE)).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should get role permissions correctly for owner', () => {
      // Act
      const permissions = getRolePermissions(UserRole.OWNER);

      // Assert
      expect(permissions).toEqual([UserRole.OWNER, UserRole.STORE_MANAGER, UserRole.EMPLOYEE]);
    });

    it('should get role permissions correctly for store manager', () => {
      // Act
      const permissions = getRolePermissions(UserRole.STORE_MANAGER);

      // Assert
      expect(permissions).toEqual([UserRole.STORE_MANAGER, UserRole.EMPLOYEE]);
    });

    it('should get role permissions correctly for employee', () => {
      // Act
      const permissions = getRolePermissions(UserRole.EMPLOYEE);

      // Assert
      expect(permissions).toEqual([UserRole.EMPLOYEE]);
    });

    it('should return empty array for invalid role', () => {
      // Act
      const permissions = getRolePermissions('' as UserRole);

      // Assert
      expect(permissions).toEqual([]);
    });
  });
});
