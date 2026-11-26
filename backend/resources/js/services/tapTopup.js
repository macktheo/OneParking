import { api, business } from './api';
import { user } from '../stores/session';
const key = () => 'oneparking-pending-topup-' + user.value?.id;
export const pendingTapTopup = () => JSON.parse(sessionStorage.getItem(key()) || 'null');
export async function submitTapTopup(claim, amount) {
    let payload = pendingTapTopup();
    if (!payload) {
        payload = { request_id: crypto.randomUUID(), claim_id: claim.claim_id, amount };
        sessionStorage.setItem(key(), JSON.stringify(payload));
    }
    // Retrying always uses the same ID, claim and amount, including after reload.
    try {
        let result;
        try { result = await api(business('requests/' + payload.request_id)); }
        catch (e) { if (e.status !== 404) throw e; result = await api(business('topup'), 'POST', payload); }
        sessionStorage.removeItem(key());
        return result;
    } catch (e) {
        if ([409,422].includes(e.status)) sessionStorage.removeItem(key());
        throw e;
    }
}
