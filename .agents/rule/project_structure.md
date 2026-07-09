# NestJS Backend Folder Structure

## TL;DR

Dự án này sử dụng mô hình **Module-Based Feature Architecture (Kiến trúc hướng Module-Tính năng)** kết hợp với các nguyên tắc của **Clean Architecture**. NestJS đã có sẵn Module System, ta sẽ tận dụng nó để tổ chức code theo **Tính năng (Feature)** một cách rõ ràng. Điều này giúp backend dễ scale, tách biệt trách nhiệm và dễ test.

Thư mục `src/` là nơi chứa toàn bộ source code. Cấu trúc được chia theo **tầng (layers)** ở cấp cao nhất, và theo **tính năng (features)** ở cấp bên trong.

---

## Cấu trúc thư mục tiêu chuẩn (Có thể có thêm/bớt các modules trong quá trình phát triển)

```text
portfolio-tracking-backend/
│
├── src/
│   │
│   ├── main.ts                    # Bootstrap app (global pipe, cors, prefix, swagger)
│   ├── app.module.ts              # Root module: import tất cả feature modules
│   │
│   ├── config/                    # 1. Cấu hình toàn cục
│   │   ├── config.module.ts       # ConfigModule setup (load .env, validate)
│   │   └── env.validation.ts      # Joi/Zod schema để validate biến môi trường
│   │
│   ├── database/                  # 2. Cơ sở hạ tầng Database
│   │   ├── database.module.ts     # TypeOrmModule.forRootAsync() setup
│   │   └── migrations/            # Database migration files
│   │
│   ├── common/                    # 3. Shared/Common (Dùng chung toàn app)
│   │   ├── decorators/            # Custom decorators (@CurrentUser, @Public, ...)
│   │   ├── filters/               # Exception filters (GraphQL error formatting)
│   │   ├── guards/                # Auth guards (JwtAuthGuard, RolesGuard)
│   │   ├── interceptors/          # Logging, transform response interceptors
│   │   ├── pipes/                 # Custom validation pipes
│   │   ├── scalars/               # Custom GraphQL scalars (DateTime, Decimal, ...)
│   │   └── utils/                 # Helper functions (formatCurrency, calcPnL, ...)
│   │
│   ├── integrations/              # 4. Third-party Integrations (API bên ngoài)
│   │   ├── coingecko/             # CoinGecko API client & service
│   │   │   ├── coingecko.module.ts
│   │   │   └── coingecko.service.ts
│   │   └── market-data/           # Abstraction layer cho price feeds
│   │       └── market-data.service.ts
│   │
│   └── modules/                   # 5. Feature Modules (Quan trọng nhất)
│       │
│       ├── auth/                  # Tính năng: Xác thực & Phân quyền
│       │   ├── auth.module.ts
│       │   ├── auth.resolver.ts   # GraphQL mutations: login, register, refreshToken
│       │   ├── auth.service.ts    # Business logic: validate, generate token
│       │   ├── strategies/        # Passport strategies (jwt.strategy.ts)
│       │   ├── dto/               # Input types cho GraphQL (LoginInput, RegisterInput)
│       │   └── entities/          # RefreshToken entity
│       │
│       ├── users/                 # Tính năng: Quản lý người dùng
│       │   ├── users.module.ts
│       │   ├── users.resolver.ts  # GraphQL: me, updateProfile
│       │   ├── users.service.ts
│       │   ├── dto/               # CreateUserInput, UpdateUserInput
│       │   └── entities/          # User entity (TypeORM)
│       │       └── user.entity.ts
│       │
│       ├── portfolios/            # Tính năng: Quản lý danh mục đầu tư
│       │   ├── portfolios.module.ts
│       │   ├── portfolios.resolver.ts
│       │   ├── portfolios.service.ts
│       │   ├── dto/
│       │   └── entities/
│       │       └── portfolio.entity.ts
│       │
│       ├── assets/                # Tính năng: Quản lý tài sản trong danh mục
│       │   ├── assets.module.ts
│       │   ├── assets.resolver.ts
│       │   ├── assets.service.ts
│       │   ├── dto/
│       │   └── entities/
│       │       └── asset.entity.ts
│       │
│       └── transactions/          # Tính năng: Lịch sử giao dịch mua/bán
│           ├── transactions.module.ts
│           ├── transactions.resolver.ts
│           ├── transactions.service.ts
│           ├── dto/
│           └── entities/
│               └── transaction.entity.ts
│
├── test/                          # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env                           # Local environment variables (KHÔNG commit lên Git)
├── .env.example                   # Template môi trường (PHẢI commit lên Git)
└── nest-cli.json
```

---

## Quy tắc thiết kế (Rules of Thumb)

### 1. Module là đơn vị cơ bản
- Mỗi tính năng là một NestJS Module riêng biệt.
- Module phải tự khép kín: import các dependencies cần thiết, export những gì các module khác cần.
- `AppModule` chỉ import các feature modules — **không** chứa business logic.

### 2. Phân tách trách nhiệm trong mỗi Module
Mỗi module tuân theo cấu trúc 3 lớp:
- **Resolver** (`*.resolver.ts`): Chỉ xử lý việc nhận GraphQL request và trả về response. **Không** chứa business logic.
- **Service** (`*.service.ts`): Chứa toàn bộ business logic. Gọi repository, tính toán, validate business rules.
- **Entity** (`entities/*.entity.ts`): Định nghĩa TypeORM entity (bảng database). Chỉ chứa schema, **không** chứa logic.

### 3. Quy tắc Dependency (phụ thuộc một chiều)
- `Resolver` → phụ thuộc vào `Service`.
- `Service` → phụ thuộc vào `Repository` (TypeORM) và các `Service` của module khác.
- `Entity` → không phụ thuộc vào bất cứ thứ gì trong `src/`.
- **TUYỆT ĐỐI KHÔNG** inject `Repository` trực tiếp vào `Resolver`.

### 4. DTO và Input Types
- Mọi GraphQL Input phải được định nghĩa là class riêng trong thư mục `dto/` với decorator `@InputType()`.
- Mọi field của DTO **phải** có decorator `class-validator` (ví dụ: `@IsString()`, `@IsEmail()`, `@Min(0)`).
- Tên file: `create-[entity].input.ts`, `update-[entity].input.ts`, `[entity].args.ts` (cho query args).

### 5. Common — Dùng chung thực sự
- Chỉ đặt vào `src/common/` những thứ được dùng ở **từ 2 module trở lên**.
- Không tạo "god service" ở `common/` — tách ra thành các helper functions thuần túy trong `common/utils/`.

### 6. Integrations — Cô lập phụ thuộc bên ngoài
- Toàn bộ giao tiếp với API bên thứ ba phải được bọc trong `src/integrations/`.
- Feature modules không bao giờ gọi `axios` hay `fetch` trực tiếp — luôn gọi thông qua integration service.
- Điều này giúp dễ dàng mock khi test và thay thế provider khi cần.
