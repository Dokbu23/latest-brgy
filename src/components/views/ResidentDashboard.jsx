import { useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import axios from '../../api/setupAxios'
import Swal from 'sweetalert2'
import DocumentRequestForm from '../dashboard/DocumentRequestForm'
import { 
  Home, 
  Briefcase, 
  FileText, 
  User, 
  Download,
  Calendar,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  X,
  PlusCircle,
  LayoutDashboard,
  Bell
} from 'lucide-react'
import './ResidentDashboard.css'

const ResidentDashboard = ({ user, setUser, onLogout }) => {
  const [jobs, setJobs] = useState([])
  const [documentRequests, setDocumentRequests] = useState([])
  const [appliedJobs, setAppliedJobs] = useState([])
  const [coverModalJob, setCoverModalJob] = useState(null)
  const [coverText, setCoverText] = useState('')
  const [applyingJobs, setApplyingJobs] = useState([])
  const [activeSection, setActiveSection] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Notification state
  const [notificationsList, setNotificationsList] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    sitio: user?.sitio || '',
    phone: user?.phone || '',
    address: user?.address || '',
    birthdate: user?.birthdate || '',
  })

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      sitio: user?.sitio || '',
      phone: user?.phone || '',
      address: user?.address || '',
      birthdate: user?.birthdate || '',
    })
  }, [user])

  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
  }

  const saveProfile = async () => {
    setIsSaving(true)
    try {
      await axios.get('/sanctum/csrf-cookie')
      await axios.patch('/api/user', profileForm, { withCredentials: true })
      const me = await axios.get('/api/user', { withCredentials: true })
      const freshUser = me?.data?.user || me?.data?.data?.user || null
      if (freshUser) {
        setUser && setUser(freshUser)
        setIsEditing(false)
        Swal.fire({ icon: 'success', title: 'Profile updated', text: 'Your profile has been saved.' })
      } else {
        setIsEditing(false)
        Swal.fire({ icon: 'warning', title: 'Profile updated', text: 'Profile saved but could not refresh user data.' })
      }
    } catch (err) {
      console.error('Profile save failed', err)
      Swal.fire({ icon: 'error', title: 'Save failed', text: err?.response?.data?.message || 'Failed to save profile.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async (request, format = 'pdf') => {
    try {
      const res = await axios.get(`/api/document-requests/${request.id}/download`, {
        params: { format },
        responseType: 'blob',
        withCredentials: true,
      })
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      const safeName = formatDocType(request.type).replace(/[^a-z0-9]/gi, '_').toLowerCase()
      link.download = `${safeName}.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed', error)
      const serverMsg = error?.response?.data?.message || error?.message || 'Unable to download document.'
      alert(`Unable to download document. ${serverMsg}`)
    }
  }

  const formatDocType = (type) => {
    if (!type) return 'Document'
    const labels = {
      barangay_clearance: 'Barangay Clearance',
      certificate_indigency: 'Certificate of Indigency',
      certificate_of_indigency: 'Certificate of Indigency',
      residency_cert: 'Certificate of Residency',
      certificate_of_residency: 'Certificate of Residency',
      good_moral: 'Good Moral Certificate',
      good_moral_certificate: 'Good Moral Certificate',
      business_permit: 'Business Permit',
      other: 'Custom Document',
    }
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const getStatusBadge = (status) => {
    const configs = {
      approved: { label: 'APPROVED', className: 'badge-success' },
      pending: { label: 'PENDING', className: 'badge-warning' },
      rejected: { label: 'REJECTED', className: 'badge-danger' },
    }
    return configs[status] || { label: status?.toUpperCase() || 'UNKNOWN', className: 'badge-default' }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      try {
        const [jobsRes, docsRes, notifRes] = await Promise.all([
          axios.get('/api/job-listings').catch(() => null),
          axios.get('/api/document-requests').catch(() => ({ data: { data: [] } })),
          axios.get('/api/notifications').catch(() => ({ data: { data: [] } }))
        ])
        if (!mounted) return
        
        const jobsData = jobsRes?.data?.data || jobsRes?.data || []
        setJobs(Array.isArray(jobsData) ? jobsData : [])
        const appliedIds = (Array.isArray(jobsData) ? jobsData : []).filter(j => j.applied_by_current_user).map(j => j.id)
        setAppliedJobs(appliedIds)

        const docs = docsRes?.data?.data?.data || docsRes?.data?.data || []
        setDocumentRequests(Array.isArray(docs) ? docs : [])
        
        const notifications = notifRes?.data?.data || []
        setNotificationsList(Array.isArray(notifications) ? notifications : [])
      } catch (err) {
        console.error('Load data error', err)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const closeCoverModal = () => {
    setCoverModalJob(null)
    setCoverText('')
  }

  // Notification functions
  const unreadCount = (notificationsList || []).filter(n => !n.read).length

  const markNotificationRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`).catch(() => null)
    } catch (err) {
      console.error('Mark read failed', err)
    }
    setNotificationsList(prev => (Array.isArray(prev) ? prev.map(n => n.id === id ? { ...n, read: true } : n) : prev))
  }

  const formatNotificationTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const applyToJob = async (jobId, cover = null) => {
    if (!jobId) return
    setApplyingJobs(prev => [...prev, jobId])
    try {
      await axios.get('/sanctum/csrf-cookie')
      await axios.post('/api/job-applications', { job_id: jobId, cover_letter: cover }, { withCredentials: true })
      setAppliedJobs(prev => [...new Set([...prev, jobId])])
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, applied_by_current_user: true } : j))
      Swal.fire({ icon: 'success', title: 'Applied', text: 'Your application was submitted.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2200 })
      closeCoverModal()
    } catch (err) {
      console.error('Apply failed', err)
      Swal.fire({ icon: 'error', title: 'Apply failed', text: err?.response?.data?.message || 'Failed to apply.' })
    } finally {
      setApplyingJobs(prev => prev.filter(id => id !== jobId))
    }
  }

  const openCoverModal = (job) => {
    if (!job) return
    setCoverModalJob(job)
  }

  const Modal = ({ children }) => {
    if (typeof document === 'undefined') return null
    return ReactDOM.createPortal(children, document.body)
  }

  // Stats for Overview
  const pendingDocs = documentRequests.filter(d => d.status === 'pending').length
  const approvedDocs = documentRequests.filter(d => d.status === 'approved').length
  const availableJobs = jobs.filter(j => !['closed', 'filled'].includes(j.status?.toLowerCase())).length
  const appliedJobsCount = appliedJobs.length

  const navItems = [
    { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { id: 'jobs', label: 'Job Listings', Icon: Briefcase },
    { id: 'documents', label: 'Documents', Icon: FileText },
    { id: 'profile', label: 'Profile', Icon: User },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            {/* Page Header */}
            <div className="page-header">
              <div className="page-header-left">
                <h1 className="page-title">Dashboard <span className="title-accent">Overview</span></h1>
                <p className="page-subtitle">Monitor your barangay services and activities</p>
              </div>
              <div className="page-header-right">
                <span className="date-badge">{today}</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat-card stat-card-blue">
                <div className="stat-value">{documentRequests.length}</div>
                <div className="stat-label">TOTAL REQUESTS</div>
              </div>
              <div className="stat-card stat-card-green">
                <div className="stat-value">{pendingDocs}</div>
                <div className="stat-label">PENDING</div>
              </div>
              <div className="stat-card stat-card-purple">
                <div className="stat-value">{availableJobs}</div>
                <div className="stat-label">AVAILABLE JOBS</div>
              </div>
              <div className="stat-card stat-card-orange">
                <div className="stat-value">{appliedJobsCount}</div>
                <div className="stat-label">JOBS APPLIED</div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="content-grid">
              {/* Recent Document Requests */}
              <div className="content-card">
                <div className="card-header">
                  <h3 className="card-title">Recent Document Requests</h3>
                  <button className="view-all-btn" onClick={() => setActiveSection('documents')}>View All</button>
                </div>
                <div className="card-body">
                  {documentRequests.length === 0 ? (
                    <div className="empty-state-small">
                      <FileText size={32} />
                      <p>No document requests yet</p>
                    </div>
                  ) : (
                    <div className="list-items">
                      {documentRequests.slice(0, 4).map(doc => {
                        const badge = getStatusBadge(doc.status)
                        return (
                          <div key={doc.id} className="list-item">
                            <div className="list-item-info">
                              <div className="list-item-title">{formatDocType(doc.type)}</div>
                              <div className="list-item-subtitle">{formatDate(doc.created_at)}</div>
                            </div>
                            <span className={`status-badge ${badge.className}`}>{badge.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="content-card">
                <div className="card-header">
                  <h3 className="card-title">Quick Actions</h3>
                </div>
                <div className="card-body">
                  <div className="quick-actions">
                    <button className="quick-action-btn" onClick={() => setActiveSection('documents')}>
                      <PlusCircle size={20} />
                      <span>Request Document</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveSection('jobs')}>
                      <Briefcase size={20} />
                      <span>Browse Jobs</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveSection('profile')}>
                      <User size={20} />
                      <span>Update Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )

      case 'jobs':
        return (
          <>
            <div className="page-header">
              <div className="page-header-left">
                <h1 className="page-title">Job <span className="title-accent">Listings</span></h1>
                <p className="page-subtitle">Browse and apply for available positions</p>
              </div>
              <div className="page-header-right">
                <span className="date-badge">{today}</span>
              </div>
            </div>

            <div className="content-card full-width">
              <div className="card-header">
                <h3 className="card-title">Available Positions</h3>
                <span className="badge-count">{jobs.length} Jobs</span>
              </div>
              <div className="card-body">
                {jobs.length === 0 ? (
                  <div className="empty-state-small">
                    <Briefcase size={32} />
                    <p>No job listings available</p>
                  </div>
                ) : (
                  <div className="list-items">
                    {jobs.map(job => {
                      const isApplied = appliedJobs.includes(job.id)
                      const isApplying = applyingJobs.includes(job.id)
                      return (
                        <div key={job.id} className="list-item job-item">
                          <div className="list-item-info">
                            <div className="list-item-title">{job.title}</div>
                            <div className="list-item-subtitle">{job.company} • {job.type}</div>
                          </div>
                          {isApplied ? (
                            <span className="status-badge badge-success">APPLIED</span>
                          ) : (
                            <button 
                              className="apply-btn"
                              onClick={() => openCoverModal(job)}
                              disabled={isApplying}
                            >
                              {isApplying ? 'Applying...' : 'Apply'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )

      case 'documents':
        return (
          <>
            <div className="page-header">
              <div className="page-header-left">
                <h1 className="page-title">Document <span className="title-accent">Services</span></h1>
                <p className="page-subtitle">Request and manage your barangay documents</p>
              </div>
              <div className="page-header-right">
                <span className="date-badge">{today}</span>
              </div>
            </div>

            <div className="content-grid documents-grid">
              {/* Request Form */}
              <div className="content-card">
                <div className="card-header">
                  <h3 className="card-title">New Request</h3>
                </div>
                <div className="card-body">
                  <DocumentRequestForm onCreated={(d) => setDocumentRequests([d, ...documentRequests])} />
                </div>
              </div>

              {/* Request History */}
              <div className="content-card">
                <div className="card-header">
                  <h3 className="card-title">Request History</h3>
                  <span className="badge-count">{documentRequests.length} Requests</span>
                </div>
                <div className="card-body">
                  {documentRequests.length === 0 ? (
                    <div className="empty-state-small">
                      <FileText size={32} />
                      <p>No requests yet</p>
                    </div>
                  ) : (
                    <div className="list-items">
                      {documentRequests.map(doc => {
                        const badge = getStatusBadge(doc.status)
                        return (
                          <div key={doc.id} className="list-item document-item">
                            <div className="list-item-info">
                              <div className="list-item-title">{formatDocType(doc.type)}</div>
                              <div className="list-item-subtitle">{formatDate(doc.created_at)}</div>
                            </div>
                            <div className="list-item-actions">
                              <span className={`status-badge ${badge.className}`}>{badge.label}</span>
                              {doc.status === 'approved' && (
                                <div className="download-btns">
                                  <button className="download-btn" onClick={() => handleDownload(doc, 'pdf')}>
                                    <Download size={14} /> PDF
                                  </button>
                                  <button className="download-btn" onClick={() => handleDownload(doc, 'docx')}>
                                    <Download size={14} /> DOCX
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )

      case 'profile':
        return (
          <>
            <div className="page-header">
              <div className="page-header-left">
                <h1 className="page-title">Profile <span className="title-accent">Settings</span></h1>
                <p className="page-subtitle">Manage your personal information</p>
              </div>
              <div className="page-header-right">
                <span className="date-badge">{today}</span>
              </div>
            </div>

            <div className="content-card full-width">
              <div className="card-header">
                <h3 className="card-title">Personal Information</h3>
                {!isEditing && (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                )}
              </div>
              <div className="card-body">
                <div className="profile-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label"><User size={14} /> Full Name</label>
                      {isEditing ? (
                        <input className="form-input" value={profileForm.name} onChange={(e) => handleProfileChange('name', e.target.value)} />
                      ) : (
                        <div className="form-value">{user?.name || 'Not provided'}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Mail size={14} /> Email</label>
                      {isEditing ? (
                        <input className="form-input" value={profileForm.email} disabled style={{ opacity: 0.6 }} />
                      ) : (
                        <div className="form-value">{user?.email || 'Not provided'}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Phone size={14} /> Phone</label>
                      {isEditing ? (
                        <input className="form-input" value={profileForm.phone} onChange={(e) => handleProfileChange('phone', e.target.value)} />
                      ) : (
                        <div className="form-value">{user?.phone || 'Not provided'}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Calendar size={14} /> Birthdate</label>
                      {isEditing ? (
                        <input className="form-input" type="date" value={profileForm.birthdate} onChange={(e) => handleProfileChange('birthdate', e.target.value)} />
                      ) : (
                        <div className="form-value">{user?.birthdate ? formatDate(user.birthdate) : 'Not provided'}</div>
                      )}
                    </div>
                    <div className="form-group full-span">
                      <label className="form-label"><MapPin size={14} /> Sitio</label>
                      {isEditing ? (
                        <select className="form-input" value={profileForm.sitio} onChange={(e) => handleProfileChange('sitio', e.target.value)}>
                          <option value="">Select Sitio</option>
                          <option value="Anuling">Anuling</option>
                          <option value="Bagong Buhay">Bagong Buhay</option>
                          <option value="Bagong Pag-asa">Bagong Pag-asa</option>
                          <option value="Bagong Silang">Bagong Silang</option>
                          <option value="Kaligayahan">Kaligayahan</option>
                          <option value="Kaunlaran">Kaunlaran</option>
                          <option value="Magsaysay">Magsaysay</option>
                          <option value="Poblacion I">Poblacion I</option>
                          <option value="Poblacion II">Poblacion II</option>
                          <option value="Poblacion III">Poblacion III</option>
                        </select>
                      ) : (
                        <div className="form-value">{user?.sitio || 'Not provided'}</div>
                      )}
                    </div>
                    <div className="form-group full-span">
                      <label className="form-label"><MapPin size={14} /> Address</label>
                      {isEditing ? (
                        <textarea className="form-input form-textarea" value={profileForm.address} onChange={(e) => handleProfileChange('address', e.target.value)} rows={3} />
                      ) : (
                        <div className="form-value">{user?.address || 'Not provided'}</div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="form-actions">
                      <button className="btn btn-primary" onClick={saveProfile} disabled={isSaving}>
                        <CheckCircle size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setProfileForm({ name: user?.name || '', email: user?.email || '', sitio: user?.sitio || '', phone: user?.phone || '', address: user?.address || '', birthdate: user?.birthdate || '' }) }}>
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )

      default:
        return null
    }
  }

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    } else {
      try {
        await axios.post('/api/logout')
        window.location.href = '/login'
      } catch (e) {
        window.location.href = '/login'
      }
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-brand">B. Del Mundo Portal</div>
        <div className="header-right">
          {/* Notification Button */}
          <div className="header-notifications" ref={notificationRef}>
            <button 
              className="notification-btn-header"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={32} strokeWidth={2.5} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {showNotifications && ReactDOM.createPortal(
              <>
                <div className="notification-overlay" onClick={() => setShowNotifications(false)}></div>
                <div className="notification-dropdown-portal">
                  <div className="notification-dropdown-content">
                    <div className="notification-header">
                      <strong>Notifications</strong>
                      {unreadCount > 0 && <span className="unread-count">{unreadCount} new</span>}
                    </div>
                    <div className="notification-list">
                      {notificationsList.length === 0 ? (
                        <div className="notification-empty">No notifications yet</div>
                      ) : (
                        notificationsList.slice(0, 10).map(notif => (
                          <div
                            key={notif.id}
                            className={`notification-item ${!notif.read ? 'unread' : ''}`}
                            onClick={() => markNotificationRead(notif.id)}
                          >
                            <div className="notification-content">
                              <p className="notification-message">{notif.data?.message || notif.message || 'New notification'}</p>
                              <span className="notification-time">{formatNotificationTime(notif.created_at)}</span>
                            </div>
                            {!notif.read && <span className="notification-dot"></span>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>


          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <Home size={20} />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-title">Resident Portal</span>
              <span className="sidebar-subtitle">Management System</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map(item => {
              const Icon = item.Icon
              return (
                <button
                  key={item.id}
                  className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>

      {/* Cover Letter Modal */}
      {coverModalJob && (
        <Modal>
          <div className="modal-overlay" onClick={closeCoverModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Apply for {coverModalJob.title}</h3>
                <button className="modal-close" onClick={closeCoverModal}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p className="modal-subtitle">{coverModalJob.company} • {coverModalJob.type}</p>
                <div className="form-group">
                  <label className="form-label">Cover Letter (Optional)</label>
                  <textarea
                    className="form-input form-textarea"
                    value={coverText}
                    onChange={(e) => setCoverText(e.target.value)}
                    placeholder="Write a brief cover letter..."
                    rows={5}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeCoverModal}>Cancel</button>
                <button className="btn btn-primary" onClick={() => applyToJob(coverModalJob.id, coverText)} disabled={applyingJobs.includes(coverModalJob.id)}>
                  {applyingJobs.includes(coverModalJob.id) ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ResidentDashboard
