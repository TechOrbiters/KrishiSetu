import React from 'react';

interface CategoryFilterProps {
  categories: { id: string; name: string; icon: string }[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  language: string;
  categoryNames: Record<string, { hi: string; en: string }>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = React.memo(({
  categories,
  selectedCategory,
  onSelectCategory,
  language,
  categoryNames,
}) => {
  return (
    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {language === 'en' ? 'Categories' : 'श्रेणियाँ (Categories)'}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => {
          const displayName = language === 'en' ? categoryNames[cat.id]?.en : categoryNames[cat.id]?.hi;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

CategoryFilter.displayName = 'CategoryFilter';
