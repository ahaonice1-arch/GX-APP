import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Profile, Friendship } from '@/lib/supabase'
import { UserPlus, Search } from 'lucide-react'

interface FriendWithProfile extends Friendship {
  friendProfile?: Profile
}

export default function ContactsTab() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadFriends()
    }
  }, [user])

  async function loadFriends() {
    if (!user) return

    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')

    if (friendships) {
      const friendsWithProfiles = await Promise.all(
        friendships.map(async (friendship) => {
          const friendId = friendship.user_id === user.id 
            ? friendship.friend_id 
            : friendship.user_id

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', friendId)
            .maybeSingle()

          return {
            ...friendship,
            friendProfile: profile || undefined,
          }
        })
      )

      setFriends(friendsWithProfiles)
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user?.id || '')
        .limit(20)

      setSearchResults(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function sendFriendRequest(friendId: string) {
    if (!user) return

    try {
      await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      })

      alert('好友请求已发送')
      setShowSearch(false)
      setSearchQuery('')
      setSearchResults([])
    } catch (error: any) {
      alert('发送失败：' + error.message)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索用户名或昵称"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            搜索
          </button>
        </div>
      </div>

      {showSearch && searchResults.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-sm text-gray-500 px-2 py-1">搜索结果</div>
            {searchResults.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-gray-500">
                        {profile.display_name?.[0] || profile.username[0]}
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{profile.display_name || profile.username}</div>
                    <div className="text-sm text-gray-500">@{profile.username}</div>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(profile.id)}
                  className="px-4 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600"
                >
                  添加
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setShowSearch(false)
              setSearchResults([])
            }}
            className="w-full py-3 text-center text-gray-500 hover:bg-gray-50"
          >
            关闭搜索
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <UserPlus className="w-16 h-16 mb-4" />
              <p>暂无好友</p>
              <p className="text-sm mt-2">搜索用户名添加好友</p>
            </div>
          ) : (
            <div className="p-2">
              <div className="text-sm text-gray-500 px-2 py-1">好友列表</div>
              {friends.map((friend) => {
                const profile = friend.friendProfile
                if (!profile) return null

                return (
                  <div
                    key={friend.id}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-gray-500">
                          {profile.display_name?.[0] || profile.username[0]}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{profile.display_name || profile.username}</div>
                      <div className="text-sm text-gray-500">{profile.bio || '暂无签名'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
