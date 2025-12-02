// src/App.jsx
import { useState, useEffect } from 'react'
import axios from './api/setupAxios'
import Swal from 'sweetalert2'
import './App.css'

// Components
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ResidentDashboard from './components/views/ResidentDashboard'
import HRDashboard from './components/views/OfficialDashboard'
import SecretaryDashboard from './components/views/SecretaryDashboard'
import AdminDashboard from './components/views/admin/AdminDashboard'
import Header from './components/Header'
import BarangayCaptainDashboard from './components/views/BarangayCaptainDashboard'

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
      await axios.get('/sanctum/csrf-cookie')
      await axios.post('/api/logout')
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Logged Out Successfully',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setView('login')
    }
  }

  // Removed loading splash — render login/dashboard immediately
  if (loading) {
    return <div />
  }

  return (
    <div className="app">
      {user && user.role !== 'resident' && <Header user={user} onLogout={handleLogout} />}
      
      <main className="main-content">
        {view === 'login' && <Login onLogin={handleLogin} />}
        {view === 'dashboard' && user && (
          user.role === 'admin' ? (
            <AdminDashboard user={user} setUser={setUser} />
          ) : user.role === 'barangay_captain' ? (
            <BarangayCaptainDashboard user={user} setUser={setUser} />
          ) : user.hr_company ? (
            // If user has an associated HR company, show HR dashboard
            <HRDashboard user={user} setUser={setUser} />
          ) : user.role === 'secretary' ? (
            <SecretaryDashboard user={user} setUser={setUser} />
          ) : user.role === 'resident' ? (
            <ResidentDashboard user={user} setUser={setUser} />
          ) : user.role === 'hr' || user.role === 'hr_manager' ? (
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