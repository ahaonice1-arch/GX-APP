import { MessageCircle, Users, Compass, User } from 'lucide-react'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'chats', label: '消息', icon: MessageCircle },
    { id: 'contacts', label: '通讯录', icon: Users },
    { id: 'discover', label: '发现', icon: Compass },
    { id: 'me', label: '我', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center h-full space-y-1"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? 'text-green-500' : 'text-gray-500'
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? 'text-green-500' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
