# Technology Stack & Standards — Backend

## 1. Mục tiêu dự án (Project Scope)
- **Tên/Loại ứng dụng:** Portfolio Tracking Backend (API server cho ứng dụng quản lý & theo dõi danh mục đầu tư).
- **Mục tiêu:** Cung cấp một GraphQL API ổn định, bảo mật, có khả năng mở rộng cao để phục vụ mobile app. Phải xử lý được dữ liệu tài chính (giá coin, cổ phiếu, lịch sử giao dịch) với độ chính xác cao.

## 2. Core Technologies (Công nghệ lõi)
- **Framework chính:** **NestJS** (v11+) — Framework Node.js được chọn vì có Dependency Injection built-in, Module System rõ ràng, và tích hợp GraphQL xuất sắc.
- **Ngôn ngữ:** **TypeScript** (Bắt buộc dùng Type/Interface rõ ràng, hạn chế tối đa dùng `any`).
- **API Layer:** **GraphQL** (Code-First approach với `@nestjs/graphql` + Apollo Server). **KHÔNG** dùng REST trừ khi có yêu cầu cụ thể (ví dụ: webhook nhận dữ liệu từ bên thứ ba).
- **Runtime:** **Node.js** (LTS).

## 3. Database & ORM
- **Database:** **PostgreSQL** (Ưu tiên cho dữ liệu tài chính do tính toàn vẹn dữ liệu và hỗ trợ ACID transaction).
- **ORM:** **TypeORM** (Tích hợp tốt nhất với NestJS, hỗ trợ Migration, Relation, Transaction). Import qua `@nestjs/typeorm`.
- **Cấu hình:** Toàn bộ cấu hình database phải đặt tại `src/database/` và không bao giờ hardcode credentials (luôn dùng `.env` qua `@nestjs/config`).

## 4. Authentication & Security
- **Auth:** **JWT (JSON Web Token)** với `@nestjs/jwt` và `@nestjs/passport`.
  - Access Token: Thời hạn ngắn (15 phút).
  - Refresh Token: Thời hạn dài (7 ngày), lưu trữ có hash trong database.
- **Guard:** Mọi resolver/route nhạy cảm phải được bảo vệ bởi `JwtAuthGuard`.
- **Rate Limiting:** Dùng `@nestjs/throttler` để chống brute-force và abuse.
- **Validation:** Dùng `class-validator` + `class-transformer` với `ValidationPipe` global để validate toàn bộ DTO input.

## 5. Configuration & Environment
- **Cấu hình:** `@nestjs/config` với file `.env`. **TUYỆT ĐỐI KHÔNG** hardcode bất kỳ secret, URL hay credential nào trong code.
- **Validation Schema:** Phải validate các biến môi trường quan trọng khi app khởi động bằng `Joi` hoặc `zod`.
- **Ví dụ các biến bắt buộc:** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `NODE_ENV`.

## 6. External Data Sources (Nguồn dữ liệu bên ngoài)
- **Giá Crypto:** Ưu tiên CoinGecko API hoặc CoinMarketCap API.
- **Giá Cổ phiếu:** Alpha Vantage hoặc Polygon.io.
- **HTTP Client cho External API:** Dùng **Axios** (qua `@nestjs/axios` — `HttpModule`) để gọi các API bên thứ ba. Bọc trong các service riêng biệt tại `src/integrations/`.

## 7. Coding Standards riêng
- **Decimal Precision (Độ chính xác số thập phân):** Khi lưu và tính toán giá tài sản, PHẢI dùng **`decimal.js`** hoặc **`big.js`** thay vì `number` thuần của JavaScript để tránh lỗi floating-point. Ví dụ: `0.1 + 0.2 !== 0.3`.
- **Naming Conventions:**
  - File: `kebab-case` (ví dụ: `portfolio.resolver.ts`, `create-asset.input.ts`).
  - Class/Type/Interface: `PascalCase` (ví dụ: `PortfolioService`, `CreateAssetInput`).
  - Variable/Function: `camelCase`.
  - GraphQL Schema: Field names dùng `camelCase`.
  - Database Column: Dùng `snake_case` (config trong TypeORM `namingStrategy`).
