export type PropertySpecs = {
  bedrooms?: number | null
  bathrooms?: number | null
  area_sqft?: number | null
  location?: string | null
}

export type RecommendationItem = {
  property_id: string
  title: string
  image_url: string
  specs: PropertySpecs
  reasons: string[]
  score: number
}

export type RecommendationResponse = {
  items: RecommendationItem[]
}

