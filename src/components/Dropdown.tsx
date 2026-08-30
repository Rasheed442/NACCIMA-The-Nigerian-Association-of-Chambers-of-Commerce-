'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownOption {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean; // renders a separator line above this item
}

interface DropdownProps {
  trigger: React.ReactNode;
  options: DropdownOption[];
  align?: 'left' | 'right';
}

export default function Dropdown({ trigger, options, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const close = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setActiveIndex(-1);
    }, 100);
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 160;

    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    // Keep it inside the viewport horizontally
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

    let top = rect.bottom + 6;
    // Flip above the trigger if there isn't room below
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    if (top + menuHeight > window.innerHeight - 8 && rect.top - menuHeight - 6 > 0) {
      top = rect.top - menuHeight - 6;
    }

    setPosition({ top, left });
  };

  // Recalculate right after opening (menu needs to render once to measure itself)
  useLayoutEffect(() => {
    if (isOpen) calculatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        close();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const handleReposition = () => calculatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const opt = options[activeIndex];
      if (!opt.disabled) {
        opt.onClick();
        close();
      }
    }
  };

  return (
    <div ref={triggerRef} className="inline-block" onKeyDown={handleKeyDown}>
      <div
        onClick={() => {
          if (isOpen) {
            close();
          } else {
            setIsOpen(true);
            setActiveIndex(-1);
          }
        }}
        className="cursor-pointer select-none"
      >
        {trigger}
      </div>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            data-state={isClosing ? 'closed' : 'open'}
            style={{
              position: 'fixed',
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              visibility: position ? 'visible' : 'hidden',
            }}
            className="z-50 min-w-[160px] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-lg
              data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
              data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
              data-[state=open]:slide-in-from-top-1
              duration-100"
          >
            {options.map((option, index) => (
              <React.Fragment key={index}>
                {option.separator && (
                  <div className="-mx-1 my-1 h-px bg-zinc-100" role="separator" />
                )}
                <button
                  role="menuitem"
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) return;
                    option.onClick();
                    close();
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors
                    ${
                      option.disabled
                        ? 'pointer-events-none opacity-50'
                        : option.destructive
                        ? 'text-red-600 focus:bg-red-50'
                        : 'text-zinc-700'
                    }
                    ${
                      activeIndex === index && !option.disabled
                        ? option.destructive
                          ? 'bg-red-50'
                          : 'bg-zinc-100 text-zinc-900'
                        : ''
                    }
                  `}
                >
                  {option.icon && (
                    <span className="flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                      {option.icon}
                    </span>
                  )}
                  <span className="flex-1 text-left">{option.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}