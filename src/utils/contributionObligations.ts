import type { AssociationEvent, Contribution, MemberProfile } from '../types/cof'

export interface MemberContributionObligation {
  eventId: string
  eventTitle: string
  eventDate: string
  eventType: AssociationEvent['type']
  branchScope: string
  expectedAmount: number
  paidAmount: number
  outstandingAmount: number
  isComplete: boolean
}

export function isEligibleForEvent(member: MemberProfile, event: AssociationEvent) {
  return event.branchScope === 'national' || event.branchScope === member.branchId
}

export function isTrackedMember(member: MemberProfile) {
  return member.approvalStatus === 'approved' && member.status === 'active'
}

export function getMemberContributionObligations(
  member: MemberProfile,
  events: AssociationEvent[],
  contributions: Contribution[],
) {
  return events
    .filter((event) => isEligibleForEvent(member, event))
    .map<MemberContributionObligation>((event) => {
      const paidAmount = contributions
        .filter((item) => item.memberId === member.id && item.eventId === event.id)
        .reduce((sum, item) => sum + item.amount, 0)

      const expectedAmount = event.minContribution
      const outstandingAmount = Math.max(expectedAmount - paidAmount, 0)

      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventType: event.type,
        branchScope: event.branchScope,
        expectedAmount,
        paidAmount,
        outstandingAmount,
        isComplete: outstandingAmount === 0,
      }
    })
    .sort((left, right) => new Date(right.eventDate).getTime() - new Date(left.eventDate).getTime())
}

export function getContributionDeskOutstanding(
  memberId: string,
  eventId: string,
  members: MemberProfile[],
  events: AssociationEvent[],
  contributions: Contribution[],
) {
  const member = members.find((item) => item.id === memberId)
  const event = events.find((item) => item.id === eventId)

  if (!member || !event) {
    return null
  }

  const obligation = getMemberContributionObligations(member, [event], contributions)[0]
  return obligation ?? null
}
