// src/App.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// Components
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ResidentDashboard from './components/views/ResidentDashboard'
import HRDashboard from './components/views/OfficialDashboard'
import Header from './components/Header'

// Configure axios for cookies-based authentication
axios.defaults.withCredentials = true
axios.defaults.baseURL = 'http://localhost:8000'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('login')

  // Check authentication status on app load
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/user')
      // Response structure: { data: { user: {...} }, message: "...", status: 200 }
      if (response.data && response.data.data && response.data.data.user) {
        setUser(response.data.data.user)
        setView('dashboard')
      } else {
        setView('login')
      }
    } catch (error) {
      // Not authenticated, stay on login page
      setView('login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setView('dashboard')
  }

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setView('login')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Barangay Portal...</p>
      </div>
    )
  }

  return (
    <div className="app">
      {user && <Header user={user} onLogout={handleLogout} />}
      
      <main className="main-content">
        {view === 'login' && <Login onLogin={handleLogin} />}
        {view === 'dashboard' && user && (
          user.role === 'resident' ? (
            <ResidentDashboard user={user} setUser={setUser} />
          ) : user.role === 'hr_manager' ? (
            <HRDashboard user={user} setUser={setUser} />
          ) : (
            <Dashboard user={user} setUser={setUser} />
          )
        )}
      </main>
    </div>
  )
}

export default App