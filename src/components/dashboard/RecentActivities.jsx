// src/components/dashboard/RecentActivities.jsx

const RecentActivities = ({ activities }) => {
  return (
    <div className="card">
      <h3 className="section-title">Recent Activities</h3>
      {activities && activities.length > 0 ? (
        <div>
          {activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <span className="icon">{activity.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text)' }}>{activity.message}</div>
                <div className="meta">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--muted)' }}>No recent activities</p>
      )}
    </div>
  )
}

export default RecentActivities
