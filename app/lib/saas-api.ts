export async function getEntitlements(){
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/me/entitlements`, { cache: 'no-store', credentials: 'include' })
  if (!res.ok) throw new Error('entitlements')
  return res.json()
}

export async function submitProperty(input: any){
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/properties`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(input)
  })
  return res.json()
}

export async function postLead(input: any){
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/leads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(input)
  })
  return res.json()
}
