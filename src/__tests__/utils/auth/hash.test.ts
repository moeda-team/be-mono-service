import bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from '../../../utils/auth/hash';

// Mock bcrypt
jest.mock('bcrypt');

describe('Password Hashing Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      // Arrange
      const password = 'test-password';
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Act
      const result = await hashPassword(password);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(password, expect.any(Number));
      expect(result).toBe(hashedPassword);
    });

    it('should throw an error if bcrypt.hash fails', async () => {
      // Arrange
      const password = 'test-password';
      const error = new Error('Hashing failed');
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(hashPassword(password)).rejects.toThrow('Hashing failed');
    });
  });

  describe('comparePassword', () => {
    it('should return true when passwords match', async () => {
      // Arrange
      const password = 'test-password';
      const hashedPassword = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await comparePassword(password, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      // Arrange
      const password = 'wrong-password';
      const hashedPassword = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await comparePassword(password, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should throw an error if bcrypt.compare fails', async () => {
      // Arrange
      const password = 'test-password';
      const hashedPassword = 'hashed-password';
      const error = new Error('Comparison failed');
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(comparePassword(password, hashedPassword)).rejects.toThrow('Comparison failed');
    });
  });
});
