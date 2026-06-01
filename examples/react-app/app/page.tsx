import lendingDna from '@/lib/lending-operational.json'
import { LoanDashboard } from '@/components/LoanDashboard'
import type { OperationalDNA } from '@dna-codes/dna-core'

export default function Home() {
  return <LoanDashboard dna={lendingDna as unknown as OperationalDNA} />
}
