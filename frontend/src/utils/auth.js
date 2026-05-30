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

export function isForcePasswordChangeRequired() {
  return localStorage.getItem("forcePasswordChange") === "true";
}

export function getStoredPermissions() {
  try {
    const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
    return Array.isArray(permissions) ? permissions : [];
  } catch {
    return [];
  }
}

export function hasPermission(permissionCode) {
  const role = getStoredRole();

  if (role === "SUPER_ADMIN" || role === "ORG_ADMIN") {
    return true;
  }

  return getStoredPermissions().includes(permissionCode);
}

export function saveAuthSession({
  token,
  role,
  organizationId,
  permissions,
  forcePasswordChange,
}) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);

  if (forcePasswordChange !== undefined) {
    localStorage.setItem(
      "forcePasswordChange",
      String(Boolean(forcePasswordChange))
    );
  }

  if (permissions !== undefined) {
    localStorage.setItem(
      "permissions",
      JSON.stringify(Array.isArray(permissions) ? permissions : [])
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
  localStorage.removeItem("permissions");
  localStorage.removeItem("forcePasswordChange");
}
