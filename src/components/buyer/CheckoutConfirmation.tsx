import React from 'react';
import { X, Loader2, CreditCard, Smartphone, Building2, Banknote } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPlacingOrder: boolean;
  selectedPaymentMethod: 'COD' | 'UPI' | 'NETBANKING' | 'CARD';
  setSelectedPaymentMethod: (method: 'COD' | 'UPI' | 'NETBANKING' | 'CARD') => void;
  cartSubtotal: number;
  deliveryFee: number;
  cartTotal: number;
  discount?: number;
}

export const CheckoutConfirmation: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  isPlacingOrder,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  cartSubtotal,
  deliveryFee,
  cartTotal,
  discount = 0,
}) => {
  if (!isOpen) return null;

  const paymentOptions = [
    { id: 'UPI', label: 'UPI (Google Pay, PhonePe, Paytm)', desc: 'तत्काल 1-क्लिक भुगतान • UPI ID: rohit@upi', icon: Smartphone },
    { id: 'CARD', label: 'डेबिट / क्रेडिट कार्ड (Visa, RuPay, MC)', desc: '100% सुरक्षित 256-बिट एन्क्रिप्शन', icon: CreditCard },
    { id: 'NETBANKING', label: 'नेट बैंकिंग (SBI, HDFC, PNB, ICICI)', desc: 'सभी प्रमुख भारतीय राष्ट्रीयकृत बैंक', icon: Building2 },
    { id: 'COD', label: 'कैश ऑन डिलीवरी (Cash on Delivery)', desc: 'सामान जांचने के बाद नकद भुगतान करें', icon: Banknote },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-[#03542B] p-4 flex justify-between items-center text-white">
          <div className="font-black text-sm">कृषिसेतु सुरक्षित चेकआउट</div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-emerald-800 font-bold">
          <span className="opacity-50">1 पता</span>
          <span className="opacity-50">2 डिलीवरी</span>
          <span className="text-emerald-900 border-b-2 border-emerald-900">3 भुगतान</span>
        </div>

        <div className="p-4 space-y-4">
          <h3 className="font-bold text-slate-800">भुगतान विधि चुनें</h3>
          
          <div className="space-y-3">
            {paymentOptions.map((opt) => (
              <label 
                key={opt.id} 
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  selectedPaymentMethod === opt.id ? 'border-emerald-700 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <input 
                  type="radio" 
                  checked={selectedPaymentMethod === opt.id} 
                  onChange={() => setSelectedPaymentMethod(opt.id as any)} 
                  className="mt-1 accent-emerald-700" 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs text-slate-700">
            <div className="flex justify-between"><span>उप-कुल:</span><strong>₹{cartSubtotal.toLocaleString()}</strong></div>
            <div className="flex justify-between"><span>डिलीवरी:</span><strong>₹{deliveryFee}</strong></div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>कूपन छूट:</span>
                <strong>-₹{discount.toLocaleString()}</strong>
              </div>
            )}
            <div className="flex justify-between font-black text-slate-900 border-t pt-1 mt-1">
              <span>कुल देय राशि:</span><strong className="text-emerald-900">₹{cartTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer text-sm">
            पीछे
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPlacingOrder}
            className="flex-[2] py-2.5 bg-[#03542B] hover:bg-[#023e1f] text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-80"
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ऑर्डर प्रोसेस हो रहा है...</span>
              </>
            ) : (
              `₹${cartTotal.toLocaleString()} का ऑर्डर दें`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
