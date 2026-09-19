'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, getBaseUrl } from '@/utils/api';

/**
 * Loads vetting applications and applies the filters on the frontend.
 *
 * - No search / certificate type / transport filter  -> normal server-side pagination
 *   (only the `status` filter is sent to the API).
 * - Any of those filters active -> ALL applications for the selected status are loaded once
 *   (and cached), then filtered and paginated locally. This means the filters work across
 *   every page, even if the backend has no support for them.
 */

const ALL_PAGE_SIZE = 100; // page size used when loading everything
const MAX_PAGES = 100; // safety cap: ALL_PAGE_SIZE * MAX_PAGES rows
const BATCH_SIZE = 5; // parallel requests per batch

export interface FilterableApplication {
  tin: string;
  certificateType: string;
  modeOfTransport: string;
  status: string;
}

interface Options {
  status: string;
  search: string;
  certType: string;
  transport: string;
  pageSize?: number;
}

interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

async function fetchPage<T>(status: string, page: number, size: number): Promise<PageResult<T>> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('API base URL is not configured');
  }

  const params = new URLSearchParams();
  if (status !== 'all') {
    params.set('status', status);
  }
  params.set('page', page.toString());
  params.set('size', size.toString());

  const response = await apiFetch(
    `${baseUrl}/api/v1/admin/certificates/vetting/applications?${params.toString()}`
  );
  const payload = await response.json();

  if (!response.ok || !payload?.success || !payload?.data) {
    throw new Error(payload?.message || 'Unable to load applications.');
  }

  return {
    content: payload.data.content || [],
    totalElements: payload.data.totalElements || 0,
    totalPages: payload.data.totalPages || 0,
  };
}

async function fetchAllPages<T>(status: string): Promise<T[]> {
  const first = await fetchPage<T>(status, 0, ALL_PAGE_SIZE);
  let rows: T[] = [...first.content];

  const lastPage = Math.min(first.totalPages, MAX_PAGES);
  if (first.totalPages > MAX_PAGES) {
    console.warn(`Only the first ${MAX_PAGES} pages were loaded for client-side filtering.`);
  }

  for (let start = 1; start < lastPage; start += BATCH_SIZE) {
    const batch: Promise<PageResult<T>>[] = [];
    for (let p = start; p < Math.min(start + BATCH_SIZE, lastPage); p++) {
      batch.push(fetchPage<T>(status, p, ALL_PAGE_SIZE));
    }
    const results = await Promise.all(batch);
    results.forEach((r) => {
      rows = rows.concat(r.content);
    });
  }

  return rows;
}

export function useVettingApplications<T extends FilterableApplication>({
  status,
  search,
  certType,
  transport,
  pageSize = 20,
}: Options) {
  const [currentPage, setCurrentPage] = useState(0);
  const [serverData, setServerData] = useState<{ rows: T[]; totalElements: number; totalPages: number }>({
    rows: [],
    totalElements: 0,
    totalPages: 0,
  });
  const [allData, setAllData] = useState<{ status: string; rows: T[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const requestIdRef = useRef(0);
  const allCacheRef = useRef<{ status: string; rows: T[] } | null>(null);

  const term = search.trim().toLowerCase();
  const hasClientFilters = certType !== 'all' || transport !== 'all' || term !== '';

  // Go back to the first page whenever a filter changes
  const filterKey = `${status}|${certType}|${transport}|${term}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(0);
  }

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    // Everything for this status is already loaded -> filter/paginate locally, no request needed
    if (hasClientFilters && allCacheRef.current?.status === status) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (hasClientFilters) {
          const rows = await fetchAllPages<T>(status);
          if (isStale()) return;
          const entry = { status, rows };
          allCacheRef.current = entry;
          setAllData(entry);
        } else {
          const result = await fetchPage<T>(status, currentPage, pageSize);
          if (isStale()) return;
          setServerData({
            rows: result.content,
            totalElements: result.totalElements,
            totalPages: result.totalPages,
          });
        }
      } catch (err) {
        if (isStale()) return;
        console.error('Failed to fetch applications:', err);
        setError(err instanceof Error && err.message ? err.message : 'Unable to load applications right now.');
      } finally {
        if (!isStale()) {
          setLoading(false);
        }
      }
    };

    load();
  }, [status, currentPage, pageSize, hasClientFilters, refreshToken]);

  const filteredAll = useMemo(() => {
    if (!allData) return [];
    const certTerm = certType.toLowerCase();
    const transportTerm = transport.toLowerCase();

    return allData.rows.filter((app) => {
      if (status !== 'all' && app.status !== status) return false;
      if (certType !== 'all' && !(app.certificateType ?? '').toLowerCase().includes(certTerm)) return false;
      if (transport !== 'all' && (app.modeOfTransport ?? '').toLowerCase() !== transportTerm) return false;
      if (term && !(app.tin ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [allData, status, certType, transport, term]);

  const allReady = allData?.status === status;
  const matchingRows: T[] = hasClientFilters ? (allReady ? filteredAll : []) : serverData.rows;

  const totalElements = hasClientFilters ? matchingRows.length : serverData.totalElements;
  const totalPages = hasClientFilters ? Math.ceil(matchingRows.length / pageSize) : serverData.totalPages;
  const page = hasClientFilters ? Math.min(currentPage, Math.max(totalPages - 1, 0)) : currentPage;

  const rows = hasClientFilters ? matchingRows.slice(page * pageSize, (page + 1) * pageSize) : serverData.rows;

  const refresh = useCallback(() => {
    allCacheRef.current = null;
    setAllData(null);
    setRefreshToken((t) => t + 1);
  }, []);

  return {
    /** Rows to show in the table for the current page */
    rows,
    /** All rows matching the filters (current page only when no client filters are active) */
    matchingRows,
    loading: loading || (hasClientFilters && !allReady && !error),
    error,
    setError,
    totalElements,
    totalPages,
    currentPage: page,
    setCurrentPage,
    refresh,
  };
}