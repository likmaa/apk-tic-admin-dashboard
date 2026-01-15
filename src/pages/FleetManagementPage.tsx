import React, { useEffect, useState } from 'react';
import { Search, PlusCircle, SlidersHorizontal, User, CheckCircle, PauseCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/api/client';

// Interfaces et Types
type DriverStatus = 'active' | 'suspended' | 'pending';
interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: DriverStatus;
  vehicle_model: string;
  vehicle_number: string;
  rating: number | null;
  join_date: string;
}

// Composant Badge de Statut (légèrement adapté pour la flotte)
const FleetStatusBadge = ({ status }: { status: DriverStatus }) => {
  const statusConfig = {
    active: { icon: <CheckCircle size={14} />, style: 'bg-green-100 text-green-800' },
    suspended: { icon: <PauseCircle size={14} />, style: 'bg-orange-100 text-orange-800' },
    pending: { icon: <AlertTriangle size={14} />, style: 'bg-yellow-100 text-yellow-800' },
  };
  const config = statusConfig[status] || { icon: null, style: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.style}`}>
      {config.icon}
      {status === 'active' ? 'Actif' : status === 'suspended' ? 'Suspendu' : status === 'pending' ? 'En attente' : status}
    </span>
  );
};

export default function FleetManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Tous les users avec role=driver
        const usersRes = await api.get('/api/admin/users', { params: { role: 'driver', per_page: 200 } });
        const users = (usersRes.data?.data ?? usersRes.data) as any[];

        // 2) Drivers en pending (driver_profiles.status = pending)
        const pendingRes = await api.get('/api/admin/drivers/pending');
        const pending = (pendingRes.data?.data ?? pendingRes.data) as any[];
        const pendingIds = new Set<number>(pending.map((p) => p.id));

        const mapped: Driver[] = users.map((u) => {
          let status: DriverStatus = 'active';
          if (pendingIds.has(u.id)) {
            status = 'pending';
          } else if (u.is_active === false) {
            status = 'suspended';
          }

          const profile = u.driver_profile;

          return {
            id: u.id,
            name: u.name ?? '',
            phone: u.phone ?? '',
            email: u.email ?? '',
            status,
            vehicle_model: profile?.vehicle_model ? `${profile.vehicle_make || ''} ${profile.vehicle_model}`.trim() : (u.vehicle_number ? 'Véhicule enregistré' : 'N/A'),
            vehicle_number: profile?.vehicle_number || u.vehicle_number || 'N/A',
            rating: u.ratings_avg_stars ? Number(u.ratings_avg_stars) : null,
            join_date: u.created_at ?? new Date().toISOString(),
          };
        });

        setDrivers(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Erreur de chargement de la flotte");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  // Logique de filtrage et de recherche
  const filteredData = drivers
    .filter(driver => {
      if (statusFilter === 'all') return true;
      return driver.status === statusFilter;
    })
    .filter(driver =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      driver.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Gestion de la Flotte</h1>
        <p className="text-sm text-gray-500 mt-1">Visualisez, recherchez et gérez l'ensemble de vos chauffeurs.</p>
      </header>

      {/* Carte principale contenant les outils et le tableau */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {loading && <p className="text-sm text-gray-500">Chargement des chauffeurs...</p>}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {/* Barre d'outils : Recherche, Filtres, Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, tél, plaque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
              <option value="pending">En attente</option>
            </select>
            <button className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
              <PlusCircle size={18} />
              <span className="hidden sm:inline">Ajouter un chauffeur</span>
            </button>
          </div>
        </div>

        {/* Tableau des chauffeurs */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                {['Chauffeur', 'Véhicule', 'Note', 'Statut', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${driver.name.replace(' ', '+')}&background=random`} alt="" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        <div className="text-sm text-gray-500">{driver.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{driver.vehicle_model}</div>
                    <div className="text-sm text-gray-500">{driver.vehicle_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {driver.rating ? `⭐ ${driver.rating.toFixed(1)}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <FleetStatusBadge status={driver.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary hover:underline">
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length === 0 && (
          <div className="text-center p-10">
            <User size={48} className="mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Aucun chauffeur trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez d'ajuster votre recherche ou vos filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}
