# 微信风格即时通讯聊天应用 - 部署文档

## 项目概述

已成功构建微信风格的即时通讯聊天Web应用，具备以下功能：
- 用户注册和登录
- 好友系统（搜索、添加好友）
- 实时聊天（私聊和群聊）
- 文件分享功能
- 微信风格界面设计
- 移动端优先响应式布局

## 部署状态

### 已完成
- ✅ 前端React应用开发完成
- ✅ 前端应用已部署：https://goakay1ooz7z.space.minimaxi.com
- ✅ Supabase配置准备就绪
- ✅ 数据库表SQL脚本已创建
- ✅ RLS安全策略已准备
- ✅ Edge Functions代码已编写

### 需要完成的配置

由于Supabase的某些配置需要通过Dashboard手动操作，请按以下步骤完成设置：

## 第一步：启用邮箱认证

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目：`injaqmzsqssxefxrglan`
3. 进入：`Authentication` → `Providers`
4. 找到并启用 `Email` provider
5. 保存设置

## 第二步：创建数据库表

### 方式A：使用SQL Editor（推荐）

1. 在Supabase Dashboard中，进入 `SQL Editor`
2. 点击 `New query`
3. 依次执行以下SQL文件内容：

#### 文件1：创建表结构
路径：`/workspace/chat-app-sql/01_create_tables.sql`

```sql
-- 创建用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建好友关系表
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 创建会话表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL DEFAULT 'private',
  name VARCHAR(100),
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建会话参与者表
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
```

#### 文件2：配置RLS策略
路径：`/workspace/chat-app-sql/02_rls_policies.sql`

```sql
-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- profiles表策略
CREATE POLICY "用户可以查看所有资料" ON profiles FOR SELECT USING (true);
CREATE POLICY "用户可以插入自己的资料" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "用户可以更新自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id);

-- friendships表策略
CREATE POLICY "用户可以查看与自己相关的好友关系" ON friendships 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "用户可以创建好友请求" ON friendships 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以更新好友请求状态" ON friendships 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "用户可以删除好友关系" ON friendships 
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- conversations表策略
CREATE POLICY "用户可以查看参与的会话" ON conversations 
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "用户可以创建会话" ON conversations 
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "创建者可以更新会话" ON conversations 
  FOR UPDATE USING (auth.uid() = created_by);

-- conversation_participants表策略
CREATE POLICY "用户可以查看会话参与者" ON conversation_participants 
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "会话创建者可以添加参与者" ON conversation_participants 
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    ) OR user_id = auth.uid()
  );

-- messages表策略
CREATE POLICY "用户可以查看参与会话的消息" ON messages 
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "用户可以发送消息" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );
```

## 第三步：创建存储桶（可选）

如果需要文件上传功能：

1. 在Supabase Dashboard，进入 `Storage`
2. 点击 `New bucket`，创建以下两个桶：

### 存储桶1：avatars
- 名称：`avatars`
- 公开访问：是
- 文件大小限制：5MB
- 允许的文件类型：image/*

### 存储桶2：chat-files  
- 名称：`chat-files`
- 公开访问：是
- 文件大小限制：10MB
- 允许的文件类型：image/*, application/pdf, application/*

3. 为每个存储桶配置RLS策略（参考 `/workspace/chat-app-sql/03_storage_policies.sql`）

## 第四步：启用Realtime

1. 在Supabase Dashboard，进入 `Database` → `Replication`
2. 找到并启用以下表的Realtime功能：
   - `messages`
   - `conversation_participants`
   - `profiles`

## 验证配置

完成上述步骤后，访问应用测试：

1. 打开：https://goakay1ooz7z.space.minimaxi.com
2. 点击"还没有账号？点击注册"
3. 填写注册信息并提交
4. 如果注册成功，说明配置正确
5. 可以尝试搜索其他用户、添加好友、发送消息等功能

## 技术架构

### 前端
- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS
- Supabase Client

### 后端
- Supabase（PostgreSQL数据库）
- Supabase Auth（用户认证）
- Supabase Realtime（实时通信）
- Supabase Storage（文件存储）

### 数据库表结构
- `profiles` - 用户资料
- `friendships` - 好友关系
- `conversations` - 会话
- `conversation_participants` - 会话参与者
- `messages` - 消息

## 项目文件位置

- 前端源码：`/workspace/wechat-clone/src/`
- 数据库SQL：`/workspace/chat-app-sql/`
- Edge Functions：`/workspace/supabase/functions/`
- 部署构建：`/workspace/wechat-clone/dist/`

## 联系支持

如遇到问题，请检查：
1. Supabase项目是否正确配置
2. 数据库表是否成功创建
3. RLS策略是否正确应用
4. Realtime功能是否已启用

## 后续优化建议

1. 添加头像上传功能（需要部署upload-file Edge Function）
2. 实现消息撤回功能
3. 添加消息已读/未读状态
4. 实现打字指示器
5. 添加群聊管理功能
6. 实现消息搜索功能
7. 添加表情包支持

---

**应用URL**: https://goakay1ooz7z.space.minimaxi.com  
**项目状态**: 前端完成，需完成后端配置后即可使用  
**预计配置时间**: 10-15分钟
