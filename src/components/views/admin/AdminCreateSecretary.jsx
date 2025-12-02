import { useState } from 'react'
import axios from '../../../api/setupAxios'
import Swal from 'sweetalert2'
import './AdminCreateSecretary.css'

const AdminCreateSecretary = ({ onCreated }) => {
  const [data, setData] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!data.name.trim()) newErrors.name = 'Name is required'
    if (!data.email.trim()) newErrors.email = 'Email is required'
    if (!data.password) newErrors.password = 'Password is required'
    if (data.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (data.password !== data.password_confirmation) newErrors.password_confirmation = 'Passwords do not match'
    return newErrors
  }

  const submit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setMessage('')
    setLoading(true)

    try {
      await axios.get('/sanctum/csrf-cookie')
      const res = await axios.post('/api/admin/create-secretary', data)
      setData({ name: '', email: '', password: '', password_confirmation: '' })
      setMessage('')
      onCreated && onCreated()
      
      Swal.fire({
        icon: 'success',
        title: 'Secretary Created',
        text: `${data.name} has been successfully added as a secretary!`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500
      })
    } catch (err) {
      setMessageType('error')
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create secretary'
      setMessage('❌ ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setData({ ...data, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  return (
    <div className="create-secretary-container">
      <div className="form-card">
        <div className="form-header">
          <h3 className="form-title">👤 Create New Secretary Account</h3>
          <p className="form-subtitle">Add a new secretary to manage document requests</p>
        </div>

        <form onSubmit={submit} className="secretary-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g., Maria Santos"
              value={data.name}
              onChange={handleChange}
              disabled={loading}
              className={`form-input ${errors.name ? 'error' : ''}`}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="e.g., maria.santos@barangay.gov.ph"
              value={data.email}
              onChange={handleChange}
              disabled={loading}
              className={`form-input ${errors.email ? 'error' : ''}`}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={data.password}
                onChange={handleChange}
                disabled={loading}
                className={`form-input ${errors.password ? 'error' : ''}`}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password_confirmation" className="form-label">Confirm Password</label>
              <input
                id="password_confirmation"
                type="password"
                name="password_confirmation"
                placeholder="••••••••"
                value={data.password_confirmation}
                onChange={handleChange}
                disabled={loading}
                className={`form-input ${errors.password_confirmation ? 'error' : ''}`}
              />
              {errors.password_confirmation && <span className="error-message">{errors.password_confirmation}</span>}
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-button"
          >
            ⚙ Create Secretary
          </button>
        </form>

        {message && (
          <div className={`message-box message-${messageType}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCreateSecretary
