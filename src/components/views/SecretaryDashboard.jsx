import { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import axios from '../../api/setupAxios'
import SecretaryRequestsList from './secretary/SecretaryRequestsList'
import './SecretaryDashboard.css'

const SecretaryDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Notification state
  const [notificationsList, setNotificationsList] = useState([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [notifPosition, setNotifPosition] = useState({ top: 0, left: 0 })
  const [notifDragging, setNotifDragging] = useState(false)
  const notifDragData = useRef({ active: false, offsetX: 0, offsetY: 0 })
  const notificationAnchorRef = useRef(null)
  const notifDropdownRef = useRef(null)

  // Fetch stats and notifications
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, notifRes] = await Promise.all([
          axios.get('/api/document-requests'),
          axios.get('/api/notifications').catch(() => ({ data: { data: [] } }))
        ])
        
        const requests = reqRes.data?.data?.data || reqRes.data?.data || []
        const stats = {
          pending: requests.filter(r => r.status === 'pending').length,
          approved: requests.filter(r => r.status === 'approved').length,
          rejected: requests.filter(r => r.status === 'rejected').length,
          total: requests.length
        }
        setStats(stats)

        const notificationsData = notifRes.data?.data || []
        setNotificationsList(Array.isArray(notificationsData) ? notificationsData : [])
      } catch (err) {
        console.error('Fetch data:', err)
      }
    }
    fetchData()
  }, [refreshTrigger])

  // Notification functions
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

  return (
    <div className="secretary-dashboard">
      {/* Header */}
      <div className="secretary-header">
        <div className="header-content">
          <h1 className="header-title">Secretary Dashboard</h1>
          <p className="header-subtitle">Manage document requests and resident inquiries</p>
        </div>
        <div className="header-actions">
          <button
            ref={notificationAnchorRef}
            className="notification-btn"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
          >
            <span className="notif-text">Notifications</span>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <div className="header-profile">
            <span className="profile-name">{user?.name || 'User'}</span>
            <span className="profile-role">Secretary</span>
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifDropdown && ReactDOM.createPortal(
        <div
          ref={notifDropdownRef}
          className="notif-dropdown"
          style={{
            position: 'fixed',
            top: `${notifPosition.top}px`,
            left: `${notifPosition.left}px`,
            zIndex: 9999
          }}
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
                  <div className="notif-title">{n.data?.title || n.type}</div>
                  <div className="notif-message">{n.data?.message || ''}</div>
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

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="requests-section">
        <div className="section-header">
          <h2 className="section-title">Document Requests</h2>
          <button 
            className="refresh-btn"
            onClick={() => setRefreshTrigger(t => t + 1)}
          >
            Refresh
          </button>
        </div>
        <SecretaryRequestsList 
          key={refreshTrigger}
          onUpdate={() => setRefreshTrigger(t => t + 1)} 
        />
      </div>
    </div>
  )
}

export default SecretaryDashboard
