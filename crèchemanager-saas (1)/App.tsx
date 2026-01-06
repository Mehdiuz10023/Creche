
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChildModal from './components/ChildModal';
import PaymentModal from './components/PaymentModal';
import TimeSelector from './components/TimeSelector';
import Dashboard from './components/Dashboard';
import { Child, Payment, PaymentHistory, Sexe, Section, CrecheSettings } from './types';
import { dbService, isSupabaseConfigured } from './services/supabase';
import { MONTHLY_FEE, CURRENCY, CRECHE_INFO, MONTHS } from './constants';
import { Plus, Edit2, Trash2, Search, Filter, Check, X, FileText, Loader2, AlertTriangle, Database, History, TrendingUp, AlertCircle, Upload, Info, Save, Building, MapPin, PhoneCall, Hash, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'children' | 'payments' | 'profile'>('home');
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<PaymentHistory>({});
  const [crecheSettings, setCrecheSettings] = useState<CrecheSettings>(CRECHE_INFO);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('Toutes');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');

  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | undefined>();
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentChild, setPaymentChild] = useState<Child | undefined>();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<{childId: string, year: number, month: number} | null>(null);
  const [historyChildId, setHistoryChildId] = useState<string | null>(null);

  const initData = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const [fetchedChildren, fetchedPayments] = await Promise.all([
        dbService.getChildren(),
        dbService.getPayments()
      ]);
      
      setChildren(fetchedChildren);
      setPayments(fetchedPayments);

      try {
        const fetchedSettings = await dbService.getSettings();
        if (fetchedSettings) setCrecheSettings(fetchedSettings);
      } catch (sError) {
        console.warn("Table 'settings' inaccessible.");
      }
      
    } catch (err: any) {
      console.error("Erreur chargement:", err);
      setError(err.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const getPaymentStatus = (childId: string, year: number, month: number) => {
    const p = payments[childId]?.[year]?.[month];
    if (!p) return { status: 'Non payé', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', remaining: MONTHLY_FEE };
    if (p.amountPaid >= MONTHLY_FEE) return { status: 'Payé', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', remaining: 0 };
    return { status: 'Reste à payer', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', remaining: MONTHLY_FEE - p.amountPaid };
  };

  const filteredChildren = useMemo(() => {
    return children.filter(child => {
      const fullName = `${child.nom} ${child.prenom}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());
      const matchesSection = sectionFilter === 'Toutes' || child.section === sectionFilter;
      
      let matchesStatus = true;
      if (currentPage === 'payments' && statusFilter !== 'Tous') {
        const pInfo = getPaymentStatus(child.id, selectedYear, selectedMonth);
        matchesStatus = pInfo.status === statusFilter;
      }

      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [children, searchQuery, sectionFilter, statusFilter, currentPage, payments, selectedYear, selectedMonth]);

  const handleSaveChild = async (child: Child) => {
    try {
      await dbService.upsertChild(child);
      const updatedChildren = await dbService.getChildren();
      setChildren(updatedChildren);
      setIsChildModalOpen(false);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleSavePayment = async (payment: Payment) => {
    try {
      await dbService.upsertPayment(payment);
      setPayments(prev => ({
        ...prev,
        [payment.childId]: {
          ...(prev[payment.childId] || {}),
          [payment.year]: {
            ...(prev[payment.childId]?.[payment.year] || {}),
            [payment.month]: payment
          }
        }
      }));
      setIsPaymentModalOpen(false);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const generateCertificate = (child: Child) => {
    if (!(window as any).jspdf) return alert("Librairie PDF non chargée");
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    
    const today = new Date().toLocaleDateString('fr-FR');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const academicYear = currentMonth >= 8 
      ? `${currentYear}-${currentYear + 1}` 
      : `${currentYear - 1}-${currentYear}`;

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    // 1. Ville et Date (Marge en haut réduite à 15)
    doc.setFontSize(16).setFont('helvetica', 'normal');
    doc.text(`${crecheSettings.city} le ${today}`, pageWidth - margin, 15, { align: 'right' });

    // 2. Titre Principal (Centre) - Remonté
    doc.setFontSize(32).setFont('helvetica', 'bold');
    doc.text(crecheSettings.name.toUpperCase(), pageWidth / 2, 40, { align: 'center' });

    // 3. Bloc d'informations légales (Gauche) - Remonté
    let yPos = 65;
    doc.setFontSize(14).setFont('helvetica', 'bold');
    doc.text(`"${crecheSettings.name.toUpperCase()}"`, margin, yPos);
    yPos += 8;
    doc.text(`RC : ${crecheSettings.rc}`, margin, yPos);
    yPos += 8;
    doc.text(`NIF : ${crecheSettings.nif}`, margin, yPos);
    yPos += 8;
    doc.text(`ARTICLE : ${crecheSettings.article}`, margin, yPos);
    yPos += 8;
    doc.text(`Agrément N° : ${crecheSettings.agrement}`, margin, yPos);
    yPos += 8;
    doc.text(crecheSettings.address, margin, yPos);
    yPos += 8;
    doc.text(`TEL : ${crecheSettings.tel}`, margin, yPos);

    // 4. Titre du Document (Centre) - Remonté
    yPos = 130;
    doc.setFontSize(26).setFont('helvetica', 'bold');
    doc.text("Certificat de scolarité", pageWidth / 2, yPos, { align: 'center' });

    // 5. Corps du texte - Remonté
    yPos = 160;
    doc.setFontSize(17).setFont('helvetica', 'normal');
    
    const isFille = child.sexe === Sexe.Fille;
    const neeStr = isFille ? 'née' : 'né';
    const inscriteStr = isFille ? 'inscrite' : 'inscrit';
    const dateNaiss = new Date(child.dateNaissance).toLocaleDateString('fr-FR');
    
    const sectionDisplay = child.section === Section.Prescolaire 
      ? child.section.toLowerCase() 
      : `${child.section.toLowerCase()} section`;
    
    const bodyText = `Je soussigné, Monsieur le Directeur de la crèche ${crecheSettings.name}, atteste que l’élève ${child.prenom.toUpperCase()} ${child.nom.toUpperCase()}, ${neeStr} le ${dateNaiss}, est ${inscriteStr} au sein de notre établissement en ${sectionDisplay} pour l’année scolaire ${academicYear}.`;

    const splitText = doc.splitTextToSize(bodyText, contentWidth);
    doc.text(splitText, margin, yPos, { lineHeightFactor: 1.6 });

    // 6. Mention de fin
    yPos += 50;
    doc.text("Cette attestation est faite pour servir et valoir ce que de droit", margin, yPos);

    // 7. Signature (Bas Droite) - Remontée (gap réduit de 45 à 25)
    yPos += 25;
    doc.setFontSize(17).setFont('helvetica', 'bold');
    doc.text("Le directeur", pageWidth - margin - 10, yPos, { align: 'right' });

    doc.save(`Certificat_${child.nom}_${child.prenom}.pdf`);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await dbService.deleteChild(id);
      setChildren(prev => prev.filter(c => c.id !== id));
      setConfirmDeleteId(null);
    } catch (error: any) {
      alert(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await dbService.updateSettings(crecheSettings);
      alert("Paramètres enregistrés avec succès !");
    } catch (error: any) {
      alert(`Erreur lors de la mise à jour: ${error.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="flex-1 ml-64 p-8 max-w-7xl mx-auto w-full">
        {currentPage === 'home' ? (
          <Dashboard children={children} payments={payments} />
        ) : (currentPage === 'children' || currentPage === 'payments') ? (
          <>
            <header className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {currentPage === 'children' ? 'Gestion Enfants' : 'Gestion Paiements'}
                </h2>
                <p className="text-slate-600 font-medium mt-1">{filteredChildren.length} enfant(s) affiché(s)</p>
              </div>
              <div className="flex gap-4">
                {currentPage === 'payments' && (
                  <TimeSelector currentYear={selectedYear} currentMonth={selectedMonth} onYearChange={setSelectedYear} onMonthChange={setSelectedMonth} />
                )}
                <div className="flex gap-2">
                  <input type="file" accept=".csv" ref={fileInputRef} className="hidden" />
                  {currentPage === 'children' && (
                    <button onClick={() => { setEditingChild(undefined); setIsChildModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm">
                      <Plus className="w-5 h-5" /> Nouveau
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-2.5 border border-slate-200 bg-white rounded-lg outline-none focus:border-indigo-500 text-slate-900 font-medium" />
              </div>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="bg-white text-sm font-bold text-slate-700 border border-slate-200 rounded-lg px-4 py-2.5">
                <option value="Toutes">Toutes Sections</option>
                {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {currentPage === 'payments' && (
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white text-sm font-bold text-slate-700 border border-slate-200 rounded-lg px-4 py-2.5">
                  <option value="Tous">Tous les statuts</option>
                  <option value="Payé">Payé</option>
                  <option value="Reste à payer">Reste à payer</option>
                  <option value="Non payé">Non payé</option>
                </select>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">Enfant</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">Section</th>
                      {currentPage === 'payments' && (
                        <>
                          <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">Statut</th>
                          <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">Versements</th>
                        </>
                      )}
                      <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredChildren.map(child => {
                      const pInfo = getPaymentStatus(child.id, selectedYear, selectedMonth);
                      const p = payments[child.id]?.[selectedYear]?.[selectedMonth];
                      return (
                        <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{child.nom} {child.prenom}</div>
                            <div className="text-xs text-slate-500">{child.sexe}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-slate-100">{child.section}</span>
                          </td>
                          {currentPage === 'payments' && (
                            <>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${pInfo.bg} ${pInfo.color} ${pInfo.border}`}>
                                  {pInfo.status}
                                </span>
                                {pInfo.status === 'Reste à payer' && (
                                  <div className="text-[10px] text-red-600 font-bold mt-1">Manque: {pInfo.remaining.toLocaleString()} DA</div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {p ? (
                                  <div>
                                    <div className="font-extrabold text-slate-900 text-sm">{p.amountPaid.toLocaleString()} {CURRENCY}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">le {new Date(p.paymentDate).toLocaleDateString()}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-xs font-medium">Aucun versement</span>
                                )}
                              </td>
                            </>
                          )}
                          <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                            {currentPage === 'children' ? (
                              <>
                                <button onClick={() => generateCertificate(child)} className="p-2 text-slate-400 hover:text-indigo-600" title="Générer Certificat"><FileText className="w-5 h-5"/></button>
                                <button onClick={() => { setEditingChild(child); setIsChildModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-5 h-5"/></button>
                                <button onClick={() => setConfirmDeleteId(child.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setHistoryChildId(child.id)} className="p-2 text-slate-400 hover:text-indigo-600" title="Historique"><History className="w-5 h-5"/></button>
                                <button onClick={() => { setPaymentChild(child); setIsPaymentModalOpen(true); }} className="text-indigo-600 font-bold hover:underline text-sm ml-2">Gérer paiement</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-4xl">
             <header className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configuration</h2>
              <p className="text-slate-600 font-medium mt-1">Paramètres de l'établissement et informations légales.</p>
            </header>
            <form onSubmit={handleUpdateSettings} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Nom de la Crèche</label>
                  <input required type="text" value={crecheSettings.name} onChange={(e) => setCrecheSettings({...crecheSettings, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:border-indigo-500 outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">RC</label>
                  <input required type="text" value={crecheSettings.rc} onChange={(e) => setCrecheSettings({...crecheSettings, rc: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">NIF</label>
                  <input required type="text" value={crecheSettings.nif} onChange={(e) => setCrecheSettings({...crecheSettings, nif: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Article</label>
                  <input required type="text" value={crecheSettings.article} onChange={(e) => setCrecheSettings({...crecheSettings, article: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">N° Agrément</label>
                  <input required type="text" value={crecheSettings.agrement} onChange={(e) => setCrecheSettings({...crecheSettings, agrement: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Ville</label>
                  <input required type="text" value={crecheSettings.city} onChange={(e) => setCrecheSettings({...crecheSettings, city: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Téléphone</label>
                  <input required type="text" value={crecheSettings.tel} onChange={(e) => setCrecheSettings({...crecheSettings, tel: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:border-indigo-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Adresse</label>
                  <input required type="text" value={crecheSettings.address} onChange={(e) => setCrecheSettings({...crecheSettings, address: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSavingSettings}
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSavingSettings ? 'Enregistrement...' : 'Enregistrer les paramètres'}
              </button>
            </form>
          </div>
        )}
      </main>

      <ChildModal isOpen={isChildModalOpen} onClose={() => setIsChildModalOpen(false)} onSave={handleSaveChild} initialChild={editingChild} />
      {paymentChild && <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleSavePayment} child={paymentChild} year={selectedYear} month={selectedMonth} existingPayment={payments[paymentChild.id]?.[selectedYear]?.[selectedMonth]} />}
      
      {historyChildId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Historique des Paiements</h3>
              <button onClick={() => setHistoryChildId(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b pb-2">
                    <th className="pb-3 text-left">Période</th>
                    <th className="pb-3 text-left">Montant</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(payments[historyChildId] || {}).flatMap(([y, mP]) => 
                    Object.entries(mP).map(([m, p]) => (
                      <tr key={`${y}-${m}`} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold">{MONTHS[parseInt(m)]} {y}</td>
                        <td className="py-3 font-bold text-green-700">{p.amountPaid.toLocaleString()} DA</td>
                        <td className="py-3 text-right text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm text-center">
            <h3 className="font-extrabold text-slate-900 text-xl mb-2">Confirmer la suppression ?</h3>
            <p className="text-slate-600 mb-8 font-medium">Cette action est irréversible.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Annuler</button>
              <button onClick={() => handleConfirmDelete(confirmDeleteId)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
