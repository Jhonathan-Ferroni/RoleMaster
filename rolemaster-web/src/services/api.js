import axios from "axios";

// Certifique-se de que a porta (7123) é a mesma que o seu backend .NET está rodando
export const api = axios.create({
  baseURL: "https://localhost:7150/api",
});

// Interceptor: Antes de qualquer requisição sair do React, ele injeta os headers
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
