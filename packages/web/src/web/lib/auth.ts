import { createAuthClient } from "better-auth/react";

const TOKEN_KEY = "ppi_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? "";
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/auth",
  fetchOptions: {
    auth: { type: "Bearer", token: () => getToken() },
    onSuccess: (ctx) => {
      const t = ctx.response.headers.get("set-auth-token");
      if (t) localStorage.setItem(TOKEN_KEY, t);
    },
  },
});
