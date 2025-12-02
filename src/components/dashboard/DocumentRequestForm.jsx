// DocumentRequestForm.jsx - Dynamic & Functional with Secretary Integration
import { useState, useEffect } from 'react'
import axios from '../../api/setupAxios'
import Swal from 'sweetalert2'
import './DocumentRequestForm.css'

const DocumentRequestForm = ({ onCreated }) => {
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState(null);
  const [secretaries, setSecretaries] = useState([]);
  const [assignTo, setAssignTo] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [urgency, setUrgency] = useState('normal');
  const [loading, setLoading] = useState(false);

  // Available document types
  const availableDocuments = [
    { id: 'barangay_clearance', label: '🏠 Barangay Clearance', description: 'For employment or travel' },
    { id: 'certificate_indigency', label: '📜 Certificate of Indigency', description: 'For assistance programs' },
    { id: 'residency_cert', label: '🏡 Certificate of Residency', description: 'Proof of residency' },
    { id: 'good_moral', label: '✅ Good Moral Certificate', description: 'Character reference' },
    { id: 'business_permit', label: '🏢 Business Permit', description: 'For business operations' },
    { id: 'permit_fiesta', label: '🎉 Permit to Fiesta', description: 'For fiesta events' },
    { id: 'birth_cert', label: '👶 Birth Certificate', description: 'Official birth record' },
    { id: 'death_cert', label: '🪦 Death Certificate', description: 'Official death record' },
    { id: 'blotter_cert', label: '📋 Blotter Certificate', description: 'Police records' },
    { id: 'other', label: '📄 Other', description: 'Custom document request' }
  ]

  const urgencyLevels = [
    { value: 'low', label: '⏳ Low - 5-7 days', color: '#64748B' },
    { value: 'normal', label: '⏱️ Normal - 2-3 days', color: '#3B82F6' },
    { value: 'high', label: '⚡ High - Next day', color: '#F59E0B' },
    { value: 'urgent', label: '🔴 Urgent - Same day', color: '#EF4444' }
  ]

  // Fetch secretaries on mount
  useEffect(() => {
    const fetchSecretaries = async () => {
      try {
        const res = await axios.get('/api/secretaries')
        setSecretaries(res.data.data || [])
        if (res.data.data && res.data.data.length > 0) {
          setAssignTo(res.data.data[0].id)
        }
      } catch (err) {
        console.error('Fetch secretaries:', err)
      }
    }
    fetchSecretaries()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!type) {
      setMessage({ type: 'error', text: '❌ Please select a document type.' })
      return
    }

    setMessage(null)
    setLoading(true)

    try {
      const payload = {
        type,
        notes: notes.trim() || null,
        urgency,
        assigned_to: assignTo || null  // Allow null if no secretaries
      }

      // Ensure Laravel CSRF cookie is set for session-based protection
      // This endpoint sets the `XSRF-TOKEN` cookie that Axios will use automatically
      // await axios.get('/sanctum/csrf-cookie')  // Removed for token auth

      const res = await axios.post('/api/document-requests', payload)
      
      // Show success alert
      Swal.fire({
        icon: 'success',
        title: 'Request submitted',
        text: 'Your document request was submitted successfully. The administrator will assign it to a secretary.',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      })

      // Reset form
      setType('')
      setNotes('')
      setUrgency('normal')

      if (onCreated) onCreated(res.data.data)
    } catch (err) {
      console.error('Create document request:', err)
      const errorText = err?.response?.data?.message || 'Failed to submit request. Please try again.'
      setMessage({ type: 'error', text: `❌ ${errorText}` })
    } finally {
      setLoading(false)
    }
  }

  const getDocumentInfo = (docId) => {
    return availableDocuments.find(d => d.id === docId)
  }

  const getUrgencyInfo = (level) => {
    return urgencyLevels.find(u => u.value === level)
  }

  const selectedDoc = getDocumentInfo(type)
  const selectedUrgency = getUrgencyInfo(urgency)

  return (
    <div className="document-request-form">
      <div className="form-header">
        <div className="form-header-content">
          <h3 className="form-title">📋 Request a Document</h3>
          <p className="form-subtitle">Submit a document request and assign it to a secretary for processing</p>
        </div>
      </div>

      <form onSubmit={submit} className="request-form">
        {/* Document Type Selection */}
        <div className="form-section">
          <label className="section-label">Select Document Type *</label>
          <div className="document-grid">
            {availableDocuments.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className={`document-option ${type === doc.id ? 'selected' : ''}`}
                onClick={() => setType(doc.id)}
              >
                <div className="option-icon">{doc.label.split(' ')[0]}</div>
                <div className="option-content">
                  <div className="option-label">{doc.label}</div>
                  <div className="option-description">{doc.description}</div>
                </div>
                {type === doc.id && <div className="option-checkmark">✓</div>}
              </button>
            ))}
          </div>
          {selectedDoc && (
            <div className="selection-feedback">
              <span className="feedback-icon">✅</span>
              Selected: <strong>{selectedDoc.label}</strong>
            </div>
          )}
        </div>

        {/* Urgency Level */}
        <div className="form-section">
          <label className="section-label">Urgency Level *</label>
          <div className="urgency-grid">
            {urgencyLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                className={`urgency-option ${urgency === level.value ? 'selected' : ''}`}
                onClick={() => setUrgency(level.value)}
                style={{
                  borderColor: urgency === level.value ? level.color : '#e2e8f0',
                  backgroundColor: urgency === level.value ? `${level.color}15` : '#f8fafc'
                }}
              >
                <div className="urgency-label">{level.label}</div>
                {urgency === level.value && <div className="urgency-checkmark">✓</div>}
              </button>
            ))}
          </div>
          {selectedUrgency && (
            <div className="selection-feedback" style={{ borderLeftColor: selectedUrgency.color }}>
              <span className="feedback-icon">⏱️</span>
              Urgency: <strong>{selectedUrgency.label}</strong>
            </div>
          )}
        </div>

        {/* Secretary Assignment */}
        <div className="form-section">
          <label className="section-label">Assign to Secretary (Optional)</label>
          {secretaries.length > 0 ? (
            <div className="secretary-select">
              <select 
                value={assignTo} 
                onChange={e => setAssignTo(e.target.value)}
                className="select-input"
              >
                <option value="">-- Auto-assign to available secretary --</option>
                {secretaries.map((secretary) => (
                  <option key={secretary.id} value={secretary.id}>
                    👤 {secretary.name} ({secretary.email})
                  </option>
                ))}
              </select>
              <div className="select-icon">▼</div>
            </div>
          ) : (
            <div className="no-secretary">
              <span className="info-icon">ℹ️</span>
              <div>
                <p>No secretaries available yet</p>
                <p className="info-text">Your request will be queued and assigned to the next available secretary. You can check status anytime.</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="form-section">
          <label className="section-label">Additional Notes (Optional)</label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            rows={4}
            className="textarea-input"
            placeholder="Add any special requirements, specific details, or notes about your request..."
            maxLength={500}
          />
          <div className="char-count">{notes.length}/500 characters</div>
        </div>

        {/* Request Summary */}
        {type && (
          <div className="request-summary">
            <div className="summary-title">📌 Request Summary</div>
            <div className="summary-item">
              <span className="summary-label">Document:</span>
              <span className="summary-value">{selectedDoc?.label}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Urgency:</span>
              <span className="summary-value">{selectedUrgency?.label}</span>
            </div>
            {assignTo && (
              <div className="summary-item">
                <span className="summary-label">Secretary:</span>
                <span className="summary-value">
                  {secretaries.find(s => s.id == assignTo)?.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={!type || loading}
          >
            <span>✓</span> {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button 
            type="reset" 
            className="reset-button"
            onClick={() => {
              setType('')
              setNotes('')
              setUrgency('normal')
              setMessage(null)
            }}
            disabled={loading}
          >
            🔄 Reset
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`form-message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              {message.type === 'success' && (
                <div className="message-timer">
                  <div className="timer-bar"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default DocumentRequestForm