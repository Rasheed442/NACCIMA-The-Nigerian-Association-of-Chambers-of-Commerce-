'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import Sidebar from '@/components/Sidebar';
import LogoutModal from '@/components/LogoutModal';
import { FiArrowRight } from "react-icons/fi";
import { ChevronDown, Check } from "lucide-react";
import { apiFetch, getBaseUrl } from '@/utils/api';

interface CertificateType {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

interface CertificateField {
  code: string;
  name: string;
  category: 'APPLICATION' | 'LINE_ITEM';
  applicable: boolean;
  required: boolean;
  readOnly: boolean;
  repeatable: boolean;
  templateComponent: string;
  options?: Array<string | { code?: string; value?: string; name?: string; label?: string }>;
}

interface CertificateTypeFields {
  certificateTypeId: string;
  certificateTypeCode: string;
  certificateTypeName: string;
  fields: CertificateField[];
}

interface TransportMode {
  code: string;
  name: string;
  documents: Array<{
    code: string;
    name: string;
    required: boolean;
  }>;
}

interface HSCode {
  id: string;
  cetCode: string;
  description: string;
  unit?: string;
}

interface Country {
  code: string;
  name: string;
}

interface CompanyProfile {
  companyId: string;
  tin: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  naccimaRegistrationNumber: string;
  address: string;
  state: string;
  lga: string;
  membershipActive: boolean;
  membershipStartDate: string;
  membershipEndDate: string;
  membershipStatus: string;
}

interface GoodsLineItem {
  id: string;
  hsCode: string;
  description: string;
  marksNo: string;
  quantity: string;
  grossWeight: string;
  nomenclature: string;
  unit: string;
  value: string;
}

interface TrackingEvent {
  event?: string;
  status?: string;
  comment?: string | null;
  occurredAt?: string;
}

interface TrackingData {
  timeline?: TrackingEvent[];
}

interface ApplicationData {
  id: string;
  certificateType: string;
  tin: string;
  shipperName: string;
  shipperAddress: string;
  importerEmail?: string;
  consignee: string;
  consigneeAddress: string;
  carrier: string;
  modeOfTransport: string;
  destinationCountry: string;
  destinationPort: string;
  countryOfMfg: string;
  totalItems?: number;
  totalValueFob?: number;
  valueCurrency?: string;
  bulkQtyMt?: number;
  status?: string;
  criteria?: string;
  fields?: Record<string, string | number | boolean>;
  goods?: Array<{
    id?: string;
    hsCode?: string;
    description?: string;
    marksNo?: string;
    quantity?: number | string;
    grossWeight?: number | string;
    nomenclature?: string;
    unit?: string;
    value?: number | string;
  }>;
}

export default function EditResubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const applicationId = params.id as string;
  const isPaymentMode = searchParams.get('mode') === 'payment';
  const isAdminUser = searchParams.get('user') === 'admin';
  const userRole = isAdminUser ? 'admin' : 'exporter';
  const dashboardPath = isAdminUser ? '/admin/my-applications' : '/exporter-dashboard';

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New application page state
  const [transportMode, setTransportMode] = useState<string | null>(null);
  const [isSavingTransportMode, setIsSavingTransportMode] = useState(false);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(true);
  const [certError, setCertError] = useState('');
  const [certificateFields, setCertificateFields] = useState<CertificateTypeFields | null>(null);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [transportModes, setTransportModes] = useState<TransportMode[]>([]);
  const [hsCodes, setHsCodes] = useState<HSCode[]>([]);
  const [hsSearchQuery, setHsSearchQuery] = useState('');
  const [isSearchingHs, setIsSearchingHs] = useState(false);
  const [activeHsCodeRowId, setActiveHsCodeRowId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false);
  const [manufacturingDropdownOpen, setManufacturingDropdownOpen] = useState(false);
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');
  const [manufacturingSearchQuery, setManufacturingSearchQuery] = useState('');
  const destinationRef = useRef<HTMLDivElement>(null);
  const manufacturingRef = useRef<HTMLDivElement>(null);
  const totalValueFOBRef = useRef<HTMLInputElement>(null);
  const errorAlertRef = useRef<HTMLDivElement>(null);
  const [goodsLineItems, setGoodsLineItems] = useState<GoodsLineItem[]>([]);
  const lineItemIdRef = useRef(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTransportModeDetails, setSelectedTransportModeDetails] = useState<TransportMode | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string | boolean | string[]>>({});

  // Payment-related state
  const paymentTabRef = useRef<Window | null>(null);
  const paymentPollIntervalRef = useRef<number | null>(null);
  const [paymentData, setPaymentData] = useState<Record<string, unknown> | null>(null);
  const [paymentCheckoutUrl, setPaymentCheckoutUrl] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER' | 'USSD'>('CARD');
  const [reviewDocuments, setReviewDocuments] = useState<Array<{ documentType: string; fileName: string; fileUrl: string }>>([]);
  // When true, the page shows the "Secure Payment" step (mirroring the New
  // Application flow's step 4) instead of the editable form/sections.
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [showReviewStep, setShowReviewStep] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);

  const prefillDynamicFields = (appData: ApplicationData) => {
    const fieldValues: Record<string, string | boolean | string[]> = {};

    if (appData.fields && typeof appData.fields === 'object') {
      Object.entries(appData.fields).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          fieldValues[key] = value.map(String);
        } else if (typeof value === 'boolean') {
          fieldValues[key] = value;
        } else if (value !== null && value !== undefined) {
          fieldValues[key] = String(value);
        }
      });
    }

    const fallbackValues: Record<string, string> = {
      IMPORTER_EMAIL: appData.importerEmail || '',
      CONSIGNEE: appData.consignee || '',
      CONSIGNEE_ADDRESS: appData.consigneeAddress || '',
      CARRIER: appData.carrier || '',
      DESTINATION: appData.destinationCountry || '',
      DESTINATION_PORT: appData.destinationPort || '',
      COUNTRY_OF_MANUFACTURING: appData.countryOfMfg || '',
      TOTAL_VALUE_FOB: String(appData.totalValueFob ?? ''),
      BULK_QUANTITY_MT: String(appData.bulkQtyMt ?? ''),
      TOTAL_ITEMS: String(appData.totalItems ?? ''),
      CRITERIA: appData.criteria || '',
    };

    Object.entries(fallbackValues).forEach(([key, value]) => {
      if (fieldValues[key] === undefined && value !== '') {
        fieldValues[key] = value;
      }
    });

    setDynamicFieldValues(fieldValues);
  };

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  // Listen for the payment-complete signal from the popup tab
  useEffect(() => {
    if (!isPaymentMode) return;

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key !== 'nacc-payment-complete' || !event.newValue) return;

      let reference: string | null = null;
      let paymentId: string | null = null;
      let status: string | null = null;
      try {
        const paymentData = JSON.parse(event.newValue);
        reference = paymentData.reference ?? null;
        paymentId = paymentData.paymentId ?? null;
        status = paymentData.status ?? null;
      } catch {
        // ignore malformed payload
      }

      setSuccessMessage(reference ? `Payment successful. Reference: ${reference}` : 'Payment successful.');
      stopPaymentStatusPolling();
      setTimeout(() => {
        const redirectUrl = `${dashboardPath}?status=success`;
        const params = new URLSearchParams();
        if (reference) params.append('reference', reference);
        if (paymentId) params.append('paymentId', paymentId);
        if (status) params.append('status', status);
        router.push(redirectUrl + (params.toString() ? `&${params.toString()}` : ''));
      }, 2000);
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [isPaymentMode, router, dashboardPath]);

  // Stop polling if the component unmounts while a payment tab is open
  useEffect(() => {
    return () => stopPaymentStatusPolling();
  }, []);

  const stopPaymentStatusPolling = () => {
    if (paymentPollIntervalRef.current !== null) {
      window.clearInterval(paymentPollIntervalRef.current);
      paymentPollIntervalRef.current = null;
    }
  };

  const startPaymentStatusPolling = () => {
    if (!applicationId) return;
    stopPaymentStatusPolling();

    paymentPollIntervalRef.current = window.setInterval(async () => {
      try {
        const baseUrl = getBaseUrl();
        if (baseUrl) {
          const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/review`, {
            method: 'GET',
          });
          const result = await response.json();
          const data = result?.data as any;
          const isPaid = data?.paymentStatus === 'PAID' || data?.status === 'PAYMENT_COMPLETE' || data?.application?.status === 'PAID';

          if (response.ok && isPaid) {
            stopPaymentStatusPolling();
            const reference = data?.paymentId || data?.reference || '';
            router.push(`${dashboardPath}?status=success${reference ? `&reference=${reference}` : ''}`);
            return;
          }
        }
      } catch (err) {
        console.error('Payment status poll failed:', err);
      }

      if (paymentTabRef.current?.closed) {
        stopPaymentStatusPolling();
      }
    }, 4000);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setDestinationDropdownOpen(false);
      }
      if (manufacturingRef.current && !manufacturingRef.current.contains(event.target as Node)) {
        setManufacturingDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to error when error state changes
  useEffect(() => {
    if ((validationError || error) && errorAlertRef.current) {
      errorAlertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [validationError, error]);

  useEffect(() => {
    if (!applicationId) return;

    let isMounted = true;

    const loadApplication = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const baseUrl = getBaseUrl();
        if (!baseUrl) {
          throw new Error('API URL not configured');
        }

        // Load certificate types and other reference data
        const [types] = await Promise.all([
          fetchCertificateTypes(),
          fetchTransportModes(),
          fetchCountries(),
          fetchCompanyProfile(),
        ]);

        // In payment mode, call review endpoint first
        if (isPaymentMode) {
          const reviewResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/review`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          const reviewResult = await reviewResponse.json();
          if (!reviewResponse.ok || !reviewResult?.data) {
            throw new Error(reviewResult?.message || 'Failed to load application review data');
          }

          const reviewData = reviewResult.data;
          console.log('Review data loaded:', reviewData);

          // Use application data from review response
          if (reviewData.application) {
            const appData = reviewData.application as ApplicationData;
            setApplication(appData);

            // Prefill dynamic fields from review data
            prefillDynamicFields(appData);

            // Set transport mode
            if (appData.modeOfTransport) {
              setTransportMode(appData.modeOfTransport);
              await fetchTransportModeDetails(appData.modeOfTransport);
            }

            // Set certificate type
            if (appData.certificateType && types.length > 0) {
              const matchedCertificate = types.find(
                cert => cert.code === appData.certificateType || cert.id === appData.certificateType || cert.name === appData.certificateType
              );

              if (matchedCertificate) {
                await fetchCertificateFields(matchedCertificate.id, matchedCertificate);
              }
            }

            // Prefill goods line items from review data
            if (appData.goods && appData.goods.length > 0) {
              const items = appData.goods.map((item, index) => ({
                id: item.id || `goods-${index}`,
                hsCode: item.hsCode || '',
                description: item.description || '',
                marksNo: item.marksNo || '',
                quantity: formatNumberWithCommas(String(item.quantity ?? '')),
                grossWeight: formatNumberWithCommas(String(item.grossWeight ?? '')),
                nomenclature: item.nomenclature || '',
                unit: item.unit || '',
                value: formatNumberWithCommas(String(item.value ?? '')),
              }));
              setGoodsLineItems(items);
              lineItemIdRef.current = items.length;
            }

            // Set payment data from review response
            if (reviewData.totalPayable || reviewData.certificateFee) {
              setPaymentData({
                amount: reviewData.totalPayable || reviewData.certificateFee,
                currency: 'NGN',
                checkoutUrl: reviewData.checkoutUrl,
                certificateFee: reviewData.certificateFee,
                vatAmount: reviewData.vatAmount,
                vatRate: reviewData.vatRate,
                membershipStatus: reviewData.membershipStatus,
                exchangeRate: reviewData.exchangeRate,
              });
            }

            // Set documents from review response
            if (reviewData.documents && Array.isArray(reviewData.documents)) {
              setReviewDocuments(reviewData.documents);
            }
          }

          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // Normal mode: load application from regular endpoint
        const appResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const appResult = await appResponse.json();
        if (!appResponse.ok || !appResult?.data) {
          throw new Error(appResult?.message || 'Failed to load application');
        }

        const appData = appResult.data as ApplicationData;
        setApplication(appData);

        console.log('Application data loaded:', appData);

        // Saved application fields are available immediately; do not wait for
        // the certificate-field configuration state to re-render first.
        prefillDynamicFields(appData);

        // Set transport mode
        if (appData.modeOfTransport) {
          setTransportMode(appData.modeOfTransport);
          await fetchTransportModeDetails(appData.modeOfTransport);
        }

        // Set certificate type
        if (appData.certificateType && types.length > 0) {
          const matchedCertificate = types.find(
            cert => cert.code === appData.certificateType || cert.id === appData.certificateType || cert.name === appData.certificateType
          );

          if (matchedCertificate) {
            await fetchCertificateFields(matchedCertificate.id, matchedCertificate);
          }
        }

        // Prefill goods line items
        if (appData.goods && appData.goods.length > 0) {
          const items = appData.goods.map((item, index) => ({
            id: item.id || `goods-${index}`,
            hsCode: item.hsCode || '',
            description: item.description || '',
            marksNo: item.marksNo || '',
            quantity: formatNumberWithCommas(String(item.quantity ?? '')),
            grossWeight: formatNumberWithCommas(String(item.grossWeight ?? '')),
            nomenclature: item.nomenclature || '',
            unit: item.unit || '',
            value: formatNumberWithCommas(String(item.value ?? '')),
          }));
          setGoodsLineItems(items);
          lineItemIdRef.current = items.length;
        }



        const trackingResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/tracking`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const trackingResult = await trackingResponse.json();
        const timeline = (trackingResult?.data as TrackingData | undefined)?.timeline ?? [];
        const extractedComments = (timeline
          .map((item) => item.comment)
          .filter((comment): comment is string => Boolean(comment && comment.trim())));

        if (isMounted) {
          setComments(extractedComments);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to fetch application for edit:', err);
        setError(err instanceof Error ? err.message : 'Failed to load application details');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadApplication();

    return () => {
      isMounted = false;
    };
  }, [applicationId, isPaymentMode]);

  async function fetchCertificateTypes(): Promise<CertificateType[]> {
    setIsLoadingCerts(true);
    setCertError('');

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch certificate types.');
      }

      const types = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
      setCertificateTypes(types);
      return types;
    } catch (err) {
      setCertError(err instanceof Error ? err.message : 'Failed to fetch certificate types. Please try again.');
      return [];
    } finally {
      setIsLoadingCerts(false);
    }
  }

  async function fetchCertificateFields(certificateId: string, certificate?: CertificateType) {
    setIsLoadingFields(true);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const selectedCert = certificate || certificateTypes.find(c => c.id === certificateId);
      if (!selectedCert) {
        throw new Error('Certificate type not found.');
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/reference/types/${selectedCert.code}/fields`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch certificate fields.');
      }

      setCertificateFields(result.data);
    } catch (err) {
      console.error('Failed to fetch certificate fields:', err);
    } finally {
      setIsLoadingFields(false);
    }
  }

  async function fetchTransportModes() {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/reference/transport-modes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setTransportModes(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch transport modes:', err);
    }
  }

  async function fetchCountries() {
    setIsLoadingCountries(true);
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/reference/countries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setCountries(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch countries:', err);
    } finally {
      setIsLoadingCountries(false);
    }
  }

  async function fetchCompanyProfile() {
    setIsLoadingProfile(true);
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/companies/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setCompanyProfile(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch company profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }

  const fetchTransportModeDetails = async (code: string) => {
    setIsSavingTransportMode(true);
    setValidationError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/reference/transport-modes/${code}`, {
        method: 'GET',
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setSelectedTransportModeDetails(result.data);
      } else {
        setValidationError(result.message || 'Failed to fetch transport mode details');
      }
    } catch (err) {
      console.error('Failed to fetch transport mode details:', err);
      setValidationError('Failed to fetch transport mode details');
    } finally {
      setIsSavingTransportMode(false);
    }
  };

  const formatNumberWithCommas = (value: string): string => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    if (!cleanValue) return '';

    const parts = cleanValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formattedInteger + decimalPart;
  };

  const isFieldApplicable = (fieldCode: string) => {
    if (!certificateFields) return true;
    const field = certificateFields?.fields?.find(f => f.code === fieldCode);
    return field ? field.applicable : false;
  };

  const getPaymentDisplayAmount = (paymentData: Record<string, unknown>): number => {
    const amount = paymentData.amount as number | string | undefined;
    return typeof amount === 'number' ? amount : typeof amount === 'string' ? parseFloat(amount) : 0;
  };

  const getPaymentCurrency = (paymentData: Record<string, unknown>): string => {
    return String(paymentData.currency || 'NGN');
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isFieldRequired = (fieldCode: string) => {
    if (!certificateFields) return false;
    const field = certificateFields?.fields?.find(f => f.code === fieldCode);
    return field ? field.required : false;
  };

  const getFieldLabel = (fieldCode: string) => {
    if (!certificateFields) return fieldCode;
    const field = certificateFields?.fields?.find(f => f.code === fieldCode);
    return field ? field.name : fieldCode;
  };

  const getHostedPaymentUrl = (paymentData: Record<string, unknown>) => {
    const checkoutUrl = String(
      paymentData.checkoutUrl ||
      paymentData.authorizationUrl ||
      paymentData.paymentUrl ||
      paymentData.redirectUrl ||
      paymentData.url ||
      ''
    );

    return checkoutUrl.trim();
  };

  const handlePaymentResponse = (paymentData: Record<string, unknown>) => {
    const checkoutUrl = paymentData.checkoutUrl as string;
    const paymentId = paymentData.paymentId as string;
    const reference = paymentData.reference as string;
    const status = paymentData.status as string;
    const amount = paymentData.amount as number;
    const currency = paymentData.currency as string;

    return {
      checkoutUrl,
      paymentId,
      reference,
      status,
      amount,
      currency,
    };
  };

  const openPayfonteCheckout = (paymentData: Record<string, unknown>) => {
    if (typeof window === 'undefined') {
      return false;
    }

    const checkoutUrl = getHostedPaymentUrl(paymentData);
    if (!checkoutUrl) {
      setValidationError('The Payfonte checkout URL is unavailable. Please try again.');
      return false;
    }

    // Redirect in the same tab instead of opening a new window
    window.location.href = checkoutUrl;
    return true;
  };



  const getDynamicFieldValue = (field: CertificateField): string | boolean | string[] => {
    if (field.repeatable) return dynamicFieldValues[field.code] || [''];

    const profileValues: Record<string, string> = {
      TIN: companyProfile?.tin || '',
      SHIPPER_NAME: companyProfile?.companyName || '',
      SHIPPER_ADDRESS: companyProfile?.address || '',
      MODE_OF_TRANSPORT: transportMode || '',
    };
    if (field.code in profileValues) return profileValues[field.code];

    return dynamicFieldValues[field.code] || '';
  };

  const setDynamicFieldValue = (field: CertificateField, value: string | boolean | string[]) => {
    setDynamicFieldValues(current => ({ ...current, [field.code]: value }));
  };

  const buildApplicationFieldsPayload = (): Record<string, string | number | boolean | string[]> => {
    const fields: Record<string, string | number | boolean | string[]> = {};
    const systemManagedFields = new Set([
      'TIN',
      'SHIPPER_NAME',
      'SHIPPER_ADDRESS',
      'MODE_OF_TRANSPORT',
    ]);

    certificateFields?.fields
      .filter(field =>
        field.category === 'APPLICATION' &&
        field.applicable &&
        !field.readOnly &&
        !systemManagedFields.has(field.code)
      )
      .forEach(field => {
        const value = getDynamicFieldValue(field);
        if (field.repeatable) {
          const values = (value as string[]).map(item => item.trim()).filter(Boolean);
          if (values.length) fields[field.code] = values;
          return;
        }
        if (typeof value === 'boolean') {
          fields[field.code] = value;
          return;
        }
        if (typeof value !== 'string' || !value.trim()) return;

        if (field.templateComponent === 'NUMBER') {
          const numericValue = Number(value.replace(/,/g, ''));
          if (!Number.isNaN(numericValue)) {
            fields[field.code] = numericValue;
          }
          return;
        }

        fields[field.code] = value.trim();
      });

    const destinationPort = dynamicFieldValues.DESTINATION_PORT;
    if (typeof destinationPort === 'string' && destinationPort.trim() && !fields.DESTINATION_PORT) {
      fields.DESTINATION_PORT = destinationPort.trim();
    }

    // Add CRITERIA field if it exists
    const criteria = dynamicFieldValues.CRITERIA;
    if (typeof criteria === 'string' && criteria.trim() && !fields.CRITERIA) {
      fields.CRITERIA = criteria.trim();
    }

    return fields;
  };

  const renderDynamicField = (field: CertificateField) => {
    const formDataKey = field.code;

    if (!field.applicable) return null;

    // Special handling for country dropdowns
    if (field.code === 'DESTINATION') {
      const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(destinationSearchQuery.toLowerCase())
      );
      return (
        <div key={field.code} className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[#374151]">
            {field.name} {field.required && <span className="text-[#e53e3e]">*</span>}
          </label>
          <div ref={destinationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                if (!isPaymentMode) {
                  setDestinationDropdownOpen(!destinationDropdownOpen);
                  setDestinationSearchQuery('');
                }
              }}
              className="w-full px-[10px] py-[7px] pr-8 border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] flex items-center justify-between border-[#d1d5db]"
              disabled={isLoadingCountries || isPaymentMode}
            >
              <span>{String(getDynamicFieldValue(field)) || '-- Select Country --'}</span>
              <ChevronDown className={`w-4 h-4 text-[#6a7a9a] transition-transform ${destinationDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {destinationDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[#d1d5db] rounded-[5px] shadow-lg">
                <div className="p-2 border-b border-[#d1d5db]">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={destinationSearchQuery}
                    onChange={(e) => setDestinationSearchQuery(e.target.value)}
                    className="w-full px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] focus:outline-none focus:border-[#3a7bd5]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-60 overflow-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setDynamicFieldValue(field, country.name);
                        setDestinationDropdownOpen(false);
                        setDestinationSearchQuery('');
                      }}
                      className="w-full px-[10px] py-[7px] text-[12px] text-[#1a2236] hover:bg-[#f1f4f9] flex items-center justify-between"
                    >
                      <span>{country.name}</span>
                      {getDynamicFieldValue(field) === country.name && <Check className="w-4 h-4 text-[#3a7bd5]" />}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-[10px] py-[7px] text-[12px] text-[#6a7a9a]">No countries found</div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      );
    }

    if (field.code === 'COUNTRY_OF_MANUFACTURING') {
      const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(manufacturingSearchQuery.toLowerCase())
      );
      return (
        <div key={field.code} className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[#374151]">
            {field.name} {field.required && <span className="text-[#e53e3e]">*</span>}
          </label>
          <div ref={manufacturingRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setManufacturingDropdownOpen(!manufacturingDropdownOpen);
                setManufacturingSearchQuery('');
              }}
              className="w-full px-[10px] py-[7px] pr-8 border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] flex items-center justify-between border-[#d1d5db]"
              disabled={isLoadingCountries}
            >
              <span>{String(getDynamicFieldValue(field)) || '-- Select Country --'}</span>
              <ChevronDown className={`w-4 h-4 text-[#6a7a9a] transition-transform ${manufacturingDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {manufacturingDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[#d1d5db] rounded-[5px] shadow-lg">
                <div className="p-2 border-b border-[#d1d5db]">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={manufacturingSearchQuery}
                    onChange={(e) => setManufacturingSearchQuery(e.target.value)}
                    className="w-full px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] focus:outline-none focus:border-[#3a7bd5]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-60 overflow-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setDynamicFieldValue(field, country.name);
                        setManufacturingDropdownOpen(false);
                        setManufacturingSearchQuery('');
                      }}
                      className="w-full px-[10px] py-[7px] text-[12px] text-[#1a2236] hover:bg-[#f1f4f9] flex items-center justify-between"
                    >
                      <span>{country.name}</span>
                      {getDynamicFieldValue(field) === country.name && <Check className="w-4 h-4 text-[#3a7bd5]" />}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-[10px] py-[7px] text-[12px] text-[#6a7a9a]">No countries found</div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      );
    }

    // Special handling for FOB value with USD prefix
    if (field.code === 'TOTAL_VALUE_FOB') {
      return (
        <div key={field.code} className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[#374151]">
            {field.name} in USD {field.required && <span className="text-[#e53e3e]">*</span>} <span className="text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-[2px] rounded-[10px] font-semibold">USD for CoO</span>
          </label>
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-bold text-[#92400e]">$</span>
            <input
              ref={totalValueFOBRef}
              className="flex-1 px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] border-[#d1d5db]"
              placeholder="0.00"
              value={String(getDynamicFieldValue(field))}
              onChange={(e) => {
                const formatted = formatNumberWithCommas(e.target.value);
                setDynamicFieldValue(field, formatted);
              }}
            />
          </div>
          <div className="text-[10px] text-[#6b7280]">FOB value in US Dollars. Converted to NGN at prevailing rate for fee calculation.</div>

        </div>
      );
    }

    const value = getDynamicFieldValue(field);
    const inputClassName = `px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] focus:outline-none focus:border-[#3a7bd5] ${field.readOnly || isPaymentMode ? 'border-[#d1d5db] bg-[#f3f4f6]' : 'border-[#d1d5db] bg-white'}`;
    const renderInput = (inputValue: string | boolean, onChange: (value: string | boolean) => void, key?: string) => {
      if (field.templateComponent === 'MULTI_LINE_TEXT') {
        return <textarea key={key} className={inputClassName} placeholder={field.name} value={String(inputValue)} readOnly={field.readOnly} required={field.required} onChange={(e) => onChange(e.target.value)} />;
      }

      if (field.templateComponent === 'CHECKBOX') {
        return (
          <label key={key} className="flex items-center gap-2 text-[12px] text-[#1a2236]">
            <input type="checkbox" checked={inputValue === true || inputValue === 'true'} disabled={field.readOnly} required={field.required} onChange={(e) => onChange(e.target.checked)} />
            {field.name}
          </label>
        );
      }

      if (field.templateComponent === 'DROPDOWN' && field.options?.length) {
        return (
          <select key={key} className={inputClassName} value={String(inputValue)} disabled={field.readOnly} required={field.required} onChange={(e) => onChange(e.target.value)}>
            <option value="">-- Select {field.name} --</option>
            {field.options.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value || option.code || option.name || option.label || '';
              const optionLabel = typeof option === 'string' ? option : option.label || option.name || optionValue;
              return <option key={`${optionValue}-${index}`} value={optionValue}>{optionLabel}</option>;
            })}
          </select>
        );
      }

      const inputType = field.templateComponent === 'NUMBER'
        ? 'number'
        : field.templateComponent === 'DATE'
          ? 'date'
          : field.templateComponent === 'EMAIL'
            ? 'email'
            : 'text';
      return <input key={key} type={inputType} step={inputType === 'number' ? 'any' : undefined} className={inputClassName} placeholder={field.name} value={String(inputValue)} readOnly={field.readOnly} required={field.required} onChange={(e) => onChange(e.target.value)} />;
    };

    return (
      <div key={field.code} className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-[#374151]">
          {field.name} {field.required && <span className="text-[#e53e3e]">*</span>}
        </label>
        {field.repeatable ? (
          <>
            {(value as string[]).map((item, index) => (
              <div key={`${field.code}-${index}`} className="flex gap-2">
                {renderInput(item, nextValue => {
                  const nextValues = [...(value as string[])];
                  nextValues[index] = String(nextValue);
                  setDynamicFieldValue(field, nextValues);
                })}
                {!field.readOnly && (value as string[]).length > 1 && <button type="button" className="text-[11px] text-[#dc2626]" onClick={() => setDynamicFieldValue(field, (value as string[]).filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}
              </div>
            ))}
            {!field.readOnly && <button type="button" className="self-start text-[11px] font-semibold text-[#3a7bd5]" onClick={() => setDynamicFieldValue(field, [...(value as string[]), ''])}>+ Add another</button>}
          </>
        ) : (
          renderInput(
            typeof value === 'string' || typeof value === 'boolean' ? value : '',
            nextValue => setDynamicFieldValue(field, nextValue)
          )
        )}

      </div>
    );
  };

  const getTransportModeIcon = (code: string) => {
    const iconMap: Record<string, string> = {
      'LAND': '🚛',
      'AIR': '✈️',
      'SEA': '🚢',
    };
    return iconMap[code] || '📦';
  };

  const getSelectedTransportMode = () => {
    return selectedTransportModeDetails || transportModes.find(tm => tm.code === transportMode);
  };

  const handleSelectTransportMode = async (code: string) => {
    setTransportMode(code);
    await fetchTransportModeDetails(code);
  };

  const searchHsCodes = async (query: string) => {
    if (!query || query.length < 2) {
      setHsCodes([]);
      return;
    }

    setIsSearchingHs(true);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/hs-codes?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setHsCodes(result);
      }
    } catch (err) {
      console.error('Failed to search HS codes:', err);
    } finally {
      setIsSearchingHs(false);
    }
  };

  const handleHsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setHsSearchQuery(query);
    searchHsCodes(query);
  };

  const handleHsCodeSelect = (hs: HSCode) => {
    lineItemIdRef.current += 1;
    const newItem: GoodsLineItem = {
      id: lineItemIdRef.current.toString(),
      hsCode: hs.cetCode,
      description: '',
      marksNo: '',
      quantity: '',
      grossWeight: '',
      nomenclature: hs.description,
      unit: hs.unit || '',
      value: '',
    };
    setGoodsLineItems([...goodsLineItems, newItem]);
    setHsSearchQuery('');
    setHsCodes([]);
  };

  const handleInlineHsCodeSelect = (rowId: string, hs: HSCode) => {
    setGoodsLineItems(current => current.map(item =>
      item.id === rowId
        ? { ...item, hsCode: hs.cetCode, nomenclature: hs.description, unit: hs.unit || '' }
        : item
    ));
    setActiveHsCodeRowId(null);
    setHsCodes([]);
  };

  const addLineItem = () => {
    lineItemIdRef.current += 1;
    const newItem: GoodsLineItem = {
      id: lineItemIdRef.current.toString(),
      hsCode: '',
      description: '',
      marksNo: '',
      quantity: '',
      grossWeight: '',
      nomenclature: '',
      unit: '',
      value: '',
    };
    setGoodsLineItems([...goodsLineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setGoodsLineItems(goodsLineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof GoodsLineItem, value: string) => {
    setGoodsLineItems(goodsLineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDocumentUpload = async (docCode: string, file: File) => {
    setUploadedDocuments(prev => ({ ...prev, [docCode]: file }));
    setUploadError(null);
  };

  const handleFileSelect = (docCode: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          handleDocumentUpload(docCode, file);
        }
        target.value = '';
      };
      fileInputRef.current.click();
    }
  };

  const removeDocument = (docCode: string) => {
    setUploadedDocuments(prev => {
      const updated = { ...prev };
      delete updated[docCode];
      return updated;
    });
  };

  const handleSaveAndResubmit = async () => {
    if (!applicationId) {
      setError('Application ID is missing.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setValidationError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API URL not configured');
      }

      // In payment mode, call review endpoint first then show review step
      if (isPaymentMode) {
        const reviewResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/review`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const reviewResult = await reviewResponse.json();
        if (!reviewResponse.ok) {
          throw new Error(reviewResult?.message || 'Failed to validate application');
        }

        const reviewData = reviewResult.data;

        // Show review step first before proceeding to payment
        // (Don't validate strictly - allow review even if there are warnings)
        setReviewData(reviewData);
        setShowReviewStep(true);
        setIsSaving(false);
        return;
      }

      // Normal edit/resubmit flow (non-payment mode)
      const payload = {
        modeOfTransport: transportMode,
        fields: buildApplicationFieldsPayload(),
      };

      const updateResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const updateResult = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateResult?.message || 'Failed to save your changes');
      }

      // Update goods items
      if (goodsLineItems.length > 0) {
        const itemsPayload = {
          items: goodsLineItems.map(item => ({
            hsCode: item.hsCode,
            marksNo: item.marksNo,
            description: item.description,
            unit: item.unit,
            quantity: parseFloat(item.quantity.replace(/,/g, '')) || 0,
            grossWeight: parseFloat(item.grossWeight.replace(/,/g, '')) || 0,
            nomenclature: item.nomenclature,
            value: parseFloat(item.value.replace(/,/g, '')) || 0,
          })),
        };

        const goodsResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/goods`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemsPayload),
        });

        if (!goodsResponse.ok) {
          const goodsResult = await goodsResponse.json();
          throw new Error(goodsResult?.message || 'Failed to save goods items');
        }
      }

      // Upload documents
      const docEntries = Object.entries(uploadedDocuments);
      for (const [docCode, file] of docEntries) {
        try {
          await uploadDocumentToServer(docCode, file);
        } catch (err) {
          console.error(`Failed to upload document ${docCode}:`, err);
          throw new Error(`Failed to upload document: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Call review endpoint to check validation status
      const reviewResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/review`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const reviewResult = await reviewResponse.json();
      if (!reviewResponse.ok) {
        throw new Error(reviewResult?.message || 'Failed to validate application');
      }

      const reviewData = reviewResult.data;

      // Check if there are validation errors
      if (reviewData.validationErrors && reviewData.validationErrors.length > 0) {
        const errorMessage = reviewData.validationErrors.join(', ');
        console.error('Validation errors:', reviewData.validationErrors);
        setValidationError(errorMessage);
        setIsSaving(false);
        return;
      }

      // Check if application can be submitted
      if (!reviewData.canSubmit) {
        setValidationError('Application cannot be submitted. Please review the requirements.');
        setIsSaving(false);
        return;
      }

      // Show review step first before proceeding to payment
      setReviewData(reviewData);
      setShowReviewStep(true);
      setIsSaving(false);
      return;
    } catch (err) {
      console.error('Failed to submit application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!applicationId) {
      setError('Application ID is missing.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API URL not configured');
      }

      // If in payment mode (from Pay Now button), call payment endpoint directly
      if (isPaymentMode) {
        const paymentResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const paymentResult = await paymentResponse.json();
        if (!paymentResponse.ok) {
          throw new Error(paymentResult?.message || 'Failed to initiate payment');
        }

        const paymentRecord = paymentResult.data as Record<string, unknown> | undefined;
        const hostedUrl = paymentRecord ? getHostedPaymentUrl(paymentRecord) : '';

        if (paymentRecord && hostedUrl) {
          setPaymentData(paymentRecord);
          setPaymentCheckoutUrl(hostedUrl);
          setSelectedPaymentMethod('CARD');
          setShowPaymentStep(true);
          setShowReviewStep(false);
          setIsSaving(false);
          return;
        }

        throw new Error('Payment checkout URL not available');
      }

      // Normal submission flow (from Save & Submit)
      const isDraft = application?.status === 'DRAFT';
      const submissionAction = isDraft ? 'submit' : 'resubmit';
      const submissionResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/${submissionAction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const submissionResult = await submissionResponse.json();
      if (!submissionResponse.ok) {
        throw new Error(submissionResult?.message || `Failed to ${submissionAction} application`);
      }

      const submissionData = submissionResult.data;

      // Show the "Secure Payment" step instead of redirecting straight to
      // Payfonte — this mirrors the New Application flow, where the review
      // step is followed by a dedicated payment step the user confirms.
      if (submissionData) {
        const paymentRecord = submissionData as Record<string, unknown>;
        const hostedUrl = getHostedPaymentUrl(paymentRecord);

        if (hostedUrl) {
          setPaymentData(paymentRecord);
          setPaymentCheckoutUrl(hostedUrl);
          setSelectedPaymentMethod('CARD');
          setShowPaymentStep(true);
          setShowReviewStep(false);
          setSuccessMessage(isDraft ? 'Application submitted successfully!' : 'Application resubmitted successfully!');
          setIsSaving(false);
          return;
        }
      }

      // If no payment URL, redirect based on status
      setSuccessMessage(isDraft ? 'Application submitted successfully!' : 'Application resubmitted successfully!');

      setTimeout(() => {
        if (submissionData.status === 'PAID') {
          // Application is already paid, redirect to applications
          router.push(isAdminUser ? '/admin/my-applications?status=PAID' : '/my-applications?status=SUBMITTED');
        } else {
          // Application needs payment, handle payment flow
          router.push(isAdminUser ? '/admin/my-applications?status=PAID' : '/my-applications?status=PENDING');
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to submit application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadDocumentToServer = async (docCode: string, file: File) => {
    if (!applicationId) {
      throw new Error('Application ID not found');
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('Please log in to upload documents');
    }

    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error('API URL not configured');
    }

    const formData = new FormData();
    formData.append('documentType', docCode);
    formData.append('file', file);

    const uploadResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadResult.data) {
      throw new Error(uploadResult.message || uploadResult.error || 'Failed to upload document');
    }

    const saveResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/documents`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentType: uploadResult.data.documentType,
        fileName: uploadResult.data.fileName,
        fileUrl: uploadResult.data.fileUrl,
      }),
    });

    const saveResult = await saveResponse.json();

    if (!saveResponse.ok) {
      throw new Error(saveResult.message || 'Failed to save document');
    }

    return true;
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <AppHeader role={userRole} />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role={userRole} />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto flex items-center justify-center">
            <div className="text-[14px] text-[#6a7a9a]">Loading application details...</div>
          </div>
        </div>
      </div>
    );
  }

  // Loading failures have no application form to display. Once the form is
  // loaded, save and resubmission errors stay in the inline alert below.
  if (!application) {
    return (
      <div className="h-screen flex flex-col">
        <AppHeader role={userRole} />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role={userRole} />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto flex flex-col items-center justify-center">
            <div className="text-[16px] font-semibold text-[#1a2236] mb-2">Unable to load this application</div>
            <div className="text-[13px] text-[#e53e3e] mb-4">{error || 'Application not found.'}</div>
            <button
              className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[13px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]"
              onClick={() => router.push(isAdminUser ? '/admin/my-applications' : '/my-applications')}
            >
              ← Back to {isAdminUser ? 'Admin Applications' : 'Applications'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role={userRole} />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role={userRole} />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <button
                  className="text-[#1a4a8a] text-[13px] font-medium hover:underline mb-2"
                  onClick={() => router.push(isPaymentMode ? dashboardPath : (isAdminUser ? '/admin/my-applications' : '/my-applications'))}
                >
                  ← Back to {isPaymentMode ? 'Dashboard' : (isAdminUser ? 'Admin Applications' : 'Applications')}
                </button>
                <div className="text-[20px] font-medium text-[#1a2236]">
                  {showPaymentStep ? 'Secure Payment' : (showReviewStep ? 'Review Application' : (isPaymentMode ? 'Pay Now' : 'Edit & Resubmit Application'))}
                </div>
                <div className="text-[12px] text-[#6a7a9a]">Application {application.id}</div>
              </div>
              {!showPaymentStep && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#fdf2f8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9d174d]">
                  Unapproved
                </span>
              )}
            </div>

            {!showPaymentStep && comments.length > 0 && (
              <div className="mb-5 rounded-[10px] border border-[#fed7aa] bg-[#fff7ed] p-[14px] text-[12px] text-[#92400e]">
                <div className="text-[12px] font-bold uppercase tracking-[0.08em] mb-2">Review feedback to correct</div>
                <div className="space-y-2">
                  {comments.map((comment, index) => (
                    <div key={`${comment}-${index}`} className="rounded-[8px] border border-[#fdba74] bg-[#fffaf0] p-3 text-[#7c2d12]">
                      {comment}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(validationError || error) && (
              <div ref={errorAlertRef} className="mb-4 rounded-[8px] border border-[#fca5a5] bg-[#fef2f2] p-3 text-[12px] text-[#991b1b] flex items-start gap-2">
                <span className="text-[14px]">⚠️</span>
                <span className="flex-1">{validationError || error}</span>
                <button
                  onClick={() => { setValidationError(null); setError(null); }}
                  className="text-[#991b1b] hover:text-[#7c2d12] font-semibold"
                >
                  ✕
                </button>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 rounded-[8px] border border-[#86efac] bg-[#f0fdf4] p-3 text-[12px] text-[#166534] flex items-start gap-2">
                <span className="text-[14px]">✅</span>
                <span className="flex-1">{successMessage}</span>
                <button 
                  onClick={() => setSuccessMessage(null)}
                  className="text-[#166534] hover:text-[#14532d] font-semibold"
                >
                  ✕
                </button>
              </div>
            )}

            {showReviewStep && reviewData ? (
              /* ---------------------------------------------------------- */
              /* Review step — shown after Save & Submit succeeds, before    */
              /* proceeding to the Secure Payment step.                     */
              /* ---------------------------------------------------------- */
              <>
                <div className="flex items-center gap-2 mb-3 flex items-center gap-2 mb-3 border border-gray-200 px-4 py-4 rounded shadow-sm">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Select Type</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#059669]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Application Details</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#059669]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#3a7bd5] bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">3</div>
                    <span className="text-[10px] font-semibold text-[#3a7bd5]">Review & Submit</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#e2e8f0]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#e2e8f0] bg-[#e2e8f0] text-[#64748b] text-[11px] font-bold flex items-center justify-center">4</div>
                    <span className="text-[10px] font-semibold text-[#64748b]">Payment</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                    <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Certificate Type</div>
                    <div className="text-[13.5px] font-bold text-[#1a2236]">{application.certificateType?.name || 'NACCIMA'}</div>
                  </div>
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                    <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Exporter</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">Company</span><span className="text-[#1a2236]">{application.companyName || '—'}</span></div>
                      <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">TIN</span><span className="text-[#1a2236] font-mono">{application.tin || '—'}</span></div>
                      <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">Membership</span><span className={`text-[10px] font-bold px-2 py-[2px] rounded-[10px] ${application.membershipActive ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>{application.membershipActive ? '★ MEMBER' : 'NON-MEMBER'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4 mb-3">
                  <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Shipment Details</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Consignee</span><br/><span className="text-[#1a2236]">{reviewData.application?.consignee || '—'}</span></div>
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Destination</span><br/><span className="text-[#1a2236]">{reviewData.application?.destinationCountry || '—'}</span></div>
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Mode of Transport</span><br/><span className="text-[#1a2236]">{transportMode || '—'}</span></div>
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Carrier</span><br/><span className="text-[#1a2236]">{reviewData.application?.carrier || '—'}</span></div>
                  </div>
                </div>

                <div className="text-[12.5px] font-bold text-[#1a2236] mb-2">Goods Line Items</div>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">#</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">HS Code</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Description</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">QTY</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Gross Wt.</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Nomenclature</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Value (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goodsLineItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-[#f8faff]">
                          <td className="px-2 py-2 border-b border-[#edf0f5]">{index + 1}</td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><span className="font-mono font-bold text-[#1a4a8a]">{item.hsCode || '—'}</span></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]">{item.description || '—'}</td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]">{item.quantity || '—'}</td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]">{item.grossWeight || '—'}</td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]">{item.nomenclature || '—'}</td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]">{item.value ? `$${item.value}` : '—'}</td>
                        </tr>
                      ))}
                      {goodsLineItems.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-2 py-4 text-center text-[#6a7a9a]">No line items added</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-[12.5px] font-bold text-[#1a2236] mb-2">Supporting Documents</div>
                    <div className="space-y-1 mb-3">
                      {Object.entries(uploadedDocuments).map(([docCode, file]) => (
                        <div key={docCode} className="flex items-center gap-2 text-[11.5px] text-[#065f46]">✅ {docCode} — {file.name}</div>
                      ))}
                      {Object.keys(uploadedDocuments).length === 0 && (
                        <div className="text-[11.5px] text-[#6a7a9a]">No documents uploaded</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="bg-[#fef3c7] border border-[#fbbf24] rounded-[8px] p-4 mb-3">
                      <div className="text-[11px] font-bold text-[#92400e] mb-2">💱 FOB Value Conversion (Certificate of Origin)</div>
                      <div className="flex justify-between text-[11px] mb-1"><span>FOB Value (USD)</span><span className="font-bold text-[#1a2236]">{reviewData.application?.totalValueFob || '—'}</span></div>
                    </div>
                    <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                      <div className="flex justify-between text-[11px] mb-1"><span className="text-[#065f46] font-semibold">★ Member Rate Applied</span><span className="text-[#065f46] text-[10.5px] font-semibold">0.11% of FOB</span></div>
                      <div className="text-[11px] text-[#6a7a9a]">Payment will be calculated after submission</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#edf0f5]">
                  <button
                    className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]"
                    onClick={() => setShowReviewStep(false)}
                    disabled={isSaving}
                  >
                    ← Back to Edit
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleProceedToPayment}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Processing...' : 'Submit & Proceed to Payment →'}
                  </button>
                </div>
              </>
            ) : showPaymentStep && paymentData ? (
              /* ---------------------------------------------------------- */
              /* Secure Payment step — shown after Save & Submit / Save &   */
              /* Resubmit / Proceed to Payment succeeds, mirroring step 4   */
              /* ("Secure Payment") of the New Application flow.            */
              /* ---------------------------------------------------------- */
              <>
                <div className="text-[16px] font-bold text-[#1a2236] mb-[3px]">Secure Payment</div>
                <div className="text-[11.5px] text-[#6a7a9a] mb-5">
                  Step 4 of 4 — Complete your payment without leaving this page
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Select Type</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#059669]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Application Details</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#059669]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Review & Submit</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#3a7bd5]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#3a7bd5] bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">4</div>
                    <span className="text-[10px] font-semibold text-[#3a7bd5]">Payment</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">
                  <div className="bg-white border border-[#dde3ee] rounded-[10px] p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-[14px] font-bold text-[#1a2236]">Checkout</div>
                      </div>
                      <div className="text-[10px] font-semibold text-[#065f46] bg-[#d1fae5] px-2 py-1 rounded-full">
                        🔒 Secure
                      </div>
                    </div>

                    <div className="rounded-[8px] bg-[#f8fafd] border border-[#dde3ee] p-4 mb-5">
                      <div className="text-[12px] font-bold text-[#1a2236] mb-1">Pay Securely with Payfonte</div>
                      <div className="text-[10.5px] text-[#6a7a9a]">
                        You will be redirected to the secure Payfonte checkout page to complete your payment.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPayfonteCheckout(paymentData)}
                      disabled={isSaving}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[7px] border-none bg-[#1a4a8a] text-white text-[12px] font-bold hover:bg-[#153c70] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Pay Securely with Payfonte
                      <FiArrowRight className="w-4 h-4" />
                    </button>

                    <div className="text-center text-[10px] text-[#94a3b8] mt-3">
                      Secured by Payfonte · Redirects to the full browser checkout
                    </div>
                  </div>

                  <div className="h-fit bg-[#f8fafd] border border-[#dde3ee] rounded-[10px] p-5">
                    <div className="text-[12px] font-bold text-[#1a2236] mb-4">Payment Summary</div>
                    <div className="space-y-3 text-[11px]">
                      <div className="flex justify-between gap-4">
                        <span className="text-[#6a7a9a]">Application</span>
                        <span className="font-semibold text-[#1a2236] text-right">{application.id}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#6a7a9a]">Certificate</span>
                        <span className="font-semibold text-[#1a2236] text-right">{application.certificateType || 'NACCIMA'}</span>
                      </div>
                      <div className="border-t border-[#dde3ee] pt-3 flex justify-between gap-4">
                        <span className="font-bold text-[#1a2236]">Total Payable</span>
                        <span className="font-bold text-[#1a4a8a] text-[15px]">
                          {formatCurrency(getPaymentDisplayAmount(paymentData), getPaymentCurrency(paymentData))}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 p-3 rounded-[7px] bg-[#ecfdf5] border border-[#a7f3d0] text-[10.5px] text-[#065f46]">
                      Once payment is confirmed successfully, you will be redirected to your dashboard.
                    </div>
                  </div>
                </div>

                <div className="flex justify-start pt-5 mt-5 border-t border-[#edf0f5]">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPaymentMode) {
                        router.push(dashboardPath);
                        return;
                      }
                      setPaymentCheckoutUrl('');
                      setShowPaymentStep(false);
                      setPaymentData(null);
                    }}
                    className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold border border-[#ccd3e0] bg-white text-[#2a3a56] hover:bg-[#f1f4f9]"
                  >
                    ← Back to {isPaymentMode ? 'Dashboard' : 'Edit'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {companyProfile?.membershipStatus === "MEMBER" ?
                  <div className="flex items-center mt-4 mb-6 gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-[14px] text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
                    ★NACCIMA Member rates apply
                  </div>:    <div className="flex mt-4 mb-6 items-center gap-[10px] px-[12px] py-[8px] rounded mb-4 text-[12px] font-semibold bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                        ⚠ Not a NACCIMA Member — non-member rates apply to your application
                      </div>
                }

                {/* Section 1: Shipper/Exporter Details */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">1</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Shipper / Exporter Details</div>
                    <span className="text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-[2px] rounded-[10px] font-semibold">NRS-Verified · Read-Only</span>
                  </div>
                  {isLoadingFields || isLoadingProfile ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-[12px] text-[#6a7a9a]">Loading application fields...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {certificateFields?.fields
                        ?.filter(field => field.category === 'APPLICATION' && field.applicable && field.readOnly)
                        .map(field => renderDynamicField(field))}
                      {certificateFields?.fields?.filter(field => field.category === 'APPLICATION' && field.applicable && field.readOnly).length === 0 && (
                        <div className="col-span-2 text-[12px] text-[#6a7a9a]">No applicable fields for this certificate type.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 2: Mode of Transport */}
                <div className={`bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4 ${isFieldApplicable('MODE_OF_TRANSPORT') ? '' : 'hidden'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">{getFieldLabel('MODE_OF_TRANSPORT')} {isFieldRequired('MODE_OF_TRANSPORT') && <span className="text-[#e53e3e]">*</span>}</div>
                    {isSavingTransportMode && <span className="text-[10px] text-[#6a7a9a]">Saving…</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {transportModes.map((t) => {
                      const icon = getTransportModeIcon(t.code);
                      const docs = t.documents.map(d => d.name).join(' + ');
                      return (
                        <div
                          key={t.code}
                          className={`p-4 rounded-[8px] border transition-all text-center ${transportMode === t.code ? 'border-[#3a7bd5] bg-[#e8f0fe]' : 'border-[#dde3ee]'} ${isPaymentMode ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-[#3a7bd5]'}`}
                          onClick={() => !isPaymentMode && handleSelectTransportMode(t.code)}
                        >
                          <div className="text-[24px] mb-2">{icon}</div>
                          <div className="text-[12px] font-bold text-[#1a2236] mb-1">{t.name}</div>
                          <div className="text-[10px] text-[#6a7a9a]">Required docs: {docs}</div>
                        </div>
                      );
                    })}
                  </div>
                  {getSelectedTransportMode() && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#dbeafe] text-[11px] text-[#1e40af]">
                      <span>ℹ️</span>
                      <span className='text-[14px]'><strong>{getSelectedTransportMode()?.name} selected:</strong> You must upload {getSelectedTransportMode()?.documents.map(d => d.name).join(', ')} before submitting.</span>
                    </div>
                  )}
                </div>

                {/* Section 3: Consignee & Shipment Details */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">3</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Consignee & Shipment Details</div>
                  </div>

                  {isLoadingFields ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-[12px] text-[#6a7a9a]">Loading form fields...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {certificateFields?.fields?.filter(field => field.category === 'APPLICATION' && field.applicable && !field.readOnly && field.code !== 'MODE_OF_TRANSPORT')
                        .map(field => renderDynamicField(field))}
                      {!certificateFields?.fields?.some(field => field.code === 'DESTINATION_PORT' && field.applicable) && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-[#374151]">Destination Port</label>
                          <input
                            className="px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] border-[#d1d5db]"
                            placeholder="Enter destination port"
                            value={typeof dynamicFieldValues.DESTINATION_PORT === 'string' ? dynamicFieldValues.DESTINATION_PORT : ''}
                            onChange={(event) => setDynamicFieldValues(current => ({ ...current, DESTINATION_PORT: event.target.value }))}
                          />
                        </div>
                      )}
                      {certificateFields?.fields?.filter(field => field.category === 'APPLICATION' && field.applicable && !field.readOnly && field.code !== 'MODE_OF_TRANSPORT').length === 0 && (
                        <div className="col-span-2 text-[12px] text-[#6a7a9a]">
                          No applicable fields for this certificate type.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 4: HS Code Lookup — disabled. HS Code search now
                    happens inline on the HS Code column of the Goods Line
                    Items table below (still labelled Section 4).
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">4</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">HS Code Lookup</div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      className="flex-1 px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]"
                      placeholder="🔍 Search by HS code or description…"
                      value={hsSearchQuery}
                      onChange={handleHsSearchChange}
                      disabled={isPaymentMode}
                      readOnly={isPaymentMode}
                    />
                  </div>
                  {isSearchingHs && (
                    <div className="text-[11px] text-[#6a7a9a] py-2">Searching...</div>
                  )}
                  <div className="space-y-1 max-h-[200px] overflow-hidden overflow-scroll">
                    {hsCodes.map((hs) => (
                      <div
                        key={hs.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-[6px] ${isPaymentMode ? 'cursor-not-allowed opacity-75' : 'hover:bg-[#edf2ff] cursor-pointer'}`}
                        onClick={() => !isPaymentMode && handleHsCodeSelect(hs)}
                      >
                        <span className="text-[13px] font-bold text-[#1a4a8a]">{hs.cetCode}</span>
                        <span className="text-[13px] text-[#374151] capitalize">{hs.description}</span>
                      </div>
                    ))}
                    {hsCodes.length === 0 && hsSearchQuery.length >= 2 && !isSearchingHs && (
                      <div className="text-[11px] text-[#6a7a9a] py-2">No results found</div>
                    )}
                  </div>
                </div>
                */}

                {/* Section 4: Goods Line Items */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">4</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Goods Line Items</div>
                    <span className="text-[10px] text-[#9ca3af]">Type in the HS Code column for suggestions</span>
                  </div>
                  <div className={activeHsCodeRowId ? "overflow-visible mb-3" : "overflow-x-auto mb-3"}>
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">#</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">HS Code</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Description <span className="text-[#e53e3e]">*</span></th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Marks/No. <span className="text-[#e53e3e]">*</span></th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">QTY <span className="text-[#e53e3e]">*</span></th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Gross Wt. <span className="text-[#e53e3e]">*</span></th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Nomenclature {isFieldRequired('NOMENCLATURE') && <span className="text-[#e53e3e]">*</span>}</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Unit</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Value (USD) {isFieldRequired('VALUE') && <span className="text-[#e53e3e]">*</span>}</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {goodsLineItems.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-8 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-[24px]">📦</span>
                                <span className="text-[12px] text-[#6a7a9a]">Add Line Items</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          goodsLineItems.map((item, index) => (
                            <tr key={item.id} className="hover:bg-[#f8faff]">
                              <td className="px-2 py-2 border-b border-[#edf0f5] text-[#9ca3af] text-[11px]">{index + 1}</td>
                              <td className="px-2 py-2 border-b border-[#edf0f5] relative">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[90px] focus:outline-none focus:border-[#3a7bd5]"
                                  value={item.hsCode}
                                  onChange={(e) => {
                                    if (!isPaymentMode) {
                                      const value = e.target.value;
                                      updateLineItem(item.id, 'hsCode', value);
                                      setActiveHsCodeRowId(item.id);
                                      searchHsCodes(value);
                                    }
                                  }}
                                  onFocus={() => {
                                    if (!isPaymentMode) {
                                      setActiveHsCodeRowId(item.id);
                                      if (item.hsCode.length >= 2) searchHsCodes(item.hsCode);
                                    }
                                  }}
                                  onBlur={() => {
                                    window.setTimeout(() => {
                                      setActiveHsCodeRowId(current => (current === item.id ? null : current));
                                    }, 150);
                                  }}
                                  placeholder="Search code…"
                                  autoComplete="off"
                                  disabled={isPaymentMode}
                                  readOnly={isPaymentMode}
                                />
                                {activeHsCodeRowId === item.id && item.hsCode.length >= 2 && (isSearchingHs || hsCodes.length > 0) && (
                                  <div className="absolute z-[9999] top-full mt-1 w-[300px] max-h-[200px] overflow-auto bg-white border border-[#d1d5db] rounded-[6px] shadow-lg">
                                    {isSearchingHs ? (
                                      <div className="px-3 py-2 text-[13px] text-[#6a7a9a]">Searching...</div>
                                    ) : hsCodes.length === 0 ? (
                                      <div className="px-3 py-2 text-[13px] text-[#6a7a9a]">No results found</div>
                                    ) : (
                                      hsCodes.map((hs) => (
                                        <div
                                          key={hs.id}
                                          className="px-3 py-2 text-[13px] hover:bg-[#edf2ff] cursor-pointer"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => !isPaymentMode && handleInlineHsCodeSelect(item.id, hs)}
                                        >
                                          <span className="font-bold text-[#1a4a8a]">{hs.cetCode}</span>
                                          <span className="text-[#374151] ml-1 capitalize">{hs.description}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[140px]"
                                  value={item.description}
                                  onChange={(e) => !isPaymentMode && updateLineItem(item.id, 'description', e.target.value)}
                                  placeholder="Description"
                                  disabled={isPaymentMode}
                                  readOnly={isPaymentMode}
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]"
                                  value={item.marksNo}
                                  onChange={(e) => !isPaymentMode && updateLineItem(item.id, 'marksNo', e.target.value)}
                                  placeholder="Marks"
                                  disabled={isPaymentMode}
                                  readOnly={isPaymentMode}
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[60px]"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    if (!isPaymentMode) {
                                      const value = e.target.value.replace(/,/g, '');
                                      if (/^\d*$/.test(value)) {
                                        updateLineItem(item.id, 'quantity', formatNumberWithCommas(value));
                                      }
                                    }
                                  }}
                                  placeholder="1,000"
                                  disabled={isPaymentMode}
                                  readOnly={isPaymentMode}
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]"
                                  value={item.grossWeight}
                                  onChange={(e) => {
                                    if (!isPaymentMode) {
                                      const value = e.target.value.replace(/,/g, '');
                                      if (/^\d*$/.test(value)) {
                                        updateLineItem(item.id, 'grossWeight', formatNumberWithCommas(value));
                                      }
                                    }
                                  }}
                                  placeholder="200"
                                  disabled={isPaymentMode}
                                  readOnly={isPaymentMode}
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[120px] bg-[#f3f4f6] text-[#6a7a9a] cursor-not-allowed"
                                  value={item.nomenclature}
                                  readOnly
                                  title="Auto-filled from HS Code"
                                  placeholder="Auto-filled"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[50px]"
                                  value={item.unit}
                                  onChange={(e) => !isPaymentMode && updateLineItem(item.id, 'unit', e.target.value)}
                                  placeholder="KG"
                                  disabled={isPaymentMode}
                                  readOnly={isPaymentMode}
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[85px]"
                                  value={item.value}
                                  onChange={(e) => {
                                    if (!isPaymentMode) {
                                      const value = e.target.value.replace(/,/g, '');
                                      if (/^\d*\.?\d*$/.test(value)) {
                                        updateLineItem(item.id, 'value', formatNumberWithCommas(value));
                                      }
                                    }
                                  }}
                                  placeholder="0.00"
                                  disabled={isPaymentMode}
                                  readOnly={isPaymentMode}
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5] text-center cursor-pointer text-[#e53e3e]" onClick={() => !isPaymentMode && removeLineItem(item.id)}>{!isPaymentMode && '✕'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-start items-center mt-4">
                    <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={addLineItem} disabled={isPaymentMode}>➕ Add Line Item</button>
                  </div>
                </div>

                {/* Section 5: Supporting Documents */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">5</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Supporting Documents</div>
                    <span className="text-[10px] text-[#9ca3af]">{getSelectedTransportMode()?.name} transport — {getSelectedTransportMode()?.documents.length} documents required</span>
                  </div>
                  {!transportMode ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#fef3c7] text-[11px] text-[#92400e]">
                      <span>⚠️</span>
                      <span>Please select a mode of transport above to see required documents</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {getSelectedTransportMode()?.documents.map((doc) => {
                        const isUploaded = uploadedDocuments[doc.code];
                        const isReviewUploaded = isPaymentMode && reviewDocuments.some(r => r.documentType === doc.code);
                        const isUploading = uploadingDoc === doc.code;
                        const reviewDoc = isPaymentMode ? reviewDocuments.find(r => r.documentType === doc.code) : null;

                        return (
                          <div
                            key={doc.code}
                            className={`border-[1.5px] border-dashed rounded-[6px] px-[14px] py-[10px] text-[11px] text-center min-w-[140px] relative ${
                              isUploaded || isReviewUploaded
                                ? 'border-[#059669] bg-[#d1fae5] text-[#065f46]'
                                : 'border-[#d1d5db] text-[#6a7a9a]'
                            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''} ${isPaymentMode ? 'cursor-not-allowed' : 'cursor-pointer hover:border-[#3a7bd5] hover:text-[#3a7bd5]'}`}
                            onClick={() => !isPaymentMode && !isUploaded && !isUploading && handleFileSelect(doc.code)}
                          >
                            {isUploading ? (
                              <>
                                <svg className="animate-spin h-5 w-5 text-[#6a7a9a] mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="block">Uploading...</span>
                              </>
                            ) : isUploaded ? (
                              <>
                                <span className="block mb-1">✅</span>
                                <span className="block font-semibold">{doc.name}</span>
                                <span className="block text-[10px]">{uploadedDocuments[doc.code].name}</span>
                                {!isPaymentMode && (
                                  <button
                                    className="absolute top-1 right-1 text-[#e53e3e] hover:text-[#dc2626] text-[10px]"
                                    onClick={(e) => { e.stopPropagation(); removeDocument(doc.code); }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </>
                            ) : isReviewUploaded ? (
                              <>
                                <span className="block mb-1">✅</span>
                                <span className="block font-semibold">{doc.name}</span>
                                <span className="block text-[10px]">{reviewDoc?.fileName || 'Uploaded'}</span>
                              </>
                            ) : (
                              <>
                                <span className="block mb-1">📎</span>
                                <span className="block">{doc.name}</span>
                                <span className="text-[10px] text-[#e53e3e]">Required {doc.required ? '✓' : '✕'}</span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#fee2e2] text-[11px] text-[#e53e3e]">
                      <span>⚠️</span>
                      <span>{uploadError}</span>
                    </div>
                  )}
                  {(() => {
                    const transportMode = getSelectedTransportMode();
                    if (!transportMode) return null;
                    const missingDocs = transportMode.documents?.filter(d => {
                      const isUploaded = uploadedDocuments[d.code];
                      const isReviewUploaded = isPaymentMode && reviewDocuments.some(r => r.documentType === d.code);
                      return d.required && !isUploaded && !isReviewUploaded;
                    });
                    if (missingDocs.length === 0) return null;
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#fef3c7] text-[11px] text-[#92400e]">
                        <span>⚠️</span>
                        <span>{missingDocs.map(d => d.name).join(', ')} are required for {transportMode.name} transport. Upload before submitting.</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-end gap-2">
                  <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push(isPaymentMode ? dashboardPath : (isAdminUser ? '/admin/my-applications' : '/my-applications'))}>Cancel</button>
                  <button
                    className="inline-flex items-center justify-center gap-1 px-[16px] py-[8px] rounded-[6px] text-[13px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSaveAndResubmit}
                    disabled={isSaving}
                  >
                    {isSaving ? (isPaymentMode ? 'Processing...' : (application.status === 'DRAFT' ? 'Submitting...' : 'Resubmitting...')) : (isPaymentMode ? 'Proceed to Payment' : (application.status === 'DRAFT' ? 'Save & Submit' : 'Save & Resubmit'))}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}