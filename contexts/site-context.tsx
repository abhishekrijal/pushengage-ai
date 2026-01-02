"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SiteData {
  site_id?: number;
  site_name?: string;
  site_url?: string;
  site_image?: string;
  site_status?: string;
  site_key?: string;
  site_subdomain?: string;
  [key: string]: any;
}

interface SiteContextType {
  siteData: SiteData | null;
  isLoading: boolean;
  error: string | null;
  refreshSiteData: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false, will be set to true when fetching
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSiteData = async () => {
    // Prevent multiple simultaneous calls - only skip if we've already successfully fetched
    if (hasFetched) {
      return;
    }

    // Prevent if already loading (to avoid duplicate calls)
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pushengage/site");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch site data");
      }

      if (result.success && result.data) {
        // Extract site data from the nested response structure
        const siteUrl = result.data?.data?.site_url || result.data?.data?.site?.site_url;
        
        const extractedSiteData: SiteData = {
          site_id: result.data?.data?.site_id || result.data?.data?.site?.site_id,
          site_name: result.data?.data?.site_name || result.data?.data?.site?.site_name,
          site_url: siteUrl, // Use the extracted value
          site_image: result.data?.data?.site_image || result.data?.data?.site?.site_image,
          site_status: result.data?.data?.site_status || result.data?.data?.site?.site_status,
          site_key: result.data?.data?.site_key || result.data?.data?.site?.site_key,
          site_subdomain: result.data?.data?.site_subdomain || result.data?.data?.site?.site_subdomain,
          // Store the full data object for any additional fields (but site_url is already set above)
          ...result.data?.data,
          // Ensure site_url is not overwritten by spread
          site_url: siteUrl || result.data?.data?.site_url || result.data?.data?.site?.site_url,
        };

        setSiteData(extractedSiteData);
        setHasFetched(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to fetch site data";
      console.error("Failed to fetch site data:", errorMessage, err);
      setError(errorMessage);
      // Don't throw - site data is optional
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch site data once on mount
  useEffect(() => {
    if (!hasFetched) {
      fetchSiteData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const refreshSiteData = async () => {
    setHasFetched(false);
    await fetchSiteData();
  };

  return (
    <SiteContext.Provider
      value={{
        siteData,
        isLoading,
        error,
        refreshSiteData,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error("useSite must be used within a SiteProvider");
  }
  return context;
}

