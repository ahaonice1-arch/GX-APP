import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Conversation, Profile, Message } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ConversationWithDetails extends Conversation {
  lastMessage?: Message
  otherProfile?: Profile
  unreadCount?: number
}

export default function ChatsTab() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadConversations()
      subscribeToMessages()
    }
  }, [user])

  async function loadConversations() {
    if (!user) return

    try {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (!participants || participants.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      const conversationIds = participants.map(p => p.conversation_id)

      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })

      if (convs) {
        const conversationsWithDetails = await Promise.all(
          convs.map(async (conv) => {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            let otherProfile: Profile | undefined

            if (conv.type === 'private') {
              const { data: otherParticipant } = await supabase
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', conv.id)
                .neq('user_id', user.id)
                .maybeSingle()

              if (otherParticipant) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', otherParticipant.user_id)
                  .maybeSingle()

                otherProfile = profile || undefined
              }
            }

            return {
              ...conv,
              lastMessage: lastMsg || undefined,
              otherProfile,
            }
          })
        )

        setConversations(conversationsWithDetails)
      }
    } finally {
      setLoading(false)
    }
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <MessageCircleIcon className="w-16 h-16 mb-4" />
        <p>暂无聊天</p>
        <p className="text-sm mt-2">去通讯录添加好友开始聊天</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conv) => {
        const displayName = conv.type === 'group' 
          ? conv.name 
          : conv.otherProfile?.display_name || conv.otherProfile?.username || '未知用户'
        
        const avatarUrl = conv.type === 'group'
          ? conv.avatar_url
          : conv.otherProfile?.avatar_url

        const lastMessageText = conv.lastMessage?.content || '暂无消息'
        const timestamp = conv.lastMessage?.created_at 
          ? formatDistanceToNow(new Date(conv.lastMessage.created_at), { 
              addSuffix: true,
              locale: zhCN 
            })
          : ''

        return (
          <div
            key={conv.id}
            className="flex items-center px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 truncate">{displayName}</h3>
                <span className="text-xs text-gray-500 ml-2">{timestamp}</span>
              </div>
              <p className="text-sm text-gray-500 truncate mt-1">{lastMessageText}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
