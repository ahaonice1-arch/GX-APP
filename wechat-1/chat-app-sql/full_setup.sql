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
-- 存储桶RLS策略（用于头像和文件上传）
CREATE POLICY "用户可以查看所有头像" ON storage.objects 
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "用户可以上传头像" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

CREATE POLICY "用户可以更新自己的头像" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

CREATE POLICY "用户可以删除自己的头像" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.role() = 'service_role'
  );

-- 聊天文件策略
CREATE POLICY "用户可以查看聊天文件" ON storage.objects 
  FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "用户可以上传聊天文件" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' AND
    (auth.role() = 'anon' OR auth.role() = 'service_role')
  );
