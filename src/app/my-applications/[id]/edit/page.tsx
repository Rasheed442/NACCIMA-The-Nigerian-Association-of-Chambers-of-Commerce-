'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const applicationId = params.id as string;

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
  }, [applicationId]);

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
                setDestinationDropdownOpen(!destinationDropdownOpen);
                setDestinationSearchQuery('');
              }}
              className="w-full px-[10px] py-[7px] pr-8 border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] flex items-center justify-between border-[#d1d5db]"
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
    const inputClassName = `px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] focus:outline-none focus:border-[#3a7bd5] ${field.readOnly ? 'border-[#d1d5db] bg-[#f3f4f6]' : 'border-[#d1d5db] bg-white'}`;
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

      // Update application details
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
      setSuccessMessage(isDraft ? 'Application submitted successfully!' : 'Application resubmitted successfully!');
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        if (submissionData.status === 'PAID') {
          // Application is already paid, redirect to applications
          router.push('/my-applications?status=SUBMITTED');
        } else {
          // Application needs payment, handle payment flow
          router.push('/my-applications?status=PENDING');
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
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
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
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto flex flex-col items-center justify-center">
            <div className="text-[16px] font-semibold text-[#1a2236] mb-2">Unable to load this application</div>
            <div className="text-[13px] text-[#e53e3e] mb-4">{error || 'Application not found.'}</div>
            <button
              className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[13px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]"
              onClick={() => router.push('/my-applications')}
            >
              ← Back to Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <button
                  className="text-[#1a4a8a] text-[13px] font-medium hover:underline mb-2"
                  onClick={() => router.push('/my-applications')}
                >
                  ← Back to Applications
                </button>
                <div className="text-[20px] font-medium text-[#1a2236]">Edit &amp; Resubmit Application</div>
                <div className="text-[12px] text-[#6a7a9a]">Application {application.id}</div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#fdf2f8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9d174d]">
                Unapproved
              </span>
            </div>

            {comments.length > 0 && (
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
              <div className="mb-4 rounded-[8px] border border-[#fca5a5] bg-[#fef2f2] p-3 text-[12px] text-[#991b1b] flex items-start gap-2">
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

              {/* Add CRITERIA field as it's required for validation */}
              <div className="flex flex-col gap-1 mb-4">
                <label className="text-[11px] font-semibold text-[#374151]">
                  Criteria <span className="text-[#e53e3e]">*</span>
                </label>
                <textarea
                  className="px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] border-[#d1d5db]"
                  placeholder="Enter criteria..."
                  rows={3}
                  value={String(dynamicFieldValues.CRITERIA || '')}
                  onChange={(e) => setDynamicFieldValues(current => ({ ...current, CRITERIA: e.target.value }))}
                />
                <div className="text-[10px] text-[#6b7280]">Required field for certificate validation</div>
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
              <div className="space-y-1 max-h-[200px] overflow-hidden overflow-scroll">
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
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push('/my-applications')}>Cancel</button>
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">💾 Save Draft</button>
              <button
                className="inline-flex items-center justify-center gap-1 px-[16px] py-[8px] rounded-[6px] text-[13px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSaveAndResubmit}
                disabled={isSaving}
              >
                {isSaving ? (application.status === 'DRAFT' ? 'Submitting...' : 'Resubmitting...') : (application.status === 'DRAFT' ? 'Save & Submit' : 'Save & Resubmit')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
