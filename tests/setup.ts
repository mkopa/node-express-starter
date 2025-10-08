/**
 * Test setup file
 * Runs before each test file
 * Sets up environment and global mocks
 */

import 'reflect-metadata';
import { Container } from 'typedi';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_boarding';
process.env.TOKEN_EXPIRY_HOURS = '12';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// Reset DI container before each test file
beforeEach(() => {
  Container.reset();
});

// Clean up after each test file
afterEach(() => {
  jest.clearAllMocks();
});

// Increase test timeout for integration tests
jest.setTimeout(10000);