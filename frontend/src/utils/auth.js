export function getDashboardPathForRole(role) {
  return role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard";
}

export function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalizedPayload));
  } catch {
    return {};
  }
}

export function getStoredRole() {
  return localStorage.getItem("role") || "";
}

export function getStoredOrganizationId() {
  return localStorage.getItem("organizationId") || "";
}

export function getStoredName() {
  return localStorage.getItem("name") || "";
}

export function isForcePasswordChangeRequired() {
  return localStorage.getItem("forcePasswordChange") === "true";
}

export function saveAuthSession({
  token,
  role,
  organizationId,
  name,
  forcePasswordChange,
}) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);

  if (name !== undefined && name !== null) {
    localStorage.setItem("name", name);
  }

  if (forcePasswordChange !== undefined) {
    localStorage.setItem(
      "forcePasswordChange",
      String(Boolean(forcePasswordChange))
    );
  }

  if (organizationId !== undefined && organizationId !== null) {
    localStorage.setItem("organizationId", String(organizationId));
  } else {
    localStorage.removeItem("organizationId");
  }
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("organizationId");
  localStorage.removeItem("name");
  localStorage.removeItem("forcePasswordChange");
}
