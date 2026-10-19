import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Centraliza a URL base da API e do SignalR Hub para evitar divergências entre arquivos
const RAW_API_URL =
  import.meta.env.VITE_API_URL || "https://rolemaster-ioyd.onrender.com/api";

export const BACKEND_URL =
  import.meta.env.VITE_HUB_URL || RAW_API_URL.replace(/\/api\/?$/, "");

export const HUB_URL = `${BACKEND_URL}/campanhaHub`;

export const api = axios.create({
  baseURL: RAW_API_URL,
});

// Interceptor: Antes de qualquer requisição sair do React, injeta Authorization e X-Tenant-ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    config.headers["X-Tenant-ID"] = tenantId;
  }

  return config;
});

// Extrai os dados do usuário logado diretamente do Token JWT
export function obterUsuarioLogado() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const idRaw =
      decoded.nameid ||
      decoded.sub ||
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];
    const nome =
      decoded.unique_name ||
      decoded.name ||
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      "Aventureiro";

    return {
      id: idRaw ? Number(idRaw) : null,
      nome,
    };
  } catch {
    return null;
  }
}
