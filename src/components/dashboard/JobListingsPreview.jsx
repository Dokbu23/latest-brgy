// src/components/dashboard/JobListingsPreview.jsx

const JobListingsPreview = ({ jobs, onClearNew }) => {
  const mockJobs = [
    { id: 1, title: 'Administrative Assistant', employer: 'Barangay Hall', status: 'open', salary: '₱15,000/month', isNew: true },
    { id: 2, title: 'Construction Worker', employer: 'Local Contractor', status: 'open', salary: '₱12,000/month' },
    { id: 3, title: 'Nurse', employer: 'Health Center', status: 'open', salary: '₱18,000/month' }
  ]

  const list = (jobs && jobs.length) ? jobs : mockJobs
  const newCount = list.filter((j) => j.isNew).length

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title">Latest Job Listings</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {newCount > 0 && (
            <div className="notify-badge" title={`${newCount} new job listing(s)`} onClick={() => onClearNew && onClearNew()}>
              {newCount}
            </div>
          )}
          {newCount > 0 && (
            <button onClick={() => onClearNew && onClearNew()} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {list.length > 0 ? (
        <div>
          {list.map((job) => (
            <div key={job.id} className="job-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {job.title}
                    {job.isNew && <span className="job-new-pill">New</span>}
                  </h4>
                  <div className="meta">{job.employer}</div>
                </div>
                <span style={{ background: '#c6f6d5', color: '#22543d', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  {job.status}
                </span>
              </div>
              <div className="salary">{job.salary}</div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--muted)' }}>No job listings available</p>
      )}
    </div>
  )
}

export default JobListingsPreview
