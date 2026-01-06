
import React, { useState, useEffect } from 'react';
import { X, Wallet, Calendar } from 'lucide-react';
import { Payment, Child } from '../types';
import { MONTHLY_FEE, CURRENCY, MONTHS } from '../constants';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  child: Child;
  year: number;
  month: number;
  existingPayment?: Payment;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  child, 
  year, 
  month, 
  existingPayment 
}) => {
  const [amount, setAmount] = useState<number>(MONTHLY_FEE);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (existingPayment) {
      setAmount(existingPayment.amountPaid);
      setDate(existingPayment.paymentDate);
    } else {
      setAmount(MONTHLY_FEE);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [existingPayment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      childId: child.id,
      year,
      month,
      amountPaid: amount,
      paymentDate: date,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Wallet className="w-5 h-5"/></div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Paiement</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
            <div className="font-black text-indigo-600 text-lg">{child.prenom} {child.nom}</div>
            <div className="text-sm text-slate-700 font-bold mt-1 uppercase tracking-widest">{MONTHS[month]} {year}</div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">Montant Versé ({CURRENCY})</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                required
                type="number"
                min="0"
                max={MONTHLY_FEE}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-black text-slate-900 text-xl"
              />
            </div>
            <div className="text-[11px] text-slate-500 font-bold italic text-right pr-1 uppercase">Scolarité totale : {MONTHLY_FEE.toLocaleString()} {CURRENCY}</div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">Date de versement</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-extrabold rounded-xl hover:bg-slate-100 transition-all text-sm uppercase tracking-widest"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm uppercase tracking-widest active:scale-95"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
