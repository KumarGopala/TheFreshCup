import { formatDateTime } from './bills.js'
import { CAFE } from '../config.js'

/**
 * Render a bill as a PNG Blob (for WhatsApp/share). Uses Canvas API only — no deps.
 */
export function renderReceiptImage({ bill, items, staffName, cafeName = CAFE.name, footer }) {
  const W = 600
  const padX = 32
  const lineH = 28
  const headerH = 130
  const itemsHeader = 30
  const itemsRowH = 60
  const totalsH = 120
  const footerH = footer ? 80 : 40

  const H = headerH + itemsHeader + items.length * itemsRowH + totalsH + footerH

  const canvas = document.createElement('canvas')
  // 2x scale for retina sharpness
  const scale = 2
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Header — brand bar
  ctx.fillStyle = '#C05621'
  ctx.fillRect(0, 0, W, 80)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.font = 'bold 30px Inter, sans-serif'
  ctx.fillText(cafeName, W / 2, 38)
  ctx.font = '14px Inter, sans-serif'
  ctx.fillText('Bill Receipt', W / 2, 62)

  // Meta block
  ctx.fillStyle = '#1f2937'
  ctx.textAlign = 'left'
  ctx.font = '13px Inter, sans-serif'
  const metaY = 100
  ctx.fillText(`Bill: ${shortId(bill.bill_id)}`, padX, metaY)
  ctx.fillText(`Date: ${formatDateTime(bill.datetime)}`, padX, metaY + 18)
  ctx.textAlign = 'right'
  ctx.fillText(`Cashier: ${staffName || bill.staff_id}`, W - padX, metaY)
  ctx.fillText(`Payment: ${(bill.payment_mode || '').toUpperCase()}`, W - padX, metaY + 18)

  // Divider
  let y = headerH + 5
  drawDashLine(ctx, padX, y, W - padX, y, '#d1d5db')
  y += 10

  // Items header
  ctx.fillStyle = '#6b7280'
  ctx.font = 'bold 12px Inter, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('ITEM', padX, y + 14)
  ctx.textAlign = 'center'
  ctx.fillText('QTY', W - padX - 180, y + 14)
  ctx.textAlign = 'right'
  ctx.fillText('PRICE', W - padX - 90, y + 14)
  ctx.fillText('TOTAL', W - padX, y + 14)
  y += itemsHeader

  // Items
  ctx.fillStyle = '#1f2937'
  ctx.font = '15px Inter, sans-serif'
  items.forEach(it => {
    ctx.textAlign = 'left'
    const nameLines = wrapText(ctx, it.product_name, W - padX * 2 - 200, 2)
    nameLines.forEach((line, idx) => {
      ctx.fillText(line, padX, y + 22 + idx * 18)
    })
    ctx.textAlign = 'center'
    ctx.fillText(String(it.qty), W - padX - 180, y + 22)
    ctx.textAlign = 'right'
    ctx.fillText('₹' + it.unit_price, W - padX - 90, y + 22)
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 15px Inter, sans-serif'
    ctx.fillText('₹' + it.line_total, W - padX, y + 22)
    ctx.font = '15px Inter, sans-serif'
    y += itemsRowH
  })

  // Divider before totals
  drawDashLine(ctx, padX, y, W - padX, y, '#d1d5db')
  y += 24

  // Total
  ctx.fillStyle = '#1f2937'
  ctx.textAlign = 'left'
  ctx.font = 'bold 20px Inter, sans-serif'
  ctx.fillText('Total', padX, y + 10)
  ctx.textAlign = 'right'
  ctx.font = 'bold 26px Inter, sans-serif'
  ctx.fillStyle = '#C05621'
  ctx.fillText('₹' + bill.subtotal, W - padX, y + 12)
  y += 48

  ctx.textAlign = 'left'
  ctx.fillStyle = '#6b7280'
  ctx.font = '13px Inter, sans-serif'
  ctx.fillText(`Paid via ${prettyPayment(bill.payment_mode)}`, padX, y + 5)
  y += 30

  // Footer
  if (footer) {
    ctx.fillStyle = '#6b7280'
    ctx.font = '13px Inter, sans-serif'
    ctx.textAlign = 'center'
    const lines = String(footer).split('\n').slice(0, 3)
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, y + 16 + i * 18)
    })
  }

  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png', 1.0))
}

function drawDashLine(ctx, x1, y1, x2, y2, color) {
  ctx.save()
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      if (lines.length === maxLines - 1) {
        line = w
        break
      }
      line = w
    } else {
      line = test
    }
  }
  if (line) {
    if (lines.length >= maxLines) {
      // ellipsize last
      while (ctx.measureText(line + '…').width > maxWidth && line.length > 0) {
        line = line.slice(0, -1)
      }
      lines[maxLines - 1] = line + '…'
    } else {
      lines.push(line)
    }
  }
  return lines.length ? lines : [String(text)]
}

function shortId(id) {
  return String(id || '').slice(-8).toUpperCase()
}

function prettyPayment(mode) {
  if (mode === 'cash') return 'Cash'
  if (mode === 'upi')  return 'UPI'
  return mode || 'N/A'
}

export { shortId, prettyPayment }
