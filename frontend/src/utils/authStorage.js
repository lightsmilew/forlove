const KEYS = ['token', 'nickname', 'username']

export const authStorage = {
  get(key) {
    return sessionStorage.getItem(key)
  },
  set(key, value) {
    sessionStorage.setItem(key, value)
  },
  remove(key) {
    sessionStorage.removeItem(key)
  },
  clear() {
    KEYS.forEach((key) => sessionStorage.removeItem(key))
  },
  clearLegacy() {
    KEYS.forEach((key) => localStorage.removeItem(key))
  },
}
