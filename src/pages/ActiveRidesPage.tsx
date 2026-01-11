import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Car, MapPin, Navigation, Clock, XCircle, RefreshCw, User, Phone } from 'lucide-react';
import { getPusher } from '@/api/pusher';

interface Ride {
    id: number;
    status: 'requested' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
    fare: number;
    pickup_address: string;
    dropoff_address: string;
    created_at: string;
    driver?: {
        id: number;
        name: string;
        phone: string;
    } | null;
    passenger?: {
        id: number;
        name: string;
        phone: string;
    } | null;
    passenger_name?: string | null;
    passenger_phone?: string | null;
    vehicle_type?: 'standard' | 'vip';
    has_baggage?: boolean;
}

export default function ActiveRidesPage() {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const fetchRides = async () => {
        try {
            setLoading(true);
            const t = Date.now();
            const [requested, accepted, arrived, pickup, ongoing] = await Promise.all([
                api.get(`/api/admin/rides?status=requested&t=${t}`),
                api.get(`/api/admin/rides?status=accepted&t=${t}`),
                api.get(`/api/admin/rides?status=arrived&t=${t}`),
                api.get(`/api/admin/rides?status=pickup&t=${t}`),
                api.get(`/api/admin/rides?status=ongoing&t=${t}`),
            ]);

            const combined = [
                ...(requested.data.data || []),
                ...(accepted.data.data || []),
                ...(arrived.data.data || []),
                ...(pickup.data.data || []),
                ...(ongoing.data.data || []),
            ];

            // Deduplicate by ID to avoid ghost rides during status transitions
            const seen = new Set();
            const allActive = combined.filter(ride => {
                if (seen.has(ride.id)) return false;
                seen.add(ride.id);
                return true;
            }).sort((a, b) => b.id - a.id);

            setRides(allActive);
        } catch (error) {
            console.error('Error fetching active rides:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRides();
        const interval = setInterval(fetchRides, 15000); // Polling 15s fallback

        const pusher = getPusher();
        const channel = pusher.subscribe('private-admin.alerts');

        channel.bind('ride.cancelled', (data: { rideId: number }) => {
            console.log('Real-time cancellation received:', data);
            setRides(prev => prev.filter(r => r.id !== data.rideId));
        });

        return () => {
            clearInterval(interval);
            channel.unbind_all();
            pusher.unsubscribe('private-admin.alerts');
        };
    }, []);

    const handleCancel = async (rideId: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler cette course ?')) return;

        try {
            setCancellingId(rideId);
            await api.post(`/api/admin/rides/${rideId}/cancel`);
            setRides(prev => prev.filter(r => r.id !== rideId));
        } catch (error) {
            alert('Erreur lors de l\'annulation de la course.');
        } finally {
            setCancellingId(null);
        }
    };

    const statusMap = {
        requested: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        accepted: { label: 'Acceptée', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        pickup: { label: 'Récupération', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        arrived: { label: 'Arrivé', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
        ongoing: { label: 'En cours', color: 'bg-green-100 text-green-800 border-green-200' },
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Courses Actives</h2>
                    <p className="text-gray-500">Supervisez et gérez les courses en cours en temps réel</p>
                </div>
                <button
                    onClick={fetchRides}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Chargement...' : 'Actualiser'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rides.length === 0 && !loading ? (
                    <div className="col-span-full py-12 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500">
                        <Car size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Aucune course active pour le moment</p>
                    </div>
                ) : (
                    rides.map(ride => (
                        <div key={ride.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Navigation size={18} />
                                    </div>
                                    <span className="font-bold text-gray-900">Course #{ride.id}</span>
                                </div>
                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusMap[ride.status as keyof typeof statusMap]?.color || 'bg-gray-100'}`}>
                                    {statusMap[ride.status as keyof typeof statusMap]?.label || ride.status}
                                </span>
                            </div>

                            <div className="p-4 space-y-4 flex-1">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ride.vehicle_type === 'vip' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {ride.vehicle_type === 'vip' ? 'VIP (AC)' : 'Standard'}
                                        </span>
                                        {ride.has_baggage && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-700">
                                                Bagages
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-green-500 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Départ</p>
                                            <p className="text-sm text-gray-800 line-clamp-2">{ride.pickup_address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-red-500 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Destination</p>
                                            <p className="text-sm text-gray-800 line-clamp-2">{ride.dropoff_address}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                            <User size={12} /> Passager
                                        </p>
                                        <p className="text-sm font-semibold truncate">{ride.passenger_name || ride.passenger?.name || 'Inconnu'}</p>
                                        {(ride.passenger_phone || ride.passenger?.phone) && (
                                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <Phone size={10} /> {ride.passenger_phone || ride.passenger?.phone}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                            <Car size={12} /> Chauffeur
                                        </p>
                                        <p className="text-sm font-semibold truncate">{ride.driver?.name || 'En recherche...'}</p>
                                        {ride.driver?.phone && (
                                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <Phone size={10} /> {ride.driver.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-gray-500">
                                    <div className="flex items-center gap-1 text-xs">
                                        <Clock size={14} />
                                        {new Date(ride.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="font-bold text-primary">
                                        {ride.fare.toLocaleString('fr-FR')} F
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => handleCancel(ride.id)}
                                    disabled={cancellingId === ride.id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <XCircle size={16} />
                                    {cancellingId === ride.id ? 'Annulation...' : 'Annuler la course'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
