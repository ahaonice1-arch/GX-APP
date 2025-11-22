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
