import { useEffect, useState } from 'react'
import axios from 'axios'
import JobListingsPreview from '../dashboard/JobListingsPreview'
import RecentActivities from '../dashboard/RecentActivities'
import './ResidentDashboard.css'

const ResidentDashboard = ({ user, setUser }) => {
  const [jobs, setJobs] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const [jobsRes, activitiesRes] = await Promise.all([
          axios.get('/api/job-listings'),
          axios.get('/api/dashboard/activities')
        ])

        if (!mounted) return
        setJobs((jobsRes.data && jobsRes.data.data) ? jobsRes.data.data : [])
        setActivities((activitiesRes.data && activitiesRes.data.data) ? activitiesRes.data.data : [])
      } catch (err) {
        console.error('Load resident dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Welcome, {user?.name}</h2>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{user?.barangay || 'Your Barangay'}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'linear-gradient(90deg,#e6f4ff,#ffffff)', color: '#0b5fff', fontWeight: 700 }}>Resident</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="section-title">Available Job Listings</h3>
            {loading ? (
              <p style={{ color: 'var(--muted)' }}>Loading jobs...</p>
            ) : (
              <JobListingsPreview jobs={jobs} />
            )}
          </div>

          <div className="card">
            <h3 className="section-title">My Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="stat-item"><div className="stat-label">Name</div><div className="stat-value">{user?.name}</div></div>
              <div className="stat-item"><div className="stat-label">Email</div><div className="stat-value">{user?.email}</div></div>
              <div className="stat-item"><div className="stat-label">Barangay</div><div className="stat-value">{user?.barangay || '-'}</div></div>
              <div className="stat-item"><div className="stat-label">Phone</div><div className="stat-value">{user?.phone || '-'}</div></div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="section-title">Recent Activities</h3>
            <RecentActivities activities={activities} />
          </div>

          <div className="card">
            <h3 className="section-title">Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="#" className="qa-button" style={{ padding: '12px 16px' }}>View Jobs</a>
              <a href="#" className="qa-button" style={{ padding: '12px 16px' }}>Edit Profile</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResidentDashboard
