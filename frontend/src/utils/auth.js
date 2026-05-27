export function getDashboardPathForRole(role) {
  return role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard";
}

export function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalizedPayload));
  } catch (error) {
    return {};
  }
}

export function getStoredRole() {
  return localStorage.getItem("role") || "";
}

export function saveAuthSession({ token, role }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}
