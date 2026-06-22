import { useMemo } from 'react'
import { useMenu } from './useMenu.js'
import { CAFE } from '../config.js'

/**
 * Live cafe identity, merged from Sheet Settings + config defaults.
 * Returns the same shape regardless of whether settings have loaded yet.
 */
export function useCafe() {
  const { data } = useMenu()
  return useMemo(() => {
    const settings = Array.isArray(data?.settings)
      ? Object.fromEntries(data.settings.map(r => [r.key, r.value]))
      : (data?.settings || {})
    return {
      name:           settings.cafe_name      || CAFE.name,
      tagline:        CAFE.tagline,
      currency:       settings.currency       || CAFE.currency,
      receiptFooter:  settings.receipt_footer || CAFE.receiptFooter
    }
  }, [data])
}
