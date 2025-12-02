// src/components/dashboard/QuickActions.jsx
import { useState } from 'react'
import RegisterResidentModal from './RegisterResidentModal'
import PostJobModal from './PostJobModal'
import ManageSkillsModal from './ManageSkillsModal'
import ReportsModal from './ReportsModal'

const QuickActions = ({ onAction, onRegistered, onRefresh, onJobPosted }) => {
  const actions = [
    { label: 'Register Resident', icon: '➕', action: 'register' },
    { label: 'Post Job', icon: '📝', action: 'post_job' },
    { label: 'View Reports', icon: '📊', action: 'reports' },
    { label: 'Manage Skills', icon: '🎯', action: 'skills' }
  ]

  const [showRegister, setShowRegister] = useState(false)
  const [showPostJob, setShowPostJob] = useState(false)
  const [showSkills, setShowSkills] = useState(false)
  const [showReports, setShowReports] = useState(false)

  const handleAction = (act) => {
    if (act === 'register') return setShowRegister(true)
    if (act === 'post_job') return setShowPostJob(true)
    if (act === 'skills') return setShowSkills(true)
    if (act === 'reports') return setShowReports(true)
    onAction && onAction(act)
  }

  return (
    <div className="card">
      <h3 className="section-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        {actions.map((action, index) => (
          <button key={index} className="qa-button" onClick={() => handleAction(action.action)}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{action.icon}</div>
            {action.label}
          </button>
        ))}
      </div>

      <RegisterResidentModal isOpen={showRegister} onClose={() => setShowRegister(false)} onRegistered={(u) => { onRegistered && onRegistered(u); onRefresh && onRefresh(); }} />
      <PostJobModal isOpen={showPostJob} onClose={() => setShowPostJob(false)} onPosted={(job) => { onJobPosted && onJobPosted(job); onRefresh && onRefresh(); }} />
      <ManageSkillsModal isOpen={showSkills} onClose={() => setShowSkills(false)} onUpdated={() => { onRefresh && onRefresh(); }} />
      <ReportsModal isOpen={showReports} onClose={() => setShowReports(false)} />
    </div>
  )
}

export default QuickActions
