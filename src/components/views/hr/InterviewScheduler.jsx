import React, { useEffect, useState } from 'react'
import axios from '../../../api/setupAxios'
import Swal from 'sweetalert2'
import '../../dashboard/JobListingsPreview.css'

const InterviewScheduler = ({ jobId }) => {
  const [interviews, setInterviews] = useState([])
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [form, setForm] = useState({
    applicant_id: '',
    interview_date: '',
    interview_time: '',
    location: '',
    notes: ''
  })

  const loadInterviews = async () => {
    if (!jobId) return
    try {
      const res = await axios.get(`/api/job-listings/${jobId}/interviews`)
      setInterviews(res.data.data || [])
    } catch (err) {
      console.error('Load interviews', err)
      setInterviews([])
    }
  }

  useEffect(() => {
    if (jobId) loadInterviews()
  }, [jobId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.applicant_id || !form.interview_date || !form.interview_time) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in applicant, date, and time',
      })
      return
    }

    try {
      await axios.post(`/api/job-listings/${jobId}/interviews`, form)
      
      Swal.fire({
        icon: 'success',
        title: 'Interview Scheduled!',
        text: 'Interview has been scheduled successfully',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      })
      
      setForm({ applicant_id: '', interview_date: '', interview_time: '', location: '', notes: '' })
      setSelectedApplicant(null)
      loadInterviews()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to schedule interview'
      })
    }
  }

  if (!jobId) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '32px',
      color: '#CBD5E1'
    }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>📅</div>
      <p style={{ margin: 0, fontWeight: 600 }}>Select a job to schedule interviews</p>
    </div>
  )

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Select Applicant
          </label>
          <select 
            value={form.applicant_id}
            onChange={(e) => setForm({ ...form, applicant_id: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 8,
              color: '#F3F4F6',
              fontSize: 14
            }}
          >
            <option value="">Choose applicant...</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Interview Date
            </label>
            <input 
              type="date"
              value={form.interview_date}
              onChange={(e) => setForm({ ...form, interview_date: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 8,
                color: '#F3F4F6',
                fontSize: 14
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Interview Time
            </label>
            <input 
              type="time"
              value={form.interview_time}
              onChange={(e) => setForm({ ...form, interview_time: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 8,
                color: '#F3F4F6',
                fontSize: 14
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Location
          </label>
          <input 
            type="text"
            placeholder="e.g., Conference Room A"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 8,
              color: '#F3F4F6',
              fontSize: 14
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Notes
          </label>
          <textarea 
            placeholder="Additional notes..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 8,
              color: '#F3F4F6',
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <button 
          type="submit"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
          }}
        >
          Schedule Interview
        </button>
      </form>

      {interviews.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#CBD5E1' }}>
          <p>No scheduled interviews yet</p>
        </div>
      )}

      {interviews.map(interview => (
        <div key={interview.id} style={{ 
          padding: '12px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: 8,
          marginBottom: '8px'
        }}>
          <div style={{ fontWeight: 700, color: '#F3F4F6', marginBottom: '4px' }}>
            {interview.applicant?.user?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
            📅 {new Date(interview.interview_date).toLocaleDateString()} at {interview.interview_time}
          </div>
          {interview.location && (
            <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
              📍 {interview.location}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default InterviewScheduler
