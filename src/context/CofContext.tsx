import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import type {
  ApprovalStatus,
  BootstrapPayload,
  ContributionKind,
  FeedType,
  MemberProfile,
} from '../types/cof'

interface CofContextValue extends BootstrapPayload {
  currentUser: MemberProfile | null
  loading: boolean
  login: (payload: { username: string; password: string }) => Promise<void>
  initializeAssociation: (payload: {
    branchName: string
    branchLocation: string
    branchDescription: string
    branchMeetingDay: string
    name: string
    username: string
    password: string
    phone: string
    email: string
    dateOfBirth: string
    placeOfBirth: string
    maritalStatus: MemberProfile['maritalStatus']
    homeAddress: string
    profession: string
  }) => Promise<void>
  registerMember: (payload: FormData) => Promise<string>
  logout: () => void
  refresh: () => Promise<void>
  addBranch: (payload: {
    name: string
    location: string
    description: string
    meetingDay: string
  }) => Promise<void>
  addMember: (payload: FormData) => Promise<void>
  editMember: (memberId: string, payload: FormData) => Promise<void>
  approveMember: (
    memberId: string,
    approvalStatus: ApprovalStatus,
    approvedBy: string,
  ) => Promise<void>
  updateOwnProfile: (memberId: string, payload: FormData) => Promise<void>
  updateMemberStatus: (memberId: string, status: MemberProfile['status']) => Promise<void>
  deleteMember: (memberId: string) => Promise<void>
  addContribution: (payload: {
    memberId: string
    eventId: string
    amount: number
    kind: ContributionKind
  }) => Promise<void>
  updateEventExpenditure: (eventId: string, expenditure: number) => Promise<void>
  uploadEventGallery: (eventId: string, payload: FormData) => Promise<void>
  deleteEventImage: (eventImageId: string) => Promise<void>
  addPost: (payload: { authorId: string; content: string; type: FeedType }) => Promise<void>
  addAnnouncement: (payload: {
    authorId: string
    title: string
    message: string
    audience: string
    channel: 'website' | 'website+whatsapp'
  }) => Promise<void>
}

const STORAGE_KEY = 'cof-auth-user-id'

const defaultPayload: BootstrapPayload = {
  branches: [],
  executives: [],
  members: [],
  events: [],
  eventImages: [],
  contributions: [],
  posts: [],
  announcements: [],
  database: {
    mode: 'demo',
    message: 'Loading...',
  },
  setup: {
    required: false,
  },
}

const CofContext = createContext<CofContextValue | undefined>(undefined)

async function request<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed.' }))
    throw new Error(error.message || 'Request failed.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function CofProvider({ children }: PropsWithChildren) {
  const [payload, setPayload] = useState<BootstrapPayload>(defaultPayload)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })

  const refresh = async () => {
    const next = await request<BootstrapPayload>('/api/bootstrap')
    setPayload(next)
  }

  useEffect(() => {
    refresh()
      .catch((error: Error) => {
        console.error(error.message)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    try {
      if (currentUserId) {
        window.localStorage.setItem(STORAGE_KEY, currentUserId)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      return
    }
  }, [currentUserId])

  const currentUser =
    payload.members.find(
      (member) =>
        member.id === currentUserId &&
        member.approvalStatus === 'approved' &&
        member.status === 'active',
    ) ?? null

  useEffect(() => {
    if (!loading && currentUserId && !currentUser) {
      setCurrentUserId(null)
    }
  }, [currentUser, currentUserId, loading])

  const login = async (credentials: { username: string; password: string }) => {
    const response = await request<{ member: MemberProfile }>('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    setCurrentUserId(response.member.id)
    await refresh()
  }

  const initializeAssociation = async (setupPayload: {
    branchName: string
    branchLocation: string
    branchDescription: string
    branchMeetingDay: string
    name: string
    username: string
    password: string
    phone: string
    email: string
    dateOfBirth: string
    placeOfBirth: string
    maritalStatus: MemberProfile['maritalStatus']
    homeAddress: string
    profession: string
  }) => {
    const response = await request<{ member: MemberProfile }>('/api/setup/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(setupPayload),
    })

    setCurrentUserId(response.member.id)
    await refresh()
  }

  const registerMember = async (formData: FormData) => {
    const response = await request<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: formData,
    })
    await refresh()
    return response.message
  }

  const logout = () => {
    setCurrentUserId(null)
  }

  const addBranch = async (branch: {
    name: string
    location: string
    description: string
    meetingDay: string
  }) => {
    await request('/api/branches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(branch),
    })
    await refresh()
  }

  const addMember = async (formData: FormData) => {
    await request('/api/members', {
      method: 'POST',
      body: formData,
    })
    await refresh()
  }

  const editMember = async (memberId: string, formData: FormData) => {
    await request(`/api/members/${memberId}`, {
      method: 'PUT',
      body: formData,
    })
    await refresh()
  }

  const approveMember = async (
    memberId: string,
    approvalStatus: ApprovalStatus,
    approvedBy: string,
  ) => {
    await request(`/api/members/${memberId}/approval`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approvalStatus, approvedBy }),
    })
    await refresh()
  }

  const updateMemberStatus = async (memberId: string, status: MemberProfile['status']) => {
    await request(`/api/members/${memberId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    await refresh()
  }

  const updateOwnProfile = async (memberId: string, formData: FormData) => {
    await request(`/api/members/${memberId}/profile`, {
      method: 'PATCH',
      body: formData,
    })
    await refresh()
  }

  const deleteMember = async (memberId: string) => {
    await request(`/api/members/${memberId}`, {
      method: 'DELETE',
    })
    await refresh()
  }

  const addContribution = async (contribution: {
    memberId: string
    eventId: string
    amount: number
    kind: ContributionKind
  }) => {
    await request('/api/contributions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contribution),
    })
    await refresh()
  }

  const addPost = async (post: { authorId: string; content: string; type: FeedType }) => {
    await request('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    })
    await refresh()
  }

  const updateEventExpenditure = async (eventId: string, expenditure: number) => {
    await request(`/api/events/${eventId}/finance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expenditure }),
    })
    await refresh()
  }

  const uploadEventGallery = async (eventId: string, formData: FormData) => {
    await request(`/api/events/${eventId}/images`, {
      method: 'POST',
      body: formData,
    })
    await refresh()
  }

  const deleteEventImage = async (eventImageId: string) => {
    await request(`/api/event-images/${eventImageId}`, {
      method: 'DELETE',
    })
    await refresh()
  }

  const addAnnouncement = async (announcement: {
    authorId: string
    title: string
    message: string
    audience: string
    channel: 'website' | 'website+whatsapp'
  }) => {
    await request('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(announcement),
    })
    await refresh()
  }

  return (
    <CofContext.Provider
      value={{
        ...payload,
        currentUser,
        loading,
        login,
        initializeAssociation,
        registerMember,
        logout,
        refresh,
        addBranch,
        addMember,
        editMember,
        approveMember,
        updateOwnProfile,
        updateMemberStatus,
        deleteMember,
        addContribution,
        updateEventExpenditure,
        uploadEventGallery,
        deleteEventImage,
        addPost,
        addAnnouncement,
      }}
    >
      {children}
    </CofContext.Provider>
  )
}

export function useCof() {
  const context = useContext(CofContext)
  if (!context) {
    throw new Error('useCof must be used within a CofProvider')
  }

  return context
}
