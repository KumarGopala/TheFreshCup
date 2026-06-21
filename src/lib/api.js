import { API_URL } from '../config.js'

export class ApiError extends Error {
  constructor(message, code = 'ERR') {
    super(message)
    this.code = code
  }
}

async function call(action, body = {}) {
  if (!API_URL) {
    throw new ApiError('API URL not configured. Set VITE_API_URL in .env.local (see setup.md).', 'NO_API')
  }
  let res
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      // text/plain avoids CORS preflight which Apps Script doesn't handle
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...body }),
      redirect: 'follow'
    })
  } catch (err) {
    throw new ApiError('Network error — check your internet connection.', 'NETWORK')
  }
  if (!res.ok) throw new ApiError(`Server error: HTTP ${res.status}`, 'HTTP')
  let json
  try {
    json = await res.json()
  } catch {
    throw new ApiError('Server returned invalid response — check Apps Script deployment.', 'PARSE')
  }
  if (!json.ok) throw new ApiError(json.error || 'Unknown server error', 'API')
  return json.data
}

export const api = {
  ping:            ()           => call('ping'),
  getAll:          ()           => call('getAll'),
  upsertCategory:  (row)        => call('upsertCategory', { row }),
  deleteCategory:  (id)         => call('deleteCategory', { id }),
  upsertProduct:   (row)        => call('upsertProduct', { row }),
  deleteProduct:   (id)         => call('deleteProduct', { id }),
  upsertStaff:     (row)        => call('upsertStaff', { row }),
  deleteStaff:     (id)         => call('deleteStaff', { id }),
  saveBill:        (bill, items) => call('saveBill', { bill, items }),
  saveBillBatch:   (batch)      => call('saveBillBatch', { batch }),
  getBills:        (from, to)   => call('getBills', { from, to }),
  updateSetting:   (key, value) => call('updateSetting', { key, value })
}
