import { ref } from "vue";
import { api } from "../services/api";
export const user = ref(null);
export async function refreshSession() {
    try {
        user.value = await api("/api/v1/auth/user");
        return user.value;
    } catch (e) {
        if (e.status === 401) {
            user.value = null;
            return null;
        }
        throw e;
    }
}
export async function login(email, password) {
    await api("/sanctum/csrf-cookie");
    user.value = await api("/login", "POST", { email, password });
    return user.value;
}
export async function logout() {
    await api("/logout", "POST", {});
    user.value = null;
}
