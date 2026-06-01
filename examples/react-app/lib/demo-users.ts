export type DemoUser = {
  id:    string
  name:  string
  roles: string[]
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'alice', name: 'Alice (Borrower)',    roles: ['Borrower']       },
  { id: 'bob',   name: 'Bob (Underwriter)',   roles: ['Underwriter']    },
  { id: 'carol', name: 'Carol (Manager)',     roles: ['LendingManager'] },
]
