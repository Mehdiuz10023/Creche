
import React, { useMemo } from 'react';
import { Child, PaymentHistory, Section, Sexe } from '../types';
import { MONTHLY_FEE, CURRENCY, MONTHS } from '../constants';
import { Users, TrendingUp, AlertCircle, PieChart, BarChart3, ArrowUpRight, Layout } from 'lucide-react';

interface DashboardProps {
  children: Child[];
  payments: PaymentHistory;
}

const Dashboard: React.FC<DashboardProps> = ({ children, payments }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const stats = useMemo(() => {
    const totalChildren = children.length;
    
    // Distribution sections
    const sections = {
      [Section.Petite]: children.filter(c => c.section === Section.Petite).length,
      [Section.Moyenne]: children.filter(c => c.section === Section.Moyenne).length,
      [Section.Prescolaire]: children.filter(c => c.section === Section.Prescolaire).length,
    };

    // Distribution sexe
    const sexes = {
      [Sexe.Garcon]: children.filter(c => c.sexe === Sexe.Garcon).length,
      [Sexe.Fille]: children.filter(c => c.sexe === Sexe.Fille).length,
    };

    // Revenus mensuels
    let monthlyPaid = 0;
    children.forEach(c => {
      const p = payments[c.id]?.[currentYear]?.[currentMonth];
      if (p) monthlyPaid += p.amountPaid;
    });

    const expectedMonthly = totalChildren * MONTHLY_FEE;
    const remainingMonthly = expectedMonthly - monthlyPaid;

    // Historique des 6 derniers mois pour l'histogramme
    const historyData = Array.from({ length: 6 }, (_, i) => {
      let date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const m = date.getMonth();
      const y = date.getFullYear();
      
      let total = 0;
      children.forEach(c => {
        const p = payments[c.id]?.[y]?.[m];
        if (p) total += p.amountPaid;
      });
      
      return { month: MONTHS[m].substring(0, 4), amount: total };
    });

    return { totalChildren, sections, sexes, monthlyPaid, remainingMonthly, historyData, expectedMonthly };
  }, [children, payments, currentYear, currentMonth]);

  const maxHistoryAmount = Math.max(...stats.historyData.map(d => d.amount), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tableau de Bord</h2>
        <p className="text-slate-600 font-medium mt-1">Analyse globale de votre activité pour {MONTHS[currentMonth]} {currentYear}.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600"><Users className="w-6 h-6"/></div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              Actifs <ArrowUpRight className="w-3 h-3"/>
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalChildren}</div>
          <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Enfants inscrits</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600"><TrendingUp className="w-6 h-6"/></div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.monthlyPaid.toLocaleString()} <span className="text-lg font-bold text-slate-400">{CURRENCY}</span></div>
          <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Encaissé ce mois</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600"><AlertCircle className="w-6 h-6"/></div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.remainingMonthly.toLocaleString()} <span className="text-lg font-bold text-slate-400">{CURRENCY}</span></div>
          <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Reste à percevoir</div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-950/20 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-slate-800 p-2.5 rounded-xl text-indigo-400"><BarChart3 className="w-6 h-6"/></div>
          </div>
          <div className="text-3xl font-black">{stats.expectedMonthly.toLocaleString()} <span className="text-lg font-bold text-slate-400">{CURRENCY}</span></div>
          <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Objectif Mensuel</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Histogramme des Revenus */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600"/> Historique des Encaissements
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Derniers 6 mois</span>
          </div>
          
          <div className="flex items-end justify-between h-56 gap-4 px-2">
            {stats.historyData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col items-center">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap font-bold pointer-events-none z-10 shadow-lg">
                    {data.amount.toLocaleString()} DA
                  </div>
                  <div 
                    className="w-full max-w-[48px] bg-indigo-500 rounded-t-xl transition-all duration-500 hover:bg-indigo-600 cursor-help"
                    style={{ height: `${(data.amount / maxHistoryAmount) * 100}%`, minHeight: '4px' }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-tighter">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartitions */}
        <div className="space-y-8">
          {/* Par Sexe */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-8 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600"/> Sexe
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-sky-600 flex items-center gap-2">Garçons</span>
                  <span className="text-slate-900">{stats.sexes[Sexe.Garcon]} ({Math.round((stats.sexes[Sexe.Garcon]/stats.totalChildren)*100 || 0)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded-full transition-all duration-700"
                    style={{ width: `${(stats.sexes[Sexe.Garcon] / stats.totalChildren) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-rose-600 flex items-center gap-2">Filles</span>
                  <span className="text-slate-900">{stats.sexes[Sexe.Fille]} ({Math.round((stats.sexes[Sexe.Fille]/stats.totalChildren)*100 || 0)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-700"
                    style={{ width: `${(stats.sexes[Sexe.Fille] / stats.totalChildren) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Par Section */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-8 flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-600"/> Sections
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.sections).map(([section, count]) => (
                <div key={section} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{section}</span>
                    <span className="text-lg font-black text-slate-900">{count}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                    section === Section.Petite ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    section === Section.Moyenne ? 'bg-sky-50 border-sky-100 text-sky-600' :
                    'bg-violet-50 border-violet-100 text-violet-600'
                  }`}>
                    {Math.round((count / stats.totalChildren) * 100 || 0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
