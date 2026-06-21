// Update this with your deployed Google Apps Script Web App URL (see setup.md)
export const API_URL = import.meta.env.VITE_API_URL || ''

export const CAFE = {
  name: 'The Fresh Cup',
  tagline: 'Freshly brewed, daily',
  currency: '₹',
  // Override these in Settings once the app is running
  receiptFooter: 'Thank you for visiting!\nVisit again at The Fresh Cup'
}

export const IS_API_CONFIGURED = Boolean(API_URL)
