import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl || '/api').replace(/\/+$/, '');

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected';

export async function sendConnectionRequest(senderId: string, receiverId: string) {
    const response = await axios.post(`${API_BASE_URL}/connect/send`, { senderId, receiverId });
    return response.data;
}

export async function getIncomingRequests(uid: string) {
    const response = await axios.get(`${API_BASE_URL}/connect/requests/${uid}`);
    return response.data;
}

export async function acceptConnectionRequest(requestId: number, senderId: string, receiverId: string) {
    const response = await axios.post(`${API_BASE_URL}/connect/accept`, { requestId, senderId, receiverId });
    return response.data;
}

export async function rejectConnectionRequest(requestId: number) {
    const response = await axios.post(`${API_BASE_URL}/connect/reject`, { requestId });
    return response.data;
}

export async function getConnectionStatus(senderId: string, receiverId: string): Promise<ConnectionStatus> {
    const response = await axios.get(`${API_BASE_URL}/connect/status`, {
        params: { senderId, receiverId }
    });
    return response.data.status;
}

export async function removeConnection(user1Id: string, user2Id: string) {
    const response = await axios.post(`${API_BASE_URL}/connect/remove`, { user1Id, user2Id });
    return response.data;
}
