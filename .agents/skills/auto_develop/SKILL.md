---
name: auto_develop
description: Luồng phát triển tự động từ A-Z cho backend NestJS. Áp dụng khi người dùng muốn AI tự viết code, tự chạy lệnh kiểm tra lỗi (tsc, lint), tự sửa bug và chỉ báo cáo khi đã hoàn thành.
---

# Luồng phát triển tự động — Backend (Auto Develop Workflow)

Khi được yêu cầu phát triển một tính năng backend theo quy trình tự động, bạn (AI Agent) ĐƯỢC ỦY QUYỀN thao tác toàn bộ chu trình. Bạn không được dừng lại để hỏi các câu lặt vặt. Người dùng chỉ muốn kiểm tra kết quả cuối cùng.

Hãy thực thi liên tục các bước sau:

## 1. Đọc và Hiểu Context (Research Phase)
- Đọc `clean_architecture.md` và `project_structure.md` để nắm cấu trúc module cần tạo/sửa.
- Đọc `api_design.md` nếu tính năng liên quan đến GraphQL schema/resolver.
- Đọc `tech_stack.md` nếu cần xác nhận library nào được phép dùng.
- Xác định các file hiện tại cần đọc để tránh xung đột (ví dụ: `app.module.ts`, entity liên quan).

## 2. Viết Code (Implementation)
- Tuân thủ **nghiêm ngặt** cấu trúc module: `*.module.ts` → `*.resolver.ts` → `*.service.ts` → `entities/` → `dto/`.
- Áp dụng các quy tắc từ `clean_architecture.md`:
  - Resolver: **chỉ** nhận/trả GraphQL request, ủy thác cho Service.
  - Service: chứa business logic, gọi Repository.
  - Entity: chỉ schema TypeORM + GraphQL Object Type.
- Áp dụng `@UseGuards(JwtAuthGuard)` cho mọi protected resolver.
- Đăng ký module mới vào `app.module.ts`.
- Nếu tạo entity mới: đăng ký trong `TypeOrmModule.forFeature([...])` của module đó.
- Mọi DTO input phải có đầy đủ `class-validator` decorators.

## 3. Tự Động Kiểm Tra Lỗi (Self-Check)
- SAU KHI viết code, **TUYỆT ĐỐI KHÔNG** được báo cáo hoàn thành ngay.
- Bạn PHẢI sử dụng `run_command` để tự chạy các lệnh kiểm tra từ thư mục backend:
  ```bash
  # Kiểm tra TypeScript errors (PHẢI chạy đầu tiên)
  npx tsc --noEmit
  
  # Kiểm tra linting (PHẢI chạy sau khi tsc pass)
  npm run lint
  ```

## 4. Vòng Lặp Tự Sửa Lỗi (Auto-Fix Loop)
- Đọc output từ terminal. Nếu có bất kỳ lỗi (Error) nào:
  - Tự động phân tích lỗi: TypeScript type error? Missing import? Wrong decorator?
  - Sửa code trong các file tương ứng.
  - Chạy lại `npx tsc --noEmit`.
- Lặp lại cho đến khi terminal báo 0 errors và 0 lint errors.
- *Lưu ý: Chỉ dừng lại hỏi người dùng nếu bạn kẹt trong 1 vòng lặp lỗi quá 3 lần.*

## 5. Viết Unit Test (Testing — Nếu yêu cầu hoặc liên quan đến tính toán tài chính)
- Tạo file `*.spec.ts` cho Service mới tạo.
- Mock dependencies bằng `jest.fn()`.
- **BẮT BUỘC** nếu tính năng có hàm tính toán (PnL, avg cost, allocation).
- Chạy `npm run test` để xác nhận tests pass.

## 6. Bàn Giao (Final Handover)
- Chỉ khi mọi lệnh kiểm tra đều vượt qua, hãy dừng lại.
- Tóm tắt ngắn gọn:
  - Các file đã tạo/sửa (liệt kê theo path).
  - GraphQL queries/mutations mới được expose (nếu có).
  - Các lỗi bạn đã tự động khắc phục trong quá trình làm.
- Gợi ý người dùng test bằng cách:
  ```bash
  npm run start:dev
  # Mở GraphQL Playground tại http://localhost:3000/graphql
  ```
