// Jest setup file
// Configure testing environment

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock environment variables
process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID = 'test-client-id';
process.env.EXPO_PUBLIC_AWS_REGION = 'us-east-1';
