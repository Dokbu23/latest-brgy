import { useEffect, useState } from 'react'
import axios from 'axios'
import './RegisterResidentModal.css'

const ReportsModal = ({ isOpen, onClose }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) fetchReports()
  }, [isOpen])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/dashboard/statistics')
      setData(res.data?.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="rrm-backdrop">
      <div className="rrm-modal">
        <div className="rrm-header">
          <h3>Reports</h3>
          <button className="rrm-close" onClick={onClose}>×</button>
        </div>

        {loading && <div style={{ padding: 12 }}>Loading...</div>}

        {data && (
          <div>
            <h4>Statistics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {Object.entries(data.statistics || {}).map(([k, v]) => (
                <div key={k} style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#718096' }}>{k}</div>
                  <div style={{ fontWeight: 700, color: '#2d3748' }}>{v}</div>
                </div>
              ))}
            </div>

            <h4 style={{ marginTop: 12 }}>Recent Jobs</h4>
            <div>
              {(data.recentJobs || []).map(job => (
                <div key={job.id} style={{ padding: 8, borderBottom: '1px solid #edf2f7' }}>
                  <div style={{ fontWeight: 600 }}>{job.title}</div>
                  <div style={{ color: '#718096', fontSize: 13 }}>{job.company} • {job.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="rrm-btn rrm-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default ReportsModal
