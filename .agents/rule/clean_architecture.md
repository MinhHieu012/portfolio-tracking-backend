# Clean Architecture — Backend NestJS

## TL;DR

**Clean Architecture trong NestJS được thể hiện qua hệ thống Module + Dependency Injection built-in của framework.** Nguyên tắc cốt lõi: Business logic (nằm trong `Service`) phải độc lập với các yếu tố bên ngoài như GraphQL layer (`Resolver`), Database schema (`Entity`), hoặc External APIs (`Integrations`).

**Key takeaway:** `Service` không được biết đến GraphQL. `Resolver` không được biết đến database. Mỗi lớp có một trách nhiệm duy nhất và chỉ giao tiếp với lớp liền kề thông qua interface/abstraction.

---

## Các tầng kiến trúc (Architecture Layers)

### 1. Presentation Layer — Resolver (`*.resolver.ts`)
- **Trách nhiệm duy nhất:** Nhận GraphQL request, ủy thác xử lý cho Service, trả về response.
- **Được phép làm:**
  - Khai báo `@Query()`, `@Mutation()`, `@ResolveField()`.
  - Inject và gọi `Service`.
  - Áp dụng `@UseGuards()`, `@Roles()`.
  - Đọc `@CurrentUser()` từ context.
- **KHÔNG được làm:**
  - Chứa business logic (tính toán, validate domain rules).
  - Gọi trực tiếp `Repository` hay `TypeORM`.
  - Gọi external API.
- **Ví dụ đúng:**
  ```typescript
  @Mutation(() => Portfolio)
  @UseGuards(JwtAuthGuard)
  async createPortfolio(
    @Args('input') input: CreatePortfolioInput,
    @CurrentUser() user: User,
  ): Promise<Portfolio> {
    // Chỉ ủy thác, không tự xử lý
    return this.portfoliosService.create(input, user.id);
  }
  ```

### 2. Application/Business Logic Layer — Service (`*.service.ts`)
- **Trách nhiệm duy nhất:** Chứa toàn bộ business logic, điều phối (orchestrate) các operations.
- **Được phép làm:**
  - Inject `Repository` (TypeORM) để CRUD dữ liệu.
  - Inject các Service khác để phối hợp nghiệp vụ.
  - Inject Integration Services để lấy dữ liệu bên ngoài.
  - Throw `NotFoundException`, `ForbiddenException`, `BadRequestException` khi cần.
  - Tính toán PnL, format dữ liệu, validate business rules.
- **KHÔNG được làm:**
  - Biết đến GraphQL schema (không import decorator GraphQL).
  - Return raw database entity nếu cần transform — map ra DTO/object trước.

### 3. Data Layer — Entity (`entities/*.entity.ts`)
- **Trách nhiệm duy nhất:** Định nghĩa cấu trúc bảng database (TypeORM schema).
- **Được phép làm:**
  - Dùng TypeORM decorators: `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn()`, `@OneToMany()`, `@ManyToOne()`, `@CreateDateColumn()`, `@UpdateDateColumn()`.
  - Dùng GraphQL Object Type decorator: `@ObjectType()`, `@Field()`.
- **KHÔNG được làm:**
  - Chứa business logic hay tính toán.
  - Inject service hay repository khác.
  - Gọi bất kỳ external dependency nào.

### 4. Infrastructure Layer — Integrations (`src/integrations/`)
- **Trách nhiệm duy nhất:** Giao tiếp với external services (third-party APIs).
- Mỗi integration là một NestJS Module + Service riêng.
- Chuẩn hóa dữ liệu trả về từ bên ngoài về interface nội bộ trước khi trả cho feature service.

---

## The Dependency Rule (Quy tắc Phụ thuộc)

```
Resolver → Service → Repository (TypeORM)
                  → Integration Service
```

- **Chiều mũi tên = chiều phụ thuộc.**
- `Resolver` phụ thuộc vào `Service`. `Service` KHÔNG được phụ thuộc vào `Resolver`.
- `Service` phụ thuộc vào `Repository`. `Repository/Entity` KHÔNG được phụ thuộc vào `Service`.

---

## Quy tắc xử lý lỗi (Error Handling)

### Trong Service — throw NestJS exceptions:
```typescript
// Đúng: Dùng NestJS built-in exceptions
if (!portfolio) {
  throw new NotFoundException(`Portfolio with id ${id} not found`);
}
if (portfolio.userId !== currentUserId) {
  throw new ForbiddenException('You do not own this portfolio');
}
```

### Trong Resolver — KHÔNG bắt lỗi thủ công:
- Resolver **không** cần try/catch cho NestJS exceptions — chúng tự động được format bởi `GraphQL Exception Filter`.
- Chỉ dùng try/catch ở Resolver khi cần xử lý cleanup hoặc logging đặc biệt.

### Global Exception Filter:
- Phải có một `GraphqlExceptionFilter` tại `src/common/filters/` để chuẩn hóa tất cả lỗi GraphQL về một format thống nhất trước khi gửi về client.

---

## Sử dụng Dependency Injection (DI) đúng cách

### ✅ Đúng — Inject qua constructor:
```typescript
@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly marketDataService: MarketDataService,
  ) {}
}
```

### ❌ Sai — Không dùng DI, tự tạo instance:
```typescript
// KHÔNG BAO GIỜ làm thế này
const service = new MarketDataService(); // Phá vỡ DI container
```

---

## Module Registration

Mọi feature module **phải** được import vào `AppModule`. Đây là quy tắc cứng:

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    PortfoliosModule,
    AssetsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
```

---

## Các sai lầm thường gặp (Common Pitfalls)

### ❌ Fat Resolver (Resolver quá phình to)
- **Vấn đề:** Nhồi business logic vào Resolver.
- **Giải pháp:** Chuyển toàn bộ logic vào Service.

### ❌ Repository trực tiếp trong Resolver
- **Vấn đề:** `@InjectRepository()` trong Resolver.
- **Giải pháp:** Luôn đi qua Service, Resolver không inject Repository.

### ❌ Circular Module Dependencies
- **Vấn đề:** Module A import Module B, Module B import Module A.
- **Giải pháp:** Dùng `forwardRef()` hoặc tách logic chung ra `CommonModule`.

### ❌ Không dùng Transaction khi cần
- **Vấn đề:** Nhiều database operations riêng lẻ — nếu một ops fail, data sẽ inconsistent.
- **Giải pháp:** Bọc multi-step database operations trong TypeORM `dataSource.transaction()`.
- **Ví dụ khi cần transaction:** Tạo Transaction đồng thời cập nhật Asset holdings.
