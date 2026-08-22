export const TIN_VERIFICATION_STORAGE_KEY = 'naccima_tin_verification';
export const TIN_VERIFICATION_TOKEN_KEY = 'naccima_tin_token';

export interface VerifyTinRequest {
  tin: string;
}

export interface VerifyTinData {
  verified: boolean;
  registrationToken: string;
  tin: string;
  registeredName: string;
  registeredAddress: string;
  registrationStatus: string;
  state: string;
  lga: string;
  taxpayerType: string;
}

export interface VerifyTinResponse {
  success: boolean;
  code: string;
  message: string;
  timestamp: string;
  data: VerifyTinData;
}

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }

  return rawBaseUrl.replace(/\/+$/, '');
}

export async function verifyTin(payload: VerifyTinRequest): Promise<VerifyTinData> {
  const baseUrl = getBaseApiUrl();

  if (!baseUrl) {
    throw new Error('API base URL is not configured. Please set NEXT_PUBLIC_API in the environment.');
  }

  const url = `${baseUrl}/api/v1/onboarding/verify-tin`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let result: VerifyTinResponse | null = null;

  try {
    result = (await response.json()) as VerifyTinResponse;
  } catch {
    result = null;
  }

  if (!response.ok || !result?.success) {
    const fallbackMessage = result?.message || 'TIN verification failed.';
    throw new Error(fallbackMessage);
  }

  if (!result.data?.verified) {
    throw new Error(result.message || 'TIN verification returned an unverified record.');
  }

  return result.data;
}

export function saveTinVerification(data: VerifyTinData): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(TIN_VERIFICATION_STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(TIN_VERIFICATION_TOKEN_KEY, data.registrationToken);
}

export function getTinVerification(): VerifyTinData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(TIN_VERIFICATION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as VerifyTinData;
  } catch {
    return null;
  }
}

export function getTinVerificationToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(TIN_VERIFICATION_TOKEN_KEY);
}

export function clearTinVerification(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TIN_VERIFICATION_STORAGE_KEY);
  localStorage.removeItem(TIN_VERIFICATION_TOKEN_KEY);
}
