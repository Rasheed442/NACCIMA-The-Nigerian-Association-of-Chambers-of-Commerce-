'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

export default function NewApplication() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [transportMode, setTransportMode] = React.useState<string | null>(null);
  const [isSavingTransportMode, setIsSavingTransportMode] = useState(false);
  const [selectedCert, setSelectedCert] = React.useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewData, setReviewData] = useState<any>(null);
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
  const [goodsLineItems, setGoodsLineItems] = useState<GoodsLineItem[]>([
    {
      id: '1',
      hsCode: '',
      description: '',
      marksNo: '',
      quantity: '',
      grossWeight: '',
      nomenclature: '',
      unit: '',
      value: '',
    }
  ]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [isSavingApplication, setIsSavingApplication] = useState(false);
  const [isSavingGoods, setIsSavingGoods] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [selectedTransportModeDetails, setSelectedTransportModeDetails] = useState<TransportMode | null>(null);

  // Application form fields
  const [formData, setFormData] = useState({
    importerEmail: '',
    consigneeName: '',
    consigneeAddress: '',
    carrier: '',
    destinationCountry: '',
    destinationPort: '',
    countryOfManufacturing: 'Nigeria',
    totalValueFOB: '',
    bulkProductQty: '',
    marksNo: '',
    ecowasNumber: '',
    criteria: '',
  });

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
    fetchCertificateTypes();
    fetchTransportModes();
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCert) {
      fetchCertificateFields(selectedCert);
    }
  }, [selectedCert]);

  const fetchCertificateTypes = async () => {
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
  };

  const fetchCertificateFields = async (certificateId: string) => {
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

      setCertificateFields(result);
    } catch (err) {
      console.error('Failed to fetch certificate fields:', err);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const fetchTransportModes = async () => {
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
  };

  const fetchCountries = async () => {
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

    // Validate required fields based on certificate type configuration
    if (!fieldsLoaded || isFieldRequired('IMPORTER_EMAIL')) {
      if (!formData.importerEmail.trim()) {
        errors.importerEmail = 'Importer Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.importerEmail)) {
        errors.importerEmail = 'Please enter a valid email address';
      }
    }
    if (!fieldsLoaded || isFieldRequired('CONSIGNEE')) {
      if (!formData.consigneeName.trim()) {
        errors.consigneeName = 'Consignee Name is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('CONSIGNEE_ADDRESS')) {
      if (!formData.consigneeAddress.trim()) {
        errors.consigneeAddress = 'Consignee Address is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('CARRIER')) {
      if (!formData.carrier.trim()) {
        errors.carrier = 'Carrier is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('DESTINATION')) {
      if (!formData.destinationCountry.trim()) {
        errors.destinationCountry = 'Destination Country is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('COUNTRY_OF_MANUFACTURING')) {
      if (!formData.countryOfManufacturing.trim()) {
        errors.countryOfManufacturing = 'Country of Manufacturing is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('TOTAL_VALUE_FOB')) {
      const cleanValue = formData.totalValueFOB.replace(/,/g, '').trim();
      if (!cleanValue) {
        errors.totalValueFOB = 'Total Value (FOB) is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('BULK_PRODUCT_QTY_MT')) {
      if (!formData.bulkProductQty.trim()) {
        errors.bulkProductQty = 'Bulk Product Qty is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('MARKS_NO')) {
      if (isFieldApplicable('MARKS_NO') && !formData.marksNo.trim()) {
        errors.marksNo = 'Marks / No. is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('ECOWAS_NUMBER')) {
      if (isFieldApplicable('ECOWAS_NUMBER') && !formData.ecowasNumber.trim()) {
        errors.ecowasNumber = 'ECOWAS Number is required';
      }
    }
    if (!fieldsLoaded || isFieldRequired('CRITERIA')) {
      if (isFieldApplicable('CRITERIA') && !formData.criteria.trim()) {
        errors.criteria = 'Criteria is required';
      }
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
      return false;
    }

    setIsSavingApplication(true);
    setValidationError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const payload: any = {
        importerEmail: formData.importerEmail,
        consignee: formData.consigneeName,
        consigneeAddress: formData.consigneeAddress,
        carrier: formData.carrier,
        modeOfTransport: transportMode,
        destinationCountry: formData.destinationCountry,
        destinationPort: formData.destinationPort,
        countryOfMfg: formData.countryOfManufacturing,
      };

      if (formData.bulkProductQty && formData.bulkProductQty.trim() !== '' && !isNaN(parseFloat(formData.bulkProductQty))) {
        payload.bulkQtyMt = parseFloat(formData.bulkProductQty);
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Shipment details saved successfully');
        setShowSuccessModal(true);
        return true;
      } else {
        setValidationError(result.message || 'Failed to save application details');
        return false;
      }
    } catch (err) {
      console.error('Failed to save application details:', err);
      setValidationError('Failed to save application details. Please try again.');
      return false;
    } finally {
      setIsSavingApplication(false);
    }
  };

  const saveGoodsItems = async () => {
    if (!applicationId) {
      setValidationError('Application ID not found');
      return false;
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
          quantity: parseFloat(item.quantity) || 0,
          grossWeight: parseFloat(item.grossWeight) || 0,
          nomenclature: item.nomenclature,
          value: parseFloat(item.value) || 0,
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
        setSuccessMessage('Goods line items saved successfully');
        setShowSuccessModal(true);
        return true;
      } else {
        setValidationError(result.message || 'Failed to save goods items');
        return false;
      }
    } catch (err) {
      console.error('Failed to save goods items:', err);
      setValidationError('Failed to save goods items. Please try again.');
      return false;
    } finally {
      setIsSavingGoods(false);
    }
  };

  const handleContinueToStep3 = async () => {
    setValidationError(null);

    if (!validateStep2()) {
      return;
    }

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
    const requiredDocs = getSelectedTransportMode()?.documents.filter(d => d.required) || [];
    const missingDocs = requiredDocs.filter(d => !uploadedDocuments[d.code]);
    if (missingDocs.length > 0) {
      setValidationError(`Please upload the following required documents: ${missingDocs.map(d => d.name).join(', ')}`);
      return;
    }

    fetchExchangeRate();
    setStep(3);
    fetchReviewData();
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
        // Redirect to Paystack checkout URL in current tab
        if (result.data.checkoutUrl) {
          window.location.href = result.data.checkoutUrl;
        } else {
          setValidationError('Payment checkout URL not received');
          return false;
        }
        return true;
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
      id: Date.now().toString(),
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
    if (goodsLineItems.length === 1) {
      // Keep at least one empty row
      setGoodsLineItems([{
        id: '1',
        hsCode: '',
        description: '',
        marksNo: '',
        quantity: '',
        grossWeight: '',
        nomenclature: '',
        unit: '',
        value: '',
      }]);
    } else {
      setGoodsLineItems(goodsLineItems.filter(item => item.id !== id));
    }
  };

  const handleDocumentUpload = async (docCode: string, file: File) => {
    if (!applicationId) {
      setUploadError('Application ID not found. Please select a certificate type first.');
      return;
    }

    if (!transportMode) {
      setUploadError('Please select a mode of transport before uploading documents.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setUploadError('Please log in to upload documents');
      return;
    }

    setUploadingDoc(docCode);
    setUploadError(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setUploadError('API URL not configured');
        return;
      }

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

      if (uploadResponse.ok && uploadResult.data) {
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

        if (saveResponse.ok) {
          setUploadedDocuments(prev => ({ ...prev, [docCode]: file }));
        } else {
          setUploadError(`Failed to save document: ${saveResult.message || 'Unknown error'} (${saveResponse.status})`);
        }
      } else {
        setUploadError(`Failed to upload document: ${uploadResult.message || uploadResult.error || 'Unknown error'} (${uploadResponse.status})`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleFileSelect = (docCode: string) => {
    if (!transportMode) {
      setUploadError('Please select a mode of transport before uploading documents.');
      return;
    }
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
    const newItem: GoodsLineItem = {
      id: Date.now().toString(),
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
                <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-4 text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
                  ★ NACCIMA Member — member rates apply to your application
                </div>

                {certError && (
                  <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-4 flex gap-2 items-start bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b]">
                    <span>⚠️</span>
                    <span>{certError}</span>
                  </div>
                )}

                {isLoadingCerts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-[14px] text-[#6a7a9a]">Loading certificate types...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {certificateTypes.filter(cert => cert.active).map((cert) => {
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
                <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-4 text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
                  ★ NACCIMA Member — member rates apply to your application
                </div>

                {/* Section 1: Shipper/Exporter Details */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">1</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Shipper / Exporter Details</div>
                    <span className="text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-[2px] rounded-[10px] font-semibold">NRS-Verified · Read-Only</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">TIN <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-[#f3f4f6] font-mono tracking-widest" value="12345678901" readOnly />
                      <div className="text-[10px] text-[#6b7280]">🔒 From your company profile — cannot be changed</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Importer Email {isFieldRequired('IMPORTER_EMAIL') && <span className="text-[#e53e3e]">*</span>}</label>
                      <input
                        ref={importerEmailRef}
                        className={`px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.importerEmail ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                        placeholder="importer@overseas.com"
                        value={formData.importerEmail}
                        onChange={(e) => {
                          setFormData({...formData, importerEmail: e.target.value});
                          if (formErrors.importerEmail) setFormErrors({...formErrors, importerEmail: ''});
                        }}
                      />
                      {formErrors.importerEmail && <div className="text-[10px] text-[#e53e3e]">{formErrors.importerEmail}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Shipper&apos;s Name <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-[#f3f4f6]" value="Lagos Traders Ltd" readOnly />
                      <div className="text-[10px] text-[#6b7280]">🔒 NRS-verified name — contact Admin to correct</div>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[11px] font-semibold text-[#374151]">Shipper&apos;s Address <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-[#f3f4f6]" value="14 Commerce Road, Apapa, Lagos State, Nigeria" readOnly />
                      <div className="text-[10px] text-[#6b7280]">🔒 NRS-verified address — contact Admin to correct</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Mode of Transport */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Mode of Transport <span className="text-[#e53e3e]">*</span></div>
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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#dbeafe] text-[#11px] text-[#1e40af]">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Consignee Name {isFieldRequired('CONSIGNEE') && <span className="text-[#e53e3e]">*</span>}</label>
                      <input
                        ref={consigneeNameRef}
                        className={`px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.consigneeName ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                        placeholder="Receiving company or person"
                        value={formData.consigneeName}
                        onChange={(e) => {
                          setFormData({...formData, consigneeName: e.target.value});
                          if (formErrors.consigneeName) setFormErrors({...formErrors, consigneeName: ''});
                        }}
                      />
                      {formErrors.consigneeName && <div className="text-[10px] text-[#e53e3e]">{formErrors.consigneeName}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Carrier {isFieldRequired('CARRIER') && <span className="text-[#e53e3e]">*</span>}</label>
                      <input
                        ref={carrierRef}
                        className={`px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.carrier ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                        placeholder="e.g. Maersk Line"
                        value={formData.carrier}
                        onChange={(e) => {
                          setFormData({...formData, carrier: e.target.value});
                          if (formErrors.carrier) setFormErrors({...formErrors, carrier: ''});
                        }}
                      />
                      {formErrors.carrier && <div className="text-[10px] text-[#e53e3e]">{formErrors.carrier}</div>}
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[11px] font-semibold text-[#374151]">Consignee Address {isFieldRequired('CONSIGNEE_ADDRESS') && <span className="text-[#e53e3e]">*</span>}</label>
                      <input
                        ref={consigneeAddressRef}
                        className={`px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.consigneeAddress ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                        placeholder="Full address of consignee at destination"
                        value={formData.consigneeAddress}
                        onChange={(e) => {
                          setFormData({...formData, consigneeAddress: e.target.value});
                          if (formErrors.consigneeAddress) setFormErrors({...formErrors, consigneeAddress: ''});
                        }}
                      />
                      {formErrors.consigneeAddress && <div className="text-[10px] text-[#e53e3e]">{formErrors.consigneeAddress}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Destination Country {isFieldRequired('DESTINATION') && <span className="text-[#e53e3e]">*</span>}</label>
                      <div ref={destinationRef as any} className="relative">
                        <button
                          type="button"
                          onClick={() => setDestinationDropdownOpen(!destinationDropdownOpen)}
                          className={`w-full px-[10px] py-[7px] pr-8 border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] flex items-center justify-between ${formErrors.destinationCountry ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                          disabled={isLoadingCountries}
                        >
                          <span>{formData.destinationCountry || '-- Select Country --'}</span>
                          <ChevronDown className={`w-4 h-4 text-[#6a7a9a] transition-transform ${destinationDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {destinationDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-[#d1d5db] rounded-[5px] shadow-lg max-h-60 overflow-auto">
                            {countries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setFormData({...formData, destinationCountry: country.name});
                                  setDestinationDropdownOpen(false);
                                  if (formErrors.destinationCountry) setFormErrors({...formErrors, destinationCountry: ''});
                                }}
                                className="w-full px-[10px] py-[7px] text-[12px] text-[#1a2236] hover:bg-[#f1f4f9] flex items-center justify-between"
                              >
                                <span>{country.name}</span>
                                {formData.destinationCountry === country.name && <Check className="w-4 h-4 text-[#3a7bd5]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {formErrors.destinationCountry && <div className="text-[10px] text-[#e53e3e]">{formErrors.destinationCountry}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Destination Port</label>
                      <input
                        ref={destinationPortRef}
                        className={`px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.destinationPort ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                        placeholder="e.g., Tema"
                        value={formData.destinationPort}
                        onChange={(e) => {
                          setFormData({...formData, destinationPort: e.target.value});
                          if (formErrors.destinationPort) setFormErrors({...formErrors, destinationPort: ''});
                        }}
                      />
                      {formErrors.destinationPort && <div className="text-[10px] text-[#e53e3e]">{formErrors.destinationPort}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Country of Manufacturing {isFieldRequired('COUNTRY_OF_MANUFACTURING') && <span className="text-[#e53e3e]">*</span>}</label>
                      <div ref={manufacturingRef as any} className="relative">
                        <button
                          type="button"
                          onClick={() => setManufacturingDropdownOpen(!manufacturingDropdownOpen)}
                          className={`w-full px-[10px] py-[7px] pr-8 border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.countryOfManufacturing ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                          disabled={isLoadingCountries}
                        >
                          <span>{formData.countryOfManufacturing || '-- Select Country --'}</span>
                          <ChevronDown className={`w-4 h-4 text-[#6a7a9a] transition-transform ${manufacturingDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {manufacturingDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-[#d1d5db] rounded-[5px] shadow-lg max-h-60 overflow-auto">
                            {countries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setFormData({...formData, countryOfManufacturing: country.name});
                                  setManufacturingDropdownOpen(false);
                                  if (formErrors.countryOfManufacturing) setFormErrors({...formErrors, countryOfManufacturing: ''});
                                }}
                                className="w-full px-[10px] py-[7px] text-[12px] text-[#1a2236] hover:bg-[#f1f4f9] flex items-center justify-between"
                              >
                                <span>{country.name}</span>
                                {formData.countryOfManufacturing === country.name && <Check className="w-4 h-4 text-[#3a7bd5]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {formErrors.countryOfManufacturing && <div className="text-[10px] text-[#e53e3e]">{formErrors.countryOfManufacturing}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Total Value (FOB) in USD {isFieldRequired('TOTAL_VALUE_FOB') && <span className="text-[#e53e3e]">*</span>} <span className="text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-[2px] rounded-[10px] font-semibold">USD for CoO</span></label>
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-bold text-[#92400e]">$</span>
                        <input
                          ref={totalValueFOBRef}
                          className={`flex-1 px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.totalValueFOB ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                          placeholder="0.00"
                          value={formData.totalValueFOB}
                          onChange={(e) => {
                            const formatted = formatNumberWithCommas(e.target.value);
                            setFormData({...formData, totalValueFOB: formatted});
                            if (formErrors.totalValueFOB) setFormErrors({...formErrors, totalValueFOB: ''});
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-[#6b7280]">FOB value in US Dollars. Converted to NGN at prevailing rate for fee calculation.</div>
                      {formErrors.totalValueFOB && <div className="text-[10px] text-[#e53e3e]">{formErrors.totalValueFOB}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Bulk Product Qty (MT) {isFieldRequired('BULK_PRODUCT_QTY_MT') && <span className="text-[#e53e3e]">*</span>}</label>
                      <input
                        ref={bulkProductQtyRef}
                        className={`px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.bulkProductQty ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                        placeholder="300"
                        value={formData.bulkProductQty}
                        onChange={(e) => {
                          setFormData({...formData, bulkProductQty: e.target.value});
                          if (formErrors.bulkProductQty) setFormErrors({...formErrors, bulkProductQty: ''});
                        }}
                      />
                      {formErrors.bulkProductQty && <div className="text-[10px] text-[#e53e3e]">{formErrors.bulkProductQty}</div>}
                    </div>
                    {isFieldApplicable('ECOWAS_NUMBER') && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-[#374151]">ECOWAS Number {isFieldRequired('ECOWAS_NUMBER') && <span className="text-[#e53e3e]">*</span>}</label>
                        <input
                          ref={ecowasNumberRef}
                          className={`px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.ecowasNumber ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                          placeholder="ECOWAS Number"
                          value={formData.ecowasNumber}
                          onChange={(e) => {
                            setFormData({...formData, ecowasNumber: e.target.value});
                            if (formErrors.ecowasNumber) setFormErrors({...formErrors, ecowasNumber: ''});
                          }}
                        />
                        {formErrors.ecowasNumber && <div className="text-[10px] text-[#e53e3e]">{formErrors.ecowasNumber}</div>}
                      </div>
                    )}
                    {isFieldApplicable('CRITERIA') && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-[#374151]">Criteria {isFieldRequired('CRITERIA') && <span className="text-[#e53e3e]">*</span>}</label>
                        <input
                          ref={criteriaRef}
                          className={`px-[10px] py-[7px] border rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] ${formErrors.criteria ? 'border-[#fca5a5]' : 'border-[#d1d5db]'}`}
                          placeholder="Criteria"
                          value={formData.criteria}
                          onChange={(e) => {
                            setFormData({...formData, criteria: e.target.value});
                            if (formErrors.criteria) setFormErrors({...formErrors, criteria: ''});
                          }}
                        />
                        {formErrors.criteria && <div className="text-[10px] text-[#e53e3e]">{formErrors.criteria}</div>}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      className="inline-flex items-center gap-1 px-[14px] py-[10px] rounded text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={saveApplicationDetails}
                      disabled={isSavingApplication}
                    >
                      {isSavingApplication ? 'Saving...' : 'Save Shipment Details'}
                    </button>
                  </div>
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
                          {isFieldApplicable('UNIT') && <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Unit {isFieldRequired('UNIT') && <span className="text-[#e53e3e]">*</span>}</th>}
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Value (USD) {isFieldRequired('VALUE') && <span className="text-[#e53e3e]">*</span>}</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {goodsLineItems.map((item, index) => (
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
                                onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                                placeholder="QTY"
                              />
                            </td>
                            <td className="px-2 py-2 border-b border-[#edf0f5]">
                              <input
                                className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]"
                                value={item.grossWeight}
                                onChange={(e) => updateLineItem(item.id, 'grossWeight', e.target.value)}
                                placeholder="KG"
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
                            {isFieldApplicable('UNIT') && (
                              <td className="px-2 py-2 border-b border-[#edf0f5]">
                                <input
                                  className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[50px]"
                                  value={item.unit}
                                  onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                                  placeholder="Unit"
                                />
                              </td>
                            )}
                            <td className="px-2 py-2 border-b border-[#edf0f5]">
                              <input
                                className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[85px]"
                                value={item.value}
                                onChange={(e) => updateLineItem(item.id, 'value', e.target.value)}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-2 py-2 border-b border-[#edf0f5] text-center cursor-pointer text-[#e53e3e]" onClick={() => removeLineItem(item.id)}>✕</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={addLineItem}>➕ Add Line Item</button>
                    <button
                      className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={saveGoodsItems}
                      disabled={isSavingGoods}
                    >
                      {isSavingGoods ? 'Saving...' : 'Save Goods Items'}
                    </button>
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
                              <span className="block mb-1">⏳</span>
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
                    const missingDocs = transportMode.documents.filter(d => d.required && !uploadedDocuments[d.code]);
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
                  <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={handleContinueToStep3}>Continue →</button>
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
                        <div className="text-[11px]"><span className="text-[#6a7a9a]">Mode of Transport</span><br/><span className="text-[#1a2236]">{getTransportModeIcon(reviewData.application?.modeOfTransport)} {reviewData.application?.modeOfTransport || '—'}</span></div>
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
                          {reviewData.application?.goods?.map((item: any, index: number) => (
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
                          {reviewData.documents?.map((doc: any) => (
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
                          <div className="flex justify-between text-[11px] mb-1"><span>FOB Value (USD)</span><span className="font-bold text-[#1a2236]">${reviewData.application?.totalValueFob || '0.00'}</span></div>
                          {isLoadingRate ? (
                            <div className="flex justify-between text-[11px] mb-1"><span>Exchange Rate (USD/NGN)</span><span className="text-[#9ca3af]">Loading...</span></div>
                          ) : exchangeRate ? (
                            <>
                              <div className="flex justify-between text-[11px] mb-1"><span>Exchange Rate (USD/NGN)</span><span className="font-bold text-[#1a2236]">₦{exchangeRate.rate.toFixed(2)}</span></div>
                              <div className="flex justify-between text-[10px] text-[#9ca3af] mb-1"><span>Rate retrieved</span><span>{new Date(exchangeRate.retrievedAt).toLocaleDateString()} (Source: {exchangeRate.source})</span></div>
                              <div className="flex justify-between text-[11px] font-bold border-t border-[#fbbf24] pt-2 mt-1"><span>FOB Value (NGN)</span><span className="font-bold text-[#1a2236]">₦{((reviewData.application?.totalValueFob || 0) * exchangeRate.rate).toFixed(2)}</span></div>
                            </>
                          ) : (
                            <div className="flex justify-between text-[11px] mb-1"><span>Exchange Rate (USD/NGN)</span><span className="text-[#e53e3e]">Failed to load</span></div>
                          )}
                        </div>
                        <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                          <div className="flex justify-between text-[11px] mb-1"><span className="text-[#065f46] font-semibold">★ Member Rate Applied</span><span className="text-[#065f46] text-[10.5px] font-semibold">0.11% of FOB</span></div>
                          {exchangeRate ? (
                            <>
                              <div className="flex justify-between text-[11px] mb-1"><span>Certificate Fee (0.11% × ₦{((reviewData.application?.totalValueFob || 0) * exchangeRate.rate).toFixed(2)})</span><span className="font-semibold text-[#1a2236]">₦{(((reviewData.application?.totalValueFob || 0) * exchangeRate.rate) * 0.0011).toFixed(2)}</span></div>
                              <div className="flex justify-between text-[11px] mb-1"><span>Processing Fee</span><span className="font-semibold text-[#1a2236]">₦2,500.00</span></div>
                              <div className="flex justify-between text-[11px] mb-1"><span>VAT (7.5%)</span><span className="font-semibold text-[#1a2236]">₦{(((((reviewData.application?.totalValueFob || 0) * exchangeRate.rate) * 0.0011) + 2500) * 0.075).toFixed(2)}</span></div>
                              <div className="flex justify-between text-[11px] font-bold border-t border-[#dde3ee] pt-2 mt-1"><span>Total Payable</span><span className="font-bold text-[#1a2236]">₦{(((((reviewData.application?.totalValueFob || 0) * exchangeRate.rate) * 0.0011) + 2500) * 1.075).toFixed(2)}</span></div>
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
            {/* Step 4 - Payment - Commented out, now redirects directly to Paystack */}
            {/* {step === 4 && (
                  <>
                    <div className="flex flex-col items-center pt-6">
                      <div className="text-[16px] font-bold text-[#1a2236] mb-1 text-center">Secure Payment</div>
                      <div className="text-[11.5px] text-[#6a7a9a] mb-5 text-center">Step 4 of 4 — Application NACC-2026-00422 submitted. Complete payment to begin processing.</div>
                      <div className="flex items-center gap-2 mb-3 max-w-[620px] w-full">
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
                          <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                          <span className="text-[10px] font-semibold text-[#059669]">Review & Submit</span>
                        </div>
                        <div className="h-[2px] flex-1 bg-[#059669]"></div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-[24px] h-[24px] rounded-full border-2 border-[#3a7bd5] bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">4</div>
                          <span className="text-[10px] font-semibold text-[#3a7bd5]">Payment</span>
                        </div>
                      </div>
                      <div className="bg-white border border-[#dde3ee] rounded-[10px] shadow-[0_2px_16px_rgba(0,0,0,0.1)] w-full max-w-[400px]">
                        <div className="px-5 py-4 border-b border-[#edf0f5]">
                          <div className="text-[14px] font-bold text-[#0ba4db] mb-1">Paystack</div>
                          <div className="text-[10.5px] text-[#6a7a9a] opacity-80">Lagos Traders Ltd — lagos@traders.ng</div>
                          <div className="text-[24px] font-bold text-[#1a2236] mt-2">₦ 12,031.88</div>
                          <div className="text-[10.5px] text-[#6a7a9a]">Ref: NACC-PAY-2026-00422 &nbsp;|&nbsp; NACCIMA Certificate Fee</div>
                        </div>
                        <div className="p-5">
                          <div className="flex gap-2 mb-4">
                            <div className="flex-1 px-3 py-2 rounded-[6px] text-[11px] font-semibold cursor-pointer bg-[#0ba4db] text-white text-center">💳 Card</div>
                            <div className="flex-1 px-3 py-2 rounded-[6px] text-[11px] font-semibold cursor-pointer bg-[#f8fafd] text-[#6a7a9a] text-center hover:bg-[#edf2ff]">🏦 Bank Transfer</div>
                            <div className="flex-1 px-3 py-2 rounded-[6px] text-[11px] font-semibold cursor-pointer bg-[#f8fafd] text-[#6a7a9a] text-center hover:bg-[#edf2ff]">📱 USSD</div>
                          </div>
                          <div className="flex flex-col gap-3 mb-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-semibold text-[#374151]">Card Number</label>
                              <input className="px-3 py-2 border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="0000  0000  0000  0000" />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 flex flex-col gap-1">
                                  <label className="text-[11px] font-semibold text-[#374151]">Expiry Date</label>
                                  <input className="px-3 py-2 border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="MM / YY" />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                  <label className="text-[11px] font-semibold text-[#374151]">CVV</label>
                                  <input className="px-3 py-2 border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="•••" />
                                </div>
                              </div>
                            </div>
                            <button className="w-full px-4 py-3 rounded-[6px] text-[13px] font-semibold cursor-pointer border-none transition-all bg-[#0ba4db] text-white hover:bg-[#0984b8]">Pay ₦12,031.88</button>
                            <div className="text-[10.5px] text-[#6a7a9a] text-center mt-3">🔒 Secured by Paystack — PCI DSS Compliant</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#9ca3af] text-center mt-3">
                        Having trouble? <span className="text-[#3a7bd5] cursor-pointer">Return to application</span> — your data is saved as PAYMENT PENDING.
                      </div>
                </div>
              </>
            )} */}
          </div>
        </div>
      </div>
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
    </div>
  );
}