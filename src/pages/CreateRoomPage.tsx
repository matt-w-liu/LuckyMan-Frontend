import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/shell/AppShell'

export default function CreateRoomPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    bonus: 0,
    fee: 0,
    size: 4,
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    
    // TODO: Implement create room API call
    // For now, just navigate back to lobby
    setTimeout(() => {
      setIsCreating(false)
      navigate('/lobby')
    }, 1000)
  }

  return (
    <AppShell>
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">Create New Room</h2>
              <p className="text-mist-300">Set up a new game room</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-ink-700/30 backdrop-blur-sm rounded-lg p-6 border border-ink-400/60">
              <div className="space-y-6">
                <div>
                  <label htmlFor="bonus" className="block text-sm font-medium text-mist-300 mb-2">
                    Bonus
                  </label>
                  <input
                    id="bonus"
                    type="number"
                    min="0"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-ink-700 border border-ink-400 rounded-lg text-white placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-sky/40"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fee" className="block text-sm font-medium text-mist-300 mb-2">
                    Entry Fee
                  </label>
                  <input
                    id="fee"
                    type="number"
                    min="0"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-ink-700 border border-ink-400 rounded-lg text-white placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-sky/40"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-mist-300 mb-2">
                    Room Size (Players)
                  </label>
                  <input
                    id="size"
                    type="number"
                    min="2"
                    max="8"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 2 })}
                    className="w-full px-4 py-2 bg-ink-700 border border-ink-400 rounded-lg text-white placeholder-mist-500 focus:outline-none focus:ring-2 focus:ring-sky/40"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/lobby')}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark hover:brightness-110 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    {isCreating ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
    </AppShell>
  )
}

