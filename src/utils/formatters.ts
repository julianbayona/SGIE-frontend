const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const formatShortId = (value?: string | null, prefix = ''): string => {
  if (!value) return '';

  const normalized = value.trim();
  if (!normalized) return '';

  const shortValue = UUID_PATTERN.test(normalized)
    ? normalized.slice(0, 8).toUpperCase()
    : normalized.length > 12
      ? normalized.slice(0, 12).toUpperCase()
      : normalized.toUpperCase();

  return prefix ? `${prefix}${shortValue}` : shortValue;
};
