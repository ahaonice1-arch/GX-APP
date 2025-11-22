import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Settings, User } from 'lucide-react'

export default function MeTab() {
  const { user, profile, signOut } = useAuth()

  async function handleSignOut() {
    if (confirm('确定要退出登录吗？')) {
      await signOut()
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 text-white">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          <div className="ml-4 flex-1">
            <div className="text-xl font-bold">{profile?.display_name || profile?.username}</div>
            <div className="text-sm opacity-90">@{profile?.username}</div>
          </div>
        </div>
        {profile?.bio && (
          <div className="mt-4 text-sm opacity-90">{profile.bio}</div>
        )}
      </div>

      <div className="p-4 space-y-2 mt-2">
        <div className="bg-white rounded-lg overflow-hidden">
          <button className="w-full flex items-center px-4 py-4 hover:bg-gray-50">
            <Settings className="w-5 h-5 text-gray-600 mr-3" />
            <span className="flex-1 text-left">设置</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-lg overflow-hidden mt-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-4 text-red-600 hover:bg-gray-50"
          >
            <LogOut className="w-5 h-5 mr-2" />
            <span>退出登录</span>
          </button>
        </div>
      </div>

      <div className="p-4 text-center text-xs text-gray-400 mt-8">
        <p>微信风格聊天应用</p>
        <p className="mt-1">v1.0.0</p>
      </div>
    </div>
  )
}
