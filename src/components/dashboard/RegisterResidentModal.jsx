// RegisterResidentModal.jsx - Redesigned
import { useState } from 'react'
import axios from '../../api/setupAxios'
import './dashboard-forms.css'

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
    setError('')

    try {
      await axios.get('/sanctum/csrf-cookie')
      const response = await axios.post('/api/register/resident', form)
      const user = response.data?.data?.user
      if (user) {
        onRegistered && onRegistered(user)
        onClose()
        setForm({
          name: '', email: '', password: '', password_confirmation: '',
          barangay: '', phone: '', address: '', birthdate: ''
        })
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
    <div className="modern-modal-overlay">
      <div className="modern-modal large">
        <div className="modal-header">
          <h3 className="modal-title">Register New Resident</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="modern-message error">{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="modern-label">Full Name *</label>
              <input 
                name="name" 
                placeholder="Enter resident's full name" 
                value={form.name} 
                onChange={handleChange} 
                className="modern-input"
                required 
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Email Address *</label>
              <input 
                name="email" 
                type="email" 
                placeholder="resident@example.com" 
                value={form.email} 
                onChange={handleChange} 
                className="modern-input"
                required 
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Sitio *</label>
              <select
                name="barangay"
                value={form.barangay}
                onChange={handleChange}
                className="modern-input"
                required
              >
                <option value="">Select Sitio</option>
                <option value="Canlumon 1">Canlumon 1</option>
                <option value="Canlumon 2">Canlumon 2</option>
                <option value="Landing 1">Landing 1</option>
                <option value="Landing 2">Landing 2</option>
                <option value="Langawin">Langawin</option>
                <option value="Banlanga 1">Banlanga 1</option>
                <option value="Banlanga 2">Banlanga 2</option>
                <option value="Parang">Parang</option>
                <option value="Barubo">Barubo</option>
                <option value="Centro">Centro</option>
                <option value="Laiya">Laiya</option>
                <option value="Sinampad">Sinampad</option>
                <option value="Palaypay">Palaypay</option>
              </select>
            </div>

            <div className="form-group">
              <label className="modern-label">Phone Number</label>
              <input 
                name="phone" 
                placeholder="+63 XXX XXX XXXX" 
                value={form.phone} 
                onChange={handleChange} 
                className="modern-input"
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Complete Address</label>
              <input 
                name="address" 
                placeholder="Street, Zone, City" 
                value={form.address} 
                onChange={handleChange} 
                className="modern-input"
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Date of Birth</label>
              <input 
                name="birthdate" 
                type="date" 
                value={form.birthdate} 
                onChange={handleChange} 
                className="modern-input"
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Password *</label>
              <input 
                name="password" 
                type="password" 
                placeholder="Create secure password" 
                value={form.password} 
                onChange={handleChange} 
                className="modern-input"
                required 
              />
            </div>

            <div className="form-group">
              <label className="modern-label">Confirm Password *</label>
              <input 
                name="password_confirmation" 
                type="password" 
                placeholder="Re-enter password" 
                value={form.password_confirmation} 
                onChange={handleChange} 
                className="modern-input"
                required 
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modern-button secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="modern-button primary">
              Complete Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterResidentModal