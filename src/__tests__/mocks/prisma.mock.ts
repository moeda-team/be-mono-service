// Mock for Prisma client
const mockPrisma = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  outlet: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  menu: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn().mockResolvedValue({ id: 'category-123' }),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  transaction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  option: {
    findMany: jest.fn(),
    findUnique: jest.fn().mockResolvedValue({ id: 'option-123' }),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Add other models as needed
};

// Export as default to work with ES modules
export default mockPrisma;

// Add a simple test to prevent the "Your test suite must contain at least one test" error
describe('Prisma Mock', () => {
  it('should have mock methods for all models', () => {
    expect(mockPrisma.user.findMany).toBeDefined();
    expect(mockPrisma.outlet.findMany).toBeDefined();
    expect(mockPrisma.menu.findMany).toBeDefined();
    expect(mockPrisma.category.findMany).toBeDefined();
    expect(mockPrisma.transaction.findMany).toBeDefined();
    expect(mockPrisma.message.findMany).toBeDefined();
    expect(mockPrisma.option.findMany).toBeDefined();
  });
});
