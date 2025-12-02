import { useEffect, useState } from 'react'
import axios from '../../../api/setupAxios'
import Swal from 'sweetalert2'
import './AdminAccountsManagement.css'

const AdminAccountsManagement = () => {
  const [accounts, setAccounts] = useState([])
  const [filteredAccounts, setFilteredAccounts] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [accounts, roleFilter, searchQuery])

  const loadAccounts = async () => {
    try {
      const res = await axios.get('/api/admin/accounts', { withCredentials: true })
      const data = res.data && res.data.data ? res.data.data : []
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load accounts', err)
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load accounts' })
    }
  }

  const filterAccounts = () => {
    let filtered = accounts
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(acc => acc.role === roleFilter)
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(acc =>
        acc.name.toLowerCase().includes(query) ||
        acc.email.toLowerCase().includes(query)
      )
    }
    
    setFilteredAccounts(filtered)
    setCurrentPage(1)
  }

  const startEdit = (account) => {
    setEditingId(account.id)
    setEditData({ ...account })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const saveEdit = async () => {
    try {
      await axios.patch(`/api/admin/accounts/${editingId}`, editData, { withCredentials: true })
      setAccounts(accounts.map(acc => acc.id === editingId ? { ...acc, ...editData } : acc))
      setEditingId(null)
      setEditData({})
      Swal.fire({
        icon: 'success',
        title: 'Account Updated',
        text: 'Account has been updated successfully',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500
      })
    } catch (err) {
      console.error('Failed to update account', err)
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || 'Failed to update account'
      })
    }
  }

  const deleteAccount = async (id, name) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Account?',
      text: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    })

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/admin/accounts/${id}`, { withCredentials: true })
        setAccounts(accounts.filter(acc => acc.id !== id))
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Account has been deleted',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500
        })
      } catch (err) {
        console.error('Failed to delete account', err)
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err.response?.data?.message || 'Failed to delete account'
        })
      }
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'purple',
      hr_manager: 'blue',
      secretary: 'green',
      resident: 'gray'
    }
    return colors[role] || 'gray'
  }

  const getRoleIcon = (role) => {
    const icons = {
      admin: '👑',
      hr_manager: '💼',
      secretary: '📋',
      resident: '👤'
    }
    return icons[role] || '•'
  }

  const formatRole = (role) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h2 className="accounts-title">Account Management</h2>
        <p className="accounts-subtitle">Manage all resident, HR, and official accounts</p>
      </div>

      <div className="accounts-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-tabs">
          {[
            { label: 'All Users', value: 'all', count: accounts.length },
            { label: 'Residents', value: 'resident', count: accounts.filter(a => a.role === 'resident').length },
            { label: 'HR Managers', value: 'hr_manager', count: accounts.filter(a => a.role === 'hr_manager').length },
            { label: 'Secretaries', value: 'secretary', count: accounts.filter(a => a.role === 'secretary').length },
            { label: 'Admins', value: 'admin', count: accounts.filter(a => a.role === 'admin').length }
          ].map(tab => (
            <button
              key={tab.value}
              className={`filter-btn ${roleFilter === tab.value ? 'active' : ''}`}
              onClick={() => setRoleFilter(tab.value)}
            >
              {tab.label}
              <span className="count-badge">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="empty-state">
          <h4 className="empty-title">No accounts found</h4>
          <p className="empty-description">
            {searchQuery ? 'Try adjusting your search' : 'No accounts in this category'}
          </p>
        </div>
      ) : (
        <>
          <div className="accounts-grid">
            {paginatedAccounts.map(account => (
              <div key={account.id} className="account-card">
                <div className="card-header">
                  <div className="account-info">
                    <div>
                      <h4 className="account-name">{account.name}</h4>
                      <p className="account-email">{account.email}</p>
                    </div>
                  </div>
                  <span className={`role-badge role-${getRoleColor(account.role)}`}>
                    {formatRole(account.role)}
                  </span>
                </div>

                {editingId === account.id ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="edit-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="edit-input"
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={editData.role || 'resident'}
                        onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                        className="edit-select"
                      >
                        <option value="resident">Resident</option>
                        <option value="secretary">Secretary</option>
                        <option value="hr_manager">HR Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="edit-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Barangay/Sitio</label>
                      <input
                        type="text"
                        value={editData.barangay || ''}
                        onChange={(e) => setEditData({ ...editData, barangay: e.target.value })}
                        className="edit-input"
                      />
                    </div>
                    <div className="edit-actions">
                      <button className="btn-save" onClick={saveEdit}>Save</button>
                      <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card-details">
                      <div className="detail">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{account.email}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{account.phone || '—'}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Barangay:</span>
                        <span className="detail-value">{account.barangay || '—'}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Joined:</span>
                        <span className="detail-value">{formatDate(account.created_at)}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => startEdit(account)}
                        title="Edit account"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => deleteAccount(account.id, account.name)}
                        title="Delete account"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminAccountsManagement
