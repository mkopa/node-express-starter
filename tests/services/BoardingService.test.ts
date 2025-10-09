import 'reflect-metadata';
import { Container } from 'typedi';
import { BoardingService, AppError } from '../../src/services/BoardingService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { CompanyRepository } from '../../src/repositories/CompanyRepository';
import { TokenRepository } from '../../src/repositories/TokenRepository';

/**
 * Example test suite for BoardingService
 * Demonstrates how proper DI makes testing easy with mocks
 */

describe('BoardingService', () => {
  let boardingService: BoardingService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockCompanyRepo: jest.Mocked<CompanyRepository>;
  let mockTokenRepo: jest.Mocked<TokenRepository>;

  /**
   * Setup: Create mocked repositories and inject them
   */
  beforeEach(() => {
    // Reset DI container
    Container.reset();

    // Create mock repositories with all methods
    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      attachToCompany: jest.fn(),
      setPassword: jest.fn(),
      getConnection: jest.fn(),
    } as any;

    mockCompanyRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockTokenRepo = {
      create: jest.fn(),
      findUnusedByHash: jest.fn(),
      markAsUsed: jest.fn(),
      deleteExpired: jest.fn(),
    } as any;

    // Register mocks in DI container
    Container.set(UserRepository, mockUserRepo);
    Container.set(CompanyRepository, mockCompanyRepo);
    Container.set(TokenRepository, mockTokenRepo);

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

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockCompanyRepo.findById.mockResolvedValue({
        id: 1,
        name: 'ACME Corp',
        created_at: new Date(),
      });
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

    it('should throw 404 error if company does not exist', async () => {
      // Arrange
      const mockConnection = {
        beginTransaction: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      } as any;

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockCompanyRepo.findById.mockResolvedValue(null); // Company not found

      // Act & Assert
      try {
        await boardingService.onboardUser(validBoardingData);
        fail('Expected AppError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toMatchObject({
          status: 404,
          message: 'Company with id 1 does not exist',
        });
      }

      // Verify rollback was called
      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should throw 409 error if user already exists', async () => {
      // Arrange
      const mockConnection = {
        beginTransaction: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      } as any;

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockCompanyRepo.findById.mockResolvedValue({
        id: 1,
        name: 'ACME Corp',
        created_at: new Date(),
      });
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 999,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        is_active: 1,
        has_password: 1,
        created_at: new Date(),
      } as any); // User exists

      // Act & Assert
      try {
        await boardingService.onboardUser(validBoardingData);
        fail('Expected AppError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toMatchObject({
          status: 409,
          message: 'User with this email already exists',
        });
      }

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
    });

    it('should rollback transaction on any error', async () => {
      // Arrange
      const mockConnection = {
        beginTransaction: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      } as any;

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockCompanyRepo.findById.mockResolvedValue({
        id: 1,
        name: 'ACME Corp',
        created_at: new Date(),
      });
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockRejectedValue(new Error('Database error')); // Simulate DB error

      // Act & Assert
      await expect(boardingService.onboardUser(validBoardingData))
        .rejects
        .toThrow('Database error');

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
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

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockTokenRepo.findUnusedByHash.mockResolvedValue({
        id: 456,
        user_id: 123,
        token_hash: 'hash123',
        created_at: tokenCreatedAt,
        used: 0,
      });
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
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should throw 404 error if token is invalid', async () => {
      // Arrange
      const mockConnection = {
        release: jest.fn(),
      } as any;

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockTokenRepo.findUnusedByHash.mockResolvedValue(null); // Token not found

      // Act & Assert
      await expect(boardingService.setPasswordFromToken(validToken, validPassword))
        .rejects
        .toMatchObject({
          status: 404,
          message: 'Invalid or expired token',
        });
    });

    it('should throw 410 error if token is expired', async () => {
      // Arrange
      const mockConnection = {
        release: jest.fn(),
      } as any;

      const tokenCreatedAt = new Date(Date.now() - 13 * 60 * 60 * 1000); // 13 hours ago

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockTokenRepo.findUnusedByHash.mockResolvedValue({
        id: 456,
        user_id: 123,
        token_hash: 'hash123',
        created_at: tokenCreatedAt,
        used: 0,
      });

      // Act & Assert
      await expect(boardingService.setPasswordFromToken(validToken, validPassword))
        .rejects
        .toMatchObject({
          status: 410,
          message: 'Token expired',
        });
    });

    it('should throw 400 error if password is too short', async () => {
      // Arrange
      const mockConnection = {
        release: jest.fn(),
      } as any;

      const tokenCreatedAt = new Date();

      mockUserRepo.getConnection.mockResolvedValue(mockConnection);
      mockTokenRepo.findUnusedByHash.mockResolvedValue({
        id: 456,
        user_id: 123,
        token_hash: 'hash123',
        created_at: tokenCreatedAt,
        used: 0,
      });

      // Act & Assert
      await expect(boardingService.setPasswordFromToken(validToken, 'short'))
        .rejects
        .toMatchObject({
          status: 400,
          message: 'Password must be at least 12 characters',
        });
    });
  });
});