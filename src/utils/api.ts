function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  const baseUrl = getBaseApiUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const result = await response.json();

    if (response.ok && result.data) {
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      localStorage.setItem('accessTokenExpiresAt', result.data.accessTokenExpiresAt);
      localStorage.setItem('refreshTokenExpiresAt', result.data.refreshTokenExpiresAt);
      
      return result.data.accessToken;
    } else {
      return null;
    }
  } catch (err) {
    console.error('Failed to refresh token:', err);
    return null;
  }
}

export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;
  
  let accessToken = localStorage.getItem('accessToken');

  if (!skipAuth) {
    if (!accessToken) {
      throw new Error('No access token found. Please log in.');
    }

    const headers = {
      ...fetchOptions.headers,
      'Authorization': `Bearer ${accessToken}`,
    };

    fetchOptions.headers = headers;
  }

  let response = await fetch(url, fetchOptions);

  if (response.status === 403 && !skipAuth) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token: string) => {
          const headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${token}`,
          };

          fetch(url, { ...fetchOptions, headers })
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();

      if (newToken) {
        onTokenRefreshed(newToken);
        
        const headers = {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${newToken}`,
        };

        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        clearAuthData();
        window.location.href = '/login';
        throw new Error('Token refresh failed. Please log in again.');
      }
    } catch (error) {
      clearAuthData();
      window.location.href = '/login';
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

export function clearAuthData() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('accessTokenExpiresAt');
  localStorage.removeItem('refreshTokenExpiresAt');
  localStorage.removeItem('userId');
  localStorage.removeItem('companyId');
  localStorage.removeItem('userData');
}

export function getBaseUrl(): string {
  return getBaseApiUrl();
}
