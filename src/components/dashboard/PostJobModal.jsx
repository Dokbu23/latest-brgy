// PostJobModal.jsx - Redesigned
import { useState } from 'react'
import axios from '../../api/setupAxios'

const PostJobModal = ({ isOpen, onClose, onPosted }) => {
  const [form, setForm] = useState({
    title: '',
    company: '',
    type: '',
    salary: '',
    description: '',
    requirements: '',
    urgent: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await axios.get('/sanctum/csrf-cookie')
      const response = await axios.post('/api/job-listings', form)
      const job = response.data?.data
      if (job) {
        onPosted && onPosted(job)
        onClose()
      } else {
        setError('Job posted but no data returned')
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to post job')
    }
  }

  return (
    <div className="modern-modal-overlay">
      <div className="modern-modal large">
        <div className="modal-header">
          <h3 className="modal-title">Post New Job Opportunity</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="modern-message error">{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="modern-label">Job Title *</label>
              <input 
                name="title" 
                placeholder="e.g. Administrative Assistant" 
                value={form.title} 
                onChange={handleChange} 
                className="modern-input"
                required 
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Company/Employer *</label>
              <input 
                name="company" 
                placeholder="e.g. Barangay Hall" 
                value={form.company} 
                onChange={handleChange} 
                className="modern-input"
                required 
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Employment Type</label>
              <select 
                name="type" 
                value={form.type} 
                onChange={handleChange}
                className="modern-select"
              >
                <option value="">Select type...</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div className="form-group">
              <label className="modern-label">Salary Range</label>
              <input 
                name="salary" 
                placeholder="e.g. ₱15,000 - ₱20,000/month" 
                value={form.salary} 
                onChange={handleChange} 
                className="modern-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="modern-label">Job Description</label>
            <textarea 
              name="description" 
              placeholder="Describe the job responsibilities and role..."
              value={form.description} 
              onChange={handleChange} 
              rows={4}
              className="modern-textarea"
            />
          </div>

          <div className="form-group">
            <label className="modern-label">Requirements</label>
            <textarea 
              name="requirements" 
              placeholder="List any required qualifications or skills..."
              value={form.requirements} 
              onChange={handleChange} 
              rows={3}
              className="modern-textarea"
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                name="urgent" 
                checked={form.urgent} 
                onChange={handleChange} 
                className="modern-checkbox"
              />
              <span className="checkmark"></span>
              Mark as urgent hiring
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="modern-button secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="modern-button primary">
              Post Job Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostJobModal