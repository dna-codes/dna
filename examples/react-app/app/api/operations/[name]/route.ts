import lendingDna from '../../../../../lending/operational.json'

type Rule = { operation: string; rule_type?: string; allow?: { role?: string }[] }

function checkPermitted(opName: string, roles: string[]): boolean {
  const rules = (lendingDna as any).rules as Rule[]
  const accessRules = rules.filter(r => r.operation === opName && r.rule_type === 'access' && Array.isArray(r.allow))
  if (accessRules.length === 0) return true
  return accessRules.some(rule => (rule.allow ?? []).some(entry => entry.role && roles.includes(entry.role)))
}

export async function POST(request: Request, { params }: { params: { name: string } }) {
  const { userId, roles, payload } = await request.json()
  const opName = params.name
  const permitted = checkPermitted(opName, roles)

  console.log('[server-audit]', { operation: opName, userId, permitted, roles, payload, timestamp: new Date().toISOString() })

  return Response.json({ permitted, message: permitted ? `${opName} accepted` : 'Forbidden' }, { status: permitted ? 200 : 403 })
}
