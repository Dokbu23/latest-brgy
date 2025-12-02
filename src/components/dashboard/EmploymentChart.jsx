// src/components/dashboard/EmploymentChart.jsx
const EmploymentChart = ({ data }) => {
  const employedPercentage = data?.employedPercentage || 71
  const unemployedPercentage = 100 - employedPercentage

  return (
    <div className="card">
      <div style={{ marginBottom: '18px' }}>
        <h3 className="section-title">Employment Status</h3>
        <span className="badge">{employedPercentage}% Employment Rate</span>
      </div>
      <div className="donut-wrap">
        <div className="donut" style={{ background: `conic-gradient(#10b981 0% ${employedPercentage}%, #ef4444 ${employedPercentage}% 100%)` }}>
          <div className="donut-center">{employedPercentage}%</div>
        </div>
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }} />
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Employed: {data?.employed || 892}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }} />
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Seeking: {data?.unemployed || 355}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmploymentChart