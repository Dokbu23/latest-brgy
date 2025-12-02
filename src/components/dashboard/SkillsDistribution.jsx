// src/components/dashboard/SkillsDistribution.jsx

const SkillsDistribution = ({ data }) => {
  const skills = [
    { name: 'Carpentry', count: 45 },
    { name: 'Plumbing', count: 38 },
    { name: 'Electrical', count: 42 },
    { name: 'Masonry', count: 35 },
    { name: 'Welding', count: 28 },
    { name: 'Administrative', count: 52 }
  ]

  const maxCount = Math.max(...skills.map(s => s.count))

  return (
    <div className="card">
      <h3 className="section-title">Skills Distribution</h3>
      {skills.map((skill, index) => (
        <div key={index} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text)', fontWeight: '500' }}>{skill.name}</span>
            <span style={{ color: 'var(--muted)' }}>{skill.count}</span>
          </div>
          <div className="skills-bar">
            <div style={{ width: `${(skill.count / maxCount) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkillsDistribution
