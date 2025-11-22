export default function DiscoverTab() {
  const features = [
    { icon: '📷', title: '朋友圈', desc: '分享生活动态' },
    { icon: '📹', title: '视频号', desc: '记录美好瞬间' },
    { icon: '🎮', title: '小程序', desc: '发现更多功能' },
    { icon: '🛍️', title: '购物', desc: '发现好物' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-2">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 flex items-center hover:bg-gray-50 cursor-pointer"
          >
            <div className="text-3xl mr-4">{feature.icon}</div>
            <div className="flex-1">
              <div className="font-medium">{feature.title}</div>
              <div className="text-sm text-gray-500">{feature.desc}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}
