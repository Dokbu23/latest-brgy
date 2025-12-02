// Enhanced Dashboard.jsx
import { useState, useEffect } from 'react'
import axios from '../api/setupAxios'
import './Dashboard.css'

// Dashboard Components

const Dashboard = ({ user, setUser }) => {
  const [dashboardData, setDashboardData] = useState(null)
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

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard/statistics')
      if (response.data && response.data.data) {
        setDashboardData(response.data.data)
      } else {
        setDashboardData(null)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData(null)
    }
  }

  // Removed dashboard loading placeholder — render UI immediately (components will handle empty data)

  return (
    <div className="dashboard-container">
      <div className="dashboard">
        {/* Enhanced Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>
                Good {getTimeOfDay()}, {safeUser.name}!
              
              </h1>
              <p className="welcome-subtitle">
                Welcome to B. Del Mundo Monitoring Portal

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

        {/* Enhanced Main Content Grid */}
        <div className="dashboard-content">
          {/* System Overview Statistics */}
          <div className="overview-section">
            <h2 className="section-title">📊 System Overview</h2>
            <div className="stats-grid">
              <div className="stat-card residents">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-value">{dashboardData?.statistics?.totalResidents || 0}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </div>
              
              <div className="stat-card jobs">
                <div className="stat-icon">💼</div>
                <div className="stat-info">
                  <div className="stat-value">{dashboardData?.statistics?.activeJobs || 0}</div>
                  <div className="stat-label">Active Jobs</div>
                </div>
              </div>
              
              <div className="stat-card skills">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <div className="stat-value">{dashboardData?.statistics?.registeredSkills || 0}</div>
                  <div className="stat-label">Registered Skills</div>
                </div>
              </div>
              
              <div className="stat-card documents">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <div className="stat-value">{dashboardData?.statistics?.pendingApplications || 0}</div>
                  <div className="stat-label">Applications</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Jobs Section */}
          {dashboardData?.recentJobs && dashboardData.recentJobs.length > 0 && (
            <div className="recent-section">
              <h2 className="section-title">💼 Recent Job Postings</h2>
              <div className="jobs-grid">
                {dashboardData.recentJobs.map(job => (
                  <div key={job.id} className="job-card-mini">
                    <div className="job-header-mini">
                      <h3 className="job-title-mini">{job.title}</h3>
                      <span className={`job-status-badge ${job.status}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="job-details-mini">
                      <span className="company">🏢 {job.company}</span>
                      <span className="location">📍 {job.location || 'Not specified'}</span>
                      <span className="type">⏰ {job.type}</span>
                    </div>
                    {job.salary && (
                      <div className="job-salary">💰 {job.salary}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Skills Section */}
          {dashboardData?.skillsData && dashboardData.skillsData.length > 0 && (
            <div className="skills-section">
              <h2 className="section-title">🎯 Top Skills in Community</h2>
              <div className="skills-list">
                {dashboardData.skillsData.slice(0, 10).map((skillData, index) => (
                  <div key={index} className="skill-item-dashboard">
                    <div className="skill-rank">#{index + 1}</div>
                    <div className="skill-name">{skillData.skill}</div>
                    <div className="skill-count">
                      <span className="count-badge">{skillData.count}</span>
                      <span className="count-label">residents</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="section-title">⚡ Quick Actions</h2>
            <div className="actions-grid">
              {safeUser.role === 'admin' && (
                <>
                  <button className="action-btn admin-btn">
                    <span className="action-icon">👥</span>
                    <span className="action-text">Manage Users</span>
                  </button>
                  <button className="action-btn admin-btn">
                    <span className="action-icon">📊</span>
                    <span className="action-text">View Reports</span>
                  </button>
                </>
              )}
              {(safeUser.role === 'hr_manager' || safeUser.role === 'hr') && (
                <>
                  <button className="action-btn hr-btn">
                    <span className="action-icon">💼</span>
                    <span className="action-text">Post New Job</span>
                  </button>
                  <button className="action-btn hr-btn">
                    <span className="action-icon">📋</span>
                    <span className="action-text">View Applicants</span>
                  </button>
                </>
              )}
              {safeUser.role === 'resident' && (
                <>
                  <button className="action-btn resident-btn">
                    <span className="action-icon">🔍</span>
                    <span className="action-text">Browse Jobs</span>
                  </button>
                  <button className="action-btn resident-btn">
                    <span className="action-icon">📝</span>
                    <span className="action-text">Update Profile</span>
                  </button>
                </>
              )}
              <button className="action-btn refresh-btn" onClick={fetchDashboardData}>
                <span className="action-icon">🔄</span>
                <span className="action-text">Refresh Data</span>
              </button>
            </div>
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


export default Dashboard