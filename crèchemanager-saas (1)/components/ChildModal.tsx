
import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Info, Phone } from 'lucide-react';
import { Child, Section, Sexe } from '../types';
import { SECTIONS, GENDERS } from '../constants';

interface ChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (child: Child) => void;
  initialChild?: Child;
}

const ChildModal: React.FC<ChildModalProps> = ({ isOpen, onClose, onSave, initialChild }) => {
  const getToday = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Child>>({
    nom: '',
    prenom: '',
    dateNaissance: '',
    dateInscription: getToday(),
    sexe: Sexe.Garcon,
    section: Section.Petite,
    nomPere: '',
    nomMere: '',
    numPere: '',
    numMere: '',
  });

  useEffect(() => {
    if (initialChild) {
      setFormData(initialChild);
    } else {
      setFormData({
        nom: '',
        prenom: '',
        dateNaissance: '',
        dateInscription: getToday(),
        sexe: Sexe.Garcon,
        section: Section.Petite,
        nomPere: '',
        nomMere: '',
        numPere: '',
        numMere: '',
      });
    }
  }, [initialChild, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    onSave({
      ...formData as Child,
      id: initialChild?.id || generatedId,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {initialChild ? 'Mise à jour dossier' : 'Nouvelle Inscription'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-2 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="text-slate-800 font-bold text-xs uppercase tracking-[0.15em] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Info className="w-4 h-4 text-indigo-500" /> Informations Personnelles
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Nom de famille</label>
                <input required name="nom" value={formData.nom} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Prénom</label>
                <input required name="prenom" value={formData.prenom} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Sexe</label>
                <select name="sexe" value={formData.sexe} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none font-bold text-slate-900 cursor-pointer">
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Section</label>
                <select name="section" value={formData.section} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none font-bold text-slate-900 cursor-pointer">
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Date de naissance</label>
                <input required type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-semibold text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Date d'inscription</label>
                <input required type="date" name="dateInscription" value={formData.dateInscription} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-semibold text-slate-900" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="text-slate-800 font-bold text-xs uppercase tracking-[0.15em] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Phone className="w-4 h-4 text-indigo-500" /> Coordonnées Parents (Facultatif)
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Père</label>
                  <input name="nomPere" value={formData.nomPere} onChange={handleChange} placeholder="Nom et Prénom"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-medium text-slate-900" />
                </div>
                <input name="numPere" value={formData.numPere} onChange={handleChange} placeholder="Numéro de téléphone"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-medium text-slate-900" />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Mère</label>
                  <input name="nomMere" value={formData.nomMere} onChange={handleChange} placeholder="Nom et Prénom"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-medium text-slate-900" />
                </div>
                <input name="numMere" value={formData.numMere} onChange={handleChange} placeholder="Numéro de téléphone"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-medium text-slate-900" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-700 font-extrabold hover:bg-slate-100 rounded-xl transition-all">
              Annuler
            </button>
            <button type="submit" className="px-10 py-2.5 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildModal;
