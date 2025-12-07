// src/components/Login.jsx
import { useState } from 'react'
import axios from '../api/setupAxios'
import Swal from 'sweetalert2'
import safeStorage from '../utils/safeStorage'
import './Login.css'

const Login = ({ onLogin }) => {
  const [activeView, setActiveView] = useState(null) // null = landing, 'login', 'register'
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

  const isLogin = activeView === 'login'
  const isRegister = activeView === 'register'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const switchView = (view) => {
    setActiveView(view)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let response
      if (isLogin) {
        response = await axios.post('/api/login', {
          email: formData.email,
          password: formData.password
        })
      } else {
        response = await axios.post('/api/register/resident', formData)
      }

      if (response.data?.data?.user) {
        if (response.data.data.token) {
          try {
            safeStorage.setItem('auth_token', response.data.data.token)
          } catch (e) {
            console.warn('Cannot save token:', e?.message)
          }
        }
        Swal.fire({
          icon: 'success',
          title: isLogin ? 'Welcome back!' : 'Account Created!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500
        })
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

  // Landing view
  if (!activeView) {
    return (
      <div className="landing-container">
        {/* Floating shapes */}
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>

        <header className="landing-nav">
          <div className="nav-brand">
            <span>Barangay B. Del Mundo</span>
          </div>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => switchView('login')}>Sign In</button>
            <button className="nav-btn primary" onClick={() => switchView('register')}>Get Started</button>
          </div>
        </header>

        <main className="landing-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Official Government Portal
            </div>
            <h1>
              Employment & Skills
              <span className="gradient-text"> Monitoring Portal</span>
            </h1>
            <p className="hero-subtitle">
              Empowering Barangay B. Del Mundo residents with seamless access to employment 
              opportunities, skills tracking, and essential community services.
            </p>
            <div className="hero-cta">
              <button className="cta-btn primary" onClick={() => switchView('register')}>
                <span>Create Account</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="cta-btn secondary" onClick={() => switchView('login')}>
                Sign In
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="feature-grid">
              <div className="feature-card">
                <h3>Real-time Analytics</h3>
                <p>Track employment trends and community statistics instantly</p>
              </div>
              <div className="feature-card">
                <h3>Job Matching</h3>
                <p>Connect with local employers and find opportunities</p>
              </div>
              <div className="feature-card">
                <h3>Document Services</h3>
                <p>Request barangay documents online with ease</p>
              </div>
              <div className="feature-card">
                <h3>Community Hub</h3>
                <p>Stay updated with meetings and announcements</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <p>© 2025 Barangay B. Del Mundo • Local Employment & Skills Monitoring Portal</p>
        </footer>
      </div>
    )
  }

  // Auth form view (login or register)
  return (
    <div className="auth-container">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="auth-wrapper">
        <button className="back-to-landing" onClick={() => switchView(null)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </button>

        <div className="auth-card">
          <div className="auth-header">
            <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p>{isLogin 
              ? 'Sign in to access your dashboard and services' 
              : 'Join the Barangay B. Del Mundo community portal'}
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Juan Dela Cruz"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Sitio</label>
                    <select name="barangay" value={formData.barangay} onChange={handleChange} required>
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
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="09XX XXX XXXX"
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
                    placeholder="Complete address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows="2"
                  />
                </div>

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
              </>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={isRegister ? 'form-row' : ''}>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {isRegister && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="password_confirmation"
                    placeholder="••••••••"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" className="link-btn" onClick={() => switchView(isLogin ? 'register' : 'login')}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login