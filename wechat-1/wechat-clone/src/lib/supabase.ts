import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://injaqmzsqssxefxrglan.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluamFxbXpzcXNzeGVmeHJnbGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjM3MTAsImV4cCI6MjA3ODU5OTcxMH0.olwAtr_2V0oYmUoChgBha5NW4Iu5ceTSxMjRSzl9-e8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  status: string
  last_seen: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  message_type: string
  file_url: string | null
  file_name: string | null
  file_size: number | null
  created_at: string
}

export interface Conversation {
  id: string
  type: string
  name: string | null
  avatar_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  joined_at: string
  last_read_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: string
  created_at: string
}
