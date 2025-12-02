// Enhanced Dashboard.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import './Dashboard.css'

// Dashboard Components
import StatsOverview from './dashboard/StatsOverview'
import RecentActivities from './dashboard/RecentActivities'
import EmploymentChart from './dashboard/EmploymentChart'
import SkillsDistribution from './dashboard/SkillsDistribution'
import QuickActions from './dashboard/QuickActions'
import JobListingsPreview from './dashboard/JobListingsPreview'

const Dashboard = ({ user, setUser }) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const safeUser = user || { name: 'User', barangay: 'Your Barangay', role: '' }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // When a job is posted via QuickActions, prepend it to recentJobs and mark as new
  const handleJobPosted = (job) => {
    const marked = { ...job, isNew: true }
    setDashboardData((prev) => {
      const existing = prev?.recentJobs || []
      return { ...(prev || {}), recentJobs: [marked, ...existing] }
    })
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800))
      const response = await axios.get('/api/dashboard/statistics')
      if (response.data && response.data.data) {
        setDashboardData(response.data.data)
      } else {
        setDashboardData(null)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner large"></div>
          <p>Loading Barangay Dashboard...</p>
          <span style={{fontSize: '14px', color: '#a0aec0', marginTop: '8px'}}>
            Preparing your community insights
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard">
        {/* Enhanced Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>
                Good {getTimeOfDay()}, {safeUser.name}!
                <span className="welcome-emoji">{getWelcomeEmoji()}</span>
              </h1>
              <p className="welcome-subtitle">
                Welcome to Barangay {safeUser.barangay} Monitoring Portal
                {safeUser.role === 'hr_manager' && ' • HR Manager'}
                {safeUser.role === 'admin' && ' • Administrator Panel'}
              </p>
            </div>
            <div className="header-actions">
              <div className="date-display">
                {currentTime.toLocaleDateString('en-PH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                <div style={{fontSize: '12px', opacity: 0.8, marginTop: '4px'}}>
                  {currentTime.toLocaleTimeString('en-PH', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={dashboardData?.statistics} user={safeUser} />

        {/* Enhanced Main Content Grid */}
        <div className="dashboard-content">
          {/* Left Column - Charts and Data Visualization */}
          <div className="content-left">
            <EmploymentChart data={dashboardData?.employmentStats} />
            <SkillsDistribution data={dashboardData?.skillsData} />
          </div>

          {/* Right Column - Actions and Updates */}
          <div className="content-right">
            <QuickActions 
              onRegistered={(u) => setUser && setUser(u)} 
              onRefresh={fetchDashboardData}
              onJobPosted={handleJobPosted}
            />
            <RecentActivities activities={dashboardData?.recentActivities} />
            <JobListingsPreview jobs={dashboardData?.recentJobs} onClearNew={() => {
              setDashboardData((prev) => {
                if (!prev) return prev
                const list = (prev.recentJobs || []).map(j => ({ ...j, isNew: false }))
                return { ...prev, recentJobs: list }
              })
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced helper functions
function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Evening'
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

function getWelcomeEmoji() {
  const hour = new Date().getHours()
  if (hour < 5) return '🌙'
  if (hour < 12) return '🌅'
  if (hour < 17) return '🌞'
  return '🌇'
}

export default Dashboard