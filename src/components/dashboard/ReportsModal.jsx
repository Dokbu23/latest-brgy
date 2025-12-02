// ReportsModal.jsx - Redesigned
import { useEffect, useState } from 'react'
import axios from '../../api/setupAxios'

const ReportsModal = ({ isOpen, onClose }) => {
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isOpen) fetchReports()
  }, [isOpen])

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/dashboard/statistics')
      setData(res.data?.data)
    } catch (err) {
      console.error(err)
    }
  }

  if (!isOpen) return null

  const mockData = data || {
    statistics: {
      totalResidents: 1247,
      employedResidents: 892,
      unemployedResidents: 355,
      activeJobs: 23,
      pendingApplications: 45,
      documentRequests: 18
    },
    recentJobs: [
      { id: 1, title: 'Administrative Assistant', company: 'Barangay Hall', type: 'Full-time', applications: 12 },
      { id: 2, title: 'Construction Worker', company: 'Local Contractor', type: 'Full-time', applications: 8 },
      { id: 3, title: 'Community Nurse', company: 'Health Center', type: 'Full-time', applications: 15 }
    ]
  }

  return (
    <div className="modern-modal-overlay">
      <div className="modern-modal xlarge">
        <div className="modal-header">
          <h3 className="modal-title">Reports & Analytics</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'employment' ? 'active' : ''}`}
            onClick={() => setActiveTab('employment')}
          >
            Employment
          </button>
          <button 
            className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
        </div>

        <div className="modal-content">
            {activeTab === 'overview' && (
              <div className="reports-overview">
                <h4 className="section-title">Key Statistics</h4>
                <div className="stats-grid">
                  {Object.entries(mockData.statistics).map(([key, value]) => (
                    <div key={key} className="stat-card">
                      <span className="stat-value">{value}</span>
                      <span className="stat-label">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>

                <h4 className="section-title">Recent Job Postings</h4>
                <div className="jobs-list compact">
                  {mockData.recentJobs.map(job => (
                    <div key={job.id} className="job-item">
                      <div className="job-info">
                        <span className="job-title">{job.title}</span>
                        <span className="job-company">{job.company}</span>
                      </div>
                      <div className="job-meta">
                        <span className="job-type">{job.type}</span>
                        <span className="job-applications">{job.applications} applications</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'employment' && (
              <div className="employment-reports">
                <h4 className="section-title">Employment Statistics</h4>
                <div className="employment-stats">
                  <div className="employment-metric">
                    <span className="metric-value">71%</span>
                    <span className="metric-label">Employment Rate</span>
                  </div>
                  <div className="employment-metric">
                    <span className="metric-value">29%</span>
                    <span className="metric-label">Seeking Employment</span>
                  </div>
                  <div className="employment-metric">
                    <span className="metric-value">45%</span>
                    <span className="metric-label">Skills Match Rate</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="documents-reports">
                <h4 className="section-title">Document Requests</h4>
                <div className="document-stats">
                  <div className="document-metric">
                    <span className="metric-value">18</span>
                    <span className="metric-label">Pending Requests</span>
                  </div>
                  <div className="document-metric">
                    <span className="metric-value">32</span>
                    <span className="metric-label">Processed This Month</span>
                  </div>
                  <div className="document-metric">
                    <span className="metric-value">94%</span>
                    <span className="metric-label">Completion Rate</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="modern-button secondary" onClick={onClose}>
            Close Reports
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportsModal