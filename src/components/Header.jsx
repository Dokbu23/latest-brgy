// src/components/Header.jsx
import './Header.css'

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
          <div className="logo-icon">🏢</div>
          <h2>Barangay Portal</h2>
        </div>
        
        <div className="user-menu">
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">
              {user.role ? user.role.replace('_', ' ').toUpperCase() : 'USER'}
              {user.barangay && ` • ${user.barangay}`}
            </div>
          </div>
          
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header