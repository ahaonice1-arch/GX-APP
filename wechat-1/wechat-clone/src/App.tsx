import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import BottomNav from './components/BottomNav'
import ChatsTab from './components/ChatsTab'
import ContactsTab from './components/ContactsTab'
import DiscoverTab from './components/DiscoverTab'
import MeTab from './components/MeTab'

function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('chats')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="h-screen flex flex-col bg-white max-w-lg mx-auto">
      <div className="flex-1 overflow-hidden pb-16">
        {activeTab === 'chats' && <ChatsTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'me' && <MeTab />}
      </div>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
