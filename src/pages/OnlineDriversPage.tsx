import React, { useEffect, useState } from 'react';
import { MapPin, Eye, UserCheck, FileText, XCircle } from 'lucide-react';
import { api } from '@/api/client';

type DriverStatus = 'pending' | 'approved' | 'rejected';

interface OnlineDriver {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  is_online: boolean;
  last_lat?: number | null;
  last_lng?: number | null;
  last_location_at?: string | null;
  status?: string | null;
  vehicle_number?: string | null;
  license_number?: string | null;
  documents?: any;
}

interface DriverProfileDetails {
  user: {
    id: number;
    name: string;
    phone: string;
    role: string | null;
    vehicle_number: string | null;
    license_number: string | null;
    photo: string | null;
  };
  profile: null | {
    status: DriverStatus | string;
    vehicle_number: string | null;
    license_number: string | null;
    photo: string | null;
    documents: Record<string, any> | null;
    created_at: string | null;
    updated_at: string | null;
  };
}

const StatusBadge = ({ status }: { status: DriverStatus | string }) => {
  const statusStyles: Record<DriverStatus | 'default', string> = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    approved: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200',
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
  };
  const normalized = status?.toString?.().toLowerCase?.() ?? 'default';
  const isKnown = ['pending', 'approved', 'rejected'].includes(normalized);
  const key: keyof typeof statusStyles = isKnown ? (normalized as DriverStatus) : 'default';
  const style = statusStyles[key];
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${style}`}>
      {status.toString().charAt(0).toUpperCase() + status.toString().slice(1)}
    </span>
  );
};

const DriverProfileModal = ({ driver, onClose }: { driver: OnlineDriver | null; onClose: () => void }) => {
  const [details, setDetails] = useState<DriverProfileDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!driver) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/admin/drivers/${driver.id}/profile`);
        setDetails(res.data as DriverProfileDetails);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Erreur de chargement du dossier du chauffeur');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [driver?.id]);

  if (!driver) return null;

  const profileStatus: string = (details?.profile?.status ?? driver.status ?? '—') as string;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900">Dossier du Chauffeur : {driver.name}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <XCircle size={24} />
          </button>
        </header>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {loading && <p className="text-sm text-gray-500">Chargement du dossier...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {details && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                    {details.profile?.photo || details.user.photo ? (
                      <img
                        src={details.profile?.photo || details.user.photo || ''}
                        alt={details.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(details.user.name)}&background=random`}
                        alt={details.user.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="md:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Informations personnelles</h4>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Nom :</span> {details.user.name}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Téléphone :</span> {details.user.phone}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Rôle actuel :</span> {details.user.role || '—'}
                  </p>
                </div>
                <div className="md:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Profil chauffeur</h4>
                  <p className="text-sm text-gray-800 flex items-center gap-2">
                    <span className="font-medium">Statut :</span> <StatusBadge status={profileStatus} />
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Immatriculation :</span>{' '}
                    {details.profile?.vehicle_number || details.user.vehicle_number || '—'}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Permis :</span>{' '}
                    {details.profile?.license_number || details.user.license_number || '—'}
                  </p>
                </div>
              </section>

              {details.profile?.documents && (
                <section>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText size={16} /> Documents transmis
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-800 space-y-1">
                    {Object.entries(details.profile.documents).map(([key, value]) => (
                      <p key={key}>
                        <span className="font-medium">{key} :</span> {String(value)}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {details.profile && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                  <p>
                    <span className="font-medium">Créé le :</span>{' '}
                    {details.profile.created_at
                      ? new Date(details.profile.created_at).toLocaleString('fr-FR')
                      : '—'}
                  </p>
                  <p>
                    <span className="font-medium">Mis à jour le :</span>{' '}
                    {details.profile.updated_at
                      ? new Date(details.profile.updated_at).toLocaleString('fr-FR')
                      : '—'}
                  </p>
                </section>
              )}
            </>
          )}
        </div>
        <footer className="flex justify-end items-center gap-3 p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          {profileStatus === 'pending' && (
            <button
              onClick={() => {
                window.location.href = `/drivers/pending?driverId=${driver.id}`;
              }}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              Aller au dossier en attente
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
};

interface LocationInfo {
  id: number;
  name: string;
  phone: string;
  is_online: boolean;
  last_lat: number | null;
  last_lng: number | null;
  last_location_at: string | null;
}

export default function OnlineDriversPage() {
  const [drivers, setDrivers] = useState<OnlineDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [selectedProfileDriver, setSelectedProfileDriver] = useState<OnlineDriver | null>(null);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');

  const totalDrivers = drivers.length;
  const onlineDrivers = drivers.filter((d) => d.is_online).length;

  const handleViewProfile = (driver: OnlineDriver) => {
    setSelectedProfileDriver(driver);
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = {};
        if (filter === 'online') params.online = 1;
        if (filter === 'offline') params.online = 0;

        const res = await api.get('/api/admin/drivers/online', { params });
        const data = (res.data?.data ?? res.data) as any[];
        const mapped: OnlineDriver[] = data.map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email ?? null,
          is_online: !!row.is_online,
          last_lat: row.last_lat != null ? Number(row.last_lat) : null,
          last_lng: row.last_lng != null ? Number(row.last_lng) : null,
          last_location_at: row.last_location_at ?? null,
          status: row.status ?? null,
          vehicle_number: row.vehicle_number ?? null,
          license_number: row.license_number ?? null,
          documents: (() => {
            if (!row.documents) return null;
            if (typeof row.documents === 'object') return row.documents;
            try {
              return JSON.parse(row.documents);
            } catch (e) {
              console.error("Failed to parse documents for driver", row.id, e);
              return null;
            }
          })(),
        }));
        setDrivers(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Erreur de chargement des chauffeurs en ligne");
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [filter]);

  const handleViewLocation = async (id: number) => {
    try {
      const res = await api.get(`/api/admin/drivers/${id}/location`);
      const data = res.data;
      setSelectedLocation({
        ...data,
        last_lat: data.last_lat != null ? Number(data.last_lat) : null,
        last_lng: data.last_lng != null ? Number(data.last_lng) : null,
      } as LocationInfo);
    } catch (e: any) {
      alert(e?.response?.data?.message || "Impossible de récupérer la localisation du chauffeur");
    }
  };

  const handleForceOffline = async (id: number) => {
    if (!window.confirm('Forcer ce chauffeur hors ligne ?')) return;
    try {
      await api.post(`/api/admin/drivers/${id}/force-offline`);
      setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, is_online: false } : d)));
    } catch (e: any) {
      alert(e?.response?.data?.message || "Impossible de forcer ce chauffeur hors ligne");
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chauffeurs — statut de connexion</h2>
            <p className="text-sm text-gray-500 mt-1">
              Liste des chauffeurs avec leur statut de connexion (en ligne / hors ligne) et leur dernière position connue.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-semibold">{onlineDrivers}</span> en ligne /{' '}
              <span className="font-semibold">{totalDrivers}</span> chauffeurs (filtre : {filter === 'all' ? 'tous' : filter === 'online' ? 'en ligne' : 'hors ligne'})
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'online', label: 'En ligne' },
              { key: 'offline', label: 'Hors ligne' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as 'all' | 'online' | 'offline')}
                className={
                  'px-3 py-1.5 text-xs rounded-full border transition-colors ' +
                  (filter === btn.key
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')
                }
              >
                {btn.label}
              </button>
            ))}
          </div>
        </header>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Chargement des chauffeurs en cours...</span>
          </div>
        )}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        {!loading && drivers.length === 0 ? (
          <div className="text-center p-10 bg-gray-50 rounded-lg border-2 border-dashed">
            <UserCheck size={48} className="mx-auto text-green-500" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Aucun chauffeur en ligne</h3>
            <p className="mt-1 text-sm text-gray-500">Actuellement, aucun chauffeur n'est enregistré dans le système.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  {['Chauffeur', 'Connexion', 'Statut profil', 'Véhicule', 'Dernière position', 'Actions'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={`https://ui-avatars.com/api/?name=${(driver.name || 'Driver').replace(' ', '+')}&background=random`}
                          alt=""
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ' +
                          (driver.is_online
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200')
                        }
                      >
                        {driver.is_online ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {driver.status ? driver.status : 'Inconnu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-sm text-gray-900">{driver.vehicle_number || '—'}</div>
                      <div className="text-xs text-gray-500">Permis : {driver.license_number || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.last_lat != null && driver.last_lng != null ? (
                        <>
                          <div>{driver.last_lat.toFixed(5)}, {driver.last_lng.toFixed(5)}</div>
                          {driver.last_location_at && (
                            <div className="text-xs text-gray-400">
                              {new Date(driver.last_location_at).toLocaleString('fr-FR')}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Position inconnue</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewLocation(driver.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <MapPin size={14} />
                          Voir position
                        </button>
                        <button
                          onClick={() => handleViewProfile(driver)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <Eye size={14} />
                          Voir dossier
                        </button>
                        {driver.is_online && (
                          <button
                            onClick={() => handleForceOffline(driver.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 border border-red-300 text-red-700 rounded-lg hover:bg-red-100"
                          >
                            Forcer hors ligne
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedLocation(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Dernière position du chauffeur</h3>
            </header>
            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Chauffeur :</span> {selectedLocation.name} ({selectedLocation.phone})
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Coordonnées :</span>{' '}
                {selectedLocation.last_lat && selectedLocation.last_lng
                  ? `${selectedLocation.last_lat.toFixed(5)}, ${selectedLocation.last_lng.toFixed(5)}`
                  : 'Inconnues'}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Dernière mise à jour :</span>{' '}
                {selectedLocation.last_location_at
                  ? new Date(selectedLocation.last_location_at).toLocaleString('fr-FR')
                  : 'Inconnue'}
              </p>
            </div>
            <footer className="flex justify-end items-center gap-3 p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setSelectedLocation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
            </footer>
          </div>
        </div>
      )}

      {selectedProfileDriver && (
        <DriverProfileModal
          driver={selectedProfileDriver}
          onClose={() => setSelectedProfileDriver(null)}
        />
      )}
    </>
  );
}
