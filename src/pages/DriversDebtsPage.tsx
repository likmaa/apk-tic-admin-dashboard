import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';

type DriverDebt = {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    is_blocked: boolean;
    wallet_id: number | null;
    balance: number;
    currency: string;
    has_debt: boolean;
    debt_amount: number;
    license_plate: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
};

type PaginatedResponse = {
    data: DriverDebt[];
    current_page: number;
    last_page: number;
    total: number;
};

export default function DriversDebtsPage() {
    const [drivers, setDrivers] = useState<DriverDebt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [onlyDebts, setOnlyDebts] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal state
    const [adjustModal, setAdjustModal] = useState<{ walletId: number; driverName: string } | null>(null);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjustLoading, setAdjustLoading] = useState(false);

    const fetchDrivers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<PaginatedResponse>('/api/admin/drivers/debts', {
                params: {
                    only_debts: onlyDebts ? '1' : undefined,
                    search: search || undefined,
                    page,
                    per_page: 30,
                },
            });
            setDrivers(res.data.data);
            setTotalPages(res.data.last_page);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, [onlyDebts, page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchDrivers();
    };

    const handleBlock = async (driverId: number) => {
        if (!confirm('Voulez-vous vraiment bloquer ce chauffeur?')) return;
        try {
            await api.post(`/api/admin/drivers/${driverId}/block`, { reason: 'Dette impayée' });
            fetchDrivers();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Erreur');
        }
    };

    const handleUnblock = async (driverId: number) => {
        if (!confirm('Voulez-vous débloquer ce chauffeur?')) return;
        try {
            await api.post(`/api/admin/drivers/${driverId}/unblock`);
            fetchDrivers();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Erreur');
        }
    };

    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustModal || !adjustAmount || !adjustReason) return;

        setAdjustLoading(true);
        try {
            await api.post(`/api/admin/wallets/${adjustModal.walletId}/adjust`, {
                amount: parseInt(adjustAmount, 10),
                type: adjustType,
                reason: adjustReason,
            });
            setAdjustModal(null);
            setAdjustAmount('');
            setAdjustReason('');
            fetchDrivers();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Erreur');
        } finally {
            setAdjustLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return `${amount.toLocaleString('fr-FR')} ${currency}`;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestion des Dettes Chauffeurs</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Suivez les soldes, enregistrez les paiements et gérez les blocages.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={onlyDebts}
                                onChange={(e) => { setOnlyDebts(e.target.checked); setPage(1); }}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>Dettes uniquement</span>
                        </label>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex gap-3 mb-4">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par nom, téléphone..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                    >
                        Rechercher
                    </button>
                </form>

                {loading && <p className="text-sm text-gray-500">Chargement...</p>}
                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

                {!loading && drivers.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['ID', 'Chauffeur', 'Téléphone', 'Véhicule', 'Solde', 'Dette', 'Statut', 'Actions'].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-sm">
                                {drivers.map((d) => (
                                    <tr key={d.id} className={d.has_debt ? 'bg-red-50' : ''}>
                                        <td className="px-4 py-3 text-gray-600">#{d.id}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{d.phone}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {d.license_plate || '—'}
                                            {d.vehicle_make && ` (${d.vehicle_make})`}
                                        </td>
                                        <td className={`px-4 py-3 font-semibold ${d.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(d.balance, d.currency)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {d.has_debt ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    ⚠️ {formatCurrency(d.debt_amount, d.currency)}
                                                </span>
                                            ) : (
                                                <span className="text-green-600 text-xs">✓ Aucune</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {d.is_blocked ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-white">
                                                    🚫 Bloqué
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    🟢 Actif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 space-x-2">
                                            {d.wallet_id && (
                                                <button
                                                    onClick={() => setAdjustModal({ walletId: d.wallet_id!, driverName: d.name })}
                                                    className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                >
                                                    💰 Ajuster
                                                </button>
                                            )}
                                            {d.is_blocked ? (
                                                <button
                                                    onClick={() => handleUnblock(d.id)}
                                                    className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                                                >
                                                    Débloquer
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBlock(d.id)}
                                                    className="px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200"
                                                >
                                                    Bloquer
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && drivers.length === 0 && !error && (
                    <p className="text-sm text-gray-500 py-8 text-center">Aucun chauffeur trouvé.</p>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                            ‹ Précédent
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-600">
                            Page {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                            Suivant ›
                        </button>
                    </div>
                )}
            </div>

            {/* Adjust Modal */}
            {adjustModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            Ajuster le solde — {adjustModal.driverName}
                        </h2>
                        <form onSubmit={handleAdjustSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            value="credit"
                                            checked={adjustType === 'credit'}
                                            onChange={() => setAdjustType('credit')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-green-600 font-medium">Crédit (paiement reçu)</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            value="debit"
                                            checked={adjustType === 'debit'}
                                            onChange={() => setAdjustType('debit')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-red-600 font-medium">Débit (retrait)</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                                <input
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                    placeholder="Ex: 5000"
                                    min="1"
                                    required
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
                                <input
                                    type="text"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Ex: Paiement espèces reçu en bureau"
                                    required
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAdjustModal(null)}
                                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustLoading}
                                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {adjustLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
