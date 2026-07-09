# Advanced Guidelines — Performance, Security & Testing

Tài liệu này định nghĩa các tiêu chuẩn nâng cao bắt buộc phải tuân thủ khi phát triển Portfolio Tracking Backend, nhằm đảm bảo API đạt tiêu chuẩn production: hiệu năng cao, bảo mật tốt, và độ chính xác tuyệt đối với dữ liệu tài chính.

---

## 1. Performance Rules (Tối ưu Hiệu năng)

### N+1 Query Problem — Vấn đề hàng đầu với GraphQL
- **Vấn đề:** Khi resolve một danh sách (ví dụ: 20 portfolios), mỗi portfolio lại gọi thêm 1 query để load user → 20+1 queries.
- **Giải pháp BẮT BUỘC:** Dùng **DataLoader** (`@nestjs/dataloader` hoặc `dataloader` package) cho mọi `@ResolveField()` quan hệ.
  ```typescript
  // users.loader.ts
  @Injectable()
  export class UsersLoader {
    constructor(private readonly usersService: UsersService) {}
    
    createLoader(): DataLoader<string, User> {
      return new DataLoader<string, User>(async (ids: readonly string[]) => {
        const users = await this.usersService.findByIds([...ids]);
        return ids.map(id => users.find(u => u.id === id));
      });
    }
  }
  ```

### Caching (Bộ đệm)
- **Price Data:** Giá tài sản từ external APIs (CoinGecko, ...) PHẢI được cache để tránh bị rate limit và giảm latency.
  - Dùng **Redis** qua `@nestjs/cache-manager` với `cache-manager-redis-store`.
  - TTL cho price data: 60 giây (cân bằng giữa freshness và performance).
- **User-specific data:** Không cache dữ liệu user (portfolio, transactions) tại server — dữ liệu nhạy cảm và thay đổi thường xuyên.

### Database Queries
- Luôn `select` chỉ những columns thực sự cần, tránh `SELECT *` (đặc biệt quan trọng với TypeORM).
- Dùng **Index** (TypeORM `@Index()`) cho các column thường xuyên dùng trong WHERE clause: `userId`, `portfolioId`, `symbol`, `createdAt`.
- Cho các query phức tạp (aggregate, join nhiều bảng), xem xét dùng **QueryBuilder** thay vì relations loading.

---

## 2. Security Rules (Bảo mật)

### Authentication
- **JWT Access Token:** Hạn ngắn (15 phút). Không lưu thông tin nhạy cảm trong payload (chỉ `userId`, `email`, `iat`, `exp`).
- **JWT Refresh Token:** Hạn dài (7 ngày). PHẢI hash bằng `bcrypt` trước khi lưu vào database. Hỗ trợ **rotation** (mỗi lần refresh là issue token mới, invalidate token cũ).
- **Token Blacklisting:** Khi user logout, refresh token phải bị xóa khỏi database ngay lập tức.

### Input Validation — LUÔN BẮT BUỘC
- `ValidationPipe` phải được đặt global trong `main.ts`:
  ```typescript
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // Tự động strip các field không khai báo trong DTO
    forbidNonWhitelisted: true, // Throw error nếu có field lạ
    transform: true,       // Tự động transform type (string → number)
  }));
  ```
- `whitelist: true` là cực kỳ quan trọng — nó bảo vệ chống Mass Assignment Attacks.

### Authorization — Kiểm tra ownership
- **KHÔNG** chỉ kiểm tra "user đã đăng nhập" (Authentication). Phải kiểm tra "user có quyền với resource này không" (Authorization).
  ```typescript
  // ❌ Sai — chỉ check auth, không check ownership
  const portfolio = await this.portfolioRepository.findOne({ where: { id } });
  
  // ✅ Đúng — luôn filter theo userId
  const portfolio = await this.portfolioRepository.findOne({
    where: { id, userId: currentUserId },
  });
  if (!portfolio) throw new NotFoundException();
  ```

### Rate Limiting
- Áp dụng **`@nestjs/throttler`** toàn bộ app.
- Giới hạn cứng hơn cho Auth mutations (login, register): Ví dụ 5 requests / phút.
- Config trong `AppModule`:
  ```typescript
  ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
  ```

### Environment Variables
- `JWT_SECRET` và `JWT_REFRESH_SECRET` phải là string ngẫu nhiên, độ dài tối thiểu 32 characters.
- **TUYỆT ĐỐI KHÔNG** commit file `.env` lên Git. File `.env.example` phải luôn được cập nhật.

---

## 3. Data Integrity — Tính toàn vẹn dữ liệu tài chính

### Floating-point TUYỆT ĐỐI KHÔNG dùng `number` cho tiền tệ
- **Lý do:** `0.1 + 0.2 = 0.30000000000000004` trong JavaScript. Với dữ liệu tài chính, sai số này là không chấp nhận được.
- **Quy tắc BẮT BUỘC:** Dùng `decimal.js` hoặc `big.js` cho mọi phép tính liên quan đến:
  - Giá tài sản (price).
  - Số lượng (quantity / amount).
  - Lãi/Lỗ (PnL — Profit and Loss).
  - Phân bổ danh mục (allocation %).
- **Lưu trong Database:** Dùng TypeORM `decimal` type với `precision: 18, scale: 8`.
- **Truyền qua GraphQL:** Dùng custom scalar `Decimal` (string-based) thay vì `Float`.

### Database Transactions
- Mọi operation nào chạm vào 2+ bảng và có thể dẫn đến inconsistent state **phải** được bọc trong `dataSource.transaction()`:
  ```typescript
  await this.dataSource.transaction(async (manager) => {
    await manager.save(Transaction, newTransaction);
    await manager.update(Asset, { id: assetId }, { quantity: newQuantity, avgCost: newAvgCost });
  });
  ```

---

## 4. Testing Rules (Quy tắc kiểm thử)

### Unit Tests — Service Layer là trọng tâm
- Mọi `Service` phải có file `*.spec.ts` đi kèm.
- Mock các dependencies (Repository, external Service) bằng `jest.fn()` hoặc `@nestjs/testing` `createMockProvider`.
- **Coverage BẮT BUỘC 100%** cho các hàm tính toán tài chính:
  - Tính PnL (lãi/lỗ): `calculatePnL()`.
  - Tính giá vốn bình quân: `calculateAvgCost()`.
  - Tính tỷ lệ phân bổ: `calculateAllocation()`.
  - Format số tiền: `formatCurrency()`.
- Phải test các edge cases: chia cho 0, đầu vào null/undefined, số âm, số cực lớn.

### Integration Tests — Module-level
- Mỗi module nên có ít nhất 1 integration test kiểm tra luồng Resolver → Service → (Mock) Repository.
- Dùng `@nestjs/testing` `Test.createTestingModule()`.

### E2E Tests — Critical paths
- Bắt buộc có E2E test cho các luồng quan trọng nhất:
  1. Đăng ký → Đăng nhập → Refresh Token → Logout.
  2. Tạo Portfolio → Thêm Asset → Ghi Transaction → Xem PnL.
- E2E tests phải chạy trên **test database riêng** (không bao giờ chạy trên production hay dev database).
- Cấu hình trong `.env.test` và chạy bằng `npm run test:e2e`.

### Testing Commands
```bash
# Unit tests (chạy thường xuyên khi dev)
npm run test

# Unit tests với coverage report
npm run test:cov

# E2E tests (chạy trước khi merge/deploy)
npm run test:e2e

# Type checking (chạy sau mỗi lần thêm/sửa code lớn)
npx tsc --noEmit
```

---

## 5. Logging & Observability

- **Logger:** Dùng NestJS built-in `Logger` class. **KHÔNG** dùng `console.log` trong production code.
  ```typescript
  private readonly logger = new Logger(PortfoliosService.name);
  
  this.logger.log(`Creating portfolio for user ${userId}`);
  this.logger.error(`Failed to fetch price for ${symbol}`, error.stack);
  ```
- **Log levels theo môi trường:**
  - `development`: `verbose` (tất cả log).
  - `production`: `warn` và `error` (giảm noise).
- **Sensitive data:** TUYỆT ĐỐI KHÔNG log passwords, JWT tokens, hoặc thông tin tài chính nhạy cảm của user.
