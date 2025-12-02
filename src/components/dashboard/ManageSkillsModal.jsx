// ManageSkillsModal.jsx - Redesigned
import { useEffect, useState } from 'react'
import axios from '../../api/setupAxios'

const ManageSkillsModal = ({ isOpen, onClose, onUpdated }) => {
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) fetchSkills()
  }, [isOpen])

  const fetchSkills = async () => {
    try {
      const res = await axios.get('/api/skills')
      setSkills(res.data?.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleAdd = async () => {
    if (!newSkill.trim()) return
    try {
      await axios.get('/sanctum/csrf-cookie')
      const res = await axios.post('/api/skills', { skill: newSkill })
      setSkills(prev => [...prev, res.data.data])
      setNewSkill('')
      onUpdated && onUpdated()
    } catch (err) {
      setError('Failed to add skill')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.get('/sanctum/csrf-cookie')
      await axios.delete(`/api/skills/${id}`)
      setSkills(prev => prev.filter(s => s.id !== id))
      onUpdated && onUpdated()
    } catch (err) {
      setError('Failed to delete skill')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modern-modal-overlay">
      <div className="modern-modal medium">
        <div className="modal-header">
          <h3 className="modal-title">Manage Skills Catalog</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="modern-message error">{error}</div>}

        <div className="modal-content">
          <div className="add-skill-form">
            <input 
              value={newSkill} 
              onChange={(e) => setNewSkill(e.target.value)} 
              placeholder="Enter new skill name..."
              className="modern-input"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button 
              className="modern-button primary" 
              onClick={handleAdd} 
              disabled={loading || !newSkill.trim()}
            >
              Add Skill
            </button>
          </div>

          <div className="skills-list">
            <h4 className="section-title">Current Skills</h4>
            {skills.length > 0 ? (
              <div className="skills-grid">
                {skills.map((skill) => (
                  <div key={skill.id} className="skill-item">
                    <div className="skill-info">
                      <span className="skill-name">{skill.skill}</span>
                      <span className="skill-count">{skill.count ?? 0} residents</span>
                    </div>
                    <button 
                      className="modern-button danger small" 
                      onClick={() => handleDelete(skill.id)} 
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No skills added yet</p>
                <p className="empty-subtitle">Add skills to build the catalog</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="modern-button secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManageSkillsModal