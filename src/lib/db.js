import { openDB } from 'idb'

const DB_NAME = 'fresh-cup'
const VERSION = 1

const dbPromise = openDB(DB_NAME, VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('cache')) {
      db.createObjectStore('cache')
    }
    if (!db.objectStoreNames.contains('pendingBills')) {
      db.createObjectStore('pendingBills', { keyPath: 'bill_id' })
    }
  }
})

export async function getCache(key) {
  const db = await dbPromise
  return db.get('cache', key)
}

export async function setCache(key, value) {
  const db = await dbPromise
  return db.put('cache', value, key)
}

export async function clearCache(key) {
  const db = await dbPromise
  return db.delete('cache', key)
}

// Reserved for Phase 4 (offline bill sync queue)
export async function queueBill(bill) {
  const db = await dbPromise
  return db.put('pendingBills', bill)
}

export async function listPendingBills() {
  const db = await dbPromise
  return db.getAll('pendingBills')
}

export async function removePendingBill(billId) {
  const db = await dbPromise
  return db.delete('pendingBills', billId)
}
