'use client';

import { useState, useEffect } from 'react';
import type { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from './Eip6963Types';

export function useEip6963() {
  const [providers, setProviders] = useState<Map<string, EIP6963ProviderDetail>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAnnouncement = (event: Event) => {
      const detail = (event as EIP6963AnnounceProviderEvent).detail;
      setProviders((prev) => {
        const newProviders = new Map(prev);
        newProviders.set(detail.info.uuid, detail);
        return newProviders;
      });
    };

    window.addEventListener('eip6963:announceProvider', handleAnnouncement);

    // Request providers
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnouncement);
    };
  }, []);

  const getProviderByRdns = (rdns: string): EIP6963ProviderDetail | undefined => {
    return Array.from(providers.values()).find((p) => p.info.rdns === rdns);
  };

  return {
    providers: Array.from(providers.values()),
    getProviderByRdns,
  };
}


