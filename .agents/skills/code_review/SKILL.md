---
name: code_review_workflow
description: Chạy quy trình review code (code review) tự động cho backend NestJS/GraphQL. Nhằm kiểm tra lỗi, vi phạm kiến trúc, và đề xuất cải thiện chất lượng code.
---

# Code Review Workflow — Backend NestJS

Khi người dùng yêu cầu "review code", "kiểm tra code", hoặc "check architecture", hãy thực hiện các bước sau một cách hệ thống:

## 1. Phân tích thay đổi (Change Analysis)
- Xác định danh sách các tệp tin vừa được tạo hoặc sửa đổi.
- Đọc các tệp tin quan trọng nhất để lấy bối cảnh (entity, service, resolver, module).
- Xác định phạm vi của thay đổi: thêm tính năng mới, sửa bug, hay refactor?

## 2. Kiểm tra Architecture (Architecture Check)
Đối chiếu với `clean_architecture.md`:
- [ ] Resolver có chứa business logic không? (Vi phạm: fat resolver)
- [ ] Service có inject Repository không? (Đúng) — Service có gọi entity repository trực tiếp không thông qua TypeORM không?
- [ ] Resolver có inject Repository không? (Vi phạm: bỏ qua service layer)
- [ ] Module mới có được đăng ký trong `AppModule` không?
- [ ] Entity mới có được thêm vào `TypeOrmModule.forFeature([...])` không?
- [ ] Có circular module dependency nào không?

## 3. Kiểm tra API Design (GraphQL Quality Check)
Đối chiếu với `api_design.md`:
- [ ] Input types có nằm trong file `dto/` riêng và có `@InputType()` không?
- [ ] Mọi field của DTO có đầy đủ `class-validator` decorators không?
- [ ] Protected resolvers có `@UseGuards(JwtAuthGuard)` không?
- [ ] Có resolver nào trả về `null` thay vì throw `NotFoundException` không?
- [ ] Naming conventions có đúng không? (`camelCase` fields, `PascalCase` types, `*Input` suffix)?

## 4. Kiểm tra Security (Security Check)
Đối chiếu với `advanced_guidelines.md`:
- [ ] Service có kiểm tra **ownership** (userId match) khi truy cập resource không, hay chỉ kiểm tra tồn tại?
- [ ] `ValidationPipe` với `whitelist: true` có được áp dụng không?
- [ ] Có secret/credential nào bị hardcode trong code không?
- [ ] Các operations multi-bảng có dùng database transaction không?

## 5. Kiểm tra chất lượng mã (Code Quality)
- [ ] Có sử dụng `number` thuần cho tính toán tài chính không? (Vi phạm: phải dùng `decimal.js`)
- [ ] Có `console.log` trong code không? (Phải dùng NestJS `Logger`)
- [ ] Có N+1 query problem tiềm ẩn không? (ResolveField không dùng DataLoader)
- [ ] Import paths có dùng path alias không? (Khuyến khích `@/src/...`)
- [ ] Có code trùng lặp (duplication) nào có thể extract ra `common/utils/` không?

## 6. Kiểm tra TypeScript (Type Safety)
- Chạy `npx tsc --noEmit` từ terminal để phát hiện lỗi type.
- Kiểm tra xem có dùng `any` ở đâu không — đề xuất type cụ thể hơn nếu có.

## 7. Báo cáo (Report)
Trình bày một báo cáo có cấu trúc theo định dạng:

```markdown
## 🔍 Code Review Report

### ✅ Điểm tốt
- [Liệt kê những gì được làm đúng]

### 🚨 Lỗi nghiêm trọng (Phải sửa)
- [File: path] [Vấn đề] → [Giải pháp cụ thể]

### ⚠️ Cảnh báo (Nên sửa)
- [File: path] [Vấn đề] → [Gợi ý]

### 💡 Đề xuất cải thiện (Tùy chọn)
- [Cải thiện performance/maintainability]

### 📊 TypeScript Check
- [Kết quả `npx tsc --noEmit`]
```

Sau đó hỏi người dùng: "Bạn có muốn tôi tự động sửa các lỗi và cảnh báo trên không?"
