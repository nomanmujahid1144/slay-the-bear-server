import axios from 'axios';
import config from '../config';

export class FinleyService {
    /**
     * Non-streaming chat — proxy to Server A's /api/chat
     */
    static async sendMessage(
        userJWT: string,
        clientIp: string,
        body: { message: string; session_id?: string; language?: string }
    ) {
        const response = await axios.post(
            `${config.AI_SERVER_URL}/api/chat`,
            body,
            {
                headers: {
                    'Authorization': `Bearer ${userJWT}`,
                    'X-Forwarded-For': clientIp,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    }

    /**
     * Streaming chat — proxy to Server A's /api/chat/stream, returns the
     * raw axios stream so the controller can pipe it directly to the client.
     */
    static async streamMessage(
        userJWT: string,
        clientIp: string,
        body: { message: string; session_id?: string; language?: string }
    ) {
        return axios.post(
            `${config.AI_SERVER_URL}/api/chat/stream`,
            body,
            {
                headers: {
                    'Authorization': `Bearer ${userJWT}`,
                    'X-Forwarded-For': clientIp,
                    'Content-Type': 'application/json',
                },
                responseType: 'stream',
            }
        );
    }

    /**
     * Disclosure — current text/version (public endpoint on Server A)
     */
    static async getDisclosure() {
        const response = await axios.get(`${config.AI_SERVER_URL}/api/disclosure`);
        return response.data;
    }

    static async getDisclosureStatus(userJWT: string) {
        const response = await axios.get(`${config.AI_SERVER_URL}/api/disclosure/status`, {
            headers: { 'Authorization': `Bearer ${userJWT}` },
        });
        return response.data;
    }

    static async acceptDisclosure(userJWT: string, clientIp: string, version: string) {
        const response = await axios.post(
            `${config.AI_SERVER_URL}/api/disclosure/accept`,
            { version },
            {
                headers: {
                    'Authorization': `Bearer ${userJWT}`,
                    'X-Forwarded-For': clientIp,
                },
            }
        );
        return response.data;
    }
}