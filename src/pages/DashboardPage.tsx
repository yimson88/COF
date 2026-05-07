import {
  AlertCircle,
  ArrowRight,
  BellRing,
  Building2,
  ChevronDown,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Images,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  PencilLine,
  Printer,
  ReceiptText,
  Save,
  Shield,
  Upload,
  UserPlus,
  Users2,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCof } from '../context/CofContext'
import { formatDate, formatMoney, roleLabels, rolePermissions } from '../data/config'
import {
  getContributionDeskOutstanding,
  getMemberContributionObligations,
  isTrackedMember,
} from '../utils/contributionObligations'

type AutoTableRunner = (doc: unknown, options: Record<string, unknown>) => void

async function loadPdfTools() {
  const [jspdfModule, autoTableModule] = await Promise.all([
    import('jspdf/dist/jspdf.umd.min.js'),
    import('jspdf-autotable'),
  ])
  const { jsPDF } = jspdfModule.default as { jsPDF: typeof import('jspdf').jsPDF }
  const autoTable =
    (autoTableModule as { default?: AutoTableRunner; autoTable?: AutoTableRunner }).default ??
    (autoTableModule as { default?: AutoTableRunner; autoTable?: AutoTableRunner }).autoTable

  if (!autoTable) {
    throw new Error('PDF table generator failed to load.')
  }

  return { jsPDF, autoTable }
}

function applyAutoTable(
  autoTable: AutoTableRunner,
  doc: unknown,
  options: Record<string, unknown>,
) {
  autoTable(doc, options)
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src)
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function createFadedImageDataUrl(src: string, alpha = 0.08) {
  const source = await imageToDataUrl(src)
  return await new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Unable to prepare watermark image.'))
        return
      }
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.globalAlpha = alpha
      context.drawImage(image, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = reject
    image.src = source
  })
}

type DashboardSectionId =
  | 'overview'
  | 'approvals'
  | 'reports'
  | 'compliance'
  | 'branches'
  | 'members'
  | 'announcements'
  | 'contributions'
  | 'exports'

const contributionKindLabels: Record<'ongoing' | 'late', string> = {
  ongoing: 'Ongoing contribution',
  late: 'Late contribution',
}

function humanizeCode(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function formatPdfMoney(value: number) {
  return `${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}

export function DashboardPage() {
  const {
    addAnnouncement,
    addBranch,
    addContribution,
    addMember,
    approveMember,
    announcements,
    branches,
    contributions,
    currentUser,
    database,
    deleteEventImage,
    deleteMember,
    editMember,
    eventImages,
    events,
    members,
    uploadEventGallery,
    updateEventExpenditure,
    updateMemberStatus,
  } = useCof()
  const [branchForm, setBranchForm] = useState({
    name: '',
    location: '',
    description: '',
    meetingDay: '',
  })
  const [memberForm, setMemberForm] = useState({
    name: '',
    username: '',
    password: '',
    branchId: currentUser?.branchId ?? '',
    role: 'member',
    title: 'Member',
    phone: '',
    email: '',
    dateOfBirth: '',
    placeOfBirth: '',
    maritalStatus: 'single',
    homeAddress: '',
    profession: '',
    city: '',
    photo: null as File | null,
  })
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    audience: 'All members',
    channel: 'website+whatsapp' as 'website' | 'website+whatsapp',
  })
  const [contributionForm, setContributionForm] = useState({
    memberId: '',
    eventId: '',
    amount: 10000,
    kind: 'ongoing' as 'ongoing' | 'late',
  })
  const [filters, setFilters] = useState({
    year: 'all',
    eventId: 'all',
    branchId: currentUser?.role.startsWith('branch_') ? currentUser.branchId : 'all',
    memberId: 'all',
  })
  const [selectedCardMemberId, setSelectedCardMemberId] = useState('')
  const [exportBranchFilter, setExportBranchFilter] = useState(
    currentUser?.role.startsWith('branch_') ? currentUser.branchId : 'all',
  )
  const [memberBranchFilter, setMemberBranchFilter] = useState(
    currentUser?.role.startsWith('branch_') ? currentUser.branchId : 'all',
  )
  const [contributionBranchFilter, setContributionBranchFilter] = useState(
    currentUser?.role.startsWith('branch_') ? currentUser.branchId : 'all',
  )
  const [memberSearch, setMemberSearch] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingMemberForm, setEditingMemberForm] = useState({
    name: '',
    username: '',
    branchId: '',
    role: 'member',
    title: 'Member',
    phone: '',
    email: '',
    dateOfBirth: '',
    placeOfBirth: '',
    maritalStatus: 'single',
    homeAddress: '',
    profession: '',
    city: '',
    photo: null as File | null,
  })
  const [complianceFilters, setComplianceFilters] = useState({
    year: 'all',
    branchId: currentUser?.role.startsWith('branch_') ? currentUser.branchId : 'all',
    memberId: 'all',
    search: '',
  })
  const [eventFinanceForm, setEventFinanceForm] = useState({
    eventId: '',
    expenditure: 0,
  })
  const [eventGalleryForm, setEventGalleryForm] = useState({
    eventId: '',
    files: [] as File[],
  })
  const [isComplianceTableOpen, setIsComplianceTableOpen] = useState(true)
  const [isMatrixTableOpen, setIsMatrixTableOpen] = useState(true)
  const [activeSectionId, setActiveSectionId] = useState<DashboardSectionId>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!memberForm.branchId && currentUser?.branchId) {
      setMemberForm((current) => ({ ...current, branchId: currentUser.branchId }))
    }
  }, [currentUser?.branchId, memberForm.branchId])

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  if (currentUser.role === 'member') {
    return <Navigate to="/portal" replace />
  }

  const user = currentUser
  const permissions = rolePermissions[user.role]
  const visibleMembers =
    user.role === 'branch_coordinator' || user.role === 'branch_treasurer'
      ? members.filter((member) => member.branchId === user.branchId)
      : members
  const visibleMemberRecords = visibleMembers.filter((member) => {
    const branchMatch = memberBranchFilter === 'all' || member.branchId === memberBranchFilter
    const search = memberSearch.trim().toLowerCase()
    const searchMatch =
      !search ||
      member.name.toLowerCase().includes(search) ||
      member.username.toLowerCase().includes(search) ||
      member.membershipCode.toLowerCase().includes(search)

    return branchMatch && searchMatch
  })
  const exportMembers = visibleMembers
    .filter((member) => exportBranchFilter === 'all' || member.branchId === exportBranchFilter)
    .sort((left, right) => {
      const branchDelta = getBranchName(left.branchId).localeCompare(getBranchName(right.branchId))
      if (branchDelta !== 0) {
        return branchDelta
      }
      return left.name.localeCompare(right.name)
    })

  const visibleContributions =
    user.role === 'branch_coordinator' || user.role === 'branch_treasurer'
      ? contributions.filter((item) => item.branchId === user.branchId)
      : contributions
  const contributionDeskMembers = visibleMembers.filter(
    (member) => contributionBranchFilter === 'all' || member.branchId === contributionBranchFilter,
  )

  const filterYears = Array.from(
    new Set(visibleContributions.map((item) => new Date(item.date).getFullYear().toString())),
  ).sort((a, b) => Number(b) - Number(a))

  const allEventsFilteredContributions = visibleContributions.filter((item) => {
    const yearMatch =
      filters.year === 'all' || new Date(item.date).getFullYear().toString() === filters.year
    const branchMatch = filters.branchId === 'all' || item.branchId === filters.branchId
    const memberMatch = filters.memberId === 'all' || item.memberId === filters.memberId
    return yearMatch && branchMatch && memberMatch
  })

  const filteredContributions = allEventsFilteredContributions.filter((item) => {
    const eventMatch = filters.eventId === 'all' || item.eventId === filters.eventId
    return eventMatch
  })
  const allEventsPdfContributions = allEventsFilteredContributions

  const branchChartData = branches.map((branch) => ({
    name: branch.name.replace(' Branch', ''),
    amount: visibleContributions
      .filter((item) => item.branchId === branch.id)
      .reduce((sum, item) => sum + item.amount, 0),
  }))
  const pendingApprovals = permissions.approveRegistrations
    ? members.filter((member) => member.approvalStatus === 'pending')
    : []
  const selectedContributionGap = getContributionDeskOutstanding(
    contributionForm.memberId,
    contributionForm.eventId,
    members,
    events,
    contributions,
  )
  const complianceRows = visibleMembers
    .filter(isTrackedMember)
    .flatMap((member) =>
      getMemberContributionObligations(member, events, contributions).map((item) => ({
        ...item,
        memberId: member.id,
        memberName: member.name,
        branchId: member.branchId,
        branchName: branches.find((branch) => branch.id === member.branchId)?.name ?? member.branchId,
      })),
    )
    .sort((left, right) => right.outstandingAmount - left.outstandingAmount)
  const complianceYears = Array.from(
    new Set(complianceRows.map((item) => new Date(item.eventDate).getFullYear().toString())),
  ).sort((a, b) => Number(b) - Number(a))
  const filteredComplianceRows = complianceRows.filter((item) => {
    const yearMatch =
      complianceFilters.year === 'all' ||
      new Date(item.eventDate).getFullYear().toString() === complianceFilters.year
    const branchMatch =
      complianceFilters.branchId === 'all' || item.branchId === complianceFilters.branchId
    const memberMatch =
      complianceFilters.memberId === 'all' || item.memberId === complianceFilters.memberId
    const search = complianceFilters.search.trim().toLowerCase()
    const searchMatch =
      !search ||
      item.memberName.toLowerCase().includes(search) ||
      item.eventTitle.toLowerCase().includes(search) ||
      item.branchName.toLowerCase().includes(search)

    return yearMatch && branchMatch && memberMatch && searchMatch
  })
  const filteredComplianceTotals = filteredComplianceRows.reduce(
    (sum, item) => ({
      expected: sum.expected + item.expectedAmount,
      paid: sum.paid + item.paidAmount,
      outstanding: sum.outstanding + item.outstandingAmount,
    }),
    { expected: 0, paid: 0, outstanding: 0 },
  )
  const complianceVisibleMembers = visibleMembers.filter(
    (member) =>
      complianceFilters.branchId === 'all' || member.branchId === complianceFilters.branchId,
  )
  const selectedReportEvent =
    filters.eventId === 'all' ? null : events.find((event) => event.id === filters.eventId) ?? null
  const filteredContributionTotal = filteredContributions.reduce((sum, item) => sum + item.amount, 0)
  const filteredContributionBranchCount = new Set(filteredContributions.map((item) => item.branchId)).size
  const filteredContributionMemberCount = new Set(filteredContributions.map((item) => item.memberId)).size
  const selectedReportEventTotal = selectedReportEvent
    ? filteredContributions
        .filter((item) => item.eventId === selectedReportEvent.id)
        .reduce((sum, item) => sum + item.amount, 0)
    : 0
  const selectedReportEventNet = selectedReportEvent
    ? selectedReportEventTotal - selectedReportEvent.expenditure
    : 0
  const selectedFinanceEvent = events.find((event) => event.id === eventFinanceForm.eventId) ?? null
  const selectedFinanceEventTotal = selectedFinanceEvent
    ? visibleContributions
        .filter((item) => item.eventId === selectedFinanceEvent.id)
        .reduce((sum, item) => sum + item.amount, 0)
    : 0
  const pastGalleryEvents = events
    .filter((event) => event.status === 'past')
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
  const selectedGalleryEvent =
    pastGalleryEvents.find((event) => event.id === eventGalleryForm.eventId) ?? pastGalleryEvents[0] ?? null
  const selectedGalleryImages = selectedGalleryEvent
    ? eventImages
        .filter((image) => image.eventId === selectedGalleryEvent.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
    : []
  const contributionMatrixEvents = Array.from(
    new Map(
      filteredComplianceRows.map((item) => [
        item.eventId,
        {
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          eventDate: item.eventDate,
        },
      ]),
    ).values(),
  ).sort((left, right) => new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime())
  const contributionMatrixRows = Array.from(
    new Map(
      filteredComplianceRows.map((item) => [
        item.memberId,
        {
          memberId: item.memberId,
          memberName: item.memberName,
          branchName: item.branchName,
        },
      ]),
    ).values(),
  )
    .map((member) => {
      const eventCells = contributionMatrixEvents.map((event) => {
        const row =
          filteredComplianceRows.find(
            (item) => item.memberId === member.memberId && item.eventId === event.eventId,
          ) ?? null

        return {
          ...event,
          paidAmount: row?.paidAmount ?? 0,
          expectedAmount: row?.expectedAmount ?? 0,
          contributed: (row?.paidAmount ?? 0) > 0,
        }
      })

      return {
        ...member,
        eventCells,
        contributedCount: eventCells.filter((item) => item.contributed).length,
        missedCount: eventCells.filter((item) => !item.contributed).length,
      }
    })
    .sort((left, right) => left.memberName.localeCompare(right.memberName))
  const totalTrackedContributions = visibleContributions.reduce((sum, item) => sum + item.amount, 0)
  const dashboardGroups = [
    {
      label: 'Overview',
      items: [
        {
          id: 'overview' as DashboardSectionId,
          label: 'Workspace',
          description: 'Summary and permissions',
          icon: LayoutDashboard,
          badge: `${branches.length}`,
          visible: true,
        },
        {
          id: 'approvals' as DashboardSectionId,
          label: 'Approvals',
          description: 'Review pending accounts',
          icon: Clock3,
          badge: pendingApprovals.length ? `${pendingApprovals.length}` : undefined,
          visible: permissions.approveRegistrations,
        },
      ],
    },
    {
      label: 'Reports',
      items: [
        {
          id: 'reports' as DashboardSectionId,
          label: 'Contribution Reports',
          description: 'Filter and export records',
          icon: ReceiptText,
          visible: permissions.viewReports,
        },
        {
          id: 'compliance' as DashboardSectionId,
          label: 'Compliance',
          description: 'Mandatory contribution status',
          icon: ListChecks,
          badge: filteredComplianceRows.length ? `${filteredComplianceRows.length}` : undefined,
          visible: permissions.viewReports,
        },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          id: 'members' as DashboardSectionId,
          label: 'Member Records',
          description: 'Create and manage members',
          icon: Users2,
          badge: `${visibleMemberRecords.length}`,
          visible: permissions.manageMembers,
        },
        {
          id: 'branches' as DashboardSectionId,
          label: 'Branches',
          description: 'Create and update branches',
          icon: Building2,
          badge: `${branches.length}`,
          visible: permissions.manageBranches,
        },
        {
          id: 'contributions' as DashboardSectionId,
          label: 'Contribution Desk',
          description: 'Record payments',
          icon: AlertCircle,
          visible: permissions.enterContributions,
        },
        {
          id: 'announcements' as DashboardSectionId,
          label: 'Announcements',
          description: 'Website and WhatsApp notices',
          icon: Megaphone,
          badge: announcements.length ? `${announcements.length}` : undefined,
          visible: permissions.announce,
        },
      ],
    },
    {
      label: 'Documents',
      items: [
        {
          id: 'exports' as DashboardSectionId,
          label: 'PDF Exports',
          description: 'Lists and membership cards',
          icon: FileText,
          visible: permissions.printLists || permissions.printCards,
        },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.visible),
    }))
    .filter((group) => group.items.length)
  const visibleSectionIds = dashboardGroups.flatMap((group) => group.items.map((item) => item.id))
  const activeSection =
    dashboardGroups.flatMap((group) => group.items).find((item) => item.id === activeSectionId) ??
    dashboardGroups[0]?.items[0]

  useEffect(() => {
    if (visibleSectionIds.length && !visibleSectionIds.includes(activeSectionId)) {
      setActiveSectionId(visibleSectionIds[0])
    }
  }, [activeSectionId, visibleSectionIds])

  useEffect(() => {
    if (
      contributionForm.memberId &&
      !contributionDeskMembers.some((member) => member.id === contributionForm.memberId)
    ) {
      setContributionForm((current) => ({ ...current, memberId: '' }))
    }
  }, [contributionDeskMembers, contributionForm.memberId])

  useEffect(() => {
    if (
      complianceFilters.memberId !== 'all' &&
      !complianceVisibleMembers.some((member) => member.id === complianceFilters.memberId)
    ) {
      setComplianceFilters((current) => ({ ...current, memberId: 'all' }))
    }
  }, [complianceFilters.memberId, complianceVisibleMembers])

  useEffect(() => {
    if (
      selectedCardMemberId &&
      !exportMembers.some((member) => member.id === selectedCardMemberId)
    ) {
      setSelectedCardMemberId('')
    }
  }, [exportMembers, selectedCardMemberId])

  useEffect(() => {
    if (!events.length) {
      return
    }

    const nextEvent = events.find((event) => event.id === eventFinanceForm.eventId) ?? events[0]
    setEventFinanceForm((current) =>
      current.eventId === nextEvent.id && current.expenditure === nextEvent.expenditure
        ? current
        : { eventId: nextEvent.id, expenditure: nextEvent.expenditure },
    )
  }, [eventFinanceForm.eventId, events])

  useEffect(() => {
    if (!pastGalleryEvents.length) {
      return
    }

    const nextEvent =
      pastGalleryEvents.find((event) => event.id === eventGalleryForm.eventId) ?? pastGalleryEvents[0]

    setEventGalleryForm((current) =>
      current.eventId === nextEvent.id ? current : { ...current, eventId: nextEvent.id, files: [] },
    )
  }, [eventGalleryForm.eventId, pastGalleryEvents])

  async function exportMembersPdf() {
    if (!exportMembers.length) {
      window.alert('No members match the current branch export filter.')
      return
    }

    const { doc, autoTable } = await createReportDoc(
      'Circle of Friends Members List',
      exportBranchFilter === 'all'
        ? 'Members grouped by branch'
        : `Members for ${getBranchName(exportBranchFilter)}`,
    )

    const branchGroups = branches
      .map((branch) => ({
        branch,
        members: exportMembers.filter((member) => member.branchId === branch.id),
      }))
      .filter((group) => group.members.length)

    let cursorY = 62
    branchGroups.forEach((group) => {
      if (cursorY > 250) {
        doc.addPage()
        cursorY = 20
      }

      doc.setFillColor(15, 65, 114)
      doc.roundedRect(14, cursorY, 182, 11, 4, 4, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.text(group.branch.name, 18, cursorY + 7)

      applyAutoTable(autoTable, doc, {
        startY: cursorY + 16,
        theme: 'striped',
        head: [['Membership ID', 'Full names', 'Username', 'Role', 'Phone', 'Email', 'Status']],
        body: group.members.map((member) => [
          member.membershipCode,
          member.name,
          member.username,
          roleLabels[member.role],
          member.phone,
          member.email,
          member.status,
        ]),
        styles: {
          fontSize: 8.2,
          cellPadding: 2.4,
          lineColor: [222, 232, 244],
          lineWidth: 0.1,
          textColor: [16, 36, 63],
        },
        headStyles: {
          fillColor: [237, 245, 255],
          textColor: [15, 65, 114],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [250, 252, 255],
        },
        margin: { left: 14, right: 14 },
      })

      cursorY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? cursorY + 22) + 10
    })

    addPdfPageNumbers(doc)
    doc.save('circle-of-friends-members.pdf')
  }

  function drawMembershipCardFront(
    doc: any,
    member: (typeof exportMembers)[number],
    x: number,
    y: number,
    width: number,
    height: number,
    assets: { logo?: string | null; watermark?: string | null; avatar?: string | null },
  ) {
    const branchName = getBranchName(member.branchId)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(x, y, width, height, 4, 4, 'F')
    doc.setDrawColor(15, 65, 114)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, width, height, 4, 4)
    doc.setFillColor(15, 65, 114)
    doc.roundedRect(x, y, width, 14, 4, 4, 'F')

    if (assets.watermark) {
      try {
        doc.addImage(assets.watermark, 'PNG', x + width - 30, y + 12, 24, 24)
      } catch {
        // ignore watermark failures
      }
    }

    if (assets.logo) {
      try {
        doc.addImage(assets.logo, 'PNG', x + 5, y + 3, 8, 8)
      } catch {
        // ignore logo failures
      }
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8.5)
    doc.text('Circle of Friends', x + 16, y + 6)
    doc.setFontSize(5.8)
    doc.text('Friends for Life', x + 16, y + 10)

    if (assets.avatar) {
      try {
        doc.addImage(assets.avatar, 'PNG', x + 5, y + 18, 17, 17)
      } catch {
        doc.setDrawColor(15, 65, 114)
        doc.rect(x + 5, y + 18, 17, 17)
      }
    } else {
      doc.setDrawColor(15, 65, 114)
      doc.rect(x + 5, y + 18, 17, 17)
    }

    doc.setTextColor(15, 65, 114)
    doc.setFontSize(9.5)
    doc.text(member.name, x + 25, y + 22, { maxWidth: width - 30 })
    doc.setFontSize(6.2)
    doc.setTextColor(90, 111, 137)
    doc.text(member.membershipCode, x + 25, y + 27)
    doc.text(branchName, x + 25, y + 31)
    doc.text(member.phone, x + 25, y + 35)
    doc.text(roleLabels[member.role], x + 25, y + 39)

    doc.setFillColor(237, 245, 255)
    doc.roundedRect(x + 4, y + height - 11, width - 8, 7, 2, 2, 'F')
    doc.setTextColor(15, 65, 114)
    doc.setFontSize(5.6)
    doc.text('Official membership card', x + 7, y + height - 6.5)
    doc.text(`Joined ${member.joinedYear}`, x + width - 7, y + height - 6.5, { align: 'right' })
  }

  function drawMembershipCardBack(
    doc: any,
    member: (typeof exportMembers)[number],
    x: number,
    y: number,
    width: number,
    height: number,
    assets: { logo?: string | null; watermark?: string | null },
  ) {
    doc.setFillColor(15, 65, 114)
    doc.roundedRect(x, y, width, height, 4, 4, 'F')

    if (assets.watermark) {
      try {
        doc.addImage(assets.watermark, 'PNG', x + width - 32, y + 10, 26, 26)
      } catch {
        // ignore watermark failures
      }
    }

    if (assets.logo) {
      try {
        doc.addImage(assets.logo, 'PNG', x + width - 15, y + 4, 10, 10)
      } catch {
        // ignore logo failures
      }
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8.3)
    doc.text('Circle of Friends', x + 6, y + 9)
    doc.setFontSize(6)
    doc.text('Friends for Life', x + 6, y + 13)
    doc.setFontSize(6.1)
    doc.text('This card certifies that the holder is a registered member', x + 6, y + 20, {
      maxWidth: width - 12,
    })
    doc.text(`Member: ${member.name}`, x + 6, y + 28, { maxWidth: width - 12 })
    doc.text(`Membership ID: ${member.membershipCode}`, x + 6, y + 33, { maxWidth: width - 12 })
    doc.text(`Branch: ${getBranchName(member.branchId)}`, x + 6, y + 38, { maxWidth: width - 12 })
    doc.text('If found, return to any Circle of Friends branch office.', x + 6, y + 45, {
      maxWidth: width - 12,
    })
    doc.setFontSize(5.2)
    doc.text('Authorized by the national executive and valid while membership remains active.', x + 6, y + 50, {
      maxWidth: width - 12,
    })
  }

  function getBranchName(branchId: string) {
    return branches.find((branch) => branch.id === branchId)?.name ?? humanizeCode(branchId)
  }

  function getContributionKindLabel(kind: 'ongoing' | 'late') {
    return contributionKindLabels[kind] ?? humanizeCode(kind)
  }

  function getEventScopeLabel(scope: string) {
    return scope === 'national' ? 'National' : getBranchName(scope)
  }

  function getEventBranchGroups(
    items: typeof filteredContributions,
    eventId: string,
    expenditure: number,
  ) {
    const event = events.find((item) => item.id === eventId)
    if (!event) {
      return null
    }

    const groups = branches
      .map((branch) => {
        const rows = items
          .filter((item) => item.eventId === eventId && item.branchId === branch.id)
          .map((item) => ({
            memberName:
              members.find((member) => member.id === item.memberId)?.name ?? 'Unknown member',
            membershipCode:
              members.find((member) => member.id === item.memberId)?.membershipCode ?? '--',
            amount: item.amount,
            kind: item.kind,
            date: item.date,
          }))
          .sort((left, right) => left.memberName.localeCompare(right.memberName))

        return {
          branchId: branch.id,
          branchName: getBranchName(branch.id),
          rows,
          total: rows.reduce((sum, row) => sum + row.amount, 0),
        }
      })
      .filter((group) => group.rows.length)

    const totalAmount = groups.reduce((sum, group) => sum + group.total, 0)

    return {
      event,
      groups,
      totalAmount,
      contributorCount: new Set(items.filter((item) => item.eventId === eventId).map((item) => item.memberId)).size,
      branchCount: groups.length,
      expenditure,
      netAmount: totalAmount - expenditure,
    }
  }

  async function createReportDoc(reportTitle: string, reportSubtitle: string) {
    const { jsPDF, autoTable } = await loadPdfTools()
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    doc.setFillColor(15, 65, 114)
    doc.rect(0, 0, 210, 34, 'F')

    try {
      const logo = await imageToDataUrl('/cof.png')
      doc.addImage(logo, 'PNG', 14, 7, 20, 20)
    } catch {
      doc.setFillColor(255, 255, 255)
      doc.circle(24, 17, 8, 'F')
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text('Circle of Friends', 40, 15)
    doc.setFontSize(9)
    doc.text('Friends for Life', 40, 21)
    doc.setFontSize(15)
    doc.text(reportTitle, 14, 42)
    doc.setTextColor(90, 111, 137)
    doc.setFontSize(10)
    doc.text(reportSubtitle, 14, 48)
    doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, 14, 53)

    return { doc, autoTable }
  }

  function fitTextToWidth(doc: any, value: string, maxWidth: number, startFontSize: number, minFontSize = 7.5) {
    let fontSize = startFontSize
    doc.setFontSize(fontSize)

    while (fontSize > minFontSize && doc.getTextWidth(value) > maxWidth) {
      fontSize -= 0.5
      doc.setFontSize(fontSize)
    }

    return fontSize
  }

  function drawSummaryCards(doc: any, startY: number, cards: { label: string; value: string }[]) {
    cards.forEach((card, index) => {
      const x = 14 + index * 46
      const cardWidth = 42
      const cardHeight = 20
      const valueWidth = cardWidth - 6

      doc.setFillColor(237, 245, 255)
      doc.roundedRect(x, startY, cardWidth, cardHeight, 4, 4, 'F')
      doc.setTextColor(90, 111, 137)
      doc.setFontSize(8)
      doc.text(card.label.toUpperCase(), x + 3, startY + 5.8)
      doc.setTextColor(15, 65, 114)
      const valueFontSize = fitTextToWidth(doc, card.value, valueWidth, 9.5)
      const lines = doc.splitTextToSize(card.value, valueWidth).slice(0, 2)
      const textY = lines.length > 1 ? startY + 10.8 : startY + 13
      doc.setFontSize(valueFontSize)
      doc.text(lines, x + 3, textY)
    })
  }

  function drawReportTotalsBlock(doc: any, startY: number, rows: { label: string; value: string }[]) {
    const blockHeight = 7 + rows.length * 6.4
    const leftX = 14
    const rightX = 190

    doc.setFillColor(15, 65, 114)
    doc.roundedRect(leftX, startY, 182, blockHeight, 5, 5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)

    rows.forEach((row, index) => {
      const y = startY + 7 + index * 6.4
      doc.text(row.label, leftX + 4, y)
      const valueFontSize = fitTextToWidth(doc, row.value, 54, 10, 8.5)
      doc.setFontSize(valueFontSize)
      doc.text(row.value, rightX, y, { align: 'right' })
      doc.setFontSize(10)
    })
  }

  function addPdfPageNumbers(doc: any) {
    const totalPages = doc.getNumberOfPages()
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page)
      doc.setDrawColor(225, 233, 245)
      doc.line(14, 286, 196, 286)
      doc.setTextColor(90, 111, 137)
      doc.setFontSize(9)
      doc.text('Circle of Friends financial report', 14, 291)
      doc.text(`Page ${page} of ${totalPages}`, 196, 291, { align: 'right' })
    }
  }

  async function exportSelectedEventContributionsPdf() {
    if (!selectedReportEvent) {
      window.alert('Select an event first to export the event contribution PDF.')
      return
    }

    const eventReport = getEventBranchGroups(
      allEventsFilteredContributions.filter((item) => item.eventId === selectedReportEvent.id),
      selectedReportEvent.id,
      selectedReportEvent.expenditure,
    )

    if (!eventReport || !eventReport.groups.length) {
      window.alert('No contributions found for the selected event and filters.')
      return
    }

    try {
      const { doc, autoTable } = await createReportDoc(
      'Event Contribution Report',
      `${eventReport.event.title} • grouped by branch`,
      )

      drawSummaryCards(doc, 58, [
        { label: 'Event date', value: formatDate(eventReport.event.date) },
        { label: 'Branches', value: `${eventReport.branchCount}` },
        { label: 'Contributors', value: `${eventReport.contributorCount}` },
        { label: 'Raised', value: formatPdfMoney(eventReport.totalAmount) },
      ])

      drawSummaryCards(doc, 79, [
        { label: 'Expenditure', value: formatPdfMoney(eventReport.expenditure) },
        { label: 'Net balance', value: formatPdfMoney(eventReport.netAmount) },
        { label: 'Minimum due', value: formatPdfMoney(eventReport.event.minContribution) },
        { label: 'Scope', value: getEventScopeLabel(eventReport.event.branchScope) },
      ])

      let cursorY = 104

      eventReport.groups.forEach((group) => {
        doc.setFillColor(22, 95, 166)
        doc.roundedRect(14, cursorY, 182, 10, 3, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(11)
        doc.text(group.branchName, 18, cursorY + 6.5)
        doc.text(formatPdfMoney(group.total), 192, cursorY + 6.5, { align: 'right' })

        applyAutoTable(autoTable, doc, {
          startY: cursorY + 14,
          theme: 'striped',
          head: [['Member', 'Membership ID', 'Kind', 'Date', 'Amount']],
          body: group.rows.map((row) => [
            row.memberName,
            row.membershipCode,
            getContributionKindLabel(row.kind),
            formatDate(row.date),
            formatPdfMoney(row.amount),
          ]),
          foot: [['', '', '', 'Branch total', formatPdfMoney(group.total)]],
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [222, 232, 244],
            lineWidth: 0.1,
            textColor: [16, 36, 63],
          },
          headStyles: {
            fillColor: [237, 245, 255],
            textColor: [15, 65, 114],
            fontStyle: 'bold',
          },
          footStyles: {
            fillColor: [22, 95, 166],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [250, 252, 255],
          },
          columnStyles: {
            4: { halign: 'right' },
          },
          margin: { left: 14, right: 14 },
          showHead: 'everyPage',
          showFoot: 'lastPage',
          pageBreak: 'avoid',
        })

        cursorY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? cursorY + 14) + 10
      })

      if (cursorY > 258) {
        doc.addPage()
        cursorY = 20
      }

      drawReportTotalsBlock(doc, cursorY, [
        { label: 'Grand total contributions', value: formatPdfMoney(eventReport.totalAmount) },
        { label: 'Total expenditure', value: formatPdfMoney(eventReport.expenditure) },
        { label: 'Net available balance', value: formatPdfMoney(eventReport.netAmount) },
      ])

      addPdfPageNumbers(doc)
      doc.save(`${selectedReportEvent.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-report.pdf`)
    } catch (error) {
      console.error(error)
      window.alert(error instanceof Error ? error.message : 'Unable to export the selected event PDF.')
    }
  }

  async function exportAllEventsGroupedPdf() {
    const eventSections = events
      .map((event) =>
        getEventBranchGroups(
          allEventsPdfContributions,
          event.id,
          event.expenditure,
        ),
      )
      .filter((section): section is NonNullable<typeof section> => Boolean(section && section.groups.length))

    if (!eventSections.length) {
      window.alert('No contributions found for the current report filters.')
      return
    }

    try {
      const { doc, autoTable } = await createReportDoc(
      'All Events Contribution Report',
      'Every event grouped by branch with contribution totals and net balances',
      )

      const grossTotal = eventSections.reduce((sum, section) => sum + section.totalAmount, 0)
      const expenditureTotal = eventSections.reduce((sum, section) => sum + section.expenditure, 0)
      const netTotal = grossTotal - expenditureTotal

      drawSummaryCards(doc, 58, [
        { label: 'Events', value: `${eventSections.length}` },
        { label: 'Branches', value: `${new Set(eventSections.flatMap((section) => section.groups.map((group) => group.branchId))).size}` },
        { label: 'Gross total', value: formatPdfMoney(grossTotal) },
        { label: 'Net balance', value: formatPdfMoney(netTotal) },
      ])

      let cursorY = 84

      eventSections.forEach((section, index) => {
        if (index > 0) {
          doc.addPage()
          cursorY = 20
        }

        doc.setFillColor(15, 65, 114)
        doc.roundedRect(14, cursorY, 182, 18, 5, 5, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.text(section.event.title, 18, cursorY + 7)
        doc.setFontSize(9)
        doc.text(`${formatDate(section.event.date)} • ${section.event.venue}`, 18, cursorY + 13)
        doc.text(`Expenditure: ${formatPdfMoney(section.expenditure)}`, 192, cursorY + 13, { align: 'right' })

        cursorY += 24

        section.groups.forEach((group) => {
          doc.setFillColor(237, 245, 255)
          doc.roundedRect(14, cursorY, 182, 9, 3, 3, 'F')
          doc.setTextColor(15, 65, 114)
          doc.setFontSize(10)
          doc.text(group.branchName, 18, cursorY + 6)
          doc.text(formatPdfMoney(group.total), 192, cursorY + 6, { align: 'right' })

          applyAutoTable(autoTable, doc, {
            startY: cursorY + 12,
            theme: 'striped',
            head: [['Member', 'Membership ID', 'Kind', 'Date', 'Amount']],
            body: group.rows.map((row) => [
              row.memberName,
              row.membershipCode,
              getContributionKindLabel(row.kind),
              formatDate(row.date),
              formatPdfMoney(row.amount),
            ]),
            foot: [['', '', '', 'Branch total', formatPdfMoney(group.total)]],
            styles: {
              fontSize: 8.5,
              cellPadding: 2.6,
              lineColor: [222, 232, 244],
              lineWidth: 0.1,
              textColor: [16, 36, 63],
            },
            headStyles: {
              fillColor: [245, 249, 255],
              textColor: [15, 65, 114],
              fontStyle: 'bold',
            },
            footStyles: {
              fillColor: [22, 95, 166],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [251, 253, 255],
            },
            columnStyles: {
              4: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
            showHead: 'everyPage',
            showFoot: 'lastPage',
            pageBreak: 'avoid',
          })

          cursorY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? cursorY + 12) + 8
        })

        if (cursorY > 272) {
          doc.addPage()
          cursorY = 20
        }

        doc.setFillColor(15, 65, 114)
        doc.roundedRect(14, cursorY, 182, 12, 4, 4, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.text(`Event total: ${formatPdfMoney(section.totalAmount)}`, 18, cursorY + 7)
        doc.text(`Net after expenditure: ${formatPdfMoney(section.netAmount)}`, 192, cursorY + 7, {
          align: 'right',
        })
      })

      addPdfPageNumbers(doc)
      doc.save('circle-of-friends-all-events-report.pdf')
    } catch (error) {
      console.error(error)
      window.alert(error instanceof Error ? error.message : 'Unable to export the all-events PDF.')
    }
  }

  async function exportMemberCardPdf() {
    const { jsPDF } = await loadPdfTools()
    const member = exportMembers.find((item) => item.id === selectedCardMemberId) ?? exportMembers[0]
    if (!member) {
      return
    }

    const logo = await imageToDataUrl('/cof.png').catch(() => null)
    const watermark = await createFadedImageDataUrl('/cof.png', 0.08).catch(() => null)
    const avatar = await imageToDataUrl(member.avatar).catch(() => null)

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [86, 54],
    })

    drawMembershipCardFront(doc, member, 0, 0, 86, 54, {
      logo,
      watermark,
      avatar,
    })
    doc.addPage([86, 54], 'landscape')
    drawMembershipCardBack(doc, member, 0, 0, 86, 54, {
      logo,
      watermark,
    })
    doc.save(`${member.name.replace(/\s+/g, '-').toLowerCase()}-card.pdf`)
  }

  async function exportMembershipCardsSheetPdf() {
    if (!exportMembers.length) {
      window.alert('No members match the current branch export filter.')
      return
    }

    const { jsPDF } = await loadPdfTools()
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const logo = await imageToDataUrl('/cof.png').catch(() => null)
    const watermark = await createFadedImageDataUrl('/cof.png', 0.08).catch(() => null)
    const cardWidth = 86
    const cardHeight = 54
    const columns = 2
    const rows = 4
    const marginX = 16
    const marginY = 20
    const gapX = 6
    const gapY = 8
    const perPage = columns * rows

    const chunks = Array.from({ length: Math.ceil(exportMembers.length / perPage) }, (_, index) =>
      exportMembers.slice(index * perPage, (index + 1) * perPage),
    )

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const membersChunk = chunks[chunkIndex]
      if (chunkIndex > 0) {
        doc.addPage('a4', 'portrait')
      }

      doc.setTextColor(15, 65, 114)
      doc.setFontSize(16)
      doc.text('Circle of Friends Membership Cards', 16, 12)
      doc.setFontSize(8)
      doc.setTextColor(90, 111, 137)
      doc.text(
        exportBranchFilter === 'all'
          ? 'Front side · all visible branches'
          : `Front side · ${getBranchName(exportBranchFilter)}`,
        16,
        17,
      )

      const frontAssets = await Promise.all(
        membersChunk.map(async (member) => ({
          member,
          avatar: await imageToDataUrl(member.avatar).catch(() => null),
        })),
      )

      frontAssets.forEach(({ member, avatar }, index) => {
        const column = index % columns
        const row = Math.floor(index / columns)
        const x = marginX + column * (cardWidth + gapX)
        const y = marginY + row * (cardHeight + gapY)
        drawMembershipCardFront(doc, member, x, y, cardWidth, cardHeight, {
          logo,
          watermark,
          avatar,
        })
      })

      doc.addPage('a4', 'portrait')
      doc.setTextColor(15, 65, 114)
      doc.setFontSize(16)
      doc.text('Circle of Friends Membership Cards', 16, 12)
      doc.setFontSize(8)
      doc.setTextColor(90, 111, 137)
      doc.text(
        exportBranchFilter === 'all'
          ? 'Back side · print duplex on A4'
          : `Back side · ${getBranchName(exportBranchFilter)}`,
        16,
        17,
      )

      membersChunk.forEach((member, index) => {
        const column = index % columns
        const row = Math.floor(index / columns)
        const x = marginX + column * (cardWidth + gapX)
        const y = marginY + row * (cardHeight + gapY)
        drawMembershipCardBack(doc, member, x, y, cardWidth, cardHeight, {
          logo,
          watermark,
        })
      })
    }

    doc.save(
      exportBranchFilter === 'all'
        ? 'circle-of-friends-membership-cards-a4.pdf'
        : `${getBranchName(exportBranchFilter).replace(/\s+/g, '-').toLowerCase()}-membership-cards-a4.pdf`,
    )
  }

  async function exportComplianceViewPdf() {
    if (!filteredComplianceRows.length) {
      window.alert('No compliance rows match the current filters.')
      return
    }

    try {
      const { doc, autoTable } = await createReportDoc(
        'Mandatory Contribution Compliance',
        'Filtered compliance view by member, branch, and event',
      )

      drawSummaryCards(doc, 58, [
        { label: 'Rows', value: `${filteredComplianceRows.length}` },
        { label: 'Expected', value: formatPdfMoney(filteredComplianceTotals.expected) },
        { label: 'Paid', value: formatPdfMoney(filteredComplianceTotals.paid) },
        { label: 'Outstanding', value: formatPdfMoney(filteredComplianceTotals.outstanding) },
      ])

      applyAutoTable(autoTable, doc, {
        startY: 84,
        theme: 'striped',
        head: [['Member', 'Branch', 'Event', 'Expected', 'Paid', 'Balance']],
        body: filteredComplianceRows.map((item) => [
          item.memberName,
          item.branchName,
          item.eventTitle,
          formatPdfMoney(item.expectedAmount),
          formatPdfMoney(item.paidAmount),
          formatPdfMoney(item.outstandingAmount),
        ]),
        styles: {
          fontSize: 8.5,
          cellPadding: 2.8,
          lineColor: [222, 232, 244],
          lineWidth: 0.1,
          textColor: [16, 36, 63],
        },
        headStyles: {
          fillColor: [237, 245, 255],
          textColor: [15, 65, 114],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [250, 252, 255],
        },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      })

      addPdfPageNumbers(doc)
      doc.save('mandatory-contribution-compliance.pdf')
    } catch (error) {
      console.error(error)
      window.alert(error instanceof Error ? error.message : 'Unable to export the compliance view PDF.')
    }
  }

  async function exportContributionMatrixPdf() {
    if (!contributionMatrixRows.length || !contributionMatrixEvents.length) {
      window.alert('No contribution matrix rows match the current filters.')
      return
    }

    try {
      const { jsPDF, autoTable } = await loadPdfTools()
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      doc.setFillColor(15, 65, 114)
      doc.rect(0, 0, 297, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text('Circle of Friends', 14, 14)
      doc.setFontSize(10)
      doc.text('Contribution Matrix', 14, 21)
      doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, 283, 21, { align: 'right' })

      applyAutoTable(autoTable, doc, {
        startY: 34,
        theme: 'striped',
        head: [[
          'Member',
          'Branch',
          ...contributionMatrixEvents.map((event) => event.eventTitle),
          'Made',
          'Missed',
        ]],
        body: contributionMatrixRows.map((member) => [
          member.memberName,
          member.branchName,
          ...member.eventCells.map((cell) => (cell.contributed ? 'YES' : 'NO')),
          `${member.contributedCount}`,
          `${member.missedCount}`,
        ]),
        didParseCell(data: any) {
          const eventColumnStart = 2
          const eventColumnEnd = eventColumnStart + contributionMatrixEvents.length - 1
          if (data.section === 'body' && data.column.index >= eventColumnStart && data.column.index <= eventColumnEnd) {
            const value = String(data.cell.raw ?? '').toUpperCase()
            if (value === 'YES') {
              data.cell.styles.textColor = [22, 163, 74]
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.fillColor = [220, 252, 231]
            } else if (value === 'NO') {
              data.cell.styles.textColor = [220, 38, 38]
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.fillColor = [254, 226, 226]
            }
          }
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.8,
          overflow: 'linebreak',
          lineColor: [222, 232, 244],
          lineWidth: 0.1,
          textColor: [16, 36, 63],
        },
        headStyles: {
          fillColor: [237, 245, 255],
          textColor: [15, 65, 114],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [250, 252, 255],
        },
        margin: { left: 10, right: 10 },
      })

      const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 40
      let cursorY = finalY + 8
      doc.setTextColor(15, 65, 114)
      doc.setFontSize(9)
      doc.text('Legend', 10, cursorY)
      cursorY += 5
      contributionMatrixEvents.forEach((event, index) => {
        if (cursorY > 190) {
          doc.addPage()
          cursorY = 16
        }
        doc.setTextColor(90, 111, 137)
        doc.text(`${index + 1}. ${event.eventTitle} (${formatDate(event.eventDate)})`, 10, cursorY)
        cursorY += 5
      })

      const totalPages = doc.getNumberOfPages()
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page)
        doc.setDrawColor(225, 233, 245)
        doc.line(10, 205, 287, 205)
        doc.setTextColor(90, 111, 137)
        doc.setFontSize(9)
        doc.text('Circle of Friends contribution matrix', 10, 210)
        doc.text(`Page ${page} of ${totalPages}`, 287, 210, { align: 'right' })
      }

      doc.save('contribution-matrix.pdf')
    } catch (error) {
      console.error(error)
      window.alert(error instanceof Error ? error.message : 'Unable to export the contribution matrix PDF.')
    }
  }

  function startEditingMember(memberId: string) {
    const member = members.find((item) => item.id === memberId)
    if (!member) {
      return
    }

    setEditingMemberId(member.id)
    setEditingMemberForm({
      name: member.name,
      username: member.username,
      branchId: member.branchId,
      role: member.role,
      title: member.title,
      phone: member.phone,
      email: member.email,
      dateOfBirth: member.dateOfBirth,
      placeOfBirth: member.placeOfBirth,
      maritalStatus: member.maritalStatus,
      homeAddress: member.homeAddress,
      profession: member.profession,
      city: member.city,
      photo: null,
    })
  }

  async function handleEventGalleryUpload() {
    if (!selectedGalleryEvent || !eventGalleryForm.files.length) {
      window.alert('Select a past event and one or more images first.')
      return
    }

    const formData = new FormData()
    eventGalleryForm.files.forEach((file) => {
      formData.append('images', file)
    })

    await uploadEventGallery(selectedGalleryEvent.id, formData)
    setEventGalleryForm((current) => ({ ...current, files: [] }))
  }

  async function handleEventImageDelete(eventImageId: string) {
    await deleteEventImage(eventImageId)
  }

  function handleSectionClick(sectionId: DashboardSectionId) {
    setActiveSectionId(sectionId)
    setSidebarOpen(false)
  }

  return (
    <div className="space-y-12 pb-8 pt-10 sm:pt-14">
      <section className="section-shell panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">
              <Shield size={14} />
              Role-based Dashboard
            </span>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-cof-deep sm:text-5xl">
              {roleLabels[user.role]} workspace
            </h1>
            <p className="max-w-3xl text-base leading-8 text-cof-slate sm:text-lg">
              Manage reports, branches, contributions, announcements, member records, and PDF
              exports according to your assigned office.
            </p>
          </div>
          <div className="rounded-3xl border border-cof-blue/12 bg-cof-pale px-5 py-4 text-sm text-cof-slate">
            <p className="font-semibold text-cof-deep">{permissions.label}</p>
            <p className="mt-1">Database mode: {database.mode === 'mysql' ? 'MySQL Live' : 'Demo fallback'}</p>
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Branches</p>
          <p className="mt-3 text-3xl font-semibold text-cof-deep">{branches.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Members</p>
          <p className="mt-3 text-3xl font-semibold text-cof-deep">{visibleMembers.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Tracked Contributions</p>
          <p className="mt-3 text-3xl font-semibold text-cof-deep">{formatMoney(totalTrackedContributions)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Pending Approvals</p>
          <p className="mt-3 text-3xl font-semibold text-cof-deep">{pendingApprovals.length}</p>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className={`fixed left-4 top-24 z-40 inline-flex items-center gap-2 rounded-full bg-cof-blue px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(22,95,166,0.28)] transition duration-300 hover:-translate-y-0.5 hover:bg-cof-deep ${
          sidebarOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <Menu size={16} />
        Sections
      </button>

      <div
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-cof-deep/30 backdrop-blur-[2px] transition duration-300 ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[320px] max-w-[88vw] overflow-y-auto border-r border-cof-blue/10 bg-white/96 px-4 pb-6 pt-24 shadow-[0_26px_80px_rgba(15,65,114,0.18)] backdrop-blur transition duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3 rounded-[28px] bg-[linear-gradient(135deg,rgba(22,95,166,0.14),rgba(15,65,114,0.04))] p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cof-blue">Dashboard navigation</p>
            <p className="mt-2 font-display text-2xl font-semibold text-cof-deep">Move by section</p>
            <p className="mt-2 text-sm leading-7 text-cof-slate">
              Open one workspace at a time instead of scrolling through every tool.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cof-blue/10 bg-white text-cof-deep transition hover:bg-cof-pale"
            aria-label="Close dashboard navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {dashboardGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-xs uppercase tracking-[0.22em] text-cof-slate">{group.label}</p>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.id === activeSection?.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSectionClick(item.id)}
                      className={`group flex w-full items-center justify-between rounded-[24px] border px-4 py-3 text-left transition duration-300 ${
                        isActive
                          ? 'border-cof-blue/20 bg-cof-blue text-white shadow-[0_16px_36px_rgba(22,95,166,0.24)]'
                          : 'border-transparent bg-cof-pale text-cof-deep hover:-translate-y-0.5 hover:border-cof-blue/12 hover:bg-white hover:shadow-[0_14px_32px_rgba(15,65,114,0.08)]'
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`mt-0.5 rounded-2xl p-2 ${
                            isActive ? 'bg-white/14 text-white' : 'bg-white text-cof-blue'
                          }`}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">{item.label}</span>
                          <span
                            className={`mt-1 block text-xs ${
                              isActive ? 'text-white/80' : 'text-cof-slate'
                            }`}
                          >
                            {item.description}
                          </span>
                        </span>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        {item.badge ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isActive ? 'bg-white/14 text-white' : 'bg-white text-cof-blue'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                        <ArrowRight
                          size={14}
                          className={`transition duration-300 ${
                            isActive
                              ? 'translate-x-0 text-white'
                              : 'text-cof-slate group-hover:translate-x-0.5'
                          }`}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="section-shell space-y-6">
        <div className="space-y-6">
          <div className="panel overflow-hidden p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cof-blue">{activeSection?.label}</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-cof-deep">
                  {activeSection?.description}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-cof-slate">
                  Access the dashboard in focused sections. This keeps the workspace shorter, cleaner,
                  and faster to navigate on both desktop and mobile.
                </p>
              </div>
              <div className="rounded-[24px] bg-cof-pale px-4 py-3 text-sm text-cof-slate">
                <span className="font-semibold text-cof-deep">{roleLabels[user.role]}</span> active
                view
              </div>
            </div>
          </div>

      {activeSectionId === 'overview' ? (
      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="panel p-6">
          <p className="font-display text-xl font-semibold text-cof-deep">Contribution overview by branch</p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
                <Bar dataKey="amount" fill="#165fa6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-6">
          <p className="font-display text-xl font-semibold text-cof-deep">Active permissions</p>
          <div className="mt-5 space-y-3 text-sm text-cof-slate">
            {Object.entries(permissions)
              .filter(([key, value]) => key !== 'label' && value)
              .map(([key]) => (
                <div key={key} className="rounded-2xl bg-cof-pale px-4 py-3 font-medium text-cof-deep">
                  {key}
                </div>
              ))}
          </div>
        </div>
      </section>
      ) : null}

      {activeSectionId === 'approvals' && permissions.approveRegistrations ? (
        <section className="panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold text-cof-deep">
                <Clock3 size={20} className="mr-2 inline-block text-cof-blue" />
                Pending account approvals
              </p>
              <p className="mt-2 text-sm text-cof-slate">
                Self-registered members must be confirmed before they can log in.
              </p>
            </div>
            <div className="rounded-2xl bg-cof-pale px-4 py-3 text-sm font-semibold text-cof-deep">
              {pendingApprovals.length} awaiting review
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {pendingApprovals.length ? (
              pendingApprovals.map((member) => (
                <div key={member.id} className="rounded-2xl border border-cof-blue/10 bg-white p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} alt={member.name} className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-cof-deep">{member.name}</p>
                        <p className="text-sm text-cof-slate">
                          @{member.username} • {branches.find((branch) => branch.id === member.branchId)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => approveMember(member.id, 'approved', user.name)}
                        className="btn-primary px-4 py-2 text-xs"
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => approveMember(member.id, 'rejected', user.name)}
                        className="btn-secondary px-4 py-2 text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-cof-pale px-4 py-4 text-sm text-cof-slate">
                No pending registrations at the moment.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeSectionId === 'reports' && permissions.viewReports ? (
        <section className="panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold text-cof-deep">Reports Centre</p>
              <p className="mt-2 text-sm text-cof-slate">
                Generate polished contribution PDFs grouped by branch, with event expenditure and net balances.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={exportSelectedEventContributionsPdf}
                disabled={!selectedReportEvent}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText size={16} />
                Export Selected Event PDF
              </button>
              <button type="button" onClick={exportAllEventsGroupedPdf} className="btn-secondary">
                <FileText size={16} />
                Export All Events PDF
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <select className="field" value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}>
              <option value="all">All years</option>
              {filterYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select className="field" value={filters.eventId} onChange={(event) => setFilters((current) => ({ ...current, eventId: event.target.value }))}>
              <option value="all">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <select className="field" value={filters.branchId} onChange={(event) => setFilters((current) => ({ ...current, branchId: event.target.value }))}>
              <option value="all">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <select className="field" value={filters.memberId} onChange={(event) => setFilters((current) => ({ ...current, memberId: event.target.value }))}>
              <option value="all">All members</option>
              {visibleMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] bg-cof-pale p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Rows in report</p>
              <p className="mt-3 text-2xl font-semibold text-cof-deep">{filteredContributions.length}</p>
            </div>
            <div className="rounded-[24px] bg-cof-pale p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Branches represented</p>
              <p className="mt-3 text-2xl font-semibold text-cof-deep">{filteredContributionBranchCount}</p>
            </div>
            <div className="rounded-[24px] bg-cof-pale p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Contributors</p>
              <p className="mt-3 text-2xl font-semibold text-cof-deep">{filteredContributionMemberCount}</p>
            </div>
            <div className="rounded-[24px] bg-cof-pale p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">
                {selectedReportEvent ? 'Event net balance' : 'Filtered gross total'}
              </p>
              <p className="mt-3 text-2xl font-semibold text-cof-deep">
                {formatMoney(selectedReportEvent ? selectedReportEventNet : filteredContributionTotal)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-[28px] border border-cof-blue/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,65,114,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-semibold text-cof-deep">Selected event finance</p>
                  <p className="mt-2 text-sm text-cof-slate">
                    Choose a single event to export its branch-grouped report and manage expenditure.
                  </p>
                </div>
                <img src="/logo/logo1.png" alt="Circle of Friends mark" className="h-14 w-14 rounded-2xl object-cover" />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select
                  className="field"
                  value={eventFinanceForm.eventId}
                  onChange={(event) =>
                    setEventFinanceForm((current) => ({
                      ...current,
                      eventId: event.target.value,
                    }))
                  }
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
                <input
                  className="field"
                  type="number"
                  min="0"
                  step="500"
                  value={eventFinanceForm.expenditure}
                  onChange={(event) =>
                    setEventFinanceForm((current) => ({
                      ...current,
                      expenditure: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-cof-pale p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-cof-slate">Raised</p>
                  <p className="mt-2 font-semibold text-cof-deep">{formatMoney(selectedFinanceEventTotal)}</p>
                </div>
                <div className="rounded-2xl bg-cof-pale p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-cof-slate">Expenditure</p>
                  <p className="mt-2 font-semibold text-cof-deep">{formatMoney(eventFinanceForm.expenditure)}</p>
                </div>
                <div className="rounded-2xl bg-cof-pale p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-cof-slate">Net available</p>
                  <p className="mt-2 font-semibold text-cof-deep">
                    {formatMoney(selectedFinanceEventTotal - eventFinanceForm.expenditure)}
                  </p>
                </div>
              </div>

              {permissions.manageEventFinance ? (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => updateEventExpenditure(eventFinanceForm.eventId, eventFinanceForm.expenditure)}
                    className="btn-primary"
                  >
                    <Save size={16} />
                    Save expenditure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const event = events.find((item) => item.id === eventFinanceForm.eventId)
                      if (!event) {
                        return
                      }
                      setEventFinanceForm({ eventId: event.id, expenditure: event.expenditure })
                    }}
                    className="btn-secondary"
                  >
                    Reset amount
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-cof-pale px-4 py-3 text-sm text-cof-slate">
                  Expenditure editing is reserved for super admin, admin, and authorized national executive roles.
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-cof-blue/10 bg-white shadow-[0_18px_50px_rgba(15,65,114,0.06)]">
              <img
                src="/home/standing-together.jpg"
                alt="Circle of Friends community support"
                className="h-full min-h-[320px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,65,114,0.18),rgba(15,65,114,0.84))]" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-white/75">PDF organization</p>
                <p className="mt-2 font-display text-2xl font-semibold">
                  Clean event reports with branch subtotals
                </p>
                <p className="mt-3 max-w-md text-sm leading-7 text-white/80">
                  The new exports use one clear header row, branch sections, branch subtotals, event totals,
                  expenditure, and net balances so the reports are easier to print and present.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-cof-blue/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,65,114,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-display text-xl font-semibold text-cof-deep">Past event gallery manager</p>
                <p className="mt-2 text-sm text-cof-slate">
                  Upload and manage gallery images for past events. These images now feed the public Events page directly from MySQL.
                </p>
              </div>
              <div className="rounded-2xl bg-cof-pale px-4 py-3 text-sm text-cof-slate">
                {selectedGalleryImages.length} image{selectedGalleryImages.length === 1 ? '' : 's'} in selected gallery
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr,1.25fr,auto] xl:items-end">
              <label className="space-y-2 text-sm font-semibold text-cof-slate">
                <span>Past event</span>
                <select
                  className="field"
                  value={selectedGalleryEvent?.id ?? ''}
                  onChange={(event) =>
                    setEventGalleryForm((current) => ({
                      ...current,
                      eventId: event.target.value,
                      files: [],
                    }))
                  }
                >
                  {pastGalleryEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-semibold text-cof-slate">
                <span>Gallery images</span>
                <span className="field flex min-h-[52px] items-center gap-3">
                  <Upload size={16} className="text-cof-blue" />
                  <span className="truncate text-sm text-cof-slate">
                    {eventGalleryForm.files.length
                      ? `${eventGalleryForm.files.length} image${eventGalleryForm.files.length === 1 ? '' : 's'} selected`
                      : 'Upload one or more past-event images'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) =>
                      setEventGalleryForm((current) => ({
                        ...current,
                        files: Array.from(event.target.files ?? []),
                      }))
                    }
                  />
                </span>
              </label>

              {permissions.manageEventMedia ? (
                <button
                  type="button"
                  onClick={handleEventGalleryUpload}
                  className="btn-primary xl:mb-[1px]"
                  disabled={!selectedGalleryEvent || !eventGalleryForm.files.length}
                >
                  <Images size={16} />
                  Upload gallery
                </button>
              ) : null}
            </div>

            {!permissions.manageEventMedia ? (
              <div className="mt-5 rounded-2xl bg-cof-pale px-4 py-3 text-sm text-cof-slate">
                Gallery uploads are reserved for super admin, admin, and authorized national executive roles.
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {selectedGalleryImages.length ? (
                selectedGalleryImages.map((image) => (
                  <div
                    key={image.id}
                    className="group overflow-hidden rounded-[24px] border border-cof-blue/10 bg-cof-mist/60 shadow-[0_14px_36px_rgba(15,65,114,0.06)]"
                  >
                    <div className="relative">
                      <img
                        src={image.imageUrl}
                        alt={selectedGalleryEvent ? `${selectedGalleryEvent.title} gallery` : 'Event gallery'}
                        className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      {permissions.manageEventMedia ? (
                        <button
                          type="button"
                          onClick={() => handleEventImageDelete(image.id)}
                          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-cof-deep shadow-lg transition hover:bg-white"
                          aria-label="Delete gallery image"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                    <div className="p-4 text-sm text-cof-slate">
                      <p className="font-semibold text-cof-deep">Image {image.sortOrder}</p>
                      <p className="mt-2 truncate">{image.imageUrl.split('/').pop()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-cof-blue/16 bg-cof-pale px-5 py-8 text-sm text-cof-slate sm:col-span-2 xl:col-span-4">
                  No gallery images yet for this past event. Upload images here and they will appear in the public event gallery.
                </div>
              )}
            </div>
          </div>

          <div className="table-shell mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-cof-pale text-cof-deep">
                <tr>
                  <th className="px-4 py-4 font-semibold">Date</th>
                  <th className="px-4 py-4 font-semibold">Member</th>
                  <th className="px-4 py-4 font-semibold">Event</th>
                  <th className="px-4 py-4 font-semibold">Branch</th>
                  <th className="px-4 py-4 font-semibold">Kind</th>
                  <th className="px-4 py-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredContributions.map((item) => (
                  <tr key={item.id} className="border-t border-cof-blue/8 text-cof-slate">
                    <td className="px-4 py-4">{formatDate(item.date)}</td>
                    <td className="px-4 py-4">{members.find((member) => member.id === item.memberId)?.name}</td>
                    <td className="px-4 py-4">{events.find((event) => event.id === item.eventId)?.title}</td>
                    <td className="px-4 py-4">{branches.find((branch) => branch.id === item.branchId)?.name}</td>
                    <td className="px-4 py-4">{getContributionKindLabel(item.kind)}</td>
                    <td className="px-4 py-4 font-semibold text-cof-deep">{formatMoney(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-cof-deep text-white">
                <tr>
                  <td className="px-4 py-4 font-semibold" colSpan={5}>
                    Filtered contribution total
                  </td>
                  <td className="px-4 py-4 text-right font-semibold">{formatMoney(filteredContributionTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : null}

      {activeSectionId === 'compliance' && permissions.viewReports ? (
        <section className="panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold text-cof-deep">Mandatory contribution compliance</p>
              <p className="mt-2 text-sm text-cof-slate">
                Every eligible approved member is expected to meet each event&apos;s minimum contribution.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-cof-pale px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Expected</p>
                <p className="mt-2 font-semibold text-cof-deep">{formatMoney(filteredComplianceTotals.expected)}</p>
              </div>
              <div className="rounded-2xl bg-cof-pale px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Paid</p>
                <p className="mt-2 font-semibold text-cof-deep">{formatMoney(filteredComplianceTotals.paid)}</p>
              </div>
              <div className="rounded-2xl bg-cof-pale px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Outstanding</p>
                <p className="mt-2 font-semibold text-cof-deep">{formatMoney(filteredComplianceTotals.outstanding)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <select
              className="field"
              value={complianceFilters.year}
              onChange={(event) => setComplianceFilters((current) => ({ ...current, year: event.target.value }))}
            >
              <option value="all">All years</option>
              {complianceYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className="field"
              value={complianceFilters.branchId}
              onChange={(event) => setComplianceFilters((current) => ({ ...current, branchId: event.target.value }))}
            >
              <option value="all">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <select
              className="field"
              value={complianceFilters.memberId}
              onChange={(event) => setComplianceFilters((current) => ({ ...current, memberId: event.target.value }))}
            >
              <option value="all">All members</option>
              {complianceVisibleMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <input
              className="field"
              placeholder="Search member or event"
              value={complianceFilters.search}
              onChange={(event) => setComplianceFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </div>

          <div className="mt-6 rounded-[28px] border border-cof-blue/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,65,114,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={() => setIsComplianceTableOpen((current) => !current)}
                className="flex items-center gap-3 text-left"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cof-pale text-cof-blue">
                  <ListChecks size={18} />
                </span>
                <span>
                  <span className="block font-display text-xl font-semibold text-cof-deep">Compliance table</span>
                  <span className="mt-1 block text-sm text-cof-slate">
                    Current filtered compliance rows with expected, paid, and balance amounts.
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  className={`ml-auto text-cof-slate transition ${isComplianceTableOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <button type="button" onClick={exportComplianceViewPdf} className="btn-secondary">
                <Printer size={16} />
                Print Selected Compliance View
              </button>
            </div>

            {isComplianceTableOpen ? (
              <div className="table-shell mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-cof-pale text-cof-deep">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Member</th>
                      <th className="px-4 py-4 font-semibold">Branch</th>
                      <th className="px-4 py-4 font-semibold">Event</th>
                      <th className="px-4 py-4 font-semibold">Expected</th>
                      <th className="px-4 py-4 font-semibold">Paid</th>
                      <th className="px-4 py-4 font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplianceRows.map((item) => (
                      <tr key={`${item.memberId}-${item.eventId}`} className="border-t border-cof-blue/8 text-cof-slate">
                        <td className="px-4 py-4">{item.memberName}</td>
                        <td className="px-4 py-4">{item.branchName}</td>
                        <td className="px-4 py-4">{item.eventTitle}</td>
                        <td className="px-4 py-4">{formatMoney(item.expectedAmount)}</td>
                        <td className="px-4 py-4">{formatMoney(item.paidAmount)}</td>
                        <td className="px-4 py-4 font-semibold text-cof-deep">{formatMoney(item.outstandingAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="mt-8 rounded-[28px] border border-cof-blue/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,65,114,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={() => setIsMatrixTableOpen((current) => !current)}
                className="flex items-center gap-3 text-left"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cof-pale text-cof-blue">
                  <CreditCard size={18} />
                </span>
                <span>
                  <span className="block font-display text-xl font-semibold text-cof-deep">Contribution matrix</span>
                  <span className="mt-1 block text-sm text-cof-slate">
                    Review each member against each event with quick contributed and missed tallies.
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  className={`ml-auto text-cof-slate transition ${isMatrixTableOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-cof-pale px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Members</p>
                    <p className="mt-2 font-semibold text-cof-deep">{contributionMatrixRows.length}</p>
                  </div>
                  <div className="rounded-2xl bg-cof-pale px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Events</p>
                    <p className="mt-2 font-semibold text-cof-deep">{contributionMatrixEvents.length}</p>
                  </div>
                  <div className="rounded-2xl bg-cof-pale px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-cof-slate">Tracked checks</p>
                    <p className="mt-2 font-semibold text-cof-deep">
                      {contributionMatrixRows.reduce((sum, item) => sum + item.eventCells.length, 0)}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={exportContributionMatrixPdf} className="btn-secondary">
                  <Printer size={16} />
                  Print Selected Matrix View
                </button>
              </div>
            </div>

            {isMatrixTableOpen ? (
              <div className="table-shell mt-6 overflow-x-auto">
                <table className="min-w-[980px] text-left text-sm">
                  <thead className="bg-cof-pale text-cof-deep">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Member</th>
                      <th className="px-4 py-4 font-semibold">Branch</th>
                      {contributionMatrixEvents.map((event) => (
                        <th key={event.eventId} className="min-w-[150px] px-4 py-4 font-semibold">
                          <div className="space-y-1">
                            <p>{event.eventTitle}</p>
                            <p className="text-xs font-medium text-cof-slate">{formatDate(event.eventDate)}</p>
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-4 font-semibold">Made</th>
                      <th className="px-4 py-4 font-semibold">Missed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributionMatrixRows.map((member) => (
                      <tr key={member.memberId} className="border-t border-cof-blue/8 text-cof-slate">
                        <td className="px-4 py-4 font-semibold text-cof-deep">{member.memberName}</td>
                        <td className="px-4 py-4">{member.branchName}</td>
                        {member.eventCells.map((cell) => (
                          <td key={`${member.memberId}-${cell.eventId}`} className="px-4 py-4">
                            <div
                              className={`inline-flex min-w-[120px] flex-col rounded-2xl px-3 py-2 ${
                                cell.contributed
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                  : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2 font-semibold">
                                {cell.contributed ? (
                                  <CheckCircle2 size={15} />
                                ) : (
                                  <X size={15} />
                                )}
                                {cell.contributed ? 'Contributed' : 'Missed'}
                              </span>
                              <span className="mt-1 text-xs font-medium">
                                {cell.contributed
                                  ? `${formatMoney(cell.paidAmount)} paid`
                                  : formatMoney(cell.expectedAmount)}
                              </span>
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            {member.contributedCount}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
                            {member.missedCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!contributionMatrixRows.length ? (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-sm text-cof-slate"
                          colSpan={contributionMatrixEvents.length + 4}
                        >
                          No contribution matrix rows match the current filters.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeSectionId === 'branches' && permissions.manageBranches ? (
        <section className="panel p-6">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-cof-blue" />
            <p className="font-display text-2xl font-semibold text-cof-deep">Branch management</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input className="field" placeholder="Branch name" value={branchForm.name} onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))} />
            <input className="field" placeholder="Location" value={branchForm.location} onChange={(event) => setBranchForm((current) => ({ ...current, location: event.target.value }))} />
            <input className="field" placeholder="Meeting day" value={branchForm.meetingDay} onChange={(event) => setBranchForm((current) => ({ ...current, meetingDay: event.target.value }))} />
            <textarea className="field min-h-28 resize-none md:col-span-2" placeholder="Branch description" value={branchForm.description} onChange={(event) => setBranchForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <button
            type="button"
            onClick={async () => {
              await addBranch(branchForm)
              setBranchForm({ name: '', location: '', description: '', meetingDay: '' })
            }}
            className="btn-primary mt-5"
          >
            Create Branch
          </button>
        </section>
      ) : null}

      {activeSectionId === 'members' && permissions.manageMembers ? (
        <section className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <UserPlus size={18} className="text-cof-blue" />
              <p className="font-display text-2xl font-semibold text-cof-deep">Add member</p>
            </div>
            <div className="mt-5 grid gap-4">
              <input className="field" placeholder="Full names" value={memberForm.name} onChange={(event) => setMemberForm((current) => ({ ...current, name: event.target.value }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="field" placeholder="Username" value={memberForm.username} onChange={(event) => setMemberForm((current) => ({ ...current, username: event.target.value }))} />
                <input className="field" type="password" placeholder="Temporary password" value={memberForm.password} onChange={(event) => setMemberForm((current) => ({ ...current, password: event.target.value }))} />
              </div>
              <select className="field" value={memberForm.branchId} onChange={(event) => setMemberForm((current) => ({ ...current, branchId: event.target.value }))}>
                {branches
                  .filter((branch) =>
                    user.role === 'branch_coordinator' ? branch.id === user.branchId : true,
                  )
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
              <select className="field" value={memberForm.role} onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="member">Member</option>
                <option value="branch_coordinator">Branch Coordinator</option>
                <option value="branch_treasurer">Branch Treasurer</option>
              </select>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="field" type="date" value={memberForm.dateOfBirth} onChange={(event) => setMemberForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                <input className="field" placeholder="Place of birth" value={memberForm.placeOfBirth} onChange={(event) => setMemberForm((current) => ({ ...current, placeOfBirth: event.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="field" placeholder="Phone number" value={memberForm.phone} onChange={(event) => setMemberForm((current) => ({ ...current, phone: event.target.value }))} />
                <input className="field" type="email" placeholder="Email address" value={memberForm.email} onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <select className="field" value={memberForm.maritalStatus} onChange={(event) => setMemberForm((current) => ({ ...current, maritalStatus: event.target.value }))}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
                <input className="field" placeholder="Profession" value={memberForm.profession} onChange={(event) => setMemberForm((current) => ({ ...current, profession: event.target.value }))} />
              </div>
              <textarea className="field min-h-24 resize-none" placeholder="Home address" value={memberForm.homeAddress} onChange={(event) => setMemberForm((current) => ({ ...current, homeAddress: event.target.value }))} />
              <input className="field" placeholder="Administrative city" value={memberForm.city} onChange={(event) => setMemberForm((current) => ({ ...current, city: event.target.value }))} />
              <label className="field flex cursor-pointer items-center gap-3">
                <Upload size={16} className="text-cof-blue" />
                <span>{memberForm.photo ? memberForm.photo.name : 'Upload member photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    setMemberForm((current) => ({
                      ...current,
                      photo: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </label>
            </div>
            <button
              type="button"
              onClick={async () => {
                const formData = new FormData()
                formData.append('name', memberForm.name)
                formData.append('username', memberForm.username)
                formData.append('password', memberForm.password)
                formData.append('branchId', memberForm.branchId)
                formData.append('role', memberForm.role)
                formData.append('title', memberForm.title)
                formData.append('phone', memberForm.phone)
                formData.append('email', memberForm.email)
                formData.append('dateOfBirth', memberForm.dateOfBirth)
                formData.append('placeOfBirth', memberForm.placeOfBirth)
                formData.append('maritalStatus', memberForm.maritalStatus)
                formData.append('homeAddress', memberForm.homeAddress)
                formData.append('profession', memberForm.profession)
                formData.append('city', memberForm.city)
                if (memberForm.photo) {
                  formData.append('photo', memberForm.photo)
                }
                await addMember(formData)
                setMemberForm({
                  name: '',
                  username: '',
                  password: '',
                  branchId: user.branchId,
                  role: 'member',
                  title: 'Member',
                  phone: '',
                  email: '',
                  dateOfBirth: '',
                  placeOfBirth: '',
                  maritalStatus: 'single',
                  homeAddress: '',
                  profession: '',
                  city: '',
                  photo: null,
                })
              }}
              className="btn-primary mt-5"
            >
              Save Member
            </button>
          </div>

          <div className="panel p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-display text-2xl font-semibold text-cof-deep">Member records</p>
                <p className="mt-2 text-sm text-cof-slate">Filter by branch and edit member details where permitted.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
              <select className="field" value={memberBranchFilter} onChange={(event) => setMemberBranchFilter(event.target.value)}>
                <option value="all">All branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <input className="field" placeholder="Search by name, username or membership ID" value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visibleMemberRecords.map((member) => (
                <div key={member.id} className="flex h-full flex-col rounded-[26px] border border-cof-blue/10 bg-white p-5 shadow-[0_16px_40px_rgba(15,65,114,0.06)]">
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <img src={member.avatar} alt={member.name} className="h-12 w-12 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="font-semibold text-cof-deep">{member.name}</p>
                        <p className="text-sm text-cof-slate">
                          {member.membershipCode} • @{member.username}
                        </p>
                        <p className="text-sm text-cof-slate">
                          {branches.find((branch) => branch.id === member.branchId)?.name} • {roleLabels[member.role]}
                        </p>
                        <p className="text-sm text-cof-slate">
                          {member.approvalStatus} • {member.status} • {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-cof-pale p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-cof-slate">Phone</p>
                        <p className="mt-2 text-sm font-medium text-cof-deep">{member.phone}</p>
                      </div>
                      <div className="rounded-2xl bg-cof-pale p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-cof-slate">Profession</p>
                        <p className="mt-2 text-sm font-medium text-cof-deep">{member.profession}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="button" onClick={() => startEditingMember(member.id)} className="btn-secondary px-4 py-2 text-xs">
                        <PencilLine size={14} />
                        Edit
                      </button>
                      <button type="button" onClick={() => updateMemberStatus(member.id, 'active')} className="btn-secondary px-4 py-2 text-xs">
                        Activate
                      </button>
                      {permissions.suspendMembers ? (
                        <button type="button" onClick={() => updateMemberStatus(member.id, 'suspended')} className="btn-secondary px-4 py-2 text-xs">
                          Suspend
                        </button>
                      ) : null}
                      {permissions.dismissMembers ? (
                        <button type="button" onClick={() => updateMemberStatus(member.id, 'dismissed')} className="btn-secondary px-4 py-2 text-xs">
                          Dismiss
                        </button>
                      ) : null}
                      <button type="button" onClick={() => deleteMember(member.id)} className="btn-secondary px-4 py-2 text-xs">
                        Delete
                      </button>
                    </div>
                  </div>
                  {editingMemberId === member.id ? (
                    <form
                      className="mt-5 grid gap-4 rounded-[22px] bg-cof-pale p-4"
                      onSubmit={async (event) => {
                        event.preventDefault()
                        const formData = new FormData()
                        formData.append('name', editingMemberForm.name)
                        formData.append('username', editingMemberForm.username)
                        formData.append('branchId', editingMemberForm.branchId)
                        formData.append('role', editingMemberForm.role)
                        formData.append('title', editingMemberForm.title)
                        formData.append('phone', editingMemberForm.phone)
                        formData.append('email', editingMemberForm.email)
                        formData.append('dateOfBirth', editingMemberForm.dateOfBirth)
                        formData.append('placeOfBirth', editingMemberForm.placeOfBirth)
                        formData.append('maritalStatus', editingMemberForm.maritalStatus)
                        formData.append('homeAddress', editingMemberForm.homeAddress)
                        formData.append('profession', editingMemberForm.profession)
                        formData.append('city', editingMemberForm.city)
                        if (editingMemberForm.photo) {
                          formData.append('photo', editingMemberForm.photo)
                        }
                        await editMember(member.id, formData)
                        setEditingMemberId(null)
                      }}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <input className="field" placeholder="Full names" value={editingMemberForm.name} onChange={(event) => setEditingMemberForm((current) => ({ ...current, name: event.target.value }))} />
                        <input className="field" placeholder="Username" value={editingMemberForm.username} onChange={(event) => setEditingMemberForm((current) => ({ ...current, username: event.target.value }))} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <select className="field" value={editingMemberForm.branchId} onChange={(event) => setEditingMemberForm((current) => ({ ...current, branchId: event.target.value }))}>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                        <select className="field" value={editingMemberForm.role} onChange={(event) => setEditingMemberForm((current) => ({ ...current, role: event.target.value }))}>
                          <option value="member">Member</option>
                          <option value="branch_coordinator">Branch Coordinator</option>
                          <option value="branch_treasurer">Branch Treasurer</option>
                          <option value="admin">Admin</option>
                          <option value="general_coordinator">General Coordinator</option>
                          <option value="secretary_general">Secretary General</option>
                          <option value="general_treasurer">General Treasurer</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <input className="field" type="date" value={editingMemberForm.dateOfBirth} onChange={(event) => setEditingMemberForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                        <input className="field" placeholder="Place of birth" value={editingMemberForm.placeOfBirth} onChange={(event) => setEditingMemberForm((current) => ({ ...current, placeOfBirth: event.target.value }))} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <input className="field" placeholder="Phone number" value={editingMemberForm.phone} onChange={(event) => setEditingMemberForm((current) => ({ ...current, phone: event.target.value }))} />
                        <input className="field" type="email" placeholder="Email" value={editingMemberForm.email} onChange={(event) => setEditingMemberForm((current) => ({ ...current, email: event.target.value }))} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <select className="field" value={editingMemberForm.maritalStatus} onChange={(event) => setEditingMemberForm((current) => ({ ...current, maritalStatus: event.target.value }))}>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                        <input className="field" placeholder="Profession" value={editingMemberForm.profession} onChange={(event) => setEditingMemberForm((current) => ({ ...current, profession: event.target.value }))} />
                      </div>
                      <input className="field" placeholder="Title" value={editingMemberForm.title} onChange={(event) => setEditingMemberForm((current) => ({ ...current, title: event.target.value }))} />
                      <textarea className="field min-h-24 resize-none" placeholder="Home address" value={editingMemberForm.homeAddress} onChange={(event) => setEditingMemberForm((current) => ({ ...current, homeAddress: event.target.value }))} />
                      <input className="field" placeholder="Administrative city" value={editingMemberForm.city} onChange={(event) => setEditingMemberForm((current) => ({ ...current, city: event.target.value }))} />
                      <label className="field flex cursor-pointer items-center gap-3">
                        <Upload size={16} className="text-cof-blue" />
                        <span>{editingMemberForm.photo ? editingMemberForm.photo.name : 'Upload new member photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            setEditingMemberForm((current) => ({
                              ...current,
                              photo: event.target.files?.[0] ?? null,
                            }))
                          }
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <button type="submit" className="btn-primary px-4 py-2 text-xs">
                          <Save size={14} />
                          Save changes
                        </button>
                        <button type="button" onClick={() => setEditingMemberId(null)} className="btn-secondary px-4 py-2 text-xs">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeSectionId === 'announcements' && permissions.announce ? (
        <section className="panel p-6">
          <div className="flex items-center gap-3">
            <BellRing size={18} className="text-cof-blue" />
            <p className="font-display text-2xl font-semibold text-cof-deep">Announcement studio</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input className="field" placeholder="Announcement title" value={announcementForm.title} onChange={(event) => setAnnouncementForm((current) => ({ ...current, title: event.target.value }))} />
            <input className="field" placeholder="Audience" value={announcementForm.audience} onChange={(event) => setAnnouncementForm((current) => ({ ...current, audience: event.target.value }))} />
            <select className="field md:col-span-2" value={announcementForm.channel} onChange={(event) => setAnnouncementForm((current) => ({ ...current, channel: event.target.value as 'website' | 'website+whatsapp' }))}>
              <option value="website+whatsapp">Website + WhatsApp</option>
              <option value="website">Website only</option>
            </select>
            <textarea className="field min-h-32 resize-none md:col-span-2" placeholder="Announcement message" value={announcementForm.message} onChange={(event) => setAnnouncementForm((current) => ({ ...current, message: event.target.value }))} />
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={async () => {
                await addAnnouncement({
                  authorId: user.id,
                  title: announcementForm.title,
                  message: announcementForm.message,
                  audience: announcementForm.audience,
                  channel: announcementForm.channel,
                })
                setAnnouncementForm({
                  title: '',
                  message: '',
                  audience: 'All members',
                  channel: 'website+whatsapp',
                })
              }}
              className="btn-primary"
            >
              Publish Announcement
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${announcementForm.title}\n\n${announcementForm.message}`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Share on WhatsApp
            </a>
          </div>
          <div className="mt-6 space-y-3">
            {announcements.slice(0, 3).map((announcement) => (
              <div key={announcement.id} className="rounded-2xl bg-cof-pale p-4 text-sm text-cof-slate">
                <p className="font-semibold text-cof-deep">{announcement.title}</p>
                <p className="mt-2 leading-7">{announcement.message}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeSectionId === 'contributions' && permissions.enterContributions ? (
        <section className="panel p-6">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-cof-blue" />
            <p className="font-display text-2xl font-semibold text-cof-deep">Contribution desk</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <select
              className="field"
              value={contributionBranchFilter}
              onChange={(event) => setContributionBranchFilter(event.target.value)}
            >
              <option value="all">All branches</option>
              {branches
                .filter((branch) =>
                  user.role === 'branch_coordinator' || user.role === 'branch_treasurer'
                    ? branch.id === user.branchId
                    : true,
                )
                .map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
            </select>
            <select className="field" value={contributionForm.memberId} onChange={(event) => setContributionForm((current) => ({ ...current, memberId: event.target.value }))}>
              <option value="">Select member</option>
              {contributionDeskMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <select
              className="field"
              value={contributionForm.eventId}
              onChange={(event) => {
                const nextEventId = event.target.value
                const eventRecord = events.find((item) => item.id === nextEventId)
                setContributionForm((current) => ({
                  ...current,
                  eventId: nextEventId,
                  amount: eventRecord?.minContribution ?? current.amount,
                }))
              }}
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <input className="field" type="number" min="1000" step="500" value={contributionForm.amount} onChange={(event) => setContributionForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
            <select className="field" value={contributionForm.kind} onChange={(event) => setContributionForm((current) => ({ ...current, kind: event.target.value as 'ongoing' | 'late' }))}>
              <option value="ongoing">Ongoing contribution</option>
              <option value="late">Late contribution</option>
            </select>
          </div>
          {selectedContributionGap ? (
            <div className="mt-4 rounded-2xl bg-cof-pale px-4 py-3 text-sm text-cof-slate">
              <span className="font-semibold text-cof-deep">Outstanding balance:</span>{' '}
              {formatMoney(selectedContributionGap.outstandingAmount)} for {selectedContributionGap.eventTitle}
            </div>
          ) : null}
          <button
            type="button"
            onClick={async () => {
              await addContribution(contributionForm)
              setContributionForm({ memberId: '', eventId: '', amount: 10000, kind: 'ongoing' })
            }}
            className="btn-primary mt-5"
          >
            Record Contribution
          </button>
        </section>
      ) : null}

      {activeSectionId === 'exports' && (permissions.printLists || permissions.printCards) ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-cof-blue" />
              <p className="font-display text-2xl font-semibold text-cof-deep">PDF exports</p>
            </div>
            <div className="mt-5">
              <label className="space-y-2 text-sm font-semibold text-cof-slate">
                <span>Filter by branch</span>
                <select
                  className="field"
                  value={exportBranchFilter}
                  onChange={(event) => setExportBranchFilter(event.target.value)}
                >
                  <option value="all">All branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {permissions.printLists ? (
                <button type="button" onClick={exportMembersPdf} className="btn-secondary">
                  Export members list PDF
                </button>
              ) : null}
              {permissions.printCards ? (
                <>
                  <select className="field" value={selectedCardMemberId} onChange={(event) => setSelectedCardMemberId(event.target.value)}>
                    <option value="">Select member for card</option>
                    {exportMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={exportMembershipCardsSheetPdf} className="btn-secondary">
                    <CreditCard size={16} />
                    Export A4 membership cards PDF
                  </button>
                  <button type="button" onClick={exportMemberCardPdf} className="btn-primary">
                    <CreditCard size={16} />
                    Export membership card PDF
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="pdf-card">
            <p className="text-sm uppercase tracking-[0.24em] text-cof-blue">Preview</p>
            <p className="mt-3 font-display text-2xl font-semibold text-cof-deep">Circle of Friends PDF output</p>
            <p className="mt-3 text-sm leading-7 text-cof-slate">
              Membership lists now export grouped by branch with branch subtitles. Membership cards
              export as front-and-back cards with logo branding, and A4 multi-card sheets can be
              filtered by branch before printing.
            </p>
          </div>
        </section>
      ) : null}
        </div>
      </section>
    </div>
  )
}
