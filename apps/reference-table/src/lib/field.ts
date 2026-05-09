const hasCodeProperty = (value: unknown): value is { code: unknown } => {
  return !!value && typeof value === 'object' && 'code' in value;
};

export const extractComparableValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (hasCodeProperty(item)) {
          return String(item.code ?? '');
        }
        return String(item ?? '');
      })
      .filter(Boolean);
  }

  if (hasCodeProperty(value)) {
    return [String(value.code ?? '')].filter(Boolean);
  }

  return [String(value ?? '')].filter(Boolean);
};
