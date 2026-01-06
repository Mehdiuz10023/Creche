
import { createClient } from '@supabase/supabase-js';
import { Child, Payment, PaymentHistory, CrecheSettings } from '../types';

/**
 * CONFIGURATION SUPABASE
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://fmwdzirsulquspilhtyp.supabase.co'; 
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtd2R6aXJzdWxxdXNwaWxodHlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYxMjA2MCwiZXhwIjoyMDgzMTg4MDYwfQ.dRoNFaEMpWa9oQasF09zaOJSRcH9rdAmAxy4mfV826E'; 

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const dbService = {
  // Enfants
  async getChildren(): Promise<Child[]> {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('nom', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(row => ({
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      dateNaissance: row.date_naissance,
      dateInscription: row.date_inscription,
      sexe: row.sexe,
      section: row.section,
      nomPere: row.nom_pere,
      nomMere: row.nom_mere,
      numPere: row.num_pere,
      numMere: row.num_mere
    }));
  },

  async upsertChild(child: Child): Promise<void> {
    if (!supabase) return;

    const payload = {
      id: child.id,
      nom: child.nom,
      prenom: child.prenom,
      date_naissance: child.dateNaissance,
      date_inscription: child.dateInscription,
      sexe: child.sexe,
      section: child.section,
      nom_pere: child.nomPere,
      nom_mere: child.nomMere,
      num_pere: child.numPere,
      num_mere: child.numMere
    };

    const { error } = await supabase
      .from('children')
      .upsert(payload);
    
    if (error) throw error;
  },

  async deleteChild(id: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Paiements
  async getPayments(): Promise<PaymentHistory> {
    if (!supabase) return {};

    const { data, error } = await supabase
      .from('payments')
      .select('*');
    
    if (error) throw error;

    const history: PaymentHistory = {};
    (data || []).forEach(row => {
      const childId = row.child_id;
      if (!history[childId]) history[childId] = {};
      if (!history[childId][row.year]) history[childId][row.year] = {};
      
      history[childId][row.year][row.month] = {
        childId: row.child_id,
        year: row.year,
        month: row.month,
        amountPaid: row.amount_paid,
        paymentDate: row.payment_date
      };
    });

    return history;
  },

  async upsertPayment(payment: Payment): Promise<void> {
    if (!supabase) return;

    const payload = {
      child_id: payment.childId,
      year: payment.year,
      month: payment.month,
      amount_paid: payment.amountPaid,
      payment_date: payment.paymentDate
    };

    const { error } = await supabase
      .from('payments')
      .upsert(payload, { onConflict: 'child_id,year,month' });
    
    if (error) throw error;
  },

  async deletePayment(childId: string, year: number, month: number): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('payments')
      .delete()
      .match({ child_id: childId, year, month });
    
    if (error) throw error;
  },

  // Paramètres Crèche
  async getSettings(): Promise<CrecheSettings | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;

    return {
      name: data.name,
      rc: data.rc,
      nif: data.nif,
      article: data.article,
      agrement: data.agrement,
      address: data.address,
      tel: data.tel,
      city: data.city
    };
  },

  async updateSettings(settings: CrecheSettings): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...settings });
    
    if (error) throw error;
  }
};
