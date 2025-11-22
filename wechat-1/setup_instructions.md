# Supabase后端配置说明

## 重要：需要手动配置

由于Supabase项目的某些配置需要通过Dashboard操作，请按以下步骤完成设置：

## 1. 启用邮箱认证

1. 访问Supabase Dashboard: https://supabase.com/dashboard
2. 选择项目：injaqmzsqssxefxrglan
3. 进入 Authentication > Providers
4. 启用 Email Provider
5. 保存设置

## 2. 创建数据库表

请在Supabase SQL Editor中执行以下SQL脚本：

### 文件位置
- `/workspace/chat-app-sql/01_create_tables.sql` - 创建表
- `/workspace/chat-app-sql/02_rls_policies.sql` - RLS策略
- `/workspace/chat-app-sql/03_storage_policies.sql` - 存储策略

### 执行顺序
1. 先执行 01_create_tables.sql
2. 再执行 02_rls_policies.sql
3. 最后执行 03_storage_policies.sql

## 3. 创建存储桶

在Supabase Storage中创建两个存储桶：

1. **avatars**
   - 公开访问
   - 最大文件大小：5MB
   - 允许的MIME类型：image/*

2. **chat-files**
   - 公开访问
   - 最大文件大小：10MB
   - 允许的MIME类型：image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

## 4. 部署Edge Function（可选）

文件上传Edge Function已创建：`/workspace/supabase/functions/upload-file/index.ts`

如需使用，请通过Supabase CLI部署：
```bash
supabase functions deploy upload-file
```

## 完成后

所有配置完成后，应用将完全可用，支持：
- 用户注册和登录
- 好友添加和管理
- 实时聊天
- 文件分享
