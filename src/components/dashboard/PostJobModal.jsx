import { useState } from 'react'
import axios from 'axios'
import './RegisterResidentModal.css'

const PostJobModal = ({ isOpen, onClose, onPosted }) => {
  const [form, setForm] = useState({
    title: '',
    company: '',
    type: '',
    salary: '',
    description: '',
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
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rrm-backdrop">
      <div className="rrm-modal">
        <div className="rrm-header">
          <h3>Post Job</h3>
          <button className="rrm-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="rrm-error">{error}</div>}

        <form className="rrm-form" onSubmit={handleSubmit}>
          <div className="rrm-row">
            <input name="title" placeholder="Job title" value={form.title} onChange={handleChange} required />
            <input name="company" placeholder="Company" value={form.company} onChange={handleChange} required />
          </div>

          <div className="rrm-row">
            <input name="type" placeholder="Type (Full-time/Part-time)" value={form.type} onChange={handleChange} />
            <input name="salary" placeholder="Salary" value={form.salary} onChange={handleChange} />
          </div>

          <div className="rrm-row">
            <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} style={{ flex: 1 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="urgent" checked={form.urgent} onChange={handleChange} />
              Mark as urgent
            </label>
            <div className="rrm-actions">
              <button type="button" className="rrm-btn rrm-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="rrm-btn rrm-btn-primary" disabled={loading}>{loading ? 'Posting...' : 'Post Job'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostJobModal
