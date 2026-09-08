import React, { useState, useEffect } from 'react';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { ProduceListing } from '../../types';
import { getAccurateCropImage } from '@/lib/cropImages';

interface ProduceCardProps {
  item: ProduceListing;
  isSaved: boolean;
  onToggleBookmark: (id: string) => void;
  onAddToCart: (item: ProduceListing) => void;
}

export const ProduceCard: React.FC<ProduceCardProps> = React.memo(({
  item,
  isSaved,
  onToggleBookmark,
  onAddToCart,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getAccurateCropImage(item.crop, item.image, item.cropHindi)
  );

  useEffect(() => {
    setImgSrc(getAccurateCropImage(item.crop, item.image, item.cropHindi));
  }, [item.crop, item.image, item.cropHindi]);

  // Helper to clean redundant names (e.g. "Green Gram (Green Gram)")
  const cleanName = (name: string) => {
    if (!name) return '';
    const trimmed = name.trim();
    const match = trimmed.match(/^(.+?)\s*\(\1\)$/i);
    if (match) return match[1].trim();
    
    const parts = trimmed.split(' (');
    if (parts.length > 2 && parts[0].trim() === parts[1].trim()) {
      return parts.slice(1).join(' (').replace(/\)$/, '').trim();
    }
    
    if (parts.length === 2 && parts[0].trim() === parts[1].replace(')', '').trim()) {
      return parts[0].trim();
    }
    
    return name;
  };

  const displayName = cleanName(item.cropHindi || item.crop);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col h-full group">
      <div className="relative h-40 sm:h-44 bg-slate-100 shrink-0 overflow-hidden">
        <img
          src={imgSrc}
          alt={item.crop}
          onError={() => {
            const fallback = getAccurateCropImage(item.crop, undefined, item.cropHindi);
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
          📍 {item.distanceKm || 10} km
        </span>
        <button
          onClick={() => onToggleBookmark(item.id)}
          className="absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-red-500 shadow-sm cursor-pointer transition-colors"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {item.quality || 'A'} Grade
            </span>
            <span className="text-[9px] font-bold text-slate-400">• सीधे किसान से</span>
          </div>
          <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-snug line-clamp-1">
            {displayName}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium truncate">{item.fpoName || 'Sharma FPO'}</p>
          <div className="text-[10px] text-slate-600 flex items-center gap-1.5 pt-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="font-black">{item.rating || 4.7}</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-bold">स्टॉक: {item.quantityKg} kg</span>
          </div>
        </div>

        <div className="space-y-2 pt-2.5 border-t border-slate-100">
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400 line-through font-bold">₹{item.marketPricePerKg || Math.round(item.pricePerKg * 1.25)}</span>
              <span className="text-base sm:text-lg font-black text-emerald-800">
                ₹{item.pricePerKg}<span className="text-[11px] font-bold text-slate-400">/kg</span>
              </span>
            </div>
            <div className="text-[9px] text-emerald-700 font-black bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 shrink-0">
              बचत: ₹{Math.round((item.marketPricePerKg || item.pricePerKg * 1.25) - item.pricePerKg)}
            </div>
          </div>

          <button
            onClick={() => onAddToCart(item)}
            className="w-full py-2.5 bg-[#03542B] hover:bg-[#023e1f] text-white text-xs font-black rounded-2xl transition-all cursor-pointer text-center active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>कार्ट में जोड़ें</span>
          </button>
        </div>
      </div>
    </div>
  );
});

ProduceCard.displayName = 'ProduceCard';
