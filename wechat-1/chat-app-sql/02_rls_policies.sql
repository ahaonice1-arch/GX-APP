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
