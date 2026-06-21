import { useCart, addItem } from '../hooks/useCart.js'

export default function ProductGrid({ products, categoryIcon }) {
  const { items } = useCart()
  const qtyById = Object.fromEntries(items.map(it => [it.product_id, it.qty]))

  if (!products.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-2">🍽️</div>
        <p className="text-sm">No items in this category</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
      {products.map(p => {
        const qty = qtyById[p.id] || 0
        return (
          <button
            key={p.id}
            onClick={() => addItem(p)}
            className="card overflow-hidden text-left active:scale-95 transition relative"
          >
            <div className="aspect-square bg-gray-100 relative">
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  {categoryIcon || '🍽️'}
                </div>
              )}
              {qty > 0 && (
                <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-fresh text-white text-xs font-bold flex items-center justify-center shadow">
                  {qty}
                </div>
              )}
            </div>
            <div className="p-2.5">
              <div className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[2.5em]">
                {p.name}
              </div>
              <div className="text-base font-bold text-brand-700 mt-1">₹{p.price}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
