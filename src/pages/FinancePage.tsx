import React, { useEffect, useState } from 'react';
import { DollarSign, ArrowUpRight, Download, Filter, Calendar, Users, Car } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '@/api/client';

// --- Données Statiques pour les Finances (seed local, remplacées ensuite par l'API) ---
const initialTransactionsData: Transaction[] = [];
// -------------------------------------------------------------

// Interfaces et Types
type TransactionStatus = 'completed' | 'refunded' | 'pending';
interface Transaction {
  id: string;
  date: string;
  passenger: string;
  driver: string;
  amount: number;
  commission: number;
  driver_payout: number;
  status: TransactionStatus;
}

interface FinanceSummaryRange {
  from: string;
  to: string;
}

interface FinanceSummary {
  range: FinanceSummaryRange;
  gross_volume: number;
  net_revenue: number;
  commission_rate: number;
  rides_count: number;
  payouts_pending: number;
}

// Props pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
}

// Composant pour les cartes de statistiques
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, change }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <Icon className="text-primary" size={22} />
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {change && <p className="text-xs text-green-600 flex items-center mt-2"><ArrowUpRight size={14} /> {change}</p>}
    </div>
  );
};

// Composant Badge de Statut pour les transactions
const TransactionStatusBadge = ({ status }: { status: TransactionStatus }) => {
  const config = {
    completed: 'bg-green-100 text-green-800',
    refunded: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
  };
  return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${config[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

export default function FinancePage() {
  const [dateRange, setDateRange] = useState('last_7_days');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactionsData);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const txPerPage = 20;

  const computeRange = (rangeKey: string): { from: string; to: string } => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (rangeKey) {
      case 'today': {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'this_month': {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'last_month': {
        const year = start.getFullYear();
        const month = start.getMonth();
        const firstOfThisMonth = new Date(year, month, 1, 0, 0, 0, 0);
        const lastMonthEnd = new Date(firstOfThisMonth.getTime() - 1);
        const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1, 0, 0, 0, 0);
        return {
          from: lastMonthStart.toISOString(),
          to: lastMonthEnd.toISOString(),
        };
      }
      case 'last_7_days':
      default: {
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
    }

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  };

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const { from, to } = computeRange(dateRange);
        const res = await api.get('/api/admin/finance/summary', {
          params: { from, to },
        });
        setSummary(res.data as FinanceSummary);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Erreur de chargement des données financières');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [dateRange]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/api/admin/finance/transactions', {
          params: { page: txPage, per_page: txPerPage },
        });
        const body = res.data as {
          data: Array<{ id: number | string; type: string; amount: number; currency: string; status: string; created_at: string }>;
          current_page: number;
          per_page: number;
          total: number;
        };

        const mapped: Transaction[] = body.data.map((item, index) => {
          const status: TransactionStatus = item.status === 'succeeded' ? 'completed' : 'pending';
          return {
            id: String(item.id),
            date: item.created_at,
            passenger: item.type === 'ride_payment' ? 'Course passager' : 'Prime chauffeur',
            driver: item.type === 'ride_payment' ? 'Course chauffeur' : 'Prime chauffeur',
            amount: item.amount,
            commission: (item as any).commission || 0,
            driver_payout: (item as any).payout || 0,
            status,
          };
        });

        setTransactions(mapped);
        setTxTotal(body.total);
      } catch (e) {
        // on garde les données initiales en cas d'erreur
      }
    };

    fetchTransactions();
  }, [txPage]);

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Finances et Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Supervisez les flux financiers, les commissions et les paiements aux chauffeurs.</p>
      </header>

      {loading && !summary && (
        <p className="text-sm text-gray-500">Chargement des données financières...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Section des KPIs (Indicateurs Clés de Performance) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires total"
          value={summary ? `${summary.gross_volume.toLocaleString('fr-FR')} FCFA` : '—'}
          icon={DollarSign}
        />
        <StatCard
          title="Commissions perçues"
          value={summary ? `${summary.net_revenue.toLocaleString('fr-FR')} FCFA` : '—'}
          icon={DollarSign}
        />
        <StatCard
          title="Paiements aux chauffeurs"
          value={summary ? `${(summary.gross_volume - summary.net_revenue).toLocaleString('fr-FR')} FCFA` : '—'}
          icon={Car}
        />
        <StatCard
          title="Transactions"
          value={summary ? summary.rides_count : '—'}
          icon={Users}
        />
      </div>

      {/* Carte principale pour la liste des transactions */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {/* Barre d'outils : Filtres et Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Historique des Transactions</h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full md:w-auto pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="today">Aujourd'hui</option>
                <option value="last_7_days">7 derniers jours</option>
                <option value="this_month">Ce mois-ci</option>
                <option value="last_month">Mois dernier</option>
              </select>
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={16} />
              Exporter en CSV
            </button>
          </div>
        </div>

        {/* Tableau des transactions */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                {['ID Transaction', 'Date', 'Passager', 'Chauffeur', 'Montant Total', 'Commission', 'Paiement Chauffeur', 'Statut'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{tx.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(tx.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.passenger}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.driver}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-gray-900">{tx.amount.toFixed(2)} FCFA</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{tx.commission.toFixed(2)} FCFA</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">{tx.driver_payout.toFixed(2)} FCFA</td>
                  <td className="px-6 py-4 whitespace-nowrap"><TransactionStatusBadge status={tx.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
