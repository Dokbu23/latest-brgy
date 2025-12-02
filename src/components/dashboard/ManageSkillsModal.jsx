import { useEffect, useState } from 'react'
import axios from 'axios'
import './RegisterResidentModal.css'

const ManageSkillsModal = ({ isOpen, onClose, onUpdated }) => {
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    try {
      await axios.get('/sanctum/csrf-cookie')
      const res = await axios.post('/api/skills', { skill: newSkill })
      setSkills(prev => [...prev, res.data.data])
      setNewSkill('')
      onUpdated && onUpdated()
    } catch (err) {
      setError('Failed to add skill')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setLoading(true)
    try {
      await axios.get('/sanctum/csrf-cookie')
      await axios.delete(`/api/skills/${id}`)
      setSkills(prev => prev.filter(s => s.id !== id))
      onUpdated && onUpdated()
    } catch (err) {
      setError('Failed to delete skill')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="rrm-backdrop">
      <div className="rrm-modal">
        <div className="rrm-header">
          <h3>Manage Skills</h3>
          <button className="rrm-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="rrm-error">{error}</div>}

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="New skill name" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <button className="rrm-btn rrm-btn-primary" onClick={handleAdd} disabled={loading}>Add</button>
          </div>
        </div>

        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {skills.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#2d3748' }}>{s.skill}</div>
                <div style={{ color: '#718096', fontSize: 12 }}>{s.count ?? 0} registered</div>
              </div>
              <div>
                <button className="rrm-btn rrm-btn-secondary" onClick={() => handleDelete(s.id)} disabled={loading}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="rrm-btn rrm-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default ManageSkillsModal
