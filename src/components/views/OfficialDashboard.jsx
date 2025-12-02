import Dashboard from '../Dashboard'

const HRDashboard = ({ user, setUser }) => {
  return (
    <div>
      <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ background: 'linear-gradient(90deg,#fff0f6,#fff)', padding: '8px 12px', borderRadius: 12, color: '#a02090', fontWeight: 700 }}>
          HR Manager Dashboard
        </div>
      </div>
      <Dashboard user={user} setUser={setUser} />
    </div>
  )
}

export default HRDashboard
