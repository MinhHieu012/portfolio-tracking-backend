# API Design Rules — GraphQL (Code-First)

## TL;DR

Dự án sử dụng **GraphQL Code-First** với NestJS. Nghĩa là TypeScript class định nghĩa cả schema GraphQL lẫn TypeORM entity. Mọi schema được generate tự động từ decorators. Đây là single source of truth — **KHÔNG** viết schema SDL (`.graphql` file) thủ công.

**Key takeaway:** Dùng `@ObjectType()`, `@InputType()`, `@Field()` của `@nestjs/graphql` trên class TypeScript. Đừng viết file `.graphql` riêng biệt.

---

## 1. Schema Design Principles (Nguyên tắc thiết kế Schema)

### Naming Conventions
- **Object Types / Query / Mutation names:** `PascalCase` (ví dụ: `Portfolio`, `CreatePortfolio`).
- **Field names:** `camelCase` (ví dụ: `totalValue`, `createdAt`).
- **Input Types:** Tên kết thúc bằng `Input` (ví dụ: `CreatePortfolioInput`, `UpdateAssetInput`).
- **Response object kèm pagination:** Tên kết thúc bằng `Connection` hoặc `Page` (ví dụ: `TransactionsPage`).

### Object Types — Entity kép (TypeORM + GraphQL)
Ưu tiên khai báo Entity kết hợp cả hai decorator để tránh code trùng lặp:

```typescript
// portfolio.entity.ts
@ObjectType()   // GraphQL Object Type
@Entity()       // TypeORM Entity
export class Portfolio {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => Float)
  @Column('decimal', { precision: 18, scale: 8 })
  totalValue: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  // Relation không expose ra GraphQL nếu không cần
  @ManyToOne(() => User, (user) => user.portfolios)
  user: User;

  @Field(() => String)
  @Column()
  userId: string;
}
```

### Input Types — Tách biệt hoàn toàn với Entity
Input types phải là class riêng biệt trong `dto/`, **KHÔNG** tái sử dụng Entity class làm Input:

```typescript
// create-portfolio.input.ts
@InputType()
export class CreatePortfolioInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
```

---

## 2. Query & Mutation Design

### Queries (Lấy dữ liệu)
- **Lấy một item:** Tên query là `[entity]` (ví dụ: `portfolio(id: ID!): Portfolio`).
- **Lấy danh sách:** Tên query là `[entities]` (ví dụ: `portfolios: [Portfolio!]!`).
- **Luôn phân trang (Pagination)** cho danh sách có thể lớn (transactions, market data).

```typescript
@Query(() => [Portfolio])
@UseGuards(JwtAuthGuard)
async portfolios(@CurrentUser() user: User): Promise<Portfolio[]> {
  return this.portfoliosService.findAllByUser(user.id);
}

@Query(() => Portfolio, { nullable: true })
@UseGuards(JwtAuthGuard)
async portfolio(
  @Args('id', { type: () => ID }) id: string,
  @CurrentUser() user: User,
): Promise<Portfolio | null> {
  return this.portfoliosService.findOne(id, user.id);
}
```

### Mutations (Thay đổi dữ liệu)
- **Tên mutation:** `create[Entity]`, `update[Entity]`, `delete[Entity]` (ví dụ: `createPortfolio`).
- Input luôn được truyền qua một `@Args('input')` duy nhất, kiểu là `*Input`.
- Mutation xóa trả về `Boolean` hoặc entity bị xóa (nhất quán trong toàn project).

```typescript
@Mutation(() => Portfolio)
@UseGuards(JwtAuthGuard)
async createPortfolio(
  @Args('input') input: CreatePortfolioInput,
  @CurrentUser() user: User,
): Promise<Portfolio> {
  return this.portfoliosService.create(input, user.id);
}

@Mutation(() => Boolean)
@UseGuards(JwtAuthGuard)
async deletePortfolio(
  @Args('id', { type: () => ID }) id: string,
  @CurrentUser() user: User,
): Promise<boolean> {
  return this.portfoliosService.remove(id, user.id);
}
```

---

## 3. Authentication & Authorization

### Public vs Protected
- **Mặc định:** Mọi Query/Mutation đều yêu cầu xác thực. Phải có `@UseGuards(JwtAuthGuard)`.
- **Public endpoints:** Khai báo bằng decorator `@Public()` (custom decorator) kết hợp metadata.
  ```typescript
  @Public()
  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> { ... }
  ```

### Current User
- Luôn tạo custom decorator `@CurrentUser()` để lấy thông tin user từ GraphQL context:
  ```typescript
  // src/common/decorators/current-user.decorator.ts
  export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): User => {
      const context = GqlExecutionContext.create(ctx);
      return context.getContext().req.user;
    },
  );
  ```
- **KHÔNG** access `req.user` trực tiếp bên trong Resolver — luôn dùng `@CurrentUser()`.

---

## 4. Error Handling & Response Format

### GraphQL Errors
- Dùng các NestJS built-in exception (NotFoundException, ForbiddenException, ...) — chúng tự động map sang GraphQL errors.
- Phải có `GraphqlExceptionFilter` custom để chuẩn hóa error format:
  ```json
  {
    "errors": [{
      "message": "Portfolio not found",
      "extensions": {
        "code": "NOT_FOUND",
        "statusCode": 404
      }
    }]
  }
  ```

### Không trả về `null` khi có thể throw exception
- ❌ Sai: `return null` khi không tìm thấy resource.
- ✅ Đúng: `throw new NotFoundException(...)` — rõ ràng và có thể debug được.
- Ngoại lệ: Các query dạng "optional lookup" — khai báo `nullable: true` và trả về `null` khi không tìm thấy.

---

## 5. Pagination (Phân trang)

Dùng **Cursor-based pagination** (offset pagination chỉ cho các màn hình đơn giản):

```typescript
@InputType()
export class PaginationArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cursor?: string;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

@ObjectType()
export class TransactionsPage {
  @Field(() => [Transaction])
  items: Transaction[];

  @Field({ nullable: true })
  nextCursor?: string;

  @Field(() => Boolean)
  hasNextPage: boolean;
}
```

---

## 6. Custom Scalars

Khai báo custom scalars tại `src/common/scalars/` cho các kiểu dữ liệu đặc biệt:
- **`DateTime`:** Cho tất cả các trường ngày giờ (ISO 8601 string ↔ JavaScript Date).
- **`Decimal`:** Cho giá tài sản, số lượng coin — đảm bảo precision cao (dùng string representation).
- **`JSON`:** Cho metadata hoặc data có cấu trúc động.

Đăng ký scalars trong module tương ứng và khai báo trong `GraphQLModule.forRoot()`.
