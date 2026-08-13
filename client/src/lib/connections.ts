import axios from 'axios';
import { auth, isDemoMode } from '@/lib/firebase';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl || '/api').replace(/\/+$/, '');

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected';

async function authConfig() {
    if (isDemoMode || !auth?.currentUser) {
        throw new Error('Secure networking requires a signed-in Firebase account.');
    }
    const token = await auth.currentUser.getIdToken();
    return { headers: { Authorization: `Bearer ${token}` } };
}

export async function sendConnectionRequest(receiverId: string) {
    const response = await axios.post(`${API_BASE_URL}/connect/send`, { receiverId }, await authConfig());
    return response.data;
}

export async function getIncomingRequests(uid: string) {
    const response = await axios.get(`${API_BASE_URL}/connect/requests/${uid}`, await authConfig());
    return response.data;
}

export async function acceptConnectionRequest(requestId: number) {
    const response = await axios.post(`${API_BASE_URL}/connect/accept`, { requestId }, await authConfig());
    return response.data;
}

export async function rejectConnectionRequest(requestId: number) {
    const response = await axios.post(`${API_BASE_URL}/connect/reject`, { requestId }, await authConfig());
    return response.data;
}

export async function getConnectionStatus(receiverId: string): Promise<ConnectionStatus> {
    const response = await axios.get(`${API_BASE_URL}/connect/status`, {
        params: { receiverId },
        ...(await authConfig()),
    });
    return response.data.status;
}

export async function removeConnection(userId: string) {
    const response = await axios.post(`${API_BASE_URL}/connect/remove`, { userId }, await authConfig());
    return response.data;
}
