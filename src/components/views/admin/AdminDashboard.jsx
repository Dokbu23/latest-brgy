import { useEffect, useState } from 'react'
import axios from '../../../api/setupAxios'
import AdminRequestsList from './AdminRequestsList'
import AdminCreateSecretary from './AdminCreateSecretary'
import AdminAccountsManagement from './AdminAccountsManagement'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    residents: 0,
    employed: 0,
    seeking: 0,
    jobs: 0,
    applications: 0,
    documentRequests: 0
  })
  const [activities, setActivities] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await axios.get('/api/user')
        if (userRes.data?.data?.user) {
          setUser(userRes.data.data.user)
        }

        // Fetch stats
        const statsRes = await axios.get('/api/admin/stats')
        if (statsRes.data?.data) {
          setStats({
            residents: statsRes.data.data.residents || 0,
            employed: statsRes.data.data.employed || 0,
            seeking: statsRes.data.data.seeking || 0,
            jobs: statsRes.data.data.jobs || 0,
            applications: statsRes.data.data.applications || 0,
            documentRequests: statsRes.data.data.document_requests || 0
          })
        }

        // Fetch recent activities
        const activitiesRes = await axios.get('/api/admin/activities')
        if (activitiesRes.data?.data) {
          setActivities(activitiesRes.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      }
    }

    fetchData()
  }, [])

  const StatCard = ({ label, value, color }) => (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value.toLocaleString()}</div>
      </div>
    </div>
  )

  const QuickAction = ({ icon, title, description, onClick }) => (
    <div className="quick-action-card" onClick={onClick}>
      <div className="qa-icon">{icon}</div>
      <div className="qa-content">
        <div className="qa-title">{title}</div>
        <div className="qa-description">{description}</div>
      </div>
      <div className="qa-arrow">→</div>
    </div>
  )

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Administrator Dashboard</h1>
            <p className="header-subtitle">Welcome back, {user?.name || 'Administrator'}</p>
          </div>
          <div className="header-user">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div className="user-name">{user?.name || 'Administrator'}</div>
              <div className="user-role">ADMIN • Main Office</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-section">
        <h2 className="section-title">System Overview</h2>
        <div className="stats-grid">
          <StatCard label="Total Residents" value={stats.residents} color="blue" />
          <StatCard label="Employed" value={stats.employed} color="green" />
          <StatCard label="Seeking Jobs" value={stats.seeking} color="orange" />
          <StatCard label="Active Listings" value={stats.jobs} color="purple" />
          <StatCard label="Applications" value={stats.applications} color="red" />
          <StatCard label="Document Requests" value={stats.documentRequests} color="indigo" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-section">
        <div className="tabs-container">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview & Quick Actions
          </button>
          <button
            className={`tab ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            👥 Account Management
          </button>
          <button
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            📄 Document Requests
          </button>
          <button
            className={`tab ${activeTab === 'secretaries' ? 'active' : ''}`}
            onClick={() => setActiveTab('secretaries')}
          >
            👤 Manage Secretaries
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="quick-actions-grid">
              <QuickAction
                icon="👥"
                title="Manage Accounts"
                description="View and manage all resident, HR, and official accounts"
                onClick={() => setActiveTab('accounts')}
              />
              <QuickAction
                icon="📄"
                title="Create Secretary"
                description="Add a new secretary account to the system"
                onClick={() => setActiveTab('secretaries')}
              />
              <QuickAction
                icon="📋"
                title="View Requests"
                description="Manage document requests and assignments"
                onClick={() => setActiveTab('requests')}
              />
              <QuickAction
                icon="📊"
                title="Generate Reports"
                description="Create system reports and analytics"
                onClick={() => { /* TODO */ }}
              />
            </div>

            <div className="recent-activities">
              <h3 className="section-title">Recent Activities</h3>
              <div className="activity-list">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-content">
                        <div className="activity-title">{activity.title}</div>
                        <div className="activity-description">{activity.description}</div>
                        <div className="activity-time">{activity.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="activity-item">
                    <div className="activity-icon">📭</div>
                    <div className="activity-content">
                      <div className="activity-description">No recent activities</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="accounts-section">
            <AdminAccountsManagement />
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-section">
            <AdminRequestsList />
          </div>
        )}

        {activeTab === 'secretaries' && (
          <div className="secretaries-section">
            <div className="section-header">
              <h2 className="section-title">Manage Secretaries</h2>
              <p className="section-description">Create new secretary accounts and manage permissions</p>
            </div>
            <AdminCreateSecretary onCreated={() => { /* Refresh secretaries list */ }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
