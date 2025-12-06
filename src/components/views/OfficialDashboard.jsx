import React, { useEffect, useState } from 'react'
import HRJobForm from './hr/HRJobForm'
import ApplicantsList from './hr/ApplicantsList'
import InterviewScheduler from './hr/InterviewScheduler'
import axios from '../../api/setupAxios'
import './HRDashboard.css'
import Swal from 'sweetalert2'

const HRDashboard = ({ user, setUser }) => {
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [jobStats, setJobStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    filled: 0
  })

  const loadJobs = async () => {
    try {
      const res = await axios.get('/api/job-listings')
      const jobsData = res.data.data || []
      setJobs(jobsData)
      
      setJobStats({
        total: jobsData.length,
        active: jobsData.filter(j => j.status === 'active').length,
        closed: jobsData.filter(j => j.status === 'closed').length,
        filled: jobsData.filter(j => j.status === 'filled').length
      })
    } catch (err) {
      console.error('Load jobs', err)
      setJobs([])
    }
  }

  useEffect(() => { 
    loadJobs()
  }, [])

  const handleJobCreated = (newJob) => {
    loadJobs()
    setSelectedJobId(newJob.id)
    Swal.fire({
      icon: 'success',
      title: 'Job Posted!',
      text: `${newJob.title} has been posted successfully`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500
    })
  }

  const handleJobClosed = (jobId) => {
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'closed' } : j
    ))
    loadJobs()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', color: '#16a34a' }
      case 'filled': return { bg: '#f3e8ff', color: '#9333ea' }
      case 'closed': return { bg: '#f1f5f9', color: '#64748b' }
      default: return { bg: '#f1f5f9', color: '#64748b' }
    }
  }

  return (
    <div className="hr-dashboard">
      {/* Sidebar */}
      <aside className="hr-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">HR</div>
          <div className="brand-text">
            <span className="brand-title">HR Portal</span>
            <span className="brand-subtitle">Management System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            Job Listings
          </button>
          <button 
            className={`nav-item ${activeTab === 'post' ? 'active' : ''}`}
            onClick={() => setActiveTab('post')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
            Post Job
          </button>
          <button 
            className={`nav-item ${activeTab === 'applicants' ? 'active' : ''}`}
            onClick={() => setActiveTab('applicants')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Applicants
          </button>
          <button 
            className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            Schedule
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="hr-main">
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'jobs' && 'Job Listings'}
              {activeTab === 'post' && 'Post New Job'}
              {activeTab === 'applicants' && 'Manage Applicants'}
              {activeTab === 'schedule' && 'Interview Schedule'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'overview' && 'Monitor your recruitment activities'}
              {activeTab === 'jobs' && 'View and manage all job postings'}
              {activeTab === 'post' && 'Create a new job opportunity'}
              {activeTab === 'applicants' && 'Review and process applications'}
              {activeTab === 'schedule' && 'Manage interview appointments'}
            </p>
          </div>
          <div className="header-right">
            <div className="date-display">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="main-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2"/>
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{jobStats.total}</span>
                    <span className="stat-label">Total Jobs</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{jobStats.active}</span>
                    <span className="stat-label">Active Jobs</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{jobStats.filled}</span>
                    <span className="stat-label">Positions Filled</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon gray">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{jobStats.closed}</span>
                    <span className="stat-label">Closed Jobs</span>
                  </div>
                </div>
              </div>

              <div className="content-grid">
                <div className="panel">
                  <div className="panel-header">
                    <h2>Recent Job Listings</h2>
                    <button className="text-btn" onClick={() => setActiveTab('jobs')}>View All</button>
                  </div>
                  <div className="panel-body">
                    {jobs.length === 0 ? (
                      <div className="empty-state">
                        <p>No jobs posted yet</p>
                        <button className="btn-primary" onClick={() => setActiveTab('post')}>Post Your First Job</button>
                      </div>
                    ) : (
                      <div className="job-list">
                        {jobs.slice(0, 5).map(job => (
                          <div key={job.id} className="job-row" onClick={() => { setSelectedJobId(job.id); setActiveTab('applicants'); }}>
                            <div className="job-row-info">
                              <span className="job-row-title">{job.title}</span>
                              <span className="job-row-meta">{job.company} • {job.type}</span>
                            </div>
                            <span 
                              className="status-badge"
                              style={{ 
                                background: getStatusColor(job.status).bg,
                                color: getStatusColor(job.status).color
                              }}
                            >
                              {job.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <h2>Quick Actions</h2>
                  </div>
                  <div className="panel-body">
                    <div className="quick-actions">
                      <button className="quick-action-btn" onClick={() => setActiveTab('post')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 8v8M8 12h8"/>
                        </svg>
                        Post New Job
                      </button>
                      <button className="quick-action-btn" onClick={() => setActiveTab('applicants')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                        </svg>
                        Review Applicants
                      </button>
                      <button className="quick-action-btn" onClick={() => setActiveTab('schedule')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        Schedule Interview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="panel full-width">
              <div className="panel-header">
                <h2>All Job Listings</h2>
                <button className="btn-primary" onClick={() => setActiveTab('post')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v8M8 12h8"/>
                  </svg>
                  New Job
                </button>
              </div>
              <div className="panel-body">
                {jobs.length === 0 ? (
                  <div className="empty-state">
                    <p>No jobs posted yet</p>
                    <small>Create your first job listing to get started</small>
                  </div>
                ) : (
                  <div className="jobs-table">
                    {jobs.map(job => (
                      <div 
                        key={job.id} 
                        className={`job-card ${selectedJobId === job.id ? 'selected' : ''}`}
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <div className="job-card-header">
                          <h3>{job.title}</h3>
                          <span 
                            className="status-badge"
                            style={{ 
                              background: getStatusColor(job.status).bg,
                              color: getStatusColor(job.status).color
                            }}
                          >
                            {job.status}
                          </span>
                        </div>
                        <div className="job-card-meta">
                          <span>{job.company}</span>
                          <span className="dot">•</span>
                          <span>{job.type}</span>
                          <span className="dot">•</span>
                          <span>{job.salary}</span>
                        </div>
                        <div className="job-card-footer">
                          <span className="applicant-count">
                            Needed: {job.needed_applicants} | Accepted: {job.accepted_count || 0}
                          </span>
                          <button 
                            className="btn-outline"
                            onClick={(e) => { e.stopPropagation(); setSelectedJobId(job.id); setActiveTab('applicants'); }}
                          >
                            View Applicants
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Post Job Tab */}
          {activeTab === 'post' && (
            <div className="panel full-width">
              <div className="panel-header">
                <h2>Create New Job Posting</h2>
              </div>
              <div className="panel-body">
                <HRJobForm onCreated={handleJobCreated} />
              </div>
            </div>
          )}

          {/* Applicants Tab */}
          {activeTab === 'applicants' && (
            <div className="applicants-layout">
              <div className="panel">
                <div className="panel-header">
                  <h2>Select Job</h2>
                </div>
                <div className="panel-body">
                  {jobs.length === 0 ? (
                    <div className="empty-state small">
                      <p>No jobs available</p>
                    </div>
                  ) : (
                    <div className="job-selector">
                      {jobs.map(job => (
                        <button
                          key={job.id}
                          className={`job-select-btn ${selectedJobId === job.id ? 'active' : ''}`}
                          onClick={() => setSelectedJobId(job.id)}
                        >
                          <span className="job-select-title">{job.title}</span>
                          <span className="job-select-company">{job.company}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="panel flex-grow">
                <div className="panel-header">
                  <h2>{selectedJobId ? 'Applicants' : 'Select a Job'}</h2>
                </div>
                <div className="panel-body">
                  <ApplicantsList 
                    jobId={selectedJobId} 
                    onJobClosed={handleJobClosed}
                    onJobUpdated={loadJobs}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="schedule-layout">
              <div className="panel">
                <div className="panel-header">
                  <h2>Select Job</h2>
                </div>
                <div className="panel-body">
                  {jobs.length === 0 ? (
                    <div className="empty-state small">
                      <p>No jobs available</p>
                    </div>
                  ) : (
                    <div className="job-selector">
                      {jobs.map(job => (
                        <button
                          key={job.id}
                          className={`job-select-btn ${selectedJobId === job.id ? 'active' : ''}`}
                          onClick={() => setSelectedJobId(job.id)}
                        >
                          <span className="job-select-title">{job.title}</span>
                          <span className="job-select-company">{job.company}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="panel flex-grow">
                <div className="panel-header">
                  <h2>{selectedJobId ? 'Schedule Interview' : 'Select a Job First'}</h2>
                </div>
                <div className="panel-body">
                  <InterviewScheduler jobId={selectedJobId} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default HRDashboard