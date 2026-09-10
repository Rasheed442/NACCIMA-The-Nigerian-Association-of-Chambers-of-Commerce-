'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import SuccessModal from '@/components/SuccessModal';
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

interface ExchangeRate {
  source: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  rateDate: string;
  retrievedAt: string;
}

interface ReviewData {
  application?: {
    certificateType?: string;
    shipperName?: string;
    tin?: string;
    consignee?: string;
    destinationCountry?: string;
    modeOfTransport?: string;
    carrier?: string;
    countryOfMfg?: string;
    bulkQtyMt?: number;
    totalValueFob?: number | string;
    goods?: Array<{
      id: string;
      hsCode?: string;
      description?: string;
      quantity?: number | string;
      grossWeight?: number | string;
      nomenclature?: string;
      value?: number | string;
    }>;
  };
  membershipStatus?: string;
  documents?: Array<{
    id: string;
    documentType: string;
    fileName: string;
  }>;
  validationErrors?: string[];
  canSubmit?: boolean;
}

function NewApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentTabRef = useRef<Window | null>(null);
  const paymentIframeRef = useRef<HTMLIFrameElement | null>(null);
  const paymentPollIntervalRef = useRef<number | null>(null);
  const [step, setStep] = React.useState(1);
  const [transportMode, setTransportMode] = React.useState<string | null>(null);
  const [isSavingTransportMode, setIsSavingTransportMode] = useState(false);
  const [selectedCert, setSelectedCert] = React.useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(true);
  const [certError, setCertError] = useState('');
  const [certificateFields, setCertificateFields] = useState<CertificateTypeFields | null>(null);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [transportModes, setTransportModes] = useState<TransportMode[]>([]);
  const [hsCodes, setHsCodes] = useState<HSCode[]>([]);
  const [hsSearchQuery, setHsSearchQuery] = useState('');
  const [isSearchingHs, setIsSearchingHs] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false);
  const [manufacturingDropdownOpen, setManufacturingDropdownOpen] = useState(false);
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');
  const [manufacturingSearchQuery, setManufacturingSearchQuery] = useState('');
  const destinationRef = useRef<HTMLDivElement>(null);
  const manufacturingRef = useRef<HTMLDivElement>(null);
  const importerEmailRef = useRef<HTMLInputElement>(null);
  const consigneeNameRef = useRef<HTMLInputElement>(null);
  const consigneeAddressRef = useRef<HTMLInputElement>(null);
  const carrierRef = useRef<HTMLInputElement>(null);
  const destinationCountryRef = useRef<HTMLInputElement>(null);
  const destinationPortRef = useRef<HTMLInputElement>(null);
  const countryOfManufacturingRef = useRef<HTMLInputElement>(null);
  const totalValueFOBRef = useRef<HTMLInputElement>(null);
  const bulkProductQtyRef = useRef<HTMLInputElement>(null);
  const marksNoRef = useRef<HTMLInputElement>(null);
  const ecowasNumberRef = useRef<HTMLInputElement>(null);
  const criteriaRef = useRef<HTMLInputElement>(null);
  const [goodsLineItems, setGoodsLineItems] = useState<GoodsLineItem[]>([]);
  const lineItemIdRef = useRef(0);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<Record<string, unknown> | null>(null);
  const [paymentCheckoutUrl, setPaymentCheckoutUrl] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER' | 'USSD'>('CARD');
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [isSavingApplication, setIsSavingApplication] = useState(false);
  const [isSavingGoods, setIsSavingGoods] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [selectedTransportModeDetails, setSelectedTransportModeDetails] = useState<TransportMode | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string | boolean | string[]>>({});

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  const redirectToExporterDashboard = (reference?: string | null) => {
    setShowSuccessModal(false);

    if (typeof window !== 'undefined') {
      const dashboardUrl = new URL('/exporter-dashboard', window.location.origin);
      dashboardUrl.searchParams.set('status', 'success');
      if (reference) {
        dashboardUrl.searchParams.set('reference', reference);
      }

      window.setTimeout(() => {
        window.location.assign(dashboardUrl.toString());
      }, 50);
    }
  };

  useEffect(() => {
    const status = searchParams.get('status');
    const reference = searchParams.get('reference');
    const resubmitApplicationId = searchParams.get('resubmit');

    if (resubmitApplicationId) {
      setApplicationId(resubmitApplicationId);
      setStep(2);
    }

    if (status === 'success' || reference) {
      // If this page loaded inside the payment tab we opened (window.open),
      // it has a live `window.opener`. In that case, signal the original
      // tab via localStorage (the `storage` event fires there) and close
      // this tab instead of navigating it — the user should end up back
      // on the original tab, not stranded on a second one.
      if (typeof window !== 'undefined' && window.opener) {
        try {
          window.localStorage.setItem(
            'nacc-payment-complete',
            JSON.stringify({ reference: reference || null, ts: Date.now() })
          );
        } catch (err) {
          console.error('Failed to write payment-complete signal:', err);
        }
        window.close();
        return;
      }

      redirectToExporterDashboard(reference || null);
    }
  }, [searchParams]);

  useEffect(() => {
    const resubmitApplicationId = searchParams.get('resubmit');
    if (!resubmitApplicationId) return;

    const loadResubmitApplication = async () => {
      try {
        const baseUrl = getBaseUrl();
        if (!baseUrl) return;

        const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${resubmitApplicationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        if (!response.ok || !result?.data) return;

        const application = result.data;

        if (application?.modeOfTransport) {
          setTransportMode(application.modeOfTransport);
        }

        if (application?.certificateType) {
          const matchedCertificate = certificateTypes.find(
            cert => cert.code === application.certificateType || cert.id === application.certificateType || cert.name === application.certificateType
          );

          if (matchedCertificate) {
            setSelectedCert(matchedCertificate.id);
          }
        }
      } catch (err) {
        console.error('Failed to load resubmission application:', err);
      }
    };

    void loadResubmitApplication();
  }, [searchParams, certificateTypes]);

  // Listen for the payment-complete signal from the popup tab (see above).
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key !== 'nacc-payment-complete' || !event.newValue) return;

      let reference: string | null = null;
      try {
        reference = JSON.parse(event.newValue)?.reference ?? null;
      } catch {
        // ignore malformed payload
      }

      setSuccessMessage(reference ? `Payment successful. Reference: ${reference}` : 'Payment successful.');
      stopPaymentStatusPolling();
      redirectToExporterDashboard(reference || null);
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // Stop polling if the component unmounts while a payment tab is open.
  useEffect(() => {
    return () => stopPaymentStatusPolling();
  }, []);

  const stopPaymentStatusPolling = () => {
    if (paymentPollIntervalRef.current !== null) {
      window.clearInterval(paymentPollIntervalRef.current);
      paymentPollIntervalRef.current = null;
    }
  };

  /**
   * Fallback for the popup flow: the `storage` event above is the primary
   * signal, but browsers can drop it (e.g. if the tab is closed before the
   * event has a chance to propagate, or storage partitioning blocks it).
   * This polls the application's review endpoint periodically and also
   * stops itself if the user just closes the tab without paying.
   *
   * NOTE: adjust the "paid" condition below to match whatever field your
   * backend actually uses to represent a completed payment.
   */
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
          const data = result?.data as (ReviewData & { paymentStatus?: string; status?: string }) | undefined;
          const isPaid = data?.paymentStatus === 'PAID' || data?.status === 'PAYMENT_COMPLETE';

          if (response.ok && isPaid) {
            stopPaymentStatusPolling();
            redirectToExporterDashboard();
            return;
          }
        }
      } catch (err) {
        console.error('Payment status poll failed:', err);
      }

      // Stop polling once the user has closed the payment tab, whether or
      // not payment succeeded — the storage-event path above will have
      // already caught a success before the tab closed.
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

  async function fetchCertificateTypes() {
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

      setCertificateTypes(result);
    } catch (err) {
      setCertError(err instanceof Error ? err.message : 'Failed to fetch certificate types. Please try again.');
    } finally {
      setIsLoadingCerts(false);
    }
  }

  async function fetchCertificateFields(certificateId: string) {
    setIsLoadingFields(true);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      // Get the certificate type code from the selected certificate
      const selectedCert = certificateTypes.find(c => c.id === certificateId);
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
      console.log('Certificate fields:', result.data?.fields?.map((f: { code: string; name: string; category: string }) => ({ code: f.code, name: f.name, category: f.category })));
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

  useEffect(() => {
    const initialFetchTimer = window.setTimeout(() => {
      void fetchCertificateTypes();
      void fetchTransportModes();
      void fetchCountries();
      void fetchCompanyProfile();
    }, 0);

    return () => window.clearTimeout(initialFetchTimer);
  }, []);

  useEffect(() => {
    if (!selectedCert) return;

    const fieldsFetchTimer = window.setTimeout(() => {
      void fetchCertificateFields(selectedCert);
    }, 0);

    return () => window.clearTimeout(fieldsFetchTimer);
  }, [selectedCert]);

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

  const getCertificateDisplay = (cert: CertificateType) => {
    // Map certificate codes to display data
    const certMap: Record<string, { icon: string; tag: string }> = {
      'NACCIMA': { icon: '📜', tag: 'Most Common · Member: 0.11% FOB' },
      'GSP': { icon: '🌍', tag: 'Member: ₦25,000' },
      'ECOWAS_FRE': { icon: '🤝', tag: 'Needs ECOWAS No. · Member: ₦40,000' },
      'ECOWAS': { icon: '🤝', tag: 'Needs ECOWAS No. · Member: ₦40,000' },
      'MOVEMENT': { icon: '🚚', tag: 'No HS Code · Member: ₦40,000' },
      'SOLID_MINERAL': { icon: '⛏️', tag: 'Minerals Only · Member: ₦150,000' },
      'MINERAL': { icon: '⛏️', tag: 'Minerals Only · Member: ₦150,000' },
    };

    const display = certMap[cert.code] || { icon: '📜', tag: 'Standard Certificate' };
    return {
      icon: display.icon,
      name: cert.name,
      desc: cert.description,
      tag: display.tag,
    };
  };

  const getTransportModeIcon = (code: string) => {
    const iconMap: Record<string, string> = {
      'LAND': '🚛',
      'AIR': '✈️',
      'SEA': '🚢',
    };
    return iconMap[code] || '📦';
  };

  const isFieldApplicable = (fieldCode: string) => {
    if (!certificateFields) return true;
    const field = certificateFields?.fields?.find(f => f.code === fieldCode);
    return field ? field.applicable : false;
  };

  const isFieldRequired = (fieldCode: string) => {
    if (!certificateFields) return false;
    const field = certificateFields?.fields?.find(f => f.code === fieldCode);
    return field ? field.required : false;
  };

  const isFieldReadOnly = (fieldCode: string) => {
    if (!certificateFields) return false;
    const field = certificateFields?.fields?.find(f => f.code === fieldCode);
    return field ? field.readOnly : false;
  };

  const getFieldLabel = (fieldCode: string) => {
    if (!certificateFields) return fieldCode;
    const field = certificateFields?.fields?.find(f => f.code === fieldCode);
    return field ? field.name : fieldCode;
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

    if (formErrors[field.code]) {
      setFormErrors(current => ({ ...current, [field.code]: '' }));
    }
  };

  /**
   * The certificate-type configuration is the source of truth for application
   * update fields. The API expects each configured field's code as the key,
   * rather than the UI's form-data key.
   */
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
        // `getDynamicFieldValue` can also return a string array for repeatable
        // fields. Those are handled above, so narrow the remaining value
        // before applying string operations.
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

    // Temporary fallback while testing certificate configurations that do not
    // yet include DESTINATION_PORT in their returned field list.
    const destinationPort = dynamicFieldValues.DESTINATION_PORT;
    if (typeof destinationPort === 'string' && destinationPort.trim() && !fields.DESTINATION_PORT) {
      fields.DESTINATION_PORT = destinationPort.trim();
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
                setDestinationDropdownOpen(!destinationDropdownOpen);
                setDestinationSearchQuery('');
              }}
              className={`w-full px-[10px] py-[7px] pr-8 border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] flex items-center justify-between ${formErrors[field.code] ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
              disabled={isLoadingCountries}
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
                        if (formErrors[field.code]) setFormErrors(current => ({ ...current, [field.code]: '' }));
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
          {formErrors[field.code] && <div className="text-[10px] text-[#e53e3e]">{formErrors[field.code]}</div>}
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
              className={`w-full px-[10px] py-[7px] pr-8 border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] flex items-center justify-between ${formErrors[field.code] ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
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
                        if (formErrors[field.code]) setFormErrors(current => ({ ...current, [field.code]: '' }));
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
          {formErrors[field.code] && <div className="text-[10px] text-[#e53e3e]">{formErrors[field.code]}</div>}
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
              className={`flex-1 px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors[field.code] ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
              placeholder="0.00"
              value={String(getDynamicFieldValue(field))}
              onChange={(e) => {
                const formatted = formatNumberWithCommas(e.target.value);
                setDynamicFieldValue(field, formatted);
              }}
            />
          </div>
          <div className="text-[10px] text-[#6b7280]">FOB value in US Dollars. Converted to NGN at prevailing rate for fee calculation.</div>
          {formErrors[field.code] && <div className="text-[10px] text-[#e53e3e]">{formErrors[field.code]}</div>}
        </div>
      );
    }

    const value = getDynamicFieldValue(field);
    const inputClassName = `px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] focus:outline-none focus:border-[#3a7bd5] ${field.readOnly ? 'border-[#d1d5db] bg-[#f3f4f6]' : formErrors[formDataKey] ? 'border-[#fca5a5] bg-white' : 'border-[#d1d5db] bg-white'}`;
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

    // templateComponent controls the input element. For repeatable fields,
    // retain every entered value instead of collapsing them into one string.
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
        {formErrors[formDataKey] && <div className="text-[10px] text-[#e53e3e]">{formErrors[formDataKey]}</div>}
      </div>
    );
  };

  const getSelectedTransportMode = () => {
    return selectedTransportModeDetails || transportModes.find(tm => tm.code === transportMode);
  };

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

  const saveTransportModeToApplication = async (code: string) => {
    if (!applicationId) {
      console.error('Application ID not found');
      return false;
    }

    setIsSavingTransportMode(true);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const payload = {
        modeOfTransport: code,
        fields: {},
      };

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        return true;
      } else {
        console.error('Failed to save transport mode:', result.message);
        return false;
      }
    } catch (err) {
      console.error('Failed to save transport mode:', err);
      return false;
    } finally {
      setIsSavingTransportMode(false);
    }
  };

  const handleSelectTransportMode = async (code: string) => {
    setTransportMode(code);
    await fetchTransportModeDetails(code);
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};

    // If certificate fields aren't loaded yet, validate all fields as required
    const fieldsLoaded = certificateFields && certificateFields.fields;

    // Dynamically validate required fields based on certificate type configuration
    if (fieldsLoaded) {
      certificateFields.fields.forEach(field => {
        // Skip HS_CODE as it's part of goods line items, not shipment details
        if (field.code === 'HS_CODE') {
          return;
        }

        if (field.category === 'APPLICATION' && field.required && field.applicable) {
          const formDataKey = field.code;
          const fieldValue = getDynamicFieldValue(field);
          const isEmpty = Array.isArray(fieldValue)
            ? fieldValue.every(value => !value.trim())
            : typeof fieldValue === 'boolean'
              ? !fieldValue
              : !fieldValue.trim();

          if (isEmpty) {
            errors[formDataKey] = `${field.name} is required`;
          }

          // Special validation for email fields
          if (field.code === 'IMPORTER_EMAIL' && typeof fieldValue === 'string' && fieldValue) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
              errors[formDataKey] = 'Please enter a valid email address';
            }
          }

          // Special validation for FOB value
          if (field.code === 'TOTAL_VALUE_FOB' && typeof fieldValue === 'string' && fieldValue) {
            const cleanValue = fieldValue.replace(/,/g, '').trim();
            if (!cleanValue) {
              errors[formDataKey] = 'Total Value (FOB) is required';
            }
          }
        }
      });
    } else {
      errors.configuration = 'The certificate field configuration is still loading. Please try again.';
    }

    setFormErrors(errors);

    // Scroll to first error if validation fails
    if (Object.keys(errors).length > 0) {
      const errorFieldMap: Record<string, React.RefObject<HTMLInputElement | HTMLDivElement | null>> = {
        importerEmail: importerEmailRef,
        consigneeName: consigneeNameRef,
        consigneeAddress: consigneeAddressRef,
        carrier: carrierRef,
        destinationCountry: destinationRef,
        destinationPort: destinationPortRef,
        countryOfManufacturing: manufacturingRef,
        totalValueFOB: totalValueFOBRef,
        bulkProductQty: bulkProductQtyRef,
        marksNo: marksNoRef,
        ecowasNumber: ecowasNumberRef,
        criteria: criteriaRef,
      };

      const firstErrorField = Object.keys(errors)[0];
      const ref = errorFieldMap[firstErrorField];
      if (ref?.current) {
        const element = ref.current;
        smoothScrollToElement(element, 800);
        // Focus after scroll completes
        setTimeout(() => {
          if ('focus' in element) {
            element.focus();
          }
        }, 800);
      }
    }

    return Object.keys(errors).length === 0;
  };

  const validateGoodsItems = () => {
    const hasEmptyLineItems = goodsLineItems.some(item =>
      !item.hsCode || !item.description || !item.marksNo || !item.quantity || !item.grossWeight
    );
    if (hasEmptyLineItems) {
      setValidationError('Please fill in all required fields in the Goods/Items section (HS Code, Description, Marks/No., Quantity, Gross Weight)');
      return false;
    }
    return true;
  };

  const handleContinueToStep2 = async () => {
    if (!selectedCert) {
      setCertError('Please select a certificate type');
      return;
    }
    setCertError('');
    setIsCreatingApplication(true);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const selectedCertificateType = certificateTypes.find(c => c.id === selectedCert);
      if (!selectedCertificateType) {
        throw new Error('Selected certificate type not found.');
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateType: selectedCertificateType.code,
        }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setApplicationId(result.data.id);
        setStep(2);
      } else {
        setCertError(result.message || 'Failed to create application');
      }
    } catch (err) {
      console.error('Failed to create application:', err);
      setCertError('Failed to create application. Please try again.');
    } finally {
      setIsCreatingApplication(false);
    }
  };

  const formatNumberWithCommas = (value: string): string => {
    // Remove existing commas and non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    if (!cleanValue) return '';

    const parts = cleanValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formattedInteger + decimalPart;
  };

  const formatCurrency = (value: number | string | null | undefined, currency: 'NGN' | 'USD') => {
    const numericValue = typeof value === 'number'
      ? value
      : Number(String(value ?? 0).replace(/,/g, ''));

    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(numericValue) ? numericValue : 0);
  };

  const getPaymentDisplayAmount = (data: Record<string, unknown> | null) => {
    if (!data) return 0;

    const rawAmount = Number(data.amount ?? data.totalAmount ?? data.amountInKobo ?? 0);
    if (!Number.isFinite(rawAmount)) return 0;

    // Paystack amounts are in the smallest currency unit when amountInKobo/koboAmount
    // is supplied. Otherwise, the backend amount is treated as the displayed amount.
    const isMinorUnit = data.amountInKobo != null || data.koboAmount != null;
    return isMinorUnit ? rawAmount / 100 : rawAmount;
  };

  const getPaymentCurrency = (data: Record<string, unknown> | null): 'NGN' | 'USD' => {
    return String(data?.currency || 'NGN').toUpperCase() === 'USD' ? 'USD' : 'NGN';
  };

  const smoothScrollToElement = (element: HTMLElement, duration: number = 1000) => {
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - window.innerHeight / 2 + element.offsetHeight / 2;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);

      window.scrollTo(0, run);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    };

    requestAnimationFrame(animation);
  };

  const saveApplicationDetails = async () => {
    if (!applicationId) {
      setValidationError('Application ID not found');
      return { success: false, errors: ['Application ID not found'] };
    }

    // Validate shipment details before saving
    const isValid = validateStep2();
    if (!isValid) {
      const errorMessages = Object.values(formErrors);
      return { success: false, errors: errorMessages };
    }

    setIsSavingApplication(true);
    setValidationError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const payload = {
        modeOfTransport: transportMode,
        fields: buildApplicationFieldsPayload(),
      };

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, errors: [] };
      } else {
        setValidationError(result.message || 'Failed to save application details');
        return { success: false, errors: [result.message || 'Failed to save application details'] };
      }
    } catch (err) {
      console.error('Failed to save application details:', err);
      setValidationError('Failed to save application details. Please try again.');
      return { success: false, errors: ['Failed to save application details. Please try again.'] };
    } finally {
      setIsSavingApplication(false);
    }
  };

  const saveAllDetails = async () => {
    setIsSavingAll(true);
    setValidationError(null);

    try {
      // Step 1: Save shipment details
      const shipmentResult = await saveApplicationDetails();
      if (!shipmentResult.success) {
        setValidationError(shipmentResult.errors.join(', '));
        return false;
      }

      // Step 2: Save goods items
      const goodsResult = await saveGoodsItems();
      if (!goodsResult.success) {
        setValidationError(goodsResult.errors.join(', '));
        return false;
      }

      // All successful
      setSuccessMessage('All details saved successfully');
      setShowSuccessModal(true);
      return true;
    } catch (err) {
      console.error('Failed to save all details:', err);
      setValidationError('Failed to save details. Please try again.');
      return false;
    } finally {
      setIsSavingAll(false);
    }
  };

  const saveGoodsItems = async () => {
    if (!applicationId) {
      setValidationError('Application ID not found');
      return { success: false, errors: ['Application ID not found'] };
    }

    // Validate goods items before saving
    const isValid = validateGoodsItems();
    if (!isValid) {
      const errorMessages = Object.values(formErrors);
      return { success: false, errors: errorMessages };
    }

    setIsSavingGoods(true);
    setValidationError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

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

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/goods`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemsPayload),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, errors: [] };
      } else {
        setValidationError(result.message || 'Failed to save goods items');
        return { success: false, errors: [result.message || 'Failed to save goods items'] };
      }
    } catch (err) {
      console.error('Failed to save goods items:', err);
      setValidationError('Failed to save goods items. Please try again.');
      return { success: false, errors: ['Failed to save goods items. Please try again.'] };
    } finally {
      setIsSavingGoods(false);
    }
  };

  const isStep2Valid = () => {
    // Validate transport mode selection
    if (!transportMode) {
      return false;
    }

    // Validate Goods Line Items
    const hasEmptyLineItems = goodsLineItems.some(item =>
      !item.hsCode || !item.description || !item.marksNo || !item.quantity || !item.grossWeight
    );
    if (hasEmptyLineItems) {
      return false;
    }

    // Validate Supporting Documents
    const requiredDocs = getSelectedTransportMode()?.documents?.filter(d => d.required) || [];
    const missingDocs = requiredDocs.filter(d => !uploadedDocuments[d.code]);
    if (missingDocs.length > 0) {
      return false;
    }

    return true;
  };

  const handleContinueToStep3 = async () => {
    setValidationError(null);

    // Validate transport mode selection
    if (!transportMode) {
      setValidationError('Please select a mode of transport');
      return;
    }

    // Validate Goods Line Items
    const hasEmptyLineItems = goodsLineItems.some(item =>
      !item.hsCode || !item.description || !item.marksNo || !item.quantity || !item.grossWeight
    );
    if (hasEmptyLineItems) {
      setValidationError('Please fill in all required fields in the Goods/Items section (HS Code, Description, Marks/No., Quantity, Gross Weight)');
      return;
    }

    // Validate Supporting Documents
    const requiredDocs = getSelectedTransportMode()?.documents?.filter(d => d.required) || [];
    const missingDocs = requiredDocs.filter(d => !uploadedDocuments[d.code]);
    if (missingDocs.length > 0) {
      setValidationError(`Please upload the following required documents: ${missingDocs.map(d => d.name).join(', ')}`);
      return;
    }

    // Save all details before proceeding
    setIsSavingAll(true);
    try {
      // Step 1: Save shipment details
      const shipmentResult = await saveApplicationDetails();
      if (!shipmentResult.success) {
        setValidationError(shipmentResult.errors.join(', '));
        return;
      }

      // Step 2: Save goods items
      const goodsResult = await saveGoodsItems();
      if (!goodsResult.success) {
        setValidationError(goodsResult.errors.join(', '));
        return;
      }

      // Step 3: Upload all documents
      const docEntries = Object.entries(uploadedDocuments);
      for (const [docCode, file] of docEntries) {
        try {
          await uploadDocumentToServer(docCode, file);
        } catch (err) {
          console.error(`Failed to upload document ${docCode}:`, err);
          setValidationError(`Failed to upload document: ${err instanceof Error ? err.message : 'Unknown error'}`);
          return;
        }
      }

      // All successful, proceed to step 3
      fetchExchangeRate();
      setStep(3);
      fetchReviewData();
    } catch (err) {
      console.error('Failed to save details:', err);
      setValidationError('Failed to save details. Please try again.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const fetchExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/integration/fx/usd-ngn`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setExchangeRate(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const fetchReviewData = async () => {
    if (!applicationId) {
      console.error('Application ID not found');
      return;
    }

    setIsLoadingReview(true);
    setValidationError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/review`, {
        method: 'GET',
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setReviewData(result.data);
      } else {
        setValidationError(result.message || 'Failed to fetch review data');
      }
    } catch (err) {
      console.error('Failed to fetch review data:', err);
      setValidationError('Failed to fetch review data. Please try again.');
    } finally {
      setIsLoadingReview(false);
    }
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

  const openPayfonteCheckout = (paymentData: Record<string, unknown>) => {
    if (typeof window === 'undefined') {
      return false;
    }

    const checkoutUrl = getHostedPaymentUrl(paymentData);
    if (!checkoutUrl) {
      setValidationError('The Payfonte checkout URL is unavailable. Please try again.');
      return false;
    }

    setPaymentCheckoutUrl(checkoutUrl);
    window.location.assign(checkoutUrl);
    return true;
  };

  const submitApplication = async () => {
    if (!applicationId) {
      setValidationError('Application ID not found');
      return false;
    }

    setIsSubmittingApplication(true);
    setValidationError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const paymentRecord = result.data as Record<string, unknown>;
        const hostedUrl = getHostedPaymentUrl(paymentRecord);

        if (hostedUrl) {
          setPaymentData(paymentRecord);
          setPaymentCheckoutUrl(hostedUrl);
          setSelectedPaymentMethod('CARD');
          window.location.assign(hostedUrl);
          return true;
        }

        setValidationError('Payment checkout URL was not returned by the payment gateway. Please try again.');
        return false;
      } else {
        setValidationError(result.message || 'Failed to submit application');
        return false;
      }
    } catch (err) {
      console.error('Failed to submit application:', err);
      setValidationError('Failed to submit application. Please try again.');
      return false;
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const addLineItem = () => {
    const newItem: GoodsLineItem = {
      id: `goods-${goodsLineItems.length}`,
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

  const handleDocumentUpload = async (docCode: string, file: File) => {
    // Just store the file locally, don't upload yet
    setUploadedDocuments(prev => ({ ...prev, [docCode]: file }));
    setUploadError(null);
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

    // Upload document
    const formData = new FormData();
    formData.append('documentType', docCode);
    formData.append('file', file);

    console.log('Uploading document:', { docCode, fileName: file.name, fileSize: file.size });

    const uploadResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    const uploadResult = await uploadResponse.json();
    console.log('Upload response:', uploadResponse.status, uploadResult);

    if (!uploadResponse.ok || !uploadResult.data) {
      throw new Error(uploadResult.message || uploadResult.error || 'Failed to upload document');
    }

    // After successful upload, save the document via PUT endpoint
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
    console.log('Save document response:', saveResponse.status, saveResult);

    if (!saveResponse.ok) {
      throw new Error(saveResult.message || 'Failed to save document');
    }

    return true;
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

  const updateLineItem = (id: string, field: keyof GoodsLineItem, value: string) => {
    setGoodsLineItems(goodsLineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleHsCodeSelect = (hs: HSCode) => {
    // Add new line item with selected HS code
    lineItemIdRef.current += 1;
    const newItem: GoodsLineItem = {
      id: lineItemIdRef.current.toString(),
      hsCode: hs.cetCode,
      description: hs.description,
      marksNo: '',
      quantity: '',
      grossWeight: '',
      nomenclature: hs.description,
      unit: '',
      value: '',
    };
    setGoodsLineItems([...goodsLineItems, newItem]);
    setHsSearchQuery('');
    setHsCodes([]);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            {step === 1 && (
              <>
                <div className="text-[16px] font-bold text-[#1a2236] mb-[3px]">New Certificate Application</div>
                <div className="text-[11.5px] text-[#6a7a9a] mb-5">Step 1 of 4 — Select the certificate type</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex  items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#1a4a8a] bg-[#1a4a8a] text-white text-[11px] font-bold flex items-center justify-center">1</div>
                    <span className="text-[13px] font-semibold text-[#1a4a8a]">Select Type</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#3a7bd5]"></div>
                  <div className="flex  items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#e2e8f0] bg-[#1a4a8a] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                    <span className="text-[13px] font-semibold text-[#64748b]">Application Details</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#1a4a8a]"></div>
                  <div className="flex  items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#1a4a8a] bg-[#1a4a8a] text-white text-[11px] font-bold flex items-center justify-center">3</div>
                    <span className="text-[13px] font-semibold text-[#64748b]">Review & Submit</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#1a4a8a]"></div>
                  <div className="flex  items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#1a4a8a] bg-[#1a4a8a] text-white text-[11px] font-bold flex items-center justify-center">4</div>
                    <span className="text-[13px] font-semibold text-[#64748b]">Payment</span>
                  </div>
                </div>
                {companyProfile?.membershipActive ? (
                  <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-4 text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
                    ★ NACCIMA Member — member rates apply to your application
                  </div>
                ) : (
                  <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-4 text-[12px] font-semibold bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                    ⚠ Not a NACCIMA Member — non-member rates apply to your application
                  </div>
                )}

                {certError && (
                  <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-4 flex gap-2 items-start bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b]">
                    <span>⚠️</span>
                    <span>{certError}</span>
                  </div>
                )}

                {isLoadingCerts ? (
                  <div className="mb-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-[10px] w-[34%] rounded-full bg-[#edf3fb] animate-pulse" />
                      <div className="h-[10px] w-[18%] rounded-full bg-[#edf3fb] animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={index}
                          className="rounded-[12px] border border-[#e6edf9] bg-white p-4 shadow-[0_2px_8px_rgba(26,34,54,0.04)] animate-pulse"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="h-[26px] w-[26px] rounded-full bg-[#edf3fb]" />
                            <div className="h-[9px] w-[52px] rounded-full bg-[#edf3fb]" />
                          </div>
                          <div className="mb-2 h-[12px] w-[52%] rounded-full bg-[#edf3fb]" />
                          <div className="mb-3 space-y-2">
                            <div className="h-[10px] w-full rounded-full bg-[#f3f7fc]" />
                            <div className="h-[10px] w-[75%] rounded-full bg-[#f3f7fc]" />
                          </div>
                          <div className="h-[8px] w-[36%] rounded-full bg-[#edf3fb]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {certificateTypes?.filter(cert => cert.active).map((cert) => {
                      const display = getCertificateDisplay(cert);
                      return (
                        <div
                          key={cert.id}
                          className={`p-4 rounded-[8px] border cursor-pointer transition-all ${selectedCert === cert.id ? 'border-[#3a7bd5] bg-[#e8f0fe]' : 'border-[#dde3ee] hover:border-[#3a7bd5]'}`}
                          onClick={() => setSelectedCert(cert.id)}
                        >
                          <div className="text-[24px] mb-2">{display.icon}</div>
                          <div className="text-[13px] font-bold text-[#1a2236] mb-1">{display.name}</div>
                          <div className="text-[11px] text-[#6a7a9a] mb-2">{display.desc}</div>
                          <div className="text-[10px] text-[#3a7bd5] font-semibold">{display.tag}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button className="inline-flex items-center gap-1 px-[14px] rounded py-[10px] border-gray-200 border text-[12px] font-semibold cursor-pointer transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push('/exporter-dashboard')}>Cancel</button>
                  <button
                    className="inline-flex items-center justify-center gap-1 px-[14px] py-[10px] rounded text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleContinueToStep2}
                    disabled={!selectedCert || isCreatingApplication}
                  >
                    {isCreatingApplication ? 'Creating...' : `Continue with ${selectedCert ? certificateTypes.find(c => c.id === selectedCert)?.name : 'Certificate'}`} {!isCreatingApplication && <FiArrowRight size={16} color="white"/>}
                  </button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="text-[16px] font-bold text-[#1a2236] mb-[3px]">New Certificate Application</div>
                <div className="text-[11.5px] text-[#6a7a9a] mb-5">Step 2 of 4 — Enter shipment details</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Select Type</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#059669]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#3a7bd5] bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                    <span className="text-[10px] font-semibold text-[#3a7bd5]">Application Details</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#e2e8f0]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#e2e8f0] bg-[#e2e8f0] text-[#64748b] text-[11px] font-bold flex items-center justify-center">3</div>
                    <span className="text-[10px] font-semibold text-[#64748b]">Review & Submit</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#e2e8f0]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#e2e8f0] bg-[#e2e8f0] text-[#64748b] text-[11px] font-bold flex items-center justify-center">4</div>
                    <span className="text-[10px] font-semibold text-[#64748b]">Payment</span>
                  </div>
                </div>
                 {companyProfile?.membershipActive ? (
                  <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-4 text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
                    ★ NACCIMA Member — member rates apply to your application
                  </div>
                ) : (
                  <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-4 text-[12px] font-semibold bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                    ⚠ Not a NACCIMA Member — non-member rates apply to your application
                  </div>
                )}

                {/* Section 1: Shipper/Exporter Details */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">1</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Shipper / Exporter Details</div>
                    <span className="text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-[2px] rounded-[10px] font-semibold">NRS-Verified · Read-Only</span>
                  </div>
                  {isLoadingFields || isLoadingProfile ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-[12px] text-[#6a7a9a]">Loading exporter fields...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {certificateFields?.fields
                        ?.filter(field => field.category === 'APPLICATION' && field.applicable && field.readOnly)
                        .map(field => renderDynamicField(field))}
                      {certificateFields?.fields?.filter(field => field.category === 'APPLICATION' && field.applicable && field.readOnly).length === 0 && (
                        <div className="col-span-2 text-[12px] text-[#6a7a9a]">No applicable exporter fields for this certificate type.</div>
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
                    <span className="text-[10px] bg-[#dbeafe] text-[#1e40af] px-2 py-[2px] rounded-[10px] font-semibold">New in v2.2</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {transportModes.map((t) => {
                      const icon = getTransportModeIcon(t.code);
                      const docs = t.documents.map(d => d.name).join(' + ');
                      return (
                        <div
                          key={t.code}
                          className={`p-4 rounded-[8px] border cursor-pointer transition-all text-center ${transportMode === t.code ? 'border-[#3a7bd5] bg-[#e8f0fe]' : 'border-[#dde3ee] hover:border-[#3a7bd5]'}`}
                          onClick={() => handleSelectTransportMode(t.code)}
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

                {/* Section 4: HS Code Lookup */}
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
                      />
                    </div>
                    {isSearchingHs && (
                      <div className="text-[11px] text-[#6a7a9a] py-2">Searching...</div>
                    )}
                    <div className="space-y-1 max-h-[200px] oveflow-hidden overflow-scroll">
                      {hsCodes.map((hs) => (
                        <div
                          key={hs.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-[6px] hover:bg-[#edf2ff] cursor-pointer"
                          onClick={() => handleHsCodeSelect(hs)}
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

                {/* Section 5: Goods Line Items */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">5</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Goods Line Items</div>
                  </div>
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">#</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">HS Code <span className="text-[#e53e3e]">*</span></th>
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
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]"
                                  value={item.hsCode}
                                  onChange={(e) => updateLineItem(item.id, 'hsCode', e.target.value)}
                                  placeholder="Code"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[140px]"
                                  value={item.description}
                                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                  placeholder="Description"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]"
                                  value={item.marksNo}
                                  onChange={(e) => updateLineItem(item.id, 'marksNo', e.target.value)}
                                  placeholder="Marks"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[60px]"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, '');
                                    if (/^\d*$/.test(value)) {
                                      updateLineItem(item.id, 'quantity', formatNumberWithCommas(value));
                                    }
                                  }}
                                  placeholder="1,000"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]"
                                  value={item.grossWeight}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, '');
                                    if (/^\d*$/.test(value)) {
                                      updateLineItem(item.id, 'grossWeight', formatNumberWithCommas(value));
                                    }
                                  }}
                                  placeholder="200"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[120px]"
                                  value={item.nomenclature}
                                  onChange={(e) => updateLineItem(item.id, 'nomenclature', e.target.value)}
                                  placeholder="Nomenclature"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[50px]"
                                  value={item.unit}
                                  onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                                  placeholder="KG"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[85px]"
                                  value={item.value}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, '');
                                    if (/^\d*\.?\d*$/.test(value)) {
                                      updateLineItem(item.id, 'value', formatNumberWithCommas(value));
                                    }
                                  }}
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="px-2 py-2 border-b border-[#edf0f5] text-center cursor-pointer text-[#e53e3e]" onClick={() => removeLineItem(item.id)}>✕</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-start items-center mt-4">
                    <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={addLineItem}>➕ Add Line Item</button>
                  </div>
                </div>

                {/* Section 6: Supporting Documents */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">6</div>
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
                        const isUploading = uploadingDoc === doc.code;
                        return (
                        <div
                          key={doc.code}
                          className={`border-[1.5px] border-dashed rounded-[6px] px-[14px] py-[10px] text-[11px] cursor-pointer text-center min-w-[140px] relative ${
                            isUploaded
                              ? 'border-[#059669] bg-[#d1fae5] text-[#065f46]'
                              : 'border-[#d1d5db] text-[#6a7a9a] hover:border-[#3a7bd5] hover:text-[#3a7bd5]'
                          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => !isUploaded && !isUploading && handleFileSelect(doc.code)}
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
                              <button
                                className="absolute top-1 right-1 text-[#e53e3e] hover:text-[#dc2626] text-[10px]"
                                onClick={(e) => { e.stopPropagation(); removeDocument(doc.code); }}
                              >
                                ✕
                              </button>
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
                    const missingDocs = transportMode.documents?.filter(d => d.required && !uploadedDocuments[d.code]);
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
                  <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => setStep(1)}>← Back</button>
                  <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">💾 Save Draft</button>
                  <button
                    className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleContinueToStep3}
                    disabled={isSavingAll || !isStep2Valid()}
                  >
                    {isSavingAll ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Continue →'
                    )}
                  </button>
                </div>
                {validationError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#fee2e2] text-[11px] text-[#e53e3e] mt-3">
                    <span>⚠️</span>
                    <span>{validationError}</span>
                  </div>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <div className="text-[16px] font-bold text-[#1a2236] mb-[3px]">Review Your Application</div>
                <div className="text-[11.5px] text-[#6a7a9a] mb-5">Step 3 of 4 — Confirm all details before submitting</div>
                <div className="flex items-center gap-2 mb-3">
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

                {isLoadingReview ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-[14px] text-[#6a7a9a]">Loading review data...</div>
                  </div>
                ) : reviewData ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                        <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Certificate Type</div>
                        <div className="text-[13.5px] font-bold text-[#1a2236]">{reviewData.application?.certificateType || 'NACCIMA'}</div>
                      </div>
                      <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                        <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Exporter</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">Company</span><span className="text-[#1a2236]">{reviewData.application?.shipperName || '—'}</span></div>
                          <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">TIN</span><span className="text-[#1a2236] font-mono">{reviewData.application?.tin || '—'}</span></div>
                          <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">Membership</span><span className={`text-[10px] font-bold px-2 py-[2px] rounded-[10px] ${reviewData.membershipStatus === 'MEMBER' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>{reviewData.membershipStatus === 'MEMBER' ? '★ MEMBER' : 'NON-MEMBER'}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4 mb-3">
                      <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Shipment Details</div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-[11px]"><span className="text-[#6a7a9a]">Consignee</span><br/><span className="text-[#1a2236]">{reviewData.application?.consignee || '—'}</span></div>
                        <div className="text-[11px]"><span className="text-[#6a7a9a]">Destination</span><br/><span className="text-[#1a2236]">{reviewData.application?.destinationCountry || '—'}</span></div>
                        <div className="text-[11px]"><span className="text-[#6a7a9a]">Mode of Transport</span><br/><span className="text-[#1a2236]">{getTransportModeIcon(reviewData.application?.modeOfTransport || '')} {reviewData.application?.modeOfTransport || '—'}</span></div>
                        <div className="text-[11px]"><span className="text-[#6a7a9a]">Carrier</span><br/><span className="text-[#1a2236]">{reviewData.application?.carrier || '—'}</span></div>
                        <div className="text-[11px]"><span className="text-[#6a7a9a]">Country of Mfg</span><br/><span className="text-[#1a2236]">{reviewData.application?.countryOfMfg || '—'}</span></div>
                        <div className="text-[11px]"><span className="text-[#6a7a9a]">Bulk Qty (MT)</span><br/><span className="text-[#1a2236]">{reviewData.application?.bulkQtyMt || '—'} MT</span></div>
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
                          {reviewData.application?.goods?.map((item, index) => (
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
                          {(!reviewData.application?.goods || reviewData.application.goods.length === 0) && (
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
                          {reviewData.documents?.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 text-[11.5px] text-[#065f46]">✅ {doc.documentType} — {doc.fileName}</div>
                          ))}
                          {(!reviewData.documents || reviewData.documents.length === 0) && (
                            <div className="text-[11.5px] text-[#6a7a9a]">No documents uploaded</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="bg-[#fef3c7] border border-[#fbbf24] rounded-[8px] p-4 mb-3">
                          <div className="text-[11px] font-bold text-[#92400e] mb-2">💱 FOB Value Conversion (Certificate of Origin)</div>
                          <div className="flex justify-between text-[11px] mb-1"><span>FOB Value (USD)</span><span className="font-bold text-[#1a2236]">{formatCurrency(reviewData.application?.totalValueFob, 'USD')}</span></div>
                          {isLoadingRate ? (
                            <div className="flex justify-between text-[11px] mb-1"><span>Exchange Rate (USD/NGN)</span><span className="text-[#9ca3af]">Loading...</span></div>
                          ) : exchangeRate ? (
                            <>
                              <div className="flex justify-between text-[11px] mb-1"><span>Exchange Rate (USD/NGN)</span><span className="font-bold text-[#1a2236]">{formatCurrency(exchangeRate.rate, 'NGN')}</span></div>
                              <div className="flex justify-between text-[10px] text-[#9ca3af] mb-1"><span>Rate retrieved</span><span>{new Date(exchangeRate.retrievedAt).toLocaleDateString()} (Source: {exchangeRate.source})</span></div>
                              <div className="flex justify-between text-[11px] font-bold border-t border-[#fbbf24] pt-2 mt-1"><span>FOB Value (NGN)</span><span className="font-bold text-[#1a2236]">{formatCurrency((Number(String(reviewData.application?.totalValueFob || 0).replace(/,/g, '')) * exchangeRate.rate), 'NGN')}</span></div>
                            </>
                          ) : (
                            <div className="flex justify-between text-[11px] mb-1"><span>Exchange Rate (USD/NGN)</span><span className="text-[#e53e3e]">Failed to load</span></div>
                          )}
                        </div>
                        <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                          <div className="flex justify-between text-[11px] mb-1"><span className="text-[#065f46] font-semibold">★ Member Rate Applied</span><span className="text-[#065f46] text-[10.5px] font-semibold">0.11% of FOB</span></div>
                          {exchangeRate ? (
                            <>
                              <div className="flex justify-between text-[11px] mb-1"><span>Certificate Fee (0.11% × {formatCurrency(Number(String(reviewData.application?.totalValueFob || 0).replace(/,/g, '')) * exchangeRate.rate, 'NGN')})</span><span className="font-semibold text-[#1a2236]">{formatCurrency((Number(String(reviewData.application?.totalValueFob || 0).replace(/,/g, '')) * exchangeRate.rate) * 0.0011, 'NGN')}</span></div>
                              <div className="flex justify-between text-[11px] mb-1"><span>Processing Fee</span><span className="font-semibold text-[#1a2236]">{formatCurrency(2500, 'NGN')}</span></div>
                              <div className="flex justify-between text-[11px] mb-1"><span>VAT (7.5%)</span><span className="font-semibold text-[#1a2236]">{formatCurrency((((Number(String(reviewData.application?.totalValueFob || 0).replace(/,/g, '')) * exchangeRate.rate) * 0.0011) + 2500) * 0.075, 'NGN')}</span></div>
                              <div className="flex justify-between text-[11px] font-bold border-t border-[#dde3ee] pt-2 mt-1"><span>Total Payable</span><span className="font-bold text-[#1a2236]">{formatCurrency((((Number(String(reviewData.application?.totalValueFob || 0).replace(/,/g, '')) * exchangeRate.rate) * 0.0011) + 2500) * 1.075, 'NGN')}</span></div>
                            </>
                          ) : (
                            <div className="text-[11px] text-[#e53e3e]">Exchange rate not loaded</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {reviewData.validationErrors && reviewData.validationErrors.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#fee2e2] text-[11px] text-[#e53e3e] mb-4">
                        <span>⚠️</span>
                        <span>{reviewData.validationErrors.join(', ')}</span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-[#edf0f5]">
                      <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => setStep(2)}>← Back to Edit</button>
                      <button
                        className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => submitApplication()}
                        disabled={!reviewData.canSubmit || isSubmittingApplication}
                      >
                        {isSubmittingApplication ? 'Submitting...' : (reviewData.canSubmit ? 'Submit & Proceed to Payment →' : 'Cannot Submit')}
                      </button>
                    </div>
                  </>
                ) : null}
              </>
            )}
            {step === 4 && (
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

                {paymentData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">
                      <div className="bg-white border border-[#dde3ee] rounded-[10px] p-5">
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <div className="text-[14px] font-bold text-[#1a2236]">Checkout</div>
                            <div className="text-[11px] text-[#6a7a9a] mt-1">Choose a payment option to continue securely.</div>
                          </div>
                          <div className="text-[10px] font-semibold text-[#065f46] bg-[#d1fae5] px-2 py-1 rounded-full">
                            🔒 Secure
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-5">
                          {[
                            { key: 'CARD' as const, label: 'Card', icon: '💳' },
                            { key: 'BANK_TRANSFER' as const, label: 'Bank Transfer', icon: '🏦' },
                            { key: 'USSD' as const, label: 'USSD', icon: '📱' },
                          ].map((method) => (
                            <button
                              key={method.key}
                              type="button"
                              onClick={() => setSelectedPaymentMethod(method.key)}
                              className={`px-3 py-3 rounded-[8px] border text-[11px] font-semibold transition-all ${
                                selectedPaymentMethod === method.key
                                  ? 'border-[#3a7bd5] bg-[#e8f0fe] text-[#1a4a8a]'
                                  : 'border-[#dde3ee] bg-white text-[#4a5a7a] hover:border-[#3a7bd5]'
                              }`}
                            >
                              <div className="text-[18px] mb-1">{method.icon}</div>
                              {method.label}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-[8px] bg-[#f8fafd] border border-[#dde3ee] p-4 mb-5">
                          {selectedPaymentMethod === 'CARD' ? (
                            <>
                              <div className="text-[12px] font-bold text-[#1a2236] mb-1">Pay with Card</div>
                              <div className="text-[10.5px] text-[#6a7a9a]">
                                Your card details will be entered securely on the Payfonte checkout page. They are not stored or sent through this application.
                              </div>
                            </>
                          ) : selectedPaymentMethod === 'BANK_TRANSFER' ? (
                            <>
                              <div className="text-[12px] font-bold text-[#1a2236] mb-1">Pay with Bank Transfer</div>
                              <div className="text-[10.5px] text-[#6a7a9a]">
                                Payfonte will provide the secure bank-transfer instructions after you continue.
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-[12px] font-bold text-[#1a2236] mb-1">Pay with USSD</div>
                              <div className="text-[10.5px] text-[#6a7a9a]">
                                Payfonte will show the available USSD options for your payment.
                              </div>
                            </>
                          )}
                        </div>

                        {paymentCheckoutUrl ? (
                          <div className="border border-[#dde3ee] rounded-[8px] overflow-hidden bg-[#f8fafd] p-4 text-[12px] text-[#1a2236]">
                            Redirecting to the secure Payfonte payment page in your browser...
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPayfonteCheckout(paymentData)}
                            disabled={isSubmittingApplication}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[7px] border-none bg-[#1a4a8a] text-white text-[12px] font-bold hover:bg-[#153c70] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Pay Securely with Payfonte
                            <FiArrowRight className="w-4 h-4" />
                          </button>
                        )}

                        <div className="text-center text-[10px] text-[#94a3b8] mt-3">
                          Secured by Payfonte · Redirects to the full browser checkout
                        </div>
                      </div>

                      <div className="h-fit bg-[#f8fafd] border border-[#dde3ee] rounded-[10px] p-5">
                        <div className="text-[12px] font-bold text-[#1a2236] mb-4">Payment Summary</div>
                        <div className="space-y-3 text-[11px]">
                          <div className="flex justify-between gap-4">
                            <span className="text-[#6a7a9a]">Application</span>
                            <span className="font-semibold text-[#1a2236] text-right">{applicationId || '—'}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-[#6a7a9a]">Certificate</span>
                            <span className="font-semibold text-[#1a2236] text-right">{reviewData?.application?.certificateType || 'NACCIMA'}</span>
                          </div>
                          <div className="border-t border-[#dde3ee] pt-3 flex justify-between gap-4">
                            <span className="font-bold text-[#1a2236]">Total Payable</span>
                            <span className="font-bold text-[#1a4a8a] text-[15px]">
                              {paymentData
                                ? formatCurrency(getPaymentDisplayAmount(paymentData), getPaymentCurrency(paymentData))
                                : formatCurrency(
                                    ((((Number(String(reviewData?.application?.totalValueFob || 0).replace(/,/g, '')) * (exchangeRate?.rate || 0)) * 0.0011) + 2500) * 1.075),
                                    'NGN'
                                  )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 p-3 rounded-[7px] bg-[#ecfdf5] border border-[#a7f3d0] text-[10.5px] text-[#065f46]">
                          Once payment is confirmed successfully, you will be redirected to your exporter dashboard.
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-start pt-5 mt-5 border-t border-[#edf0f5]">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentCheckoutUrl('');
                          stopPaymentStatusPolling();
                          setStep(3);
                        }}
                        className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold border border-[#ccd3e0] bg-white text-[#2a3a56] hover:bg-[#f1f4f9]"
                      >
                        ← Back to Review
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-[12px] text-[#6a7a9a]">
                    Payment details are not available. Please return to the review step and submit again.
                  </div>
                )}

                {validationError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#fee2e2] text-[11px] text-[#e53e3e] mt-4">
                    <span>⚠️</span>
                    <span>{validationError}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
    </div>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f8fafc] px-4">
          <div className="w-full max-w-[420px] rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-[#dbeafe]" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1a4a8a] animate-spin" />
                <div className="absolute inset-3 rounded-full border-2 border-[#e2e8f0]" />
              </div>

              <div className="mt-5 text-center">
                <div className="text-[12px] font-bold tracking-[0.22em] text-[#64748b] uppercase">Loading</div>
                <div className="mt-2 text-[18px] font-semibold text-[#1a2236]">Application Form</div>
              </div>

              <div className="mt-5 w-full space-y-3">
                <div className="h-3 w-full animate-pulse rounded-full bg-[#edf3fb]" />
                <div className="h-3 w-5/6 animate-pulse rounded-full bg-[#edf3fb]" />
                <div className="h-10 w-full animate-pulse rounded-[8px] bg-[#edf3fb]" />
                <div className="h-10 w-full animate-pulse rounded-[8px] bg-[#edf3fb]" />
                <div className="h-10 w-4/5 animate-pulse rounded-[8px] bg-[#edf3fb]" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <NewApplicationContent />
    </Suspense>
  );
}