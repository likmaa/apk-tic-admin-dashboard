import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || 'local-key';
const WS_HOST = import.meta.env.VITE_PUSHER_HOST || '192.168.1.70';
const WS_PORT = Number(import.meta.env.VITE_PUSHER_PORT || '6001');
const FORCE_TLS = import.meta.env.VITE_PUSHER_TLS === 'true';

let pusher: Pusher | null = null;

export const getPusher = () => {
    if (pusher) return pusher;

    const token = localStorage.getItem('admin_token');

    pusher = new Pusher(PUSHER_KEY, {
        wsHost: WS_HOST,
        wsPort: WS_PORT,
        forceTLS: FORCE_TLS,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        cluster: 'mt1',
        authEndpoint: `${import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.70:8000'}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });

    return pusher;
};

export const disconnectPusher = () => {
    if (pusher) {
        pusher.disconnect();
        pusher = null;
    }
};
