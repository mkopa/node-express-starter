import 'reflect-metadata';
import { Container } from 'typedi';
import { BoardingService } from '../../src/services/BoardingService';
import { IUserRepository } from '../../src/types/interfaces/IUserRepository';
import { ICompanyRepository } from '../../src/types/interfaces/ICompanyRepository';
import { ITokenRepository } from '../../src/types/interfaces/ITokenRepository';
import {
  CompanyNotFoundError,
  UserAlreadyExistsError,
  InvalidTokenError,
  TokenExpiredError,
  WeakPasswordError,
} from '../../src/types/errors/DomainErrors';
import { User } from '../../src/types/entities/User.types';
import { Company } from '../../src/types/entities/Company.types';
import { PasswordToken } from '../../src/types/entities/PasswordToken.types';

/**
 * BoardingService Test Suite
 */

describe('BoardingService', () => {
  let boardingService: BoardingService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockCompanyRepo: jest.Mocked<ICompanyRepository>;
  let mockTokenRepo: jest.Mocked<ITokenRepository>;

  /**
   * Setup: Create mocked repository interfaces and inject them
   */
  beforeEach(() => {
    // Reset DI container
    Container.reset();

    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      attachToCompany: jest.fn(),
      setPassword: jest.fn(),
      getConnection: jest.fn(),
    };

    mockCompanyRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
    };

    mockTokenRepo = {
      create: jest.fn(),
      findUnusedByHash: jest.fn(),
      markAsUsed: jest.fn(),
      deleteExpired: jest.fn(),
    };

    // Register mocks in DI container as interfaces
    Container.set('IUserRepository', mockUserRepo);
    Container.set('ICompanyRepository', mockCompanyRepo);
    Container.set('ITokenRepository', mockTokenRepo);

    // Get service instance (with mocked dependencies)
    boardingService = Container.get(BoardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onboardUser', () => {
    const validBoardingData = {
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+48123456789',
      company_id: 1,
    };

    it('should successfully onboard a user', async () => {
      // Arrange: Setup mock responses
      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      } as any;

      const mockCompany: Company = {
        id: 1,
        name: 'ACME Corp',
        created_at: new Date(),
      };

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findByEmail.mockResolvedValue(null); // User doesn't exist
      mockUserRepo.create.mockResolvedValue(123); // New user ID
      mockUserRepo.attachToCompany.mockResolvedValue(undefined);
      mockTokenRepo.create.mockResolvedValue(456); // New token ID

      // Act: Call the service
      const result = await boardingService.onboardUser(validBoardingData);

      // Assert: Check results
      expect(result).toHaveProperty('userId', 123);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('message', 'User created successfully');
      expect(result.token).toHaveLength(64); // SHA-256 hex

      // Verify transaction flow
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.rollback).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalledTimes(1);

      // Verify repository calls
      expect(mockCompanyRepo.findById).toHaveBeenCalledWith(1, mockConnection);
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com', mockConnection);
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        }),
        mockConnection
      );
      expect(mockUserRepo.attachToCompany).toHaveBeenCalledWith(123, 1, mockConnection);
      expect(mockTokenRepo.create).toHaveBeenCalledWith(
        123,
        expect.any(String), // Token hash
        mockConnection
      );
    });

    it('should throw CompanyNotFoundError if company does not exist', async () => {
      // Arrange
      const mockConnection = {
        beginTransaction: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      } as any;

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockCompanyRepo.findById.mockResolvedValue(null); // Company not found

      // Act & Assert: Expect domain-specific error
      await expect(boardingService.onboardUser(validBoardingData)).rejects.toThrow(
        CompanyNotFoundError
      );

      await expect(boardingService.onboardUser(validBoardingData)).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'COMPANY_NOT_FOUND',
        message: 'Company with id 1 does not exist',
      });

      // Verify rollback was called
      expect(mockConnection.rollback).toHaveBeenCalledTimes(2); // Called twice due to two test runs
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsError if user already exists', async () => {
      // Arrange
      const mockConnection = {
        beginTransaction: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      } as any;

      const mockCompany: Company = {
        id: 1,
        name: 'ACME Corp',
        created_at: new Date(),
      };

      const existingUser: User = {
        id: 999,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: undefined,
        is_active: 1,
        has_password: 1,
        password_hash: 'hash123',
        created_at: new Date(),
      };

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findByEmail.mockResolvedValue(existingUser); // User exists

      // Act & Assert: Expect domain-specific error
      await expect(boardingService.onboardUser(validBoardingData)).rejects.toThrow(
        UserAlreadyExistsError
      );

      await expect(boardingService.onboardUser(validBoardingData)).rejects.toMatchObject({
        statusCode: 409,
        errorCode: 'USER_ALREADY_EXISTS',
        message: 'User with email test@example.com already exists',
      });

      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('should rollback transaction on any error', async () => {
      // Arrange
      const mockConnection = {
        beginTransaction: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      } as any;

      const mockCompany: Company = {
        id: 1,
        name: 'ACME Corp',
        created_at: new Date(),
      };

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockCompanyRepo.findById.mockResolvedValue(mockCompany);
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockRejectedValue(new Error('Database error')); // Simulate DB error

      // Act & Assert
      await expect(boardingService.onboardUser(validBoardingData)).rejects.toThrow(
        'Database error'
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('setPasswordFromToken', () => {
    const validToken = 'a'.repeat(64); // 64-char hex
    const validPassword = 'SecurePassword123!';

    it('should successfully set password with valid token', async () => {
      // Arrange
      const mockConnection = {
        release: jest.fn(),
      } as any;

      const tokenCreatedAt = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

      const mockToken: PasswordToken = {
        id: 456,
        user_id: 123,
        token_hash: 'hash123',
        created_at: tokenCreatedAt,
        used: 0,
      };

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockTokenRepo.findUnusedByHash.mockResolvedValue(mockToken);
      mockUserRepo.setPassword.mockResolvedValue(undefined);
      mockTokenRepo.markAsUsed.mockResolvedValue(undefined);

      // Act
      const result = await boardingService.setPasswordFromToken(validToken, validPassword);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Password set successfully',
      });

      expect(mockUserRepo.setPassword).toHaveBeenCalledWith(
        123,
        expect.any(String), // Password hash
        mockConnection
      );
      expect(mockTokenRepo.markAsUsed).toHaveBeenCalledWith(456, mockConnection);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should throw InvalidTokenError if token is invalid', async () => {
      // Arrange
      const mockConnection = {
        release: jest.fn(),
      } as any;

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockTokenRepo.findUnusedByHash.mockResolvedValue(null); // Token not found

      // Act & Assert
      await expect(
        boardingService.setPasswordFromToken(validToken, validPassword)
      ).rejects.toThrow(InvalidTokenError);

      await expect(
        boardingService.setPasswordFromToken(validToken, validPassword)
      ).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'INVALID_TOKEN',
      });
    });

    it('should throw TokenExpiredError if token is expired', async () => {
      // Arrange
      const mockConnection = {
        release: jest.fn(),
      } as any;

      const tokenCreatedAt = new Date(Date.now() - 13 * 60 * 60 * 1000); // 13 hours ago

      const mockToken: PasswordToken = {
        id: 456,
        user_id: 123,
        token_hash: 'hash123',
        created_at: tokenCreatedAt,
        used: 0,
      };

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockTokenRepo.findUnusedByHash.mockResolvedValue(mockToken);

      // Act & Assert
      await expect(
        boardingService.setPasswordFromToken(validToken, validPassword)
      ).rejects.toThrow(TokenExpiredError);

      await expect(
        boardingService.setPasswordFromToken(validToken, validPassword)
      ).rejects.toMatchObject({
        statusCode: 410,
        errorCode: 'TOKEN_EXPIRED',
      });
    });

    it('should throw WeakPasswordError if password is too short', async () => {
      // Arrange
      const mockConnection = {
        release: jest.fn(),
      } as any;

      const tokenCreatedAt = new Date();

      const mockToken: PasswordToken = {
        id: 456,
        user_id: 123,
        token_hash: 'hash123',
        created_at: tokenCreatedAt,
        used: 0,
      };

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockTokenRepo.findUnusedByHash.mockResolvedValue(mockToken);

      // Act & Assert
      await expect(boardingService.setPasswordFromToken(validToken, 'short')).rejects.toThrow(
        WeakPasswordError
      );

      await expect(boardingService.setPasswordFromToken(validToken, 'short')).rejects.toMatchObject(
        {
          statusCode: 400,
          errorCode: 'WEAK_PASSWORD',
        }
      );
    });
  });
});
