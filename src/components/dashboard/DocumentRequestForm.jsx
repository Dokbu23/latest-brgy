// DocumentRequestForm.jsx - Dynamic & Functional with Secretary Integration
import { useState, useEffect } from 'react'
import axios from '../../api/setupAxios'
import Swal from 'sweetalert2'
import './DocumentRequestForm.css'

const DocumentRequestForm = ({ onCreated }) => {
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Available document types
  const availableDocuments = [
    { id: 'barangay_clearance', label: '🏠 Barangay Clearance', description: 'For employment or travel' },
    { id: 'certificate_indigency', label: '📜 Certificate of Indigency', description: 'For assistance programs' },
    { id: 'residency_cert', label: '🏡 Certificate of Residency', description: 'Proof of residency' },
  ]




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
        notes: notes.trim() || null,// Allow null if no secretaries
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

  const selectedDoc = getDocumentInfo(type)

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

        {/* Urgency removed */}

        {/* Secretary assignment removed */}

        {/* Notes */}
        <div className="form-section">
          <label className="section-label">Purpose (this will appear on the issued document)</label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            rows={4}
            className="textarea-input"
            placeholder="Describe the purpose for this document (e.g., employment, travel, school enrollment). This text will appear on the issued document."
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
              <span className="summary-label">Document:</span>
              <span className="summary-value">{selectedDoc?.label}</span>
            </div>
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