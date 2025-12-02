import { useState } from 'react'
import axios from 'axios'
import './RegisterResidentModal.css'

const RegisterResidentModal = ({ isOpen, onClose, onRegistered }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    barangay: '',
    phone: '',
    address: '',
    birthdate: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get CSRF cookie (session-based auth)
      await axios.get('/sanctum/csrf-cookie')

      const response = await axios.post('/api/register/resident', form)

      // API returns structure with user under data.data.user
      const user = response.data?.data?.user
      if (user) {
        onRegistered && onRegistered(user)
        onClose()
      } else {
        setError('Registration succeeded but no user returned')
      }
    } catch (err) {
      console.error('Register error:', err)
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rrm-backdrop">
      <div className="rrm-modal">
        <div className="rrm-header">
          <h3>Register Resident</h3>
          <button className="rrm-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="rrm-error">{error}</div>}

        <form className="rrm-form" onSubmit={handleSubmit}>
          <div className="rrm-row">
            <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="rrm-row">
            <input name="barangay" placeholder="Barangay" value={form.barangay} onChange={handleChange} required />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
          </div>

          <div className="rrm-row">
            <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
            <input name="birthdate" type="date" placeholder="Birthdate" value={form.birthdate} onChange={handleChange} />
          </div>

          <div className="rrm-row">
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <input name="password_confirmation" type="password" placeholder="Confirm password" value={form.password_confirmation} onChange={handleChange} required />
          </div>

          <div className="rrm-actions">
            <button type="button" className="rrm-btn rrm-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="rrm-btn rrm-btn-primary" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterResidentModal
