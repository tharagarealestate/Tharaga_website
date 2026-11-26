import { BrandedMessage } from '@/components/brand/BrandedMessage'

export default function NotFound() {
  return (
    <BrandedMessage
      numeral="404"
      title="This address"
      italic="is not on our register."
      body="The page you were looking for has moved or never existed. Our current mandates are all in the portfolio."
    />
  )
}
