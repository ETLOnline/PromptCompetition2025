// hooks/useAuthenticatedFetch.ts
"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

/**
 * Hook that provides an authenticated fetch function using Clerk
 * This wraps the fetchWithAuth utility to automatically pass the getToken function
 */
export function useAuthenticatedFetch() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!isLoaded) {
        throw new Error("Auth is still loading");
      }

      if (!isSignedIn) {
        throw new Error("User not authenticated");
      }

      const token = await getToken();

      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 302) {
        window.location.href = "/"; // force full redirect
        return; // stop further execution
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    [getToken, isLoaded, isSignedIn]
  );

  return {
    authenticatedFetch,
    isLoaded,
    isSignedIn,
  };
}
