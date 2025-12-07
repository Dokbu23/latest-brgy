import React, { useState } from 'react'
import axios from '../../../api/setupAxios'
import Swal from 'sweetalert2'
import '../../dashboard/JobListingsPreview.css'

const HRJobForm = ({ onCreated }) => {
  const [form, setForm] = useState({ 
    title: '', 
    company: '', 
    type: 'full-time', 
    salary: '', 
    description: '', 
    needed_applicants: 1,
    urgent: false 
  })

  const jobTypes = ['Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Freelance', 'Internship']

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (name === 'needed_applicants' ? parseInt(value) || 1 : value)
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    
    if (!form.title.trim() || !form.company.trim() || !form.type.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all required fields',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      })
      return
    }

    if (form.needed_applicants < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Number of applicants needed must be at least 1',
      })
      return
    }

    try {
      await axios.get('/sanctum/csrf-cookie')
      const res = await axios.post('/api/job-listings', form)
      
      Swal.fire({
        icon: 'success',
        title: 'Job Posted Successfully',
        text: `${form.title} has been posted. Accepting ${form.needed_applicants} applicant(s)`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      })
      
      onCreated && onCreated(res.data.data)
      setForm({ title: '', company: '', type: 'full-time', salary: '', description: '', needed_applicants: 1, urgent: false })
    } catch (err) {
      console.error('Create job error', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to create job',
      })
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Job Title *</label>
          <input 
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            placeholder="e.g., Senior Developer" 
            required
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
          <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Company *</label>
          <input 
            name="company" 
            value={form.company} 
            onChange={handleChange} 
            placeholder="Company name" 
            required
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
          <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Job Type *</label>
          <select 
            name="type" 
            value={form.type} 
            onChange={handleChange}
            required
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
            <option value="">Select job type</option>
            {jobTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Applicants Needed</label>
          <input 
            type="number"
            name="needed_applicants" 
            value={form.needed_applicants} 
            onChange={handleChange}
            min="1"
            max="100"
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
          <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Salary</label>
          <input 
            name="salary" 
            value={form.salary} 
            onChange={handleChange} 
            placeholder="e.g., $50,000 - $80,000" 
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

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Job Description</label>
        <textarea 
          name="description" 
          value={form.description} 
          onChange={handleChange} 
          rows={5} 
          placeholder="Describe the position, responsibilities, and requirements..." 
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

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F3F4F6', fontWeight: 600 }}>
          <input 
            type="checkbox" 
            name="urgent" 
            checked={form.urgent} 
            onChange={handleChange}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          /> 
          Mark as Urgent
        </label>
        <button 
          type="submit" 
          style={{
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
          Post Job
        </button>
      </div>
    </form>
  )
}

export default HRJobForm
