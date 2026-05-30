import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AccessDenied from "../pages/AccessDenied";
import api from "../services/api";
import { getStoredOrganizationId, getStoredRole } from "../utils/auth";

function FeatureProtectedRoute({ featureCode }) {
  const role = getStoredRole();
  const organizationId = getStoredOrganizationId();
  const [isLoading, setIsLoading] = useState(true);
  const [hasFeature, setHasFeature] = useState(false);

  useEffect(() => {
    const fetchFeatures = async () => {
      if (role !== "ORG_ADMIN" || !organizationId) {
        setHasFeature(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/api/organizations/${organizationId}/features`
        );
        const features = response.data?.data?.features ?? [];
        setHasFeature(Array.isArray(features) && features.includes(featureCode));
      } catch {
        setHasFeature(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = window.setTimeout(fetchFeatures, 0);
    return () => window.clearTimeout(timeoutId);
  }, [featureCode, organizationId, role]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-slate-500 sm:px-6">
        Checking access...
      </main>
    );
  }

  if (!hasFeature) {
    return <AccessDenied />;
  }

  return <Outlet />;
}

export default FeatureProtectedRoute;
