const BASE_URL = 'http://localhost:3000/api/drafts'

const adminTestId = '00000000-0000-0000-0000-000000000001' // Replace with real UUID
const nonAdminTestId = '00000000-0000-0000-0000-000000000002' // Replace with real UUID
let draftId: number

async function createDraft() {
  const res = await fetch(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminUserId: adminTestId,
      name: 'Test Draft',
      maxDrafters: 6,
      secPerRound: 45,
      numRounds: 4
    })
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Status ${res.status}`)
  }

  draftId = data.draft.id
}

async function joinDraft(userId: string) {
  const res = await fetch(`${BASE_URL}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, draftId })
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Status ${res.status}`)
  }
}

async function getDraftInfo() {
  const res = await fetch(`${BASE_URL}/${draftId}`)
  const data = await res.json()
  if (!res.ok) {
    console.error('❌ Fetch draft info failed:', data)
    throw new Error(`Status ${res.status}`)
  }
}

async function startDraft(userId: string) {
  const res = await fetch(`${BASE_URL}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, draftId })
  })
}

async function runTests() {
  try {
    await createDraft()
    await joinDraft(adminTestId)
    await joinDraft(nonAdminTestId)
    await getDraftInfo()
    await startDraft(nonAdminTestId) // Should fail
    await startDraft(adminTestId) // Should succeed
  } catch (err) {
    console.error('\n❌ Error during test run:', err)
  }
}

runTests()
