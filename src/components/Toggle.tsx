'use client';

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function Toggle({ checked, onChange, disabled = false, className = '' }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-10 items-center rounded-full transition-colors
        ${checked ? 'bg-[#1a4a8a]' : 'bg-[#d1d5db]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}
