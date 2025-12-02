import { useEffect, useState } from 'react'
import axios from '../../../api/setupAxios'
import AdminCreateSecretary from './AdminCreateSecretary'
import './AdminRequestsList.css'

const AdminRequestsList = () => {
  const [requests, setRequests] = useState([])
  const [secretaries, setSecretaries] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const load = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        axios.get('/api/document-requests'),
        axios.get('/api/document-requests/secretaries')
      ])
      const rData = rRes.data && rRes.data.data ? (rRes.data.data.data || rRes.data.data) : []
      setRequests(rData)
      setSecretaries(sRes.data && sRes.data.data ? sRes.data.data : [])
    } catch (err) {
      console.error('Load admin requests', err)
      setMessageType('error')
      setMessage('❌ Failed to load requests')
    }
  }

  useEffect(() => { load() }, [])

  const assign = async (id, assigned_to) => {
    try {
      await axios.patch(`/api/document-requests/${id}`, { assigned_to })
      setMessageType('success')
      setMessage('✅ Request assigned successfully')
      setTimeout(() => setMessage(''), 3000)
      await load()
    } catch (err) {
      console.error(err)
      setMessageType('error')
      setMessage('❌ Failed to assign request')
    }
  }

  const setStatus = async (id, status) => {
    try {
      await axios.patch(`/api/document-requests/${id}`, { status })
      setMessageType('success')
      setMessage(`✅ Request ${status}`)
      setTimeout(() => setMessage(''), 3000)
      await load()
    } catch (err) {
      console.error(err)
      setMessageType('error')
      setMessage('❌ Failed to update status')
    }
  }

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === statusFilter)

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'approved': 'green',
      'rejected': 'red',
      'completed': 'blue'
    }
    return colors[status] || 'gray'
  }

  const getStatusEmoji = (status) => {
    const emojis = {
      'pending': '⏳',
      'approved': '✅',
      'rejected': '❌',
      'completed': '✓'
    }
    return emojis[status] || '•'
  }

  // Note: loading spinner removed so the admin requests render immediately.

  return (
    <div className="requests-list-container">
      {message && (
        <div className={`message-banner message-${messageType}`}>
          {message}
        </div>
      )}

      <div className="requests-header">
        <h3 className="requests-title">📄 Document Requests Management</h3>
        <p className="requests-subtitle">Manage and assign document requests to secretaries</p>
      </div>

      <div className="filter-tabs">
        {[
          { label: 'All Requests', value: 'all', count: requests.length },
          { label: 'Pending', value: 'pending', count: requests.filter(r => r.status === 'pending').length },
          { label: 'Approved', value: 'approved', count: requests.filter(r => r.status === 'approved').length },
          { label: 'Rejected', value: 'rejected', count: requests.filter(r => r.status === 'rejected').length }
        ].map(tab => (
          <button
            key={tab.value}
            className={`filter-tab ${statusFilter === tab.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h4 className="empty-title">No requests found</h4>
          <p className="empty-description">
            {statusFilter === 'all' 
              ? 'There are no document requests yet' 
              : `No ${statusFilter} requests at the moment`}
          </p>
        </div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((r) => (
            <div key={r.id} className="request-card">
              <div className="request-header">
                <div className="request-type">
                  <div className="type-icon">📄</div>
                  <div>
                    <div className="type-name">{r.type || 'Document Request'}</div>
                    <div className="request-id">ID: #{r.id}</div>
                  </div>
                </div>
                <div className={`status-badge status-${getStatusColor(r.status)}`}>
                  {getStatusEmoji(r.status)} {r.status.toUpperCase()}
                </div>
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">👤 Requested by:</span>
                  <span className="detail-value">{r.user?.name || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📧 Email:</span>
                  <span className="detail-value">{r.user?.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📝 Notes:</span>
                  <span className="detail-value detail-notes">{r.notes || 'No additional notes'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📅 Date:</span>
                  <span className="detail-value">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="request-actions">
                <div className="assign-section">
                  <label className="assign-label">Assign to Secretary:</label>
                  <select 
                    value={r.assigned_to || ''} 
                    onChange={(e) => assign(r.id, e.target.value)}
                    className="assign-select"
                  >
                    <option value="">-- Select Secretary --</option>
                    {secretaries.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {r.assigned_to && (
                    <div className="assigned-info">
                      ✓ Assigned to: {secretaries.find(s => s.id === r.assigned_to)?.name}
                    </div>
                  )}
                </div>

                <div className="action-buttons">
                  {r.status !== 'approved' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => setStatus(r.id, 'approved')}
                      title="Approve this request"
                    >
                      ✓ Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button 
                      className="btn btn-danger"
                      onClick={() => setStatus(r.id, 'rejected')}
                      title="Reject this request"
                    >
                      ✕ Reject
                    </button>
                  )}
                  {r.status === 'approved' && (
                    <button 
                      className="btn btn-info"
                      onClick={() => setStatus(r.id, 'completed')}
                      title="Mark as completed"
                    >
                      ✓ Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="create-secretary-section">
        <AdminCreateSecretary onCreated={() => load()} />
      </div>
    </div>
  )
}

export default AdminRequestsList
