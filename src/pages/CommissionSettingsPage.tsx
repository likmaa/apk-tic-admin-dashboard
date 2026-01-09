import React, { useEffect, useState } from 'react';
import { PieChart, Save, Loader2, AlertTriangle, TrendingUp, Wrench, Car } from 'lucide-react';
import { api } from '@/api/client';

interface CommissionConfig {
  platform_pct: number;
  driver_pct: number;
  maintenance_pct: number;
}

export default function CommissionSettingsPage() {
  const [config, setConfig] = useState<CommissionConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/admin/pricing');
        const data = res.data as any;
        setConfig({
          platform_pct: Number(data.commission?.platform_pct ?? 70),
          driver_pct: Number(data.commission?.driver_pct ?? 20),
          maintenance_pct: Number(data.commission?.maintenance_pct ?? 10),
        });
      } catch (e: any) {
        setError(e?.response?.data?.message || "Erreur de chargement de la configuration");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const totalPct = config ? config.platform_pct + config.driver_pct + config.maintenance_pct : 0;
  const isValidTotal = totalPct === 100;

  const handleSave = async () => {
    if (!config || !isValidTotal) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put('/api/admin/pricing', {
        commission: {
          platform_pct: config.platform_pct,
          driver_pct: config.driver_pct,
          maintenance_pct: config.maintenance_pct,
        },
      });
      setSuccess("Configuration des commissions sauvegardée avec succès !");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration des Commissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Définissez la répartition des revenus entre la plateforme, les chauffeurs et la maintenance.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !isValidTotal}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Save size={20} />
          <span>{success}</span>
        </div>
      )}

      {!isValidTotal && config && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          <AlertTriangle size={20} />
          <span>Le total des pourcentages doit être égal à 100%. Actuellement: {totalPct}%</span>
        </div>
      )}

      {config && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenus Plateforme */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Revenus APK</h3>
                <p className="text-xs text-gray-500">Part de la plateforme</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={config.platform_pct}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, platform_pct: parseInt(e.target.value) || 0 } : prev
                  )
                }
                className="w-full text-3xl font-bold text-center py-4 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">%</span>
            </div>
            <p className="mt-3 text-sm text-gray-500 text-center">
              Montant retenu par TIC sur chaque course
            </p>
          </div>

          {/* Part Chauffeur */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Car className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Part Chauffeur</h3>
                <p className="text-xs text-gray-500">Gains du conducteur</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={config.driver_pct}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, driver_pct: parseInt(e.target.value) || 0 } : prev
                  )
                }
                className="w-full text-3xl font-bold text-center py-4 rounded-lg border-2 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">%</span>
            </div>
            <p className="mt-3 text-sm text-gray-500 text-center">
              Montant reversé au chauffeur
            </p>
          </div>

          {/* Maintenance */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Wrench className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Maintenance APK</h3>
                <p className="text-xs text-gray-500">Fonds de maintenance</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={config.maintenance_pct}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev ? { ...prev, maintenance_pct: parseInt(e.target.value) || 0 } : prev
                  )
                }
                className="w-full text-3xl font-bold text-center py-4 rounded-lg border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">%</span>
            </div>
            <p className="mt-3 text-sm text-gray-500 text-center">
              Réserve pour la maintenance de l'application
            </p>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {config && (
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center gap-3 mb-4">
            <PieChart size={28} />
            <h3 className="text-lg font-semibold">Résumé de la Répartition</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{config.platform_pct}%</p>
              <p className="text-sm opacity-80">APK</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{config.driver_pct}%</p>
              <p className="text-sm opacity-80">Chauffeur</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{config.maintenance_pct}%</p>
              <p className="text-sm opacity-80">Maintenance</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm opacity-80">
              Pour une course de <span className="font-bold">10,000 FCFA</span>:{' '}
              <span className="font-bold">{(10000 * config.platform_pct / 100).toLocaleString()} FCFA</span> APK,{' '}
              <span className="font-bold">{(10000 * config.driver_pct / 100).toLocaleString()} FCFA</span> Chauffeur,{' '}
              <span className="font-bold">{(10000 * config.maintenance_pct / 100).toLocaleString()} FCFA</span> Maintenance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
