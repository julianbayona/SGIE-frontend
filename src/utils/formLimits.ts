import type React from 'react';

export const FORM_LIMITS = {
  idNumber: 12,
  phone: 15,
  name: 80,
  username: 60,
  password: 72,
  email: 120,
  shortText: 80,
  mediumText: 160,
  longText: 500,
  moneyDigits: 9,
  quantityDigits: 4,
  percentDigits: 3,
};

export const limitText = (value: string, maxLength: number): string => {
  return value.slice(0, maxLength);
};

export const onlyDigits = (value: string, maxLength: number): string => {
  return value.replace(/\D/g, '').slice(0, maxLength);
};

export const limitDecimalNumber = (value: string, maxDigits: number): string => {
  const normalized = value.replace(/[^\d.]/g, '');
  const [integer = '', decimal = ''] = normalized.split('.');
  const safeInteger = integer.slice(0, maxDigits);
  const safeDecimal = decimal.slice(0, 2);
  return normalized.includes('.') ? `${safeInteger}.${safeDecimal}` : safeInteger;
};

export const toLimitedNumber = (
  value: string,
  maxDigits: number,
  fallback = 0,
  maxValue?: number,
): number => {
  const limited = limitDecimalNumber(value, maxDigits);
  if (!limited) {
    return fallback;
  }

  const parsed = Number(limited);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return typeof maxValue === 'number' ? Math.min(parsed, maxValue) : parsed;
};

export const numberInputValue = (value: number): string | number => {
  return value === 0 ? '' : value;
};

export const selectInputText = (event: React.FocusEvent<HTMLInputElement>): void => {
  event.currentTarget.select();
};
