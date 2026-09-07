import React from 'react';
import { Check, Clock, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { OrderStatus } from '../../types';

interface OrderStepperProps {
  status: OrderStatus;
  deliveryMethod?: 'DELIVERY_PARTNER' | 'SELF_PICKUP';
  placedAt?: string;
  language?: string;
  isMini?: boolean;
}

interface StepItem {
  key: string;
  labelHi: string;
  labelEn: string;
  descHi: string;
  descEn: string;
  icon: React.ReactNode;
}

export const OrderStepper: React.FC<OrderStepperProps> = ({
  status,
  deliveryMethod = 'DELIVERY_PARTNER',
  language = 'hi',
  isMini = false,
}) => {
  const isHi = language === 'hi';

  const steps: StepItem[] = [
    {
      key: 'PLACED',
      labelHi: 'ऑर्डर हुआ',
      labelEn: 'Placed',
      descHi: 'ऑर्डर प्राप्त हुआ',
      descEn: 'Order Received',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    {
      key: 'PACKED',
      labelHi: deliveryMethod === 'SELF_PICKUP' ? 'तैयार है' : 'पैकिंग पूर्ण',
      labelEn: deliveryMethod === 'SELF_PICKUP' ? 'Ready' : 'Packed',
      descHi: deliveryMethod === 'SELF_PICKUP' ? 'पिकअप के लिए तैयार' : 'पैकिंग पूर्ण',
      descEn: deliveryMethod === 'SELF_PICKUP' ? 'Ready for Pickup' : 'Packed & Ready',
      icon: <Package className="w-3.5 h-3.5" />,
    },
    {
      key: 'IN_TRANSIT',
      labelHi: deliveryMethod === 'SELF_PICKUP' ? 'पिकअप प्रक्रिया' : 'रास्ते में',
      labelEn: deliveryMethod === 'SELF_PICKUP' ? 'In Progress' : 'In Transit',
      descHi: deliveryMethod === 'SELF_PICKUP' ? 'ग्राहक पिकअप पर' : 'वाहन गंतव्य की ओर',
      descEn: deliveryMethod === 'SELF_PICKUP' ? 'Self Pickup Active' : 'On the Way',
      icon: <Truck className="w-3.5 h-3.5" />,
    },
    {
      key: 'DELIVERED',
      labelHi: 'डिलीवर हुआ',
      labelEn: 'Delivered',
      descHi: 'सफलतापूर्वक प्राप्त',
      descEn: 'Successfully Delivered',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  ];

  const getStepIndex = (st: OrderStatus): number => {
    switch (st) {
      case 'PLACED':
      case 'ACCEPTED':
        return 0;
      case 'PACKED':
        return 1;
      case 'DISPATCHED':
      case 'IN_TRANSIT':
      case 'SELF_PICKUP':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentIdx = getStepIndex(status);

  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-800 text-xs font-bold">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <span>{isHi ? 'यह ऑर्डर रद्द कर दिया गया है' : 'This order has been cancelled'}</span>
      </div>
    );
  }

  return (
    <div className={`w-full ${isMini ? 'py-1' : 'py-2'}`}>
      <div className="relative flex items-center justify-between">
        {/* Connector Line Background */}
        <div className={`absolute ${isMini ? 'left-3 right-3 top-2 h-0.5' : 'left-6 right-6 top-3.5 h-1'} bg-slate-200 z-0 rounded-full`} />
        
        {/* Active Connector Progress Line */}
        <div
          className={`absolute ${isMini ? 'left-3 top-2 h-0.5' : 'left-6 top-3.5 h-1'} bg-emerald-600 z-0 rounded-full transition-all duration-500`}
          style={{
            width: `${Math.min(100, (currentIdx / (steps.length - 1)) * 100)}%`,
            right: `${100 - (currentIdx / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              {/* Step Circle */}
              <div
                className={`${isMini ? 'w-4 h-4' : 'w-7 h-7'} rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isActive
                    ? `bg-[#03542B] text-white ${isMini ? 'ring-2' : 'ring-4'} ring-emerald-100 shadow-sm animate-pulse`
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className={isMini ? 'w-2 h-2 text-white' : 'w-4 h-4 text-white'} />
                ) : (
                  React.cloneElement(step.icon as React.ReactElement<any>, { className: isMini ? 'w-2 h-2' : 'w-3.5 h-3.5' })
                )}
              </div>

              {/* Labels */}
              {!isMini && (
                <div className="text-center mt-1.5">
                  <div
                    className={`text-[11px] font-bold tracking-tight ${
                      isActive
                        ? 'text-emerald-950 font-extrabold'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {isHi ? step.labelHi : step.labelEn}
                  </div>
                  <div className="text-[9px] text-slate-400 hidden sm:block">
                    {isHi ? step.descHi : step.descEn}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
