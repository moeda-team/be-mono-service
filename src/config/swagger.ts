import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './index';

// Match route files for both ts-node (dev) and compiled dist (prod). tsc keeps
// JSDoc comments in the emitted .js, so swagger-jsdoc can parse either source.
const ext = path.extname(__filename) || '.ts';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Moeda POS API',
      version: '1.0.0',
      description:
        'REST API for the Moeda POS system.\n\n' +
        '**Authentication** uses JWT Bearer tokens obtained from `POST /users/login`.\n\n' +
        '**Role-based outlet access:** `EMPLOYEE` and `STORE_MANAGER` are always ' +
        'scoped to their own `outletId` (from the JWT). `ADMIN` and `OWNER` may see ' +
        'every outlet aggregated, or narrow results to one outlet via the ' +
        '`?outletId=` query parameter (see the `OutletIdQuery` parameter).',
    },
    servers: [
      { url: `http://localhost:${config.port}/v1`, description: 'Local' },
      { url: 'https://api-pos.hompimpa.biz.id/v1', description: 'Production' },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication' },
      { name: 'Users', description: 'User management' },
      { name: 'Outlets', description: 'Outlet management' },
      { name: 'Menus', description: 'Menus' },
      { name: 'Categories', description: 'Menu categories' },
      { name: 'Options', description: 'Menu options / add-ons' },
      { name: 'Menu Ingredients', description: 'Menu ingredient composition' },
      { name: 'Best Seller', description: 'Best seller menus' },
      { name: 'Transactions', description: 'Transactions' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Inventories', description: 'Inventory / stock items' },
      { name: 'Activities', description: 'Inventory stock activities' },
      { name: 'Discounts', description: 'Discounts' },
      { name: 'Discount Menus', description: 'Discount ↔ menu links' },
      { name: 'Vouchers', description: 'Vouchers' },
      { name: 'Voucher Menus', description: 'Voucher ↔ menu links' },
      { name: 'Tables', description: 'Dine-in tables' },
      { name: 'Cash Balances', description: 'Cash balance & logs' },
      { name: 'Reports', description: 'Reports & analytics' },
      { name: 'Cash Books', description: 'Cash book / shift reports' },
      { name: 'Attendances', description: 'Employee attendance' },
      { name: 'Messages', description: 'Customer feedback messages' },
      { name: 'Files', description: 'File uploads' },
      { name: 'WebSockets', description: 'WebSocket statistics' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from `POST /users/login`.',
        },
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'HTTP Basic auth for service-to-service endpoints.',
        },
      },
      parameters: {
        OutletIdQuery: {
          name: 'outletId',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'uuid' },
          description:
            'Filter by outlet. Only honored for `ADMIN`/`OWNER`; omit to see all ' +
            'outlets. Ignored for `EMPLOYEE`/`STORE_MANAGER` (always their own outlet).',
        },
        PageQuery: {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1 },
          description: 'Page number (enables pagination together with `limit`).',
        },
        LimitQuery: {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1 },
          description: 'Items per page.',
        },
        SearchQuery: {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Case-insensitive search term.',
        },
        IdPath: {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Resource id.',
        },
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string' },
            data: {},
            pagination: { $ref: '#/components/schemas/Pagination' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
            data: { nullable: true, example: null },
            error: {
              type: 'object',
              nullable: true,
              properties: {
                code: { type: 'string' },
                details: {},
              },
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@example.com' },
            password: { type: 'string', format: 'password', example: 'Johndoe123!' },
          },
        },
        LoginData: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { $ref: '#/components/schemas/Role' },
            token_type: { type: 'string', example: 'Bearer' },
            expires_in: { type: 'integer' },
            ext_expires_in: { type: 'integer' },
            access_token: { type: 'string' },
            expires_on: { type: 'string' },
            outlet: { allOf: [{ $ref: '#/components/schemas/Outlet' }], nullable: true },
          },
        },
        Role: {
          type: 'string',
          enum: ['ADMIN', 'OWNER', 'STORE_MANAGER', 'EMPLOYEE'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid', nullable: true },
            name: { type: 'string' },
            position: { type: 'string' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            gender: { type: 'string' },
            phoneNumber: { type: 'string' },
            role: { $ref: '#/components/schemas/Role' },
            status: { type: 'string', example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserCreate: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            outletId: { type: 'string', format: 'uuid', nullable: true },
            name: { type: 'string' },
            position: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
            address: { type: 'string' },
            gender: { type: 'string', example: 'male' },
            phoneNumber: { type: 'string' },
            role: { $ref: '#/components/schemas/Role' },
            status: { type: 'string', example: 'active' },
          },
        },
        Outlet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            img: { type: 'string', nullable: true },
            color: { type: 'string', example: '#FE770A', nullable: true },
            outletType: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string', nullable: true },
            number: { type: 'string', nullable: true },
            province: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            postalCode: { type: 'string', nullable: true },
            wifiName: { type: 'string', nullable: true },
            wifiPassword: { type: 'string', nullable: true },
            status: { type: 'string', example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OutletCreate: {
          type: 'object',
          required: ['name', 'outletType'],
          properties: {
            img: { type: 'string' },
            color: { type: 'string', example: '#FE770A' },
            outletType: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            number: { type: 'string' },
            province: { type: 'string' },
            city: { type: 'string' },
            postalCode: { type: 'string' },
            wifiName: { type: 'string' },
            wifiPassword: { type: 'string' },
            status: { type: 'string', example: 'active' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid', nullable: true },
            name: { type: 'string' },
            icon: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CategoryCreate: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            icon: { type: 'string' },
          },
        },
        Menu: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid', nullable: true },
            name: { type: 'string' },
            desc: { type: 'string' },
            img: { type: 'string', nullable: true },
            price: { type: 'number', format: 'float', example: 25000 },
            pdf: { type: 'string', nullable: true },
            categoryId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MenuCreate: {
          type: 'object',
          required: ['name', 'price', 'categoryId'],
          properties: {
            outletId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            desc: { type: 'string' },
            img: { type: 'string' },
            price: { type: 'number', format: 'float', example: 25000 },
            pdf: { type: 'string' },
            categoryId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean', default: true },
          },
        },
        Option: {
          type: 'object',
          properties: {
            menuId: { type: 'string', format: 'uuid' },
            data: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
              description: 'Arbitrary option/add-on definition list.',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OptionUpsert: {
          type: 'object',
          required: ['menuId', 'data'],
          properties: {
            menuId: { type: 'string', format: 'uuid' },
            data: { type: 'array', items: { type: 'object', additionalProperties: true } },
          },
        },
        MenuIngredient: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            menuId: { type: 'string', format: 'uuid' },
            ingredientId: { type: 'string', format: 'uuid' },
            quantity: { type: 'number', format: 'float' },
            unit: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MenuIngredientUpsert: {
          type: 'object',
          required: ['menuId', 'ingredients'],
          properties: {
            menuId: { type: 'string', format: 'uuid' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                required: ['ingredientId', 'quantity', 'unit'],
                properties: {
                  ingredientId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'number', format: 'float' },
                  unit: { type: 'string' },
                },
              },
            },
          },
        },
        BestSellerMenu: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            menuId: { type: 'string', format: 'uuid' },
            order: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        BestSellerMenuCreate: {
          type: 'object',
          required: ['menuId'],
          properties: {
            menuId: { type: 'string', format: 'uuid' },
            order: { type: 'integer' },
          },
        },
        SubTransaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            transactionId: { type: 'string', format: 'uuid' },
            menuId: { type: 'string', format: 'uuid' },
            menuName: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number', format: 'float' },
            subTotal: { type: 'number', format: 'float' },
            addOn: { type: 'string' },
            addOnPrice: { type: 'number', format: 'float' },
            discount: { type: 'number', format: 'float' },
            note: { type: 'string' },
            status: { type: 'string', example: 'preparation' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid', nullable: true },
            outletId: { type: 'string', format: 'uuid', nullable: true },
            number: { type: 'string' },
            transactionType: { type: 'string', example: 'dine-in' },
            tableId: { type: 'string', format: 'uuid', nullable: true },
            paymentNumber: { type: 'string' },
            paymentMethod: { type: 'string', example: 'cash' },
            customerName: { type: 'string', nullable: true },
            totalSubTransaction: { type: 'integer' },
            subTotal: { type: 'number', format: 'float' },
            discount: { type: 'number', format: 'float' },
            tax: { type: 'number', format: 'float' },
            serviceCharge: { type: 'number', format: 'float' },
            rounding: { type: 'number', format: 'float' },
            total: { type: 'number', format: 'float' },
            additionalNote: { type: 'string', nullable: true },
            voucherId: { type: 'string', format: 'uuid', nullable: true },
            status: { type: 'string', example: 'pending' },
            fraudStatus: { type: 'string', example: 'pending' },
            cashBookId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            subTransactions: {
              type: 'array',
              items: { $ref: '#/components/schemas/SubTransaction' },
            },
          },
        },
        TransactionCreate: {
          type: 'object',
          required: ['transactionType', 'paymentMethod', 'subTransactions'],
          properties: {
            outletId: { type: 'string', format: 'uuid' },
            transactionType: { type: 'string', example: 'dine-in' },
            tableId: { type: 'string', format: 'uuid', nullable: true },
            paymentMethod: { type: 'string', example: 'cash' },
            customerName: { type: 'string' },
            additionalNote: { type: 'string' },
            voucherId: { type: 'string', format: 'uuid', nullable: true },
            subTransactions: {
              type: 'array',
              items: {
                type: 'object',
                required: ['menuId', 'quantity'],
                properties: {
                  menuId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer' },
                  addOn: { type: 'string' },
                  addOnPrice: { type: 'number' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        Inventory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            unit: { type: 'string' },
            currentStock: { type: 'number', format: 'float' },
            minimumStock: { type: 'number', format: 'float' },
            status: { type: 'string', enum: ['SAFE', 'LOW', 'OUT'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        InventoryCreate: {
          type: 'object',
          required: ['name', 'unit', 'currentStock', 'minimumStock'],
          properties: {
            outletId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            unit: { type: 'string' },
            currentStock: { type: 'number', format: 'float' },
            minimumStock: { type: 'number', format: 'float' },
          },
        },
        StockActivity: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ingredientId: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['ADD', 'REDUCE', 'ADJUST'] },
            quantity: { type: 'number', format: 'float' },
            note: { type: 'string', nullable: true },
            createdBy: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        StockActivityCreate: {
          type: 'object',
          required: ['inventoryId', 'type', 'quantity'],
          properties: {
            inventoryId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['ADD', 'REDUCE', 'ADJUST'] },
            quantity: { type: 'number', format: 'float' },
            notes: { type: 'string' },
          },
        },
        Discount: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            type: { type: 'string', example: 'percent' },
            discount: { type: 'number', format: 'float' },
            usage: { type: 'number' },
            maxUsage: { type: 'number' },
            allMenu: { type: 'boolean' },
            expiredAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        DiscountCreate: {
          type: 'object',
          required: ['name', 'type', 'discount'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['percent', 'nominal'], example: 'percent' },
            discount: { type: 'number', format: 'float' },
            maxUsage: { type: 'number' },
            allMenu: { type: 'boolean' },
            expiredAt: { type: 'string', format: 'date-time' },
          },
        },
        DiscountMenuCreate: {
          type: 'object',
          required: ['discountId', 'menuIds'],
          properties: {
            discountId: { type: 'string', format: 'uuid' },
            menuIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          },
        },
        Voucher: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid', nullable: true },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            type: { type: 'string', example: 'percent' },
            discount: { type: 'number', format: 'float' },
            usage: { type: 'number' },
            maxUsage: { type: 'number' },
            allMenu: { type: 'boolean' },
            expiredAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        VoucherCreate: {
          type: 'object',
          required: ['name', 'type', 'discount'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['percent', 'nominal'], example: 'percent' },
            discount: { type: 'number', format: 'float' },
            maxUsage: { type: 'number' },
            allMenu: { type: 'boolean' },
            expiredAt: { type: 'string', format: 'date-time' },
          },
        },
        VoucherMenuCreate: {
          type: 'object',
          required: ['voucherId', 'menuIds'],
          properties: {
            voucherId: { type: 'string', format: 'uuid' },
            menuIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          },
        },
        Table: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            status: { type: 'string', example: 'available' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TableCreate: {
          type: 'object',
          required: ['name', 'status'],
          properties: {
            outletId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            status: { type: 'string', example: 'available' },
          },
        },
        CashBalance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', format: 'float' },
            status: { type: 'string', example: 'active' },
            userId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LogCashBalance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cashBalanceId: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid', nullable: true },
            type: { type: 'string', example: 'in' },
            amount: { type: 'number', format: 'float' },
            previousAmount: { type: 'number', format: 'float', nullable: true },
            description: { type: 'string', nullable: true },
            cancelNote: { type: 'string', nullable: true },
            status: { type: 'string', example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LogCashBalanceCreate: {
          type: 'object',
          required: ['type', 'amount'],
          properties: {
            type: { type: 'string', example: 'in' },
            amount: { type: 'number', format: 'float' },
            description: { type: 'string' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid', nullable: true },
            message: { type: 'string' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MessageCreate: {
          type: 'object',
          required: ['message', 'rating'],
          properties: {
            outletId: { type: 'string', format: 'uuid' },
            message: { type: 'string' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
          },
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            outletId: { type: 'string', format: 'uuid' },
            fileName: { type: 'string' },
            fileUrl: { type: 'string' },
            note: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Validation error / bad request',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        Unauthorized: {
          description: 'Missing or invalid authentication',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        Forbidden: {
          description: 'Insufficient role/permission',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, `../modules/**/routes/*${ext}`),
    path.join(__dirname, `../app${ext}`),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
