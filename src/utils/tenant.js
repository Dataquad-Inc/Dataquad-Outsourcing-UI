/**
 * Tenant = data isolation only. Product UI stays MyMulya branding.
 *
 * Priority for API calls:
 * 1. Logged-in user's tenantId (from auth)
 * 2. REACT_APP_TENANT
 * 3. ?tenant=
 * 4. Host (aventrainc.ai → aventra)
 * 5. default mymulya
 */
export const DEFAULT_TENANT = "mymulya";
export const AVENTRA_TENANT = "aventra";

export function tenantFromEmail(email) {
  if (!email || !email.includes("@")) return null;
  const domain = email.split("@").pop().trim().toLowerCase();
  if (domain === "aventrainc.ai" || domain.endsWith(".aventrainc.ai")) {
    return AVENTRA_TENANT;
  }
  return null;
}

export function tenantFromHost(hostname = window.location.hostname) {
  const host = (hostname || "").toLowerCase();
  if (!host) return null;
  if (host === "aventrainc.ai" || host.endsWith(".aventrainc.ai")) {
    return AVENTRA_TENANT;
  }
  if (host.startsWith("aventra.")) {
    return AVENTRA_TENANT;
  }
  return null;
}

export function resolveTenantId() {
  try {
    const stored = JSON.parse(localStorage.getItem("authUser") || "null");
    if (stored?.tenantId) {
      return String(stored.tenantId).toLowerCase();
    }
  } catch (_) {
    /* ignore */
  }

  const fromEnv = process.env.REACT_APP_TENANT;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim().toLowerCase();
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("tenant");
    if (fromQuery && fromQuery.trim()) {
      return fromQuery.trim().toLowerCase();
    }
  } catch (_) {
    /* ignore */
  }

  const fromHost = tenantFromHost();
  if (fromHost) return fromHost;

  return DEFAULT_TENANT;
}

export function getTenantHeader() {
  return { "X-Tenant-Id": resolveTenantId() };
}

/** fetch() with tenant header + credentials (proxy-friendly). */
export function tenantFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: options.credentials ?? "include",
    headers: {
      ...getTenantHeader(),
      ...(options.headers || {}),
    },
  });
}

