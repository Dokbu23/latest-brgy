import { useEffect, useState } from 'react'
import axios from '../../../api/setupAxios'
import '../SecretaryDashboard.css'

const SecretaryRequestsList = ({ onUpdate }) => {
  const [requests, setRequests] = useState([])
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [message, setMessage] = useState(null)

  const load = async () => {
    setError(null)
    try {
      const res = await axios.get('/api/document-requests')
      const data = res.data?.data?.data || res.data?.data || []
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Load document requests:', err)
      setError('Failed to load requests. Please try again.')
    }
  }

  useEffect(() => { 
    load() 
  }, [])

  const updateRequest = async (id, status) => {
    setUpdating(id)
    try {
      await axios.patch(`/api/document-requests/${id}`, { status })
      setMessage({ type: 'success', text: `Request ${status} successfully!` })
      setTimeout(() => setMessage(null), 3000)
      await load()
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Update request:', err)
      setMessage({ type: 'error', text: 'Failed to update request. Please try again.' })
    } finally {
      setUpdating(null)
    }
  }

  const filteredRequests = requests.filter(req => 
    filter === 'all' ? true : req.status === filter
  )

  if (error) {
    return (
      <div className="error-state">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button className="retry-btn" onClick={load}>🔄 Try Again</button>
      </div>
    )
  }

  return (
    <div className="requests-list-container">
      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({requests.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          📬 Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          ✅ Approved ({requests.filter(r => r.status === 'approved').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          ❌ Rejected ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>No {filter === 'all' ? 'requests' : `${filter} requests`} found.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((req) => (
            <div key={req.id} className="request-card">
              <div className="request-header">
                <div className="request-type-badge">
                  {req.type.charAt(0).toUpperCase() + req.type.slice(1)}
                </div>
                <div className={`status-badge status-${req.status}`}>
                  {req.status === 'pending' && '📬'}
                  {req.status === 'approved' && '✅'}
                  {req.status === 'rejected' && '❌'}
                  {' ' + req.status.toUpperCase()}
                </div>
              </div>

              <div className="request-body">
                <div className="request-resident">
                  <span className="resident-icon">👤</span>
                  <div>
                    <div className="resident-name">{req.user?.name || 'Unknown Resident'}</div>
                    <div className="resident-email">{req.user?.email || 'No email'}</div>
                  </div>
                </div>

                <div className="request-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  {req.urgency && (
                    <div className={`meta-item urgency-${req.urgency}`}>
                      <span className="meta-icon">
                        {req.urgency === 'low' && '⏳'}
                        {req.urgency === 'normal' && '⏱️'}
                        {req.urgency === 'high' && '⚡'}
                        {req.urgency === 'urgent' && '🔴'}
                      </span>
                      <span>{req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}</span>
                    </div>
                  )}
                </div>

                {req.notes && (
                  <div className="request-notes">
                    <strong>Notes:</strong> {req.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              {req.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="action-btn approve-btn"
                    onClick={() => updateRequest(req.id, 'approved')}
                    disabled={updating === req.id}
                  >
                    {updating === req.id ? '⏳ Processing...' : '✅ Approve'}
                  </button>
                  <button 
                    className="action-btn reject-btn"
                    onClick={() => updateRequest(req.id, 'rejected')}
                    disabled={updating === req.id}
                  >
                    {updating === req.id ? '⏳ Processing...' : '❌ Reject'}
                  </button>
                </div>
              )}
              {req.status !== 'pending' && (
                <div className="request-completed">
                  ✅ {req.status.toUpperCase()} {req.processed_at ? `on ${new Date(req.processed_at).toLocaleDateString()}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SecretaryRequestsList
