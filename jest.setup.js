// Jest setup file
// This file is run before each test file

// Mock @zxing/browser since it's a browser-only library
jest.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
    decodeFromCanvas: jest.fn().mockResolvedValue({
      getText: () => 'mock-qr-data',
    }),
    decodeFromImage: jest.fn().mockResolvedValue({
      getText: () => 'mock-qr-data',
    }),
    reset: jest.fn(),
  })),
  Result: jest.fn().mockImplementation((text) => ({
    getText: () => text,
  })),
  NotFoundException: jest.fn(),
}));

// Mock next/server for API route tests
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({ data, init })),
  },
}));

// Add global test utilities
global.testUtils = {
  mockRequest: (overrides = {}) => ({
    headers: {
      get: jest.fn((key) => {
        const headers = {
          'X-User-ID': 'test-user-id',
          ...overrides.headers,
        };
        return headers[key];
      }),
    },
    nextUrl: {
      searchParams: {
        get: jest.fn((key) => {
          const params = {
            limit: '100',
            offset: '0',
            ...overrides.searchParams,
          };
          return params[key] || null;
        }),
      },
    },
    json: jest.fn().mockResolvedValue(overrides.body || {}),
    ...overrides,
  }),
};

// Configure console error to not break tests for expected errors
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
    // Skip Prisma warnings
    return;
  }
  originalError(...args);
};
