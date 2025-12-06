import React, { useEffect, useState } from 'react'
import axios from '../../../api/setupAxios'
import Swal from 'sweetalert2'
import '../../dashboard/JobListingsPreview.css'

const ApplicantsList = ({ jobId, onJobClosed, onJobUpdated }) => {
  const [apps, setApps] = useState([])
  const [jobInfo, setJobInfo] = useState(null)
  const [interviewModal, setInterviewModal] = useState(null)
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('')
  const [schedulingId, setSchedulingId] = useState(null)
  const [selectedApplicant, setSelectedApplicant] = useState(null)

  const load = async () => {
    if (!jobId) return
    try {
      const res = await axios.get(`/api/job-listings/${jobId}/applicants`)
      setApps(res.data.data || [])
      
      // Get job info to show needed count
      const jobRes = await axios.get(`/api/job-listings/${jobId}`)
      setJobInfo(jobRes.data.data)
    } catch (err) {
      console.error('Load applicants', err)
      setApps([])
    }
  }

  useEffect(() => { if (jobId) load() }, [jobId])

  const action = async (id, applicantName, type) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: type === 'accept' ? 'Accept Applicant?' : 'Reject Applicant?',
      text: `${type === 'accept' ? 'Accept' : 'Reject'} ${applicantName} for this position?`,
      showCancelButton: true,
      confirmButtonColor: type === 'accept' ? '#10B981' : '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: type === 'accept' ? 'Yes, Accept' : 'Yes, Reject',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      await axios.post(`/api/job-applications/${id}/${type}`)
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: type === 'accept' ? 'accepted' : 'rejected' } : a))
      
      Swal.fire({
        icon: 'success',
        title: type === 'accept' ? 'Accepted!' : 'Rejected!',
        text: `${applicantName} has been ${type === 'accept' ? 'accepted' : 'rejected'}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      })

      // Check if job should be auto-closed (all needed positions filled)
      if (type === 'accept') {
        const acceptedCount = apps.filter(a => a.status === 'accepted' || (a.id === id && type === 'accept')).length
        if (acceptedCount >= jobInfo?.needed_applicants) {
          // Auto-close the job
          await axios.put(`/api/job-listings/${jobId}/close`)
          onJobClosed && onJobClosed(jobId)
          Swal.fire({
            icon: 'success',
            title: 'Job Position Filled!',
            text: `All ${jobInfo?.needed_applicants} needed applicants have been accepted. Job posting is now closed.`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          })
        }
      }

      onJobUpdated && onJobUpdated()
    } catch (err) {
      console.error('Action error', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to process application'
      })
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'accepted': return '#10B981'
      case 'rejected': return '#EF4444'
      default: return '#F59E0B'
    }
  }

  const getStatusBg = (status) => {
    switch(status) {
      case 'accepted': return 'rgba(16, 185, 129, 0.1)'
      case 'rejected': return 'rgba(239, 68, 68, 0.1)'
      default: return 'rgba(245, 158, 11, 0.1)'
    }
  }

  const scheduleInterview = async () => {
    if (!interviewDate || !interviewTime) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Please enter date and time' })
      return
    }

    const applicant = apps.find(a => a.id === schedulingId)
    if (!applicant) return

    try {
      await axios.post(`/api/job-listings/${jobId}/interviews`, {
        job_application_id: schedulingId,
        interview_date: interviewDate,
        interview_time: interviewTime
      })

      // Update local state to show interview scheduled
      setApps(prev => prev.map(a => a.id === schedulingId ? { ...a, interview_date: interviewDate, interview_time: interviewTime } : a))

      // Show success
      Swal.fire({
        icon: 'success',
        title: 'Interview Scheduled',
        text: `Interview scheduled for ${interviewDate} at ${interviewTime}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      })

      // Reset modal
      setInterviewModal(null)
      setInterviewDate('')
      setInterviewTime('')
      setSchedulingId(null)
    } catch (err) {
      console.error('Schedule interview error', err)
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
      color: '#64748b'
    }}>
      <p style={{ margin: 0, fontWeight: 600 }}>Select a job to view applicants</p>
    </div>
  )

  const acceptedCount = apps.filter(a => a.status === 'accepted').length

  return (
    <div>
      {jobInfo && (
        <div style={{
          padding: '12px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          marginBottom: '12px',
          fontSize: '13px',
          color: '#1e40af'
        }}>
          <strong>Position Status:</strong> {acceptedCount} / {jobInfo.needed_applicants} accepted
          <div style={{ 
            height: '6px', 
            background: '#dbeafe',
            borderRadius: '4px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: '#3B82F6',
              width: `${Math.min(100, (acceptedCount / jobInfo.needed_applicants) * 100)}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      <h4 style={{ color: '#1e293b', marginTop: '12px', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
        Total Applicants: {apps.length}
      </h4>

      {apps.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '24px',
          color: '#64748b'
        }}>
          <p style={{ margin: 0 }}>No applicants yet</p>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {apps.map(a => (
          <div 
            key={a.id} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              padding: '14px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              transition: 'all 0.2s ease',
              fontSize: '13px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
                {a.user?.name || 'Unknown'}
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: 8 }}>
                {a.user?.email} {a.user?.phone && `• ${a.user.phone}`}
              </div>
              <button
                onClick={() => setSelectedApplicant(a)}
                style={{
                  padding: '5px 12px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                View Resume
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 110 }}>
              <div 
                style={{ 
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  background: getStatusBg(a.status || 'pending'),
                  color: getStatusColor(a.status || 'pending'),
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {a.status || 'Pending'}
              </div>

              {a.status === 'pending' && (
                <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                  <button 
                    onClick={() => action(a.id, a.user?.name || 'Applicant', 'accept')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 700,
                      fontSize: 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => action(a.id, a.user?.name || 'Applicant', 'reject')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 700,
                      fontSize: 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
                  >
                    Reject
                  </button>
                </div>
              )}

              {a.status === 'accepted' && (
                <button
                  onClick={() => {
                    setSchedulingId(a.id)
                    setInterviewModal(a)
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#8B5CF6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#7C3AED'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#8B5CF6'}
                >
                  Schedule Interview
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resume/Profile Modal */}
      {selectedApplicant && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 0,
            maxWidth: 600,
            width: '95%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              background: '#3B82F6',
              padding: '24px',
              color: 'white',
              position: 'relative'
            }}>
              <button
                onClick={() => setSelectedApplicant(null)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                {selectedApplicant.user?.name || 'Applicant'}
              </h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: 14 }}>
                Applicant Resume
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Contact Info */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Contact Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Email</span>
                    <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{selectedApplicant.user?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Phone</span>
                    <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{selectedApplicant.user?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Address</span>
                    <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{selectedApplicant.user?.address || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Barangay</span>
                    <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{selectedApplicant.user?.barangay || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Birthdate</span>
                    <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>
                      {selectedApplicant.user?.birthdate ? new Date(selectedApplicant.user.birthdate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplicant.cover_letter && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Cover Letter
                  </h3>
                  <div style={{
                    background: '#f8fafc',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    color: '#475569',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedApplicant.cover_letter}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Skills
                </h3>
                {selectedApplicant.user?.skills?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedApplicant.user.skills.map((skill, idx) => (
                      <span key={idx} style={{
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {skill.name} {skill.pivot?.proficiency && `(${skill.pivot.proficiency})`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: 13 }}>No skills listed</p>
                )}
              </div>

              {/* Employment History */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Employment History
                </h3>
                {selectedApplicant.user?.employment_records?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedApplicant.user.employment_records.map((job, idx) => (
                      <div key={idx} style={{
                        background: '#f8fafc',
                        padding: 14,
                        borderRadius: 8,
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{job.position}</div>
                        <div style={{ color: '#3b82f6', fontSize: 13 }}>{job.company}</div>
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                          {job.start_date} - {job.end_date || 'Present'}
                        </div>
                        {job.description && (
                          <div style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>{job.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: 13 }}>No employment history listed</p>
                )}
              </div>

              {/* Application Date */}
              <div style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: 16,
                fontSize: 12,
                color: '#64748b'
              }}>
                Applied on: {new Date(selectedApplicant.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {interviewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%'
          }}>
            <h3 style={{ color: '#F3F4F6', margin: '0 0 16px 0', fontSize: 18 }}>
              Schedule Interview
            </h3>
            <p style={{ color: '#CBD5E1', fontSize: 13, margin: '0 0 16px 0' }}>
              {interviewModal.user?.name}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#CBD5E1', fontSize: 12, display: 'block', marginBottom: 6 }}>
                Interview Date
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 6,
                  color: '#F3F4F6',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#CBD5E1', fontSize: 12, display: 'block', marginBottom: 6 }}>
                Interview Time
              </label>
              <input
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 6,
                  color: '#F3F4F6',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setInterviewModal(null)
                  setInterviewDate('')
                  setInterviewTime('')
                  setSchedulingId(null)
                }}
                style={{
                  padding: '8px 16px',
                  background: '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={scheduleInterview}
                style={{
                  padding: '8px 16px',
                  background: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicantsList
