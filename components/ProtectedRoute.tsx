
/**
 * Protected Route Component Template
 *
 * A wrapper component that ensures a user is authenticated before
 * allowing access to a screen. Redirects to login if not authenticated.
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <ProfileScreen />
 * </ProtectedRoute>
 * ```
 *
 * Note: Currently disabled to allow direct app access.
 * Re-enable by uncommenting useAuth logic when auth is needed.
 */

import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  // Auth protection disabled - app launches directly to tabs
  // Uncomment below when authentication is required:
  
  // const { user, loading } = useAuth();
  // const router = useRouter();
  //
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.replace(redirectTo as any);
  //   }
  // }, [user, loading, router, redirectTo]);
  //
  // if (loading) {
  //   return loadingComponent || <ActivityIndicator />;
  // }
  //
  // if (!user) {
  //   return null;
  // }

  return <>{children}</>;
}
