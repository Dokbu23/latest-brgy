// JobDetailModal.jsx - Redesigned
import React from 'react'

const JobDetailModal = ({ isOpen, onClose, job, onApply, applied, applying }) => {
  if (!isOpen || !job) return null

  return (
    <div className="modern-modal-overlay">
      <div className="modern-modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{job.title}</h3>
            <p className="modal-subtitle">{job.employer}</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Salary Range</span>
              <span className="detail-value highlight">{job.salary}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Employment Type</span>
              <span className="detail-value">{job.type || 'Full-time'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className={`status-tag ${job.status}`}>{job.status}</span>
            </div>
          </div>

          {job.description && (
            <div className="description-section">
              <h4 className="section-title">Job Description</h4>
              <p className="description-text">{job.description}</p>
            </div>
          )}

          {job.requirements && (
            <div className="requirements-section">
              <h4 className="section-title">Requirements</h4>
              <p className="requirements-text">{job.requirements}</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {applied ? (
            <div className="applied-status">
              <span className="applied-badge">Application Submitted</span>
              <p className="applied-note">Your application has been received</p>
            </div>
          ) : (
            <button
              className={`modern-button primary large ${applying ? 'loading' : ''}`}
              onClick={onApply}
              disabled={applying}
            >
              {applying ? 'Submitting Application...' : 'Apply for this Position'}
            </button>
          )}
          <button className="modern-button secondary" onClick={onClose}>
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default JobDetailModal