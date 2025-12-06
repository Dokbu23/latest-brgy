// BarangayCaptainDashboard.jsx - Barangay Captain Dashboard with Meeting Scheduler
import { useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import axios from '../../api/setupAxios'
import Swal from 'sweetalert2'
import './BarangayCaptainDashboard.css'

// Modal component outside to prevent re-creation on every render
const Modal = ({ children }) => {
  if (typeof document === 'undefined') return null
  return ReactDOM.createPortal(children, document.body)
}

const BarangayCaptainDashboard = ({ user, setUser }) => {
  const [activeSection, setActiveSection] = useState('overview')
  const [meetings, setMeetings] = useState([])
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState(null)
  const [notificationsList, setNotificationsList] = useState([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [notifPosition, setNotifPosition] = useState({ top: 0, left: 0 })
  const [notifDragging, setNotifDragging] = useState(false)
  const notifDragData = useRef({ active: false, offsetX: 0, offsetY: 0 })
  const notificationAnchorRef = useRef(null)
  const notifDropdownRef = useRef(null)

  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    meeting_type: 'officials_only',
    target_sitio: '',
    meeting_date: '',
    meeting_time: '',
    location: '',
    agenda: '',
    notes: ''
  })

  const [sitios, setSitios] = useState([])
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false)
  const [autoScheduleForm, setAutoScheduleForm] = useState({
    title_template: 'Sitio {sitio} Meeting',
    description: '',
    meeting_type: 'residents',
    start_date: '',
    start_time: '09:00',
    duration_minutes: 60,
    location_template: 'Sitio {sitio} Hall',
    agenda: '',
    notes: ''
  })

  const [residents, setResidents] = useState([])
  const [officials, setOfficials] = useState([])
  const [selectedSitioFilter, setSelectedSitioFilter] = useState('')

  const [stats, setStats] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    officialsOnlyMeetings: 0,
    publicMeetings: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [meetingsRes, notificationsRes, sitiosRes, residentsRes, officialsRes] = await Promise.all([
        axios.get('/api/barangay/meetings').catch(() => ({ data: { data: [] } })),
        axios.get('/api/notifications').catch(() => ({ data: { data: [] } })),
        axios.get('/api/barangay/sitios').catch(() => ({ data: { data: [] } })),
        axios.get('/api/barangay/residents').catch(() => ({ data: { data: [] } })),
        axios.get('/api/barangay/officials').catch(() => ({ data: { data: [] } }))
      ])

      const meetingsData = meetingsRes.data?.data || []
      setMeetings(Array.isArray(meetingsData) ? meetingsData : [])

      const notificationsData = notificationsRes.data?.data || []
      setNotificationsList(Array.isArray(notificationsData) ? notificationsData : [])

      const sitiosData = sitiosRes.data?.data || []
      setSitios(Array.isArray(sitiosData) ? sitiosData : [])

      const residentsData = residentsRes.data?.data || []
      setResidents(Array.isArray(residentsData) ? residentsData : [])

      const officialsData = officialsRes.data?.data || []
      setOfficials(Array.isArray(officialsData) ? officialsData : [])

      // Calculate stats
      const now = new Date()
      const upcoming = meetingsData.filter(m => new Date(m.meeting_date) >= now)
      const officialsOnly = meetingsData.filter(m => m.meeting_type === 'officials_only')
      const publicMeetings = meetingsData.filter(m => m.meeting_type === 'public' || m.meeting_type === 'residents')

      setStats({
        totalMeetings: meetingsData.length,
        upcomingMeetings: upcoming.length,
        officialsOnlyMeetings: officialsOnly.length,
        publicMeetings: publicMeetings.length
      })
    } catch (err) {
      console.error('Load data failed', err)
    }
  }

  const handleMeetingSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await axios.get('/sanctum/csrf-cookie')
      
      const payload = {
        ...meetingForm,
        meeting_datetime: `${meetingForm.meeting_date} ${meetingForm.meeting_time}`
      }

      if (editingMeeting) {
        await axios.put(`/api/barangay/meetings/${editingMeeting.id}`, payload, { withCredentials: true })
        Swal.fire({ icon: 'success', title: 'Meeting Updated', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 })
      } else {
        await axios.post('/api/barangay/meetings', payload, { withCredentials: true })
        Swal.fire({ icon: 'success', title: 'Meeting Created', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 })
      }

      setShowMeetingModal(false)
      resetMeetingForm()
      loadData()
    } catch (err) {
      console.error('Meeting submit failed', err)
      Swal.fire({ icon: 'error', title: 'Failed', text: err?.response?.data?.message || 'Failed to save meeting' })
    }
  }

  const resetMeetingForm = () => {
    setMeetingForm({
      title: '',
      description: '',
      meeting_type: 'officials_only',
      target_sitio: '',
      meeting_date: '',
      meeting_time: '',
      location: '',
      agenda: '',
      notes: ''
    })
    setEditingMeeting(null)
  }

  const openMeetingModal = (meeting = null) => {
    if (meeting) {
      const meetingDate = new Date(meeting.meeting_datetime || meeting.meeting_date)
      setMeetingForm({
        title: meeting.title || '',
        description: meeting.description || '',
        meeting_type: meeting.meeting_type || 'officials_only',
        target_sitio: meeting.target_sitio || '',
        meeting_date: meetingDate.toISOString().split('T')[0],
        meeting_time: meetingDate.toTimeString().substring(0, 5),
        location: meeting.location || '',
        agenda: meeting.agenda || '',
        notes: meeting.notes || ''
      })
      setEditingMeeting(meeting)
    }
    setShowMeetingModal(true)
  }

  const deleteMeeting = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Meeting?',
      text: 'This action cannot be undone',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    })

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/barangay/meetings/${id}`, { withCredentials: true })
        Swal.fire({ icon: 'success', title: 'Deleted', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 })
        loadData()
      } catch (err) {
        console.error('Delete failed', err)
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to delete meeting' })
      }
    }
  }

  const handleAutoScheduleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await axios.get('/sanctum/csrf-cookie')
      
      await axios.post('/api/barangay/meetings/schedule-all-sitios', autoScheduleForm, { withCredentials: true })
      Swal.fire({ 
        icon: 'success', 
        title: 'Meetings Scheduled!', 
        text: `Meetings created for all sitios`,
        toast: true, 
        position: 'top-end', 
        showConfirmButton: false, 
        timer: 3000 
      })

      setShowAutoScheduleModal(false)
      loadData()
    } catch (err) {
      console.error('Auto-schedule failed', err)
      Swal.fire({ icon: 'error', title: 'Failed', text: err?.response?.data?.message || 'Failed to schedule meetings' })
    }
  }

  const getMeetingTypeConfig = (type) => {
    const configs = {
      officials_only: { label: 'Officials Only', icon: '👔', className: 'type-officials', color: '#7C3AED' },
      public: { label: 'Public Meeting', icon: '👥', className: 'type-public', color: '#10B981' },
      residents: { label: 'Residents Meeting', icon: '🏘️', className: 'type-residents', color: '#2563EB' },
      emergency: { label: 'Emergency', icon: '🚨', className: 'type-emergency', color: '#DC2626' }
    }
    return configs[type] || configs.officials_only
  }

  const formatDateTime = (datetime) => {
    if (!datetime) return '—'
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const unreadCount = (notificationsList || []).filter(n => !n.read).length

  const markNotificationRead = async (id) => {
    if (!id) return
    try {
      await axios.patch(`/api/notifications/${id}/read`).catch(() => null)
    } catch (e) {
      // ignore
    }
    setNotificationsList(prev => (Array.isArray(prev) ? prev.map(n => n.id === id ? { ...n, read: true } : n) : prev))
  }

  const startNotifDrag = (event) => {
    const dropdownRect = notifDropdownRef.current?.getBoundingClientRect()
    if (!dropdownRect) return
    const isTouch = event.type === 'touchstart'
    const point = isTouch ? event.touches[0] : event
    notifDragData.current = {
      active: true,
      offsetX: point.clientX - dropdownRect.left,
      offsetY: point.clientY - dropdownRect.top
    }
    setNotifDragging(true)
    if (!isTouch) {
      event.preventDefault()
    }
  }

  const handleNotifDragMove = (event) => {
    if (!notifDragData.current.active) return
    const dropdownRect = notifDropdownRef.current?.getBoundingClientRect()
    const width = dropdownRect?.width ?? 360
    const height = dropdownRect?.height ?? 420
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const isTouch = event.type === 'touchmove'
    const point = isTouch ? event.touches[0] : event
    const newLeft = Math.min(Math.max(point.clientX - notifDragData.current.offsetX, 8), viewportWidth - width - 8)
    const newTop = Math.min(Math.max(point.clientY - notifDragData.current.offsetY, 8), viewportHeight - height - 8)
    setNotifPosition({ top: newTop, left: newLeft })
    if (!isTouch) {
      event.preventDefault()
    }
  }

  const stopNotifDrag = () => {
    if (!notifDragData.current.active) return
    notifDragData.current.active = false
    setNotifDragging(false)
  }

  useEffect(() => {
    if (!showNotifDropdown) {
      notifDragData.current.active = false
      setNotifDragging(false)
      return
    }

    const measurePosition = () => {
      const anchorRect = notificationAnchorRef.current?.getBoundingClientRect()
      const viewportWidth = window.innerWidth

      if (!anchorRect) {
        setNotifPosition(prev => ({
          top: Math.min(prev.top, window.innerHeight - 80),
          left: Math.min(Math.max(prev.left, 16), viewportWidth - 420)
        }))
        return
      }

      const dropdownWidth = 420
      const defaultLeft = Math.min(
        Math.max(16, anchorRect.right - dropdownWidth),
        viewportWidth - dropdownWidth - 16
      )
      const defaultTop = anchorRect.bottom + 8

      setNotifPosition({ top: defaultTop, left: defaultLeft })
    }

    const raf = requestAnimationFrame(measurePosition)
    return () => cancelAnimationFrame(raf)
  }, [showNotifDropdown])

  useEffect(() => {
    if (!notifDragging && !notifDragData.current.active) return
    const moveHandler = (event) => handleNotifDragMove(event)
    const endHandler = () => stopNotifDrag()
    window.addEventListener('mousemove', moveHandler)
    window.addEventListener('mouseup', endHandler)
    window.addEventListener('touchmove', moveHandler, { passive: false })
    window.addEventListener('touchend', endHandler)
    return () => {
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('mouseup', endHandler)
      window.removeEventListener('touchmove', moveHandler)
      window.removeEventListener('touchend', endHandler)
    }
  }, [notifDragging])

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Meeting Management Overview</h2>
              <p className="section-subtitle">Manage and schedule meetings for barangay officials and residents</p>
            </div>

            <div className="stats-rhythm">
              <div className="stat-tile blue">
                <div className="stat-content">
                  <span className="stat-value">{stats.totalMeetings}</span>
                  <span className="stat-label">Total Meetings</span>
                  <span className="stat-trend">All scheduled</span>
                </div>
              </div>
              <div className="stat-tile green">
                <div className="stat-content">
                  <span className="stat-value">{stats.upcomingMeetings}</span>
                  <span className="stat-label">Upcoming</span>
                  <span className="stat-trend">Future events</span>
                </div>
              </div>
              <div className="stat-tile purple">
                <div className="stat-content">
                  <span className="stat-value">{stats.officialsOnlyMeetings}</span>
                  <span className="stat-label">Officials Only</span>
                  <span className="stat-trend">Private</span>
                </div>
              </div>
              <div className="stat-tile orange">
                <div className="stat-content">
                  <span className="stat-value">{stats.publicMeetings}</span>
                  <span className="stat-label">Public Meetings</span>
                  <span className="stat-trend">Open to residents</span>
                </div>
              </div>
            </div>

            <div className="actions-bar">
              <button className="action-btn primary" onClick={() => openMeetingModal()}>
                <span className="btn-icon">📅</span>
                Schedule New Meeting
              </button>
              <button className="action-btn success" onClick={() => setShowAutoScheduleModal(true)}>
                <span className="btn-icon">🗓️</span>
                Auto-Schedule All Sitios
              </button>
              <button className="action-btn" onClick={loadData}>
                <span className="btn-icon">🔄</span>
                Refresh
              </button>
            </div>
          </div>
        )

      case 'meetings':
        return (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">All Meetings</h2>
              <p className="section-subtitle">View, edit, and manage scheduled meetings</p>
            </div>

            <div className="actions-bar">
              <button className="action-btn primary" onClick={() => openMeetingModal()}>
                <span className="btn-icon">📅</span>
                Schedule New Meeting
              </button>
            </div>

            {meetings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Meetings Scheduled</h3>
                <p>Click "Schedule New Meeting" to create your first meeting</p>
              </div>
            ) : (
              <div className="meetings-grid">
                {meetings.map(meeting => {
                  const typeConfig = getMeetingTypeConfig(meeting.meeting_type)
                  const isPast = new Date(meeting.meeting_datetime || meeting.meeting_date) < new Date()
                  
                  return (
                    <div key={meeting.id} className={`meeting-card ${isPast ? 'past-meeting' : ''}`}>
                      <div className="meeting-header">
                        <span className={`meeting-type-badge ${typeConfig.className}`}>
                          {typeConfig.icon} {typeConfig.label}
                        </span>
                        {isPast && <span className="past-badge">Past</span>}
                      </div>
                      
                      <h3 className="meeting-title">{meeting.title}</h3>
                      <p className="meeting-description">{meeting.description}</p>
                      
                      <div className="meeting-details">
                        <div className="detail-item">
                          <span className="detail-icon">📅</span>
                          <span>{formatDateTime(meeting.meeting_datetime || meeting.meeting_date)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span>{meeting.location || 'TBD'}</span>
                        </div>
                        {meeting.agenda && (
                          <div className="detail-item">
                            <span className="detail-icon">📋</span>
                            <span>{meeting.agenda}</span>
                          </div>
                        )}
                      </div>

                      <div className="meeting-actions">
                        <button className="btn-edit" onClick={() => openMeetingModal(meeting)}>
                          Edit
                        </button>
                        <button className="btn-delete" onClick={() => deleteMeeting(meeting.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'residents':
        const filteredResidents = selectedSitioFilter 
          ? residents.filter(r => r.sitio === selectedSitioFilter)
          : residents

        return (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Residents Directory</h2>
              <p className="section-subtitle">View all residents and their sitio assignments</p>
            </div>

            <div className="actions-bar">
              <select 
                className="sitio-filter"
                value={selectedSitioFilter}
                onChange={(e) => setSelectedSitioFilter(e.target.value)}
              >
                <option value="">All Sitios ({residents.length} residents)</option>
                {sitios.map(sitio => (
                  <option key={sitio.sitio} value={sitio.sitio}>
                    {sitio.sitio} ({sitio.resident_count} residents)
                  </option>
                ))}
              </select>
              <button className="action-btn" onClick={loadData}>
                <span className="btn-icon">🔄</span>
                Refresh
              </button>
            </div>

            {filteredResidents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No Residents Found</h3>
                <p>{selectedSitioFilter ? `No residents in ${selectedSitioFilter}` : 'No residents registered'}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Sitio</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map(resident => (
                      <tr key={resident.id}>
                        <td className="name-cell">{resident.name}</td>
                        <td><span className="sitio-badge">{resident.sitio || 'N/A'}</span></td>
                        <td>{resident.email}</td>
                        <td>{resident.phone || 'N/A'}</td>
                        <td>{resident.address || 'N/A'}</td>
                        <td>{new Date(resident.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      case 'officials':
        return (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Barangay Officials</h2>
              <p className="section-subtitle">View all barangay officials and administrators</p>
            </div>

            <div className="actions-bar">
              <button className="action-btn" onClick={loadData}>
                <span className="btn-icon">🔄</span>
                Refresh
              </button>
            </div>

            {officials.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👔</div>
                <h3>No Officials Found</h3>
                <p>No officials registered</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officials.map(official => (
                      <tr key={official.id}>
                        <td className="name-cell">{official.name}</td>
                        <td>
                          <span className={`role-badge ${official.role}`}>
                            {official.role === 'barangay_captain' && '⭐ Captain'}
                            {official.role === 'barangay_official' && '👔 Official'}
                            {official.role === 'secretary' && '📝 Secretary'}
                          </span>
                        </td>
                        <td>{official.email}</td>
                        <td>{official.phone || 'N/A'}</td>
                        <td>{official.address || 'N/A'}</td>
                        <td>{new Date(official.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="captain-dashboard-container">
      <header className="dashboard-header">
        <div className="header-main">
          <div className="header-brand">
            <h1 className="brand-title">Barangay Captain Dashboard</h1>
            <span className="brand-subtitle">Meeting Management System</span>
          </div>

          <div className="header-profile">
            <div className="notification-stack">
              <div
                ref={notificationAnchorRef}
                className="notification-pill"
                onClick={() => setShowNotifDropdown(prev => !prev)}
                role="button"
                tabIndex={0}
              >
                <span className="notification-label">Notifications</span>
                {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
              </div>
            </div>

            <div className="profile-info">
              <span className="profile-name">{user?.name || 'Barangay Captain'}</span>
              <span className="profile-role">Captain</span>
            </div>
          </div>
        </div>

        <nav className="dashboard-nav">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'meetings', label: 'Meetings', icon: '📅' },
            { id: 'residents', label: 'Residents', icon: '👥' },
            { id: 'officials', label: 'Officials', icon: '👔' }
          ].map((item, index) => (
            <button 
              key={item.id}
              className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="dashboard-main">
        {renderContent()}
      </main>

      {/* Notification Dropdown Portal */}
      {showNotifDropdown && ReactDOM.createPortal(
        <div
          className={`notif-dropdown${notifDragging ? ' dragging' : ''}`}
          ref={notifDropdownRef}
          role="menu"
          style={{ top: notifPosition.top, left: notifPosition.left }}
        >
          <div
            className="notif-header"
            onMouseDown={startNotifDrag}
            onTouchStart={startNotifDrag}
            style={{ cursor: notifDragging ? 'grabbing' : 'grab' }}
          >
            <strong>Notifications</strong>
            <button className="notif-close" onClick={() => setShowNotifDropdown(false)}>×</button>
          </div>
          <div className="notif-list">
            {notificationsList && notificationsList.length > 0 ? (
              notificationsList.slice(0, 20).map(n => (
                <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`} onClick={() => markNotificationRead(n.id)}>
                  <div className="notif-title">{n.title || n.type}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-meta">
                    <span className="notif-time">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="notif-empty">No notifications</div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Meeting Modal */}
      {showMeetingModal && (
        <Modal>
          <div className="modal-overlay">
            <div className="modal-content meeting-modal">
              <div className="modal-header">
                <h3 className="modal-title">{editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
                <button className="modal-close" onClick={() => { setShowMeetingModal(false); resetMeetingForm(); }}>×</button>
              </div>

              <form onSubmit={handleMeetingSubmit} className="meeting-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="title">Meeting Title *</label>
                    <input
                      type="text"
                      id="title"
                      value={meetingForm.title}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                      placeholder="e.g., Monthly Barangay Officials Meeting"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={meetingForm.description}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, description: e.target.value }))}
                      rows="3"
                      placeholder="Brief description of the meeting"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="meeting_type">Meeting Type *</label>
                    <select
                      id="meeting_type"
                      value={meetingForm.meeting_type}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, meeting_type: e.target.value }))}
                      required
                    >
                      <option value="officials_only">👔 Officials Only</option>
                      <option value="public">👥 Public Meeting (All Residents)</option>
                      <option value="residents">🏘️ Residents Meeting</option>
                      <option value="emergency">🚨 Emergency Meeting</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="target_sitio">Target Sitio (Optional)</label>
                    <select
                      id="target_sitio"
                      value={meetingForm.target_sitio}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, target_sitio: e.target.value }))}
                    >
                      <option value="">All Sitios</option>
                      {sitios.map(sitio => (
                        <option key={sitio.sitio} value={sitio.sitio}>
                          {sitio.sitio} ({sitio.resident_count} residents)
                        </option>
                      ))}
                    </select>
                    <small className="form-hint">Leave blank to notify all sitios</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      type="text"
                      id="location"
                      value={meetingForm.location}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, location: e.target.value }))}
                      required
                      placeholder="e.g., Barangay Hall"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="meeting_date">Date *</label>
                    <input
                      type="date"
                      id="meeting_date"
                      value={meetingForm.meeting_date}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, meeting_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="meeting_time">Time *</label>
                    <input
                      type="time"
                      id="meeting_time"
                      value={meetingForm.meeting_time}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, meeting_time: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="agenda">Agenda</label>
                    <textarea
                      id="agenda"
                      value={meetingForm.agenda}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))}
                      rows="3"
                      placeholder="Meeting agenda items"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="notes">Additional Notes</label>
                    <textarea
                      id="notes"
                      value={meetingForm.notes}
                      onChange={(e) => setMeetingForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows="2"
                      placeholder="Any additional information"
                    />
                  </div>
                </div>

                <div className="meeting-type-info">
                  {meetingForm.meeting_type === 'officials_only' && (
                    <p className="info-text">
                      <span className="info-icon">ℹ️</span>
                      This meeting will only notify barangay officials. Residents will not receive notifications.
                    </p>
                  )}
                  {(meetingForm.meeting_type === 'public' || meetingForm.meeting_type === 'residents') && (
                    <p className="info-text">
                      <span className="info-icon">ℹ️</span>
                      This meeting will notify both barangay officials and residents.
                    </p>
                  )}
                  {meetingForm.meeting_type === 'emergency' && (
                    <p className="info-text warning">
                      <span className="info-icon">⚠️</span>
                      Emergency meeting - All officials and residents will be notified immediately.
                    </p>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => { setShowMeetingModal(false); resetMeetingForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Auto-Schedule Modal */}
      {showAutoScheduleModal && (
        <Modal>
          <div className="modal-overlay">
            <div className="modal-content meeting-modal">
              <div className="modal-header">
                <h3 className="modal-title">Auto-Schedule Meetings for All Sitios</h3>
                <button className="modal-close" onClick={() => setShowAutoScheduleModal(false)}>×</button>
              </div>

              <form onSubmit={handleAutoScheduleSubmit} className="meeting-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="title_template">Meeting Title Template *</label>
                    <input
                      type="text"
                      id="title_template"
                      value={autoScheduleForm.title_template}
                      onChange={(e) => setAutoScheduleForm(prev => ({ ...prev, title_template: e.target.value }))}
                      required
                      placeholder="Use {sitio} as placeholder, e.g., 'Sitio {sitio} Meeting'"
                    />
                    <small className="form-hint">Use {'{sitio}'} as placeholder for sitio name</small>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="auto_description">Description</label>
                    <textarea
                      id="auto_description"
                      value={autoScheduleForm.description}
                      onChange={(e) => setAutoScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                      rows="3"
                      placeholder="Meeting description (same for all sitios)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="auto_meeting_type">Meeting Type *</label>
                    <select
                      id="auto_meeting_type"
                      value={autoScheduleForm.meeting_type}
                      onChange={(e) => setAutoScheduleForm(prev => ({ ...prev, meeting_type: e.target.value }))}
                      required
                    >
                      <option value="public">👥 Public Meeting</option>
                      <option value="residents">🏘️ Residents Meeting</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location_template">Location Template *</label>
                    <input
                      type="text"
                      id="location_template"
                      value={autoScheduleForm.location_template}
                      onChange={(e) => setAutoScheduleForm(prev => ({ ...prev, location_template: e.target.value }))}
                      required
                      placeholder="e.g., 'Sitio {sitio} Hall'"
                    />
                    <small className="form-hint">Use {'{sitio}'} as placeholder</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="start_date">Start Date *</label>
                    <input
                      type="date"
                      id="start_date"
                      value={autoScheduleForm.start_date}
                      onChange={(e) => setAutoScheduleForm(prev => ({ ...prev, start_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="start_time">Start Time *</label>
                    <input
                      type="time"
                      id="start_time"
                      value={autoScheduleForm.start_time}
                      onChange={(e) => setAutoScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="duration_minutes">Meeting Duration (minutes) *</label>
                    <input
                      type="number"
                      id="duration_minutes"
                      value={autoScheduleForm.duration_minutes}
                      onChange={(e) => setAutoScheduleForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                      required
                      min="15"
                      max="480"
                      step="15"
                    />
                    <small className="form-hint">Time between each sitio meeting</small>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="auto_agenda">Agenda</label>
                    <textarea
                      id="auto_agenda"
                      value={autoScheduleForm.agenda}
                      onChange={(e) => setAutoScheduleForm(prev => ({ ...prev, agenda: e.target.value }))}
                      rows="3"
                      placeholder="Meeting agenda (same for all)"
                    />
                  </div>
                </div>

                <div className="meeting-type-info">
                  <p className="info-text">
                    <span className="info-icon">ℹ️</span>
                    This will create {sitios.length} meetings, one for each sitio, starting at the specified time with {autoScheduleForm.duration_minutes} minutes between each.
                  </p>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowAutoScheduleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Schedule All ({sitios.length} meetings)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default BarangayCaptainDashboard
