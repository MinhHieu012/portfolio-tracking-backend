---
name: create_module
description: Scaffold một NestJS feature module đầy đủ theo chuẩn kiến trúc của project (module, resolver, service, entity, dto). Áp dụng khi người dùng yêu cầu tạo mới một tính năng hoặc thêm một module mới vào backend.
---

# Create NestJS Feature Module — Scaffold Workflow

Khi người dùng yêu cầu tạo mới một module (ví dụ: "tạo module portfolios", "thêm tính năng transactions"), hãy thực hiện các bước sau:

## 1. Xác nhận thông tin (Clarify)
Trước khi viết code, xác nhận ngắn gọn:
- Tên module (ví dụ: `portfolios`, `transactions`, `assets`).
- Các fields chính của Entity là gì?
- Module này có quan hệ (relation) với entity nào khác không?
- Các GraphQL operations cần thiết: queries nào? mutations nào?

*Nếu thông tin đã đủ trong yêu cầu, bỏ qua bước này và tiến hành ngay.*

## 2. Tạo cấu trúc thư mục
Tạo đầy đủ theo cấu trúc chuẩn tại `src/modules/[module-name]/`:

```
src/modules/[module-name]/
├── [module-name].module.ts
├── [module-name].resolver.ts
├── [module-name].service.ts
├── dto/
│   ├── create-[module-name].input.ts
│   ├── update-[module-name].input.ts
│   └── (pagination args nếu cần)
└── entities/
    └── [module-name].entity.ts
```

## 3. Thứ tự tạo file (Quan trọng — từ trong ra ngoài)

### Bước 3.1 — Entity (`entities/[entity].entity.ts`)
```typescript
@ObjectType()   // GraphQL
@Entity()       // TypeORM
export class [Entity] {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ... fields

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Bước 3.2 — DTOs (`dto/`)
```typescript
// create-[entity].input.ts
@InputType()
export class Create[Entity]Input {
  @Field()
  @IsString()
  @MinLength(1)
  name: string;
  // ... với class-validator decorators đầy đủ
}

// update-[entity].input.ts — dùng PartialType
@InputType()
export class Update[Entity]Input extends PartialType(Create[Entity]Input) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
```

### Bước 3.3 — Service (`[entity].service.ts`)
```typescript
@Injectable()
export class [Entity]Service {
  constructor(
    @InjectRepository([Entity])
    private readonly [entity]Repository: Repository<[Entity]>,
  ) {}

  async create(input: Create[Entity]Input, userId: string): Promise<[Entity]> { ... }
  async findAll(userId: string): Promise<[Entity][]> { ... }
  async findOne(id: string, userId: string): Promise<[Entity]> { ... }
  async update(input: Update[Entity]Input, userId: string): Promise<[Entity]> { ... }
  async remove(id: string, userId: string): Promise<boolean> { ... }
}
```

**Quy tắc trong Service:**
- Luôn filter theo `userId` để enforce ownership.
- Throw `NotFoundException` khi không tìm thấy resource.
- Throw `ForbiddenException` nếu user không có quyền.
- Dùng `decimal.js` cho mọi phép tính tài chính.

### Bước 3.4 — Resolver (`[entity].resolver.ts`)
```typescript
@Resolver(() => [Entity])
export class [Entity]Resolver {
  constructor(private readonly [entity]Service: [Entity]Service) {}

  @Mutation(() => [Entity])
  @UseGuards(JwtAuthGuard)
  async create[Entity](
    @Args('input') input: Create[Entity]Input,
    @CurrentUser() user: User,
  ): Promise<[Entity]> {
    return this.[entity]Service.create(input, user.id);
  }

  @Query(() => [[Entity]])
  @UseGuards(JwtAuthGuard)
  async [entities](@CurrentUser() user: User): Promise<[Entity][]> {
    return this.[entity]Service.findAll(user.id);
  }
  // ...
}
```

### Bước 3.5 — Module (`[entity].module.ts`)
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([[Entity]])],
  providers: [[Entity]Resolver, [Entity]Service],
  exports: [[Entity]Service],  // Export nếu module khác cần dùng
})
export class [Entity]Module {}
```

### Bước 3.6 — Đăng ký vào AppModule
Thêm `[Entity]Module` vào `imports` của `AppModule`.

## 4. Tự động kiểm tra (Self-Check)
Sau khi tạo đủ files:
```bash
npx tsc --noEmit
npm run lint
```

## 5. Báo cáo
Liệt kê tất cả files đã tạo và GraphQL operations mới:
- Queries: `[entities]`, `[entity](id: ID!)`
- Mutations: `create[Entity]`, `update[Entity]`, `delete[Entity]`
