import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  userRole?: 'buyer' | 'farmer';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  userRole = 'buyer',
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Trigger printable invoice window or simulated PDF download
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - #${order.orderCode}</title>
            <style>
              body { font-family: sans-serif; padding: 30px; color: #1e293b; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #03542B; padding-bottom: 20px; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: 900; color: #03542B; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
              th { background-color: #f1f5f9; font-weight: bold; }
              .total-box { margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; }
              .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; pt: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo">🌾 KrishiSetu ई-मंडी (e-Mandi Invoice)</div>
                <p>ऑर्डर रसीद / Tax Invoice</p>
              </div>
              <div style="text-align: right;">
                <p><strong>ऑर्डर ID:</strong> #${order.orderCode}</p>
                <p><strong>दिनांक:</strong> ${order.placedAt || 'आज'}</p>
                <p><strong>स्थिति:</strong> ${order.statusLabel || order.status}</p>
              </div>
            </div>
            <div>
              <p><strong>विक्रेता (Seller):</strong> ${order.sellerName || 'Sharma FPO Farmer Producer'}</p>
              <p><strong>खरीदार / गंतव्य (Buyer / Destination):</strong> ${order.dropLocation || 'नजदीकी मंडी / गोदाम'}</p>
            </div>
            <table>
              <tr>
                <th>विवरण (Item)</th>
                <th>मात्रा (Qty)</th>
                <th>दर (Rate)</th>
                <th>कुल राशि (Total)</th>
              </tr>
              <tr>
                <td>${order.crop || order.cropHindi || 'ताजा कृषि उपज (Fresh Produce)'}</td>
                <td>${order.quantityKg || 100} kg</td>
                <td>₹${order.pricePerKg || Math.round((order.totalAmount || 1000) / 100)}/kg</td>
                <td>₹${order.totalAmount?.toLocaleString() || 1000}</td>
              </tr>
            </table>
            <div class="total-box">
              कुल भुगतान (Total Amount Paid): ₹${order.totalAmount?.toLocaleString() || 1000}
            </div>
            <div class="footer">
              <p>यह KrishiSetu डिजिटल ई-मंडी प्लेटफॉर्म द्वारा जनरेटेड इलेक्ट्रॉनिक इनवॉइस है।</p>
              <p>धन्यवाद! जय जवान, जय किसान।</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#03542B] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white font-bold">
              📄
            </div>
            <div>
              <h3 className="font-extrabold text-base">ऑर्डर इनवॉइस / रसीद</h3>
              <p className="text-xs text-emerald-100">ऑर्डर #{order.orderCode} • KrishiSetu ई-मंडी</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            {/* Top Info */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-black text-emerald-800 text-lg">KrishiSetu ई-मंडी</h4>
                <p className="text-xs text-slate-500">प्रत्यक्ष कृषि उपज व्यापार एवं लॉजिस्टिक्स प्लेटफॉर्म</p>
              </div>
              <div className="text-right sm:text-right">
                <div className="text-xs font-bold text-slate-900">ऑर्डर ID: #{order.orderCode}</div>
                <div className="text-xs text-slate-500">दिनांक: {order.placedAt || 'आज'}</div>
                <div className="mt-1">
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    {order.statusLabel || order.status || 'SUCCESS'}
                  </span>
                </div>
              </div>
            </div>

            {/* Parties Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">विक्रेता (Seller / FPO):</span>
                <p className="font-extrabold text-slate-900">{order.sellerName || 'Sharma FPO Farmer Producer'}</p>
                <p className="text-slate-500">राज्य: उत्तर प्रदेश, भारत</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">खरीदार / गंतव्य (Buyer / Drop):</span>
                <p className="font-extrabold text-slate-900">{order.dropLocation || 'नजदीकी मंडी गोदाम'}</p>
                <p className="text-slate-500">भुगतान मोड: डिजिटल एस्क्रो / UPI</p>
              </div>
            </div>

            {/* Item Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 rounded-l-xl">उत्पाद (Produce)</th>
                    <th className="p-3">मात्रा (Qty)</th>
                    <th className="p-3">दर (Rate)</th>
                    <th className="p-3 rounded-r-xl text-right">कुल (Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span>🌾</span>
                      <span>{order.crop || order.cropHindi || 'ताजा कृषि उपज'}</span>
                    </td>
                    <td className="p-3 text-slate-600 font-semibold">{order.quantityKg || 100} kg</td>
                    <td className="p-3 text-slate-600 font-semibold">₹{order.pricePerKg || Math.round((order.totalAmount || 1000) / 100)}/kg</td>
                    <td className="p-3 text-right font-black text-slate-900">₹{order.totalAmount?.toLocaleString() || 1000}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Totals */}
            <div className="flex flex-col items-end space-y-1.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between w-64 text-slate-500">
                <span>उपज मूल्य:</span>
                <span className="font-bold text-slate-800">₹{order.totalAmount?.toLocaleString() || 1000}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-500">
                <span>लॉजिस्टिक्स / परिवहन:</span>
                <span className="font-bold text-emerald-700">मुफ़्त (Free)</span>
              </div>
              <div className="flex justify-between w-64 text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                <span>कुल भुगतान राशि:</span>
                <span className="text-emerald-800 text-base">₹{order.totalAmount?.toLocaleString() || 1000}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>सत्यापित डिजिटल इनवॉइस</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट / PDF डाउनलोड</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#03542B] hover:bg-[#023e1f] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              बंद करें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
