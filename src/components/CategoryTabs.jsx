export default function CategoryTabs({ categories, activeId, onChange }) {
  if (!categories.length) return null
  return (
    <div className="bg-white border-b border-gray-200 overflow-x-auto no-scrollbar sticky top-[60px] z-20">
      <div className="flex gap-1 px-2 py-2 min-w-min">
        {categories.map(c => {
          const active = c.id === activeId
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition ${
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              {c.icon && <span className="text-base">{c.icon}</span>}
              <span>{c.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
