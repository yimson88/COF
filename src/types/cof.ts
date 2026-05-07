export type Role =
  | 'member'
  | 'super_admin'
  | 'admin'
  | 'general_coordinator'
  | 'secretary_general'
  | 'general_treasurer'
  | 'branch_coordinator'
  | 'branch_treasurer'

export type MemberStatus = 'active' | 'suspended' | 'dismissed'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed'
export type EventStatus = 'upcoming' | 'ongoing' | 'past'
export type EventType =
  | 'wedding'
  | 'member-funeral'
  | 'family-funeral'
  | 'charity'
  | 'community'
export type FeedType = 'photo' | 'video' | 'file' | 'update'
export type ContributionKind = 'ongoing' | 'late'

export interface Branch {
  id: string
  name: string
  location: string
  description: string
  meetingDay: string
  photo: string
  color: string
  highlights: string[]
  coordinatorName: string
  treasurerName: string
}

export interface ExecutiveProfile {
  id: string
  name: string
  portfolio: string
  bio: string
  avatar: string
  phone: string
}

export interface MemberProfile {
  id: string
  membershipCode: string
  name: string
  username: string
  role: Role
  title: string
  branchId: string
  phone: string
  email: string
  dateOfBirth: string
  placeOfBirth: string
  maritalStatus: MaritalStatus
  homeAddress: string
  profession: string
  joinedYear: number
  avatar: string
  coverPhoto: string
  status: MemberStatus
  approvalStatus: ApprovalStatus
  approvedBy: string | null
  approvedAt: string | null
  city: string
}

export interface AssociationEvent {
  id: string
  title: string
  type: EventType
  status: EventStatus
  date: string
  venue: string
  summary: string
  minContribution: number
  targetAmount: number
  raisedAmount: number
  expenditure: number
  hero: string
  branchScope: string
}

export interface EventImage {
  id: string
  eventId: string
  imageUrl: string
  sortOrder: number
  createdAt?: string | null
}

export interface Contribution {
  id: string
  eventId: string
  memberId: string
  branchId: string
  amount: number
  date: string
  kind: ContributionKind
}

export interface FeedPost {
  id: string
  authorId: string
  branchId: string
  type: FeedType
  content: string
  createdAt: string
  media: string
  attachments: string[]
  reactions: number
  comments: number
}

export interface Announcement {
  id: string
  title: string
  message: string
  audience: string
  createdAt: string
  authorId: string
  channel: 'website' | 'website+whatsapp'
}

export interface BootstrapPayload {
  branches: Branch[]
  executives: ExecutiveProfile[]
  members: MemberProfile[]
  events: AssociationEvent[]
  eventImages: EventImage[]
  contributions: Contribution[]
  posts: FeedPost[]
  announcements: Announcement[]
  database: {
    mode: 'mysql' | 'demo'
    message: string
  }
  setup: {
    required: boolean
  }
}

export interface PermissionSet {
  label: string
  viewReports: boolean
  manageEventFinance: boolean
  manageEventMedia: boolean
  manageBranches: boolean
  manageMembers: boolean
  suspendMembers: boolean
  dismissMembers: boolean
  announce: boolean
  printLists: boolean
  printCards: boolean
  enterContributions: boolean
  enterLateContributions: boolean
  approveRegistrations: boolean
}
