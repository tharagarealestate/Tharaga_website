/**
 * Formats numbers in Indian currency system
 * Following Tharaga pricing page standards
 */

export function formatIndianCurrency(amount: number, showDecimals: boolean = true): string {
  if (amount >= 10000000) {
    // Crores (1 Crore = 1,00,00,000)
    const crores = amount / 10000000;
    return showDecimals 
      ? `₹${crores.toFixed(2)} Cr`
      : `₹${Math.round(crores)} Cr`;
  } else if (amount >= 100000) {
    // Lakhs (1 Lakh = 1,00,000)
    const lakhs = amount / 100000;
    return showDecimals
      ? `₹${lakhs.toFixed(2)} L`
      : `₹${Math.round(lakhs)} L`;
  } else if (amount >= 1000) {
    // Thousands
    const thousands = amount / 1000;
    return `₹${thousands.toFixed(1)}K`;
  }
  
  // Less than 1000 - use Indian number format
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Price range display
export function formatPriceRange(min: number, max: number): string {
  if (min === 0 && max >= 200000000) {
    return 'Any Price';
  }
  if (min === 0) {
    return `Up to ${formatIndianCurrency(max)}`;
  }
  if (max >= 200000000) {
    return `${formatIndianCurrency(min)}+`;
  }
  return `${formatIndianCurrency(min)} - ${formatIndianCurrency(max)}`;
}

// Number formatting for counts (properties, views, etc.)
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

