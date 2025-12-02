// src/components/dashboard/StatsOverview.jsx

const StatsOverview = ({ statistics }) => {
  const stats = [
    { label: 'Total Residents', value: statistics?.totalResidents || 0, icon: '👥' },
    { label: 'Employed', value: statistics?.employedResidents || 0, icon: '💼' },
    { label: 'Unemployed', value: statistics?.unemployedResidents || 0, icon: '📊' },
    { label: 'Active Jobs', value: statistics?.activeJobs || 0, icon: '📋' }
  ]

  return (
    <div className="card-grid">
      {stats.map((stat, index) => (
        <div key={index} className="card stat-card">
          <div className="icon">{stat.icon}</div>
          <div className="label">{stat.label}</div>
          <div className="value">{stat.value}</div>
        </div>
      ))}
    </div>
  )
}

export default StatsOverview
