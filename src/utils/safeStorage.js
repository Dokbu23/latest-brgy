// small helper to safely access localStorage (handles contexts where storage is blocked)
export function getItem(key) {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  } catch (e) {
    // in some embedded/extension contexts localStorage access can throw
    console.warn('safeStorage.getItem: storage not available', e && e.message)
    return null
  }
}

export function setItem(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    console.warn('safeStorage.setItem: storage not available', e && e.message)
    return false
  }
}

export function removeItem(key) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.removeItem(key)
    return true
  } catch (e) {
    console.warn('safeStorage.removeItem: storage not available', e && e.message)
    return false
  }
}

export default { getItem, setItem, removeItem }
