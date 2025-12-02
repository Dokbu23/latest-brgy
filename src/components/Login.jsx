// src/components/Login.jsx
import { useState } from 'react'
import axios from 'axios'
import './Login.css'

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    barangay: '',
    phone: '',
    address: '',
    birthdate: '',
    role: 'resident'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get CSRF token first
      await axios.get('/sanctum/csrf-cookie')
      
      let response
      
      if (isLogin) {
        response = await axios.post('/api/login', {
          email: formData.email,
          password: formData.password
        })
      } else {
        response = await axios.post('/api/register', formData)
      }

      // Response structure: { data: { user: {...} }, message: "...", status: 200 }
      if (response.data && response.data.data && response.data.data.user) {
        onLogin(response.data.data.user)
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.response?.data?.error || err.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <h2>🏢</h2>
          </div>
          <h1>Barangay Local Employment & Skills Monitoring Portal</h1>
          <p>{isLogin ? 'Sign in to your account' : 'Create new account'}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Barangay</label>
                  <select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Barangay</option>
                    <option value="Barangay 1">Barangay 1</option>
                    <option value="Barangay 2">Barangay 2</option>
                    <option value="Barangay 3">Barangay 3</option>
                    <option value="Barangay 4">Barangay 4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Birthdate</label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="resident">Resident</option>
                    <option value="hr_manager">HR Manager</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
            >
              {isLogin ? 'Register here' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login