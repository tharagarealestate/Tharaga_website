// Pure financial calculation functions — no Next.js/React imports

/**
 * EMI calculation using standard formula:
 * M = P * r * (1+r)^n / ((1+r)^n - 1)
 * where r = monthly rate, n = tenure in months
 */
export function calcEMI(
  principal: number,
  annualRate: number,
  tenureYears: number
): number {
  if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) return 0
  const monthlyRate = annualRate / 100 / 12
  const n = tenureYears * 12
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
               (Math.pow(1 + monthlyRate, n) - 1)
  return Math.round(emi)
}

/**
 * Total interest paid over loan tenure
 */
export function calcTotalInterest(
  emi: number,
  principal: number,
  tenureMonths: number
): number {
  return Math.round(emi * tenureMonths - principal)
}

/**
 * Net rental yield after maintenance, vacancy and property tax costs
 * netYield = (annualRent - annualCosts) / propertyPrice * 100
 */
export function calcNetRentalYield(
  annualRent: number,
  annualCosts: number,
  propertyPrice: number
): number {
  if (propertyPrice <= 0) return 0
  return parseFloat(((annualRent - annualCosts) / propertyPrice * 100).toFixed(2))
}

/**
 * Future value with compound appreciation
 * FV = PV * (1 + r)^n
 */
export function calcFutureValue(
  currentPrice: number,
  appreciationRate: number,
  years: number
): number {
  return Math.round(currentPrice * Math.pow(1 + appreciationRate / 100, years))
}

/**
 * Break-even year: when cumulative net cashflow covers total investment
 * Returns years (can be fractional). Returns 99 if never breaks even in 30yr.
 */
export function calcBreakEven(
  totalInvestment: number,
  monthlyNetCashflow: number
): number {
  if (monthlyNetCashflow <= 0) {
    // Negative cashflow — break-even via appreciation only; not calculable here
    return 99
  }
  const months = totalInvestment / monthlyNetCashflow
  return parseFloat((months / 12).toFixed(1))
}

/**
 * Loan eligibility per Indian banking norms:
 * - FOIR (Fixed Obligation Income Ratio): max 50-55% of net income
 * - Max tenure: 30 years or (65 - age) years, whichever is lower
 * - Standard rate assumption: 8.5% if not specified
 */
export function calcLoanEligibility(
  monthlyIncome: number,
  age: number,
  existingEMIs: number,
  tenureYears?: number
): { maxLoan: number; eligibleEMI: number; maxTenure: number } {
  const foirLimit = 0.50 // 50% FOIR for salaried
  const maxEMICapacity = monthlyIncome * foirLimit
  const eligibleEMI = Math.max(0, maxEMICapacity - existingEMIs)

  const maxTenureByAge = Math.max(5, 65 - age)
  const maxTenure = tenureYears
    ? Math.min(tenureYears, maxTenureByAge, 30)
    : Math.min(maxTenureByAge, 30)

  // Back-calculate principal from EMI using 8.50% rate
  const assumedRate = 8.50
  const r = assumedRate / 100 / 12
  const n = maxTenure * 12
  const factor = (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))
  const maxLoan = Math.round(eligibleEMI * factor)

  return {
    maxLoan: Math.max(0, maxLoan),
    eligibleEMI: Math.round(eligibleEMI),
    maxTenure,
  }
}

/**
 * Investment verdict: BUY / HOLD / AVOID
 * Scoring rubric:
 *   rentalYield >= 4%: +2, >= 3%: +1, < 2%: -2
 *   appreciation >= 9%: +2, >= 7%: +1, < 5%: -1
 *   emiToIncomeRatio <= 35%: +2, <= 45%: +1, > 55%: -2
 *   propertyAge < 5yr: +1, > 20yr: -1
 */
export function calcInvestmentVerdict(params: {
  rentalYield: number
  appreciation: number
  emiToIncomeRatio: number
  locality: string
  propertyAge: number
}): { verdict: 'BUY' | 'HOLD' | 'AVOID'; confidence: 'High' | 'Medium' | 'Low'; reason: string } {
  const { rentalYield, appreciation, emiToIncomeRatio, locality, propertyAge } = params
  let score = 0
  const reasons: string[] = []

  // Rental yield scoring
  if (rentalYield >= 4) { score += 2; reasons.push(`strong rental yield of ${rentalYield}%`) }
  else if (rentalYield >= 3) { score += 1; reasons.push(`decent rental yield of ${rentalYield}%`) }
  else if (rentalYield < 2) { score -= 2; reasons.push(`low rental yield of ${rentalYield}%`) }

  // Appreciation scoring
  if (appreciation >= 9) { score += 2; reasons.push(`high appreciation of ${appreciation}% pa`) }
  else if (appreciation >= 7) { score += 1; reasons.push(`steady appreciation of ${appreciation}% pa`) }
  else if (appreciation < 5) { score -= 1; reasons.push(`low appreciation of ${appreciation}% pa`) }

  // EMI to income ratio
  if (emiToIncomeRatio <= 35) { score += 2; reasons.push('very comfortable EMI burden') }
  else if (emiToIncomeRatio <= 45) { score += 1; reasons.push('manageable EMI burden') }
  else if (emiToIncomeRatio > 55) { score -= 2; reasons.push('EMI burden exceeds safe threshold') }
  else { score -= 1; reasons.push('EMI burden is on the higher side') }

  // Property age scoring
  if (propertyAge < 5) { score += 1; reasons.push('new property with lower maintenance risk') }
  else if (propertyAge > 20) { score -= 1; reasons.push('older property may need renovation') }

  let verdict: 'BUY' | 'HOLD' | 'AVOID'
  let confidence: 'High' | 'Medium' | 'Low'

  if (score >= 5) { verdict = 'BUY'; confidence = 'High' }
  else if (score >= 3) { verdict = 'BUY'; confidence = 'Medium' }
  else if (score >= 1) { verdict = 'HOLD'; confidence = 'Medium' }
  else if (score >= -1) { verdict = 'HOLD'; confidence = 'Low' }
  else if (score >= -3) { verdict = 'AVOID'; confidence = 'Medium' }
  else { verdict = 'AVOID'; confidence = 'High' }

  const reason = `${locality}: ${reasons.slice(0, 3).join(', ')}.`

  return { verdict, confidence, reason }
}

/**
 * Yearly amortization schedule
 * Returns array of yearly rows — useful for charting
 */
export function calcAmortizationYearly(
  principal: number,
  annualRate: number,
  tenureYears: number
): Array<{
  year: number
  openingBalance: number
  principalPaid: number
  interestPaid: number
  closingBalance: number
}> {
  if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) return []

  const monthlyRate = annualRate / 100 / 12
  const emi = calcEMI(principal, annualRate, tenureYears)
  const rows = []
  let balance = principal

  for (let year = 1; year <= tenureYears; year++) {
    const openingBalance = balance
    let yearlyPrincipal = 0
    let yearlyInterest = 0

    for (let month = 0; month < 12; month++) {
      if (balance <= 0) break
      const interestForMonth = balance * monthlyRate
      const principalForMonth = Math.min(emi - interestForMonth, balance)
      yearlyInterest += interestForMonth
      yearlyPrincipal += principalForMonth
      balance -= principalForMonth
    }

    rows.push({
      year,
      openingBalance: Math.round(openingBalance),
      principalPaid: Math.round(yearlyPrincipal),
      interestPaid: Math.round(yearlyInterest),
      closingBalance: Math.max(0, Math.round(balance)),
    })

    if (balance <= 0) break
  }

  return rows
}

/**
 * Tax savings under Indian income tax:
 * - Section 80C: up to ₹1,50,000 principal repayment deduction
 * - Section 24B: up to ₹2,00,000 interest deduction (self-occupied)
 * taxBracket defaults to 30% (highest slab)
 */
export function calcTaxSavings(
  emi: number,
  annualRate: number,
  principal: number,
  taxBracket: number = 30
): {
  principalDeduction: number
  interestDeduction: number
  annualTaxSaving: number
} {
  // First year estimates (interest-heavy)
  const monthlyRate = annualRate / 100 / 12
  const firstYearInterest = principal * monthlyRate * 12 * 0.95 // ~95% of first year EMIs go to interest
  const firstYearPrincipal = emi * 12 - firstYearInterest

  const principalDeduction = Math.min(150000, Math.round(firstYearPrincipal))
  const interestDeduction = Math.min(200000, Math.round(firstYearInterest))
  const annualTaxSaving = Math.round((principalDeduction + interestDeduction) * (taxBracket / 100))

  return {
    principalDeduction,
    interestDeduction,
    annualTaxSaving,
  }
}

/**
 * Prepayment savings calculation
 * Returns interest saved and years reduced if lump-sum prepayment made at given year
 */
export function calcPrepaymentSavings(
  originalPrincipal: number,
  annualRate: number,
  tenureYears: number,
  prepaymentAmount: number,
  prepaymentAtYear: number
): {
  interestSaved: number
  yearsSaved: number
  newTenureYears: number
} {
  const originalEMI = calcEMI(originalPrincipal, annualRate, tenureYears)
  const totalOriginalInterest = calcTotalInterest(originalEMI, originalPrincipal, tenureYears * 12)

  // Find outstanding balance at prepayment year
  const schedule = calcAmortizationYearly(originalPrincipal, annualRate, tenureYears)
  const rowAtYear = schedule.find(r => r.year === prepaymentAtYear)
  if (!rowAtYear) return { interestSaved: 0, yearsSaved: 0, newTenureYears: tenureYears }

  const remainingBalance = Math.max(0, rowAtYear.closingBalance - prepaymentAmount)
  const remainingTenure = tenureYears - prepaymentAtYear

  if (remainingBalance <= 0) {
    return { interestSaved: totalOriginalInterest, yearsSaved: remainingTenure, newTenureYears: prepaymentAtYear }
  }

  const newEMI = calcEMI(remainingBalance, annualRate, remainingTenure)
  const newTotalInterest = calcTotalInterest(newEMI, remainingBalance, remainingTenure * 12)

  // Original interest from this point onward
  const originalRemainingInterest = schedule
    .filter(r => r.year > prepaymentAtYear)
    .reduce((sum, r) => sum + r.interestPaid, 0)

  const interestSaved = Math.max(0, Math.round(originalRemainingInterest - newTotalInterest))

  // Approximate years saved (prepayment effectively reduces tenure)
  const monthlyRate = annualRate / 100 / 12
  let balance = remainingBalance
  let months = 0
  while (balance > 0 && months < remainingTenure * 12) {
    const interest = balance * monthlyRate
    balance -= (originalEMI - interest)
    months++
  }
  const newTenureFromNow = Math.ceil(months / 12)
  const yearsSaved = Math.max(0, remainingTenure - newTenureFromNow)

  return {
    interestSaved,
    yearsSaved,
    newTenureYears: prepaymentAtYear + newTenureFromNow,
  }
}
