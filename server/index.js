import crypto from 'crypto'
import cors from 'cors'
import express from 'express'
import fs from 'fs/promises'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'
import { getDatabaseStatus, getPool, initDatabase, isMysqlReady } from './db.js'
import { demoState } from './seedData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, 'uploads')
const schemaPath = path.join(__dirname, 'schema.sql')
const distDir = path.resolve(__dirname, '../dist')
const distIndexPath = path.join(distDir, 'index.html')
const app = express()
const port = Number(process.env.PORT || 4000)
const defaultSeedPassword = 'friend123'
const maritalStatusValues = ['single', 'married', 'divorced', 'widowed']
const roleValues = [
  'member',
  'super_admin',
  'admin',
  'general_coordinator',
  'secretary_general',
  'general_treasurer',
  'branch_coordinator',
  'branch_treasurer',
]

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-')
    callback(null, `${Date.now()}-${safeName}`)
  },
})

const upload = multer({ storage })
const cloneDemoState = () => structuredClone(demoState)
let state = cloneDemoState()
const demoCredentials = new Map(
  demoState.members.map((member) => [
    member.username,
    { id: member.id, passwordHash: hashPassword(defaultSeedPassword) },
  ]),
)

const branchSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  description: z.string().min(10),
  meetingDay: z.string().min(3),
})

const memberSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(6),
  branchId: z.string().min(2),
  role: z.enum(roleValues),
  title: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  dateOfBirth: z.string().min(10),
  placeOfBirth: z.string().min(2),
  maritalStatus: z.enum(maritalStatusValues),
  homeAddress: z.string().min(4),
  profession: z.string().min(2),
  city: z.string().min(2).optional(),
})

const registrationSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(6),
  branchId: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  dateOfBirth: z.string().min(10),
  placeOfBirth: z.string().min(2),
  maritalStatus: z.enum(maritalStatusValues),
  homeAddress: z.string().min(4),
  profession: z.string().min(2),
  city: z.string().min(2).optional(),
})

const memberUpdateSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  branchId: z.string().min(2),
  role: z.enum(roleValues),
  title: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  dateOfBirth: z.string().min(10),
  placeOfBirth: z.string().min(2),
  maritalStatus: z.enum(maritalStatusValues),
  homeAddress: z.string().min(4),
  profession: z.string().min(2),
  city: z.string().min(2).optional(),
})

const ownProfileSchema = z.object({
  phone: z.string().min(6),
  email: z.string().email(),
  maritalStatus: z.enum(maritalStatusValues),
  homeAddress: z.string().min(4),
  profession: z.string().min(2),
})

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

const approvalSchema = z.object({
  approvalStatus: z.enum(['approved', 'rejected']),
  approvedBy: z.string().min(2),
})

const contributionSchema = z.object({
  memberId: z.string().min(2),
  eventId: z.string().min(2),
  amount: z.coerce.number().min(1),
  kind: z.enum(['ongoing', 'late']),
})

const eventFinanceSchema = z.object({
  expenditure: z.coerce.number().min(0),
})

const postSchema = z.object({
  authorId: z.string().min(2),
  content: z.string().min(4),
  type: z.enum(['photo', 'video', 'file', 'update']),
})

const announcementSchema = z.object({
  authorId: z.string().min(2),
  title: z.string().min(4),
  message: z.string().min(10),
  audience: z.string().min(2),
  channel: z.enum(['website', 'website+whatsapp']),
})

const branchPalette = ['#165fa6', '#1d7ed8', '#0f4172', '#4f94dd', '#2b6cb0', '#89b4e2']

function safeJson(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }

  return []
}

function buildPhotoUrl(filename) {
  return `/uploads/${filename}`
}

function createId(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString('hex')}`
}

function defaultMemberCover(branchId) {
  const coverMap = {
    douala: '/home/standing-together.jpg',
    bamenda: '/home/celebrating-together.jpg',
    kumbo: '/home/unity-in-support.jpg',
    yaounde: '/home/FB_IMG_1749649752439.jpg',
    bafoussam: '/home/e74dc5c7-8405-4e42-9f20-80aa073608b5.jpg',
    ndop: '/home/1.jpeg',
    nkambe: '/home/standing-together.jpg',
  }

  return coverMap[branchId] || '/home/unity-in-support.jpg'
}

function branchColor(index) {
  return branchPalette[index % branchPalette.length]
}

function normalizeUsername(username) {
  return username.trim().toLowerCase().replace(/\s+/g, '.')
}

function slugifyUsername(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^[.]+|[.]+$)/g, '')
}

function createUniqueUsername(seed, usedUsernames) {
  const base = seed || `member.${Date.now()}`
  let candidate = base
  let suffix = 1

  while (usedUsernames.has(candidate)) {
    candidate = `${base}.${suffix}`
    suffix += 1
  }

  usedUsernames.add(candidate)
  return candidate
}

function branchMembershipPrefix(branchId) {
  return branchId.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

function generateMembershipCode(branchId, sequence) {
  return `${branchMembershipPrefix(branchId)}-${String(sequence).padStart(3, '0')}`
}

function normalizeDateOnly(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedHash) {
  const [salt, storedDigest] = storedHash.split(':')
  if (!salt || !storedDigest) {
    return false
  }

  const storedBuffer = Buffer.from(storedDigest, 'hex')
  const derivedBuffer = crypto.scryptSync(password, salt, storedBuffer.length)
  return storedBuffer.length === derivedBuffer.length && crypto.timingSafeEqual(storedBuffer, derivedBuffer)
}

function mysqlDateTime(value) {
  return value.toISOString().slice(0, 19).replace('T', ' ')
}

function isEligibleForEvent(member, event) {
  return event.branchScope === 'national' || event.branchScope === member.branchId
}

function isActiveApprovedMember(member) {
  return member.approvalStatus === 'approved' && member.status === 'active'
}

function isDuplicateKeyError(error) {
  return error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY'
}

async function columnExists(tableName, columnName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  )

  return rows[0].count > 0
}

async function indexExists(tableName, indexName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName],
  )

  return rows[0].count > 0
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    return
  }

  await getPool().query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`)
}

async function ensureMembersMigration() {
  if (!isMysqlReady()) {
    return
  }

  await addColumnIfMissing('members', 'membershipCode', 'VARCHAR(80) NULL AFTER `id`')
  await addColumnIfMissing('members', 'username', 'VARCHAR(80) NULL AFTER `name`')
  await addColumnIfMissing('members', 'passwordHash', 'TEXT NULL AFTER `avatar`')
  await addColumnIfMissing('members', 'email', 'VARCHAR(160) NULL AFTER `phone`')
  await addColumnIfMissing('members', 'dateOfBirth', 'DATE NULL AFTER `email`')
  await addColumnIfMissing('members', 'placeOfBirth', 'VARCHAR(160) NULL AFTER `dateOfBirth`')
  await addColumnIfMissing(
    'members',
    'maritalStatus',
    "ENUM('single','married','divorced','widowed') NULL AFTER `placeOfBirth`",
  )
  await addColumnIfMissing('members', 'homeAddress', 'TEXT NULL AFTER `maritalStatus`')
  await addColumnIfMissing('members', 'profession', 'VARCHAR(160) NULL AFTER `homeAddress`')
  await addColumnIfMissing(
    'members',
    'approvalStatus',
    "ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER `status`",
  )
  await addColumnIfMissing('members', 'approvedBy', 'VARCHAR(120) NULL AFTER `approvalStatus`')
  await addColumnIfMissing('members', 'approvedAt', 'DATETIME NULL AFTER `approvedBy`')
  await addColumnIfMissing('members', 'coverPhoto', 'TEXT NULL AFTER `avatar`')

  const [members] = await getPool().query(
    `SELECT id, name, branchId, membershipCode, username, passwordHash, phone, email,
            DATE_FORMAT(dateOfBirth, "%Y-%m-%d") AS dateOfBirth, placeOfBirth, maritalStatus, homeAddress, profession,
            approvalStatus, approvedBy, approvedAt, coverPhoto
     FROM members
     ORDER BY created_at ASC, id ASC`,
  )

  const usedUsernames = new Set()
  for (const member of members) {
    if (member.username) {
      usedUsernames.add(normalizeUsername(member.username))
    }
  }

  const branchSequences = new Map()

  for (const member of members) {
    const existingUsername = member.username ? normalizeUsername(member.username) : ''
    const hasDuplicate =
      existingUsername &&
      members.some((item) => item.id !== member.id && normalizeUsername(item.username || '') === existingUsername)
    const isLegacyRecord = !member.username || !member.passwordHash
    const nextSequence = (branchSequences.get(member.branchId) || 0) + 1
    branchSequences.set(member.branchId, nextSequence)
    const nextUsername = !existingUsername || hasDuplicate
      ? createUniqueUsername(slugifyUsername(member.name), usedUsernames)
      : existingUsername
    const nextMembershipCode = member.membershipCode || generateMembershipCode(member.branchId, nextSequence)
    const nextPasswordHash = member.passwordHash || hashPassword(defaultSeedPassword)
    const nextEmail = member.email || `${nextUsername}@circleoffriends.cm`
    const nextDateOfBirth = member.dateOfBirth || '1990-01-01'
    const nextPlaceOfBirth = member.placeOfBirth || member.branchId
    const nextMaritalStatus = member.maritalStatus || 'single'
    const nextHomeAddress = member.homeAddress || `Main residence, ${member.branchId}`
    const nextProfession = member.profession || 'Member'
    const nextCoverPhoto = member.coverPhoto || defaultMemberCover(member.branchId)
    const nextApprovalStatus = isLegacyRecord ? 'approved' : member.approvalStatus
    const nextApprovedBy =
      nextApprovalStatus === 'approved' ? member.approvedBy || 'System bootstrap' : member.approvedBy
    const nextApprovedAt =
      nextApprovalStatus === 'approved'
        ? member.approvedAt || mysqlDateTime(new Date())
        : member.approvedAt

    await getPool().execute(
      `UPDATE members
       SET membershipCode = ?, username = ?, passwordHash = ?, email = ?, dateOfBirth = ?, placeOfBirth = ?,
           maritalStatus = ?, homeAddress = ?, profession = ?, approvalStatus = ?, approvedBy = ?, approvedAt = ?, coverPhoto = ?
       WHERE id = ?`,
      [
        nextMembershipCode,
        nextUsername,
        nextPasswordHash,
        nextEmail,
        nextDateOfBirth,
        nextPlaceOfBirth,
        nextMaritalStatus,
        nextHomeAddress,
        nextProfession,
        nextApprovalStatus,
        nextApprovedBy,
        nextApprovedAt,
        nextCoverPhoto,
        member.id,
      ],
    )
  }

  if (!(await indexExists('members', 'idx_members_membership_code_unique'))) {
    await getPool().query('CREATE UNIQUE INDEX idx_members_membership_code_unique ON members (membershipCode)')
  }
  if (!(await indexExists('members', 'idx_members_username_unique'))) {
    await getPool().query('CREATE UNIQUE INDEX idx_members_username_unique ON members (username)')
  }
}

async function ensureEventsMigration() {
  if (!isMysqlReady()) {
    return
  }

  await addColumnIfMissing('events', 'expenditure', 'INT NOT NULL DEFAULT 0 AFTER `raisedAmount`')
  await getPool().query('UPDATE events SET expenditure = 0 WHERE expenditure IS NULL')
}

async function ensureEventImagesMigration() {
  if (!isMysqlReady()) {
    return
  }

  const [rows] = await getPool().query('SELECT COUNT(*) AS count FROM event_images')
  if (rows[0].count > 0) {
    return
  }

  const [existingEvents] = await getPool().query('SELECT id FROM events')
  const existingEventIds = new Set(existingEvents.map((item) => item.id))

  for (const image of demoState.eventImages) {
    if (!existingEventIds.has(image.eventId)) {
      continue
    }

    await getPool().execute(
      'INSERT INTO event_images (id, eventId, imageUrl, sortOrder) VALUES (?, ?, ?, ?)',
      [image.id, image.eventId, image.imageUrl, image.sortOrder],
    )
  }
}

async function ensureDatabaseSchema() {
  if (!isMysqlReady()) {
    return
  }

  const schema = await fs.readFile(schemaPath, 'utf8')
  await getPool().query(schema)
  await ensureMembersMigration()
  await ensureEventsMigration()
  await ensureEventImagesMigration()
}

async function seedDatabaseIfEmpty() {
  if (!isMysqlReady()) {
    return
  }

  const [[branchCount]] = await getPool().query('SELECT COUNT(*) AS count FROM branches')
  if (branchCount.count > 0) {
    return
  }

  for (const branch of demoState.branches) {
    await getPool().execute(
      'INSERT INTO branches (id, name, location, description, meetingDay, photo, color, highlights, coordinatorName, treasurerName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        branch.id,
        branch.name,
        branch.location,
        branch.description,
        branch.meetingDay,
        branch.photo,
        branch.color,
        JSON.stringify(branch.highlights),
        branch.coordinatorName,
        branch.treasurerName,
      ],
    )
  }

  for (const executive of demoState.executives) {
    await getPool().execute(
      'INSERT INTO executives (id, name, portfolio, bio, avatar, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [executive.id, executive.name, executive.portfolio, executive.bio, executive.avatar, executive.phone],
    )
  }

  for (const member of demoState.members) {
    await getPool().execute(
      `INSERT INTO members
       (id, membershipCode, name, username, role, title, branchId, phone, email, dateOfBirth, placeOfBirth, maritalStatus, homeAddress, profession, joinedYear, avatar, coverPhoto, passwordHash, status, approvalStatus, approvedBy, approvedAt, city)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.id,
        member.membershipCode,
        member.name,
        member.username,
        member.role,
        member.title,
        member.branchId,
        member.phone,
        member.email,
        member.dateOfBirth,
        member.placeOfBirth,
        member.maritalStatus,
        member.homeAddress,
        member.profession,
        member.joinedYear,
        member.avatar,
        member.coverPhoto,
        hashPassword(defaultSeedPassword),
        member.status,
        member.approvalStatus,
        member.approvedBy,
        member.approvedAt ? mysqlDateTime(new Date(member.approvedAt)) : null,
        member.city,
      ],
    )
  }

  for (const event of demoState.events) {
    await getPool().execute(
      'INSERT INTO events (id, title, type, status, `date`, venue, summary, minContribution, targetAmount, raisedAmount, expenditure, hero, branchScope) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        event.id,
        event.title,
        event.type,
        event.status,
        event.date,
        event.venue,
        event.summary,
        event.minContribution,
        event.targetAmount,
        event.raisedAmount,
        event.expenditure,
        event.hero,
        event.branchScope,
      ],
    )
  }

  for (const image of demoState.eventImages) {
    await getPool().execute(
      'INSERT INTO event_images (id, eventId, imageUrl, sortOrder) VALUES (?, ?, ?, ?)',
      [image.id, image.eventId, image.imageUrl, image.sortOrder],
    )
  }

  for (const contribution of demoState.contributions) {
    await getPool().execute(
      'INSERT INTO contributions (id, eventId, memberId, branchId, amount, `date`, kind) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        contribution.id,
        contribution.eventId,
        contribution.memberId,
        contribution.branchId,
        contribution.amount,
        contribution.date,
        contribution.kind,
      ],
    )
  }

  for (const post of demoState.posts) {
    await getPool().execute(
      'INSERT INTO posts (id, authorId, branchId, type, content, createdAt, media, attachments, reactions, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        post.id,
        post.authorId,
        post.branchId,
        post.type,
        post.content,
        post.createdAt,
        post.media,
        JSON.stringify(post.attachments),
        post.reactions,
        post.comments,
      ],
    )
  }

  for (const announcement of demoState.announcements) {
    await getPool().execute(
      'INSERT INTO announcements (id, title, message, audience, createdAt, authorId, channel) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        announcement.id,
        announcement.title,
        announcement.message,
        announcement.audience,
        announcement.createdAt,
        announcement.authorId,
        announcement.channel,
      ],
    )
  }
}

async function loadMysqlState() {
  const [branches] = await getPool().query(
    'SELECT id, name, location, description, meetingDay, photo, color, highlights, coordinatorName, treasurerName FROM branches ORDER BY name',
  )
  const [executives] = await getPool().query(
    'SELECT id, name, portfolio, bio, avatar, phone FROM executives ORDER BY name',
  )
  const [members] = await getPool().query(
    `SELECT id, membershipCode, name, username, role, title, branchId, phone, email,
            DATE_FORMAT(dateOfBirth, "%Y-%m-%d") AS dateOfBirth, placeOfBirth, maritalStatus, homeAddress, profession,
            joinedYear, avatar, coverPhoto, status, approvalStatus, approvedBy,
            DATE_FORMAT(approvedAt, "%Y-%m-%dT%H:%i:%s") AS approvedAt, city
     FROM members
     ORDER BY name`,
  )
  const [events] = await getPool().query(
    'SELECT id, title, type, status, DATE_FORMAT(`date`, "%Y-%m-%d") AS date, venue, summary, minContribution, targetAmount, raisedAmount, expenditure, hero, branchScope FROM events ORDER BY `date` DESC',
  )
  const [eventImages] = await getPool().query(
    'SELECT id, eventId, imageUrl, sortOrder, DATE_FORMAT(createdAt, "%Y-%m-%dT%H:%i:%s") AS createdAt FROM event_images ORDER BY eventId, sortOrder, createdAt, id',
  )
  const [contributions] = await getPool().query(
    'SELECT id, eventId, memberId, branchId, amount, DATE_FORMAT(`date`, "%Y-%m-%d") AS date, kind FROM contributions ORDER BY `date` DESC',
  )
  const [posts] = await getPool().query(
    'SELECT id, authorId, branchId, type, content, createdAt, media, attachments, reactions, comments FROM posts ORDER BY createdAt DESC',
  )
  const [announcements] = await getPool().query(
    'SELECT id, title, message, audience, createdAt, authorId, channel FROM announcements ORDER BY createdAt DESC',
  )

  if (!branches.length) {
    return cloneDemoState()
  }

  return {
    branches: branches.map((item) => ({ ...item, highlights: safeJson(item.highlights) })),
    executives,
    members,
    events,
    eventImages,
    contributions,
    posts: posts.map((item) => ({ ...item, attachments: safeJson(item.attachments) })),
    announcements,
  }
}

async function getCurrentState() {
  if (!isMysqlReady()) {
    return state
  }

  state = await loadMysqlState()
  return state
}

function nextMembershipCode(members, branchId) {
  const branchMembers = members.filter((item) => item.branchId === branchId)
  return generateMembershipCode(branchId, branchMembers.length + 1)
}

function updateDemoEventRaisedAmount(eventId, amount) {
  state.events = state.events.map((event) =>
    event.id === eventId ? { ...event, raisedAmount: event.raisedAmount + amount } : event,
  )
}

function updateDemoEventExpenditure(eventId, expenditure) {
  state.events = state.events.map((event) =>
    event.id === eventId ? { ...event, expenditure } : event,
  )
}

function addDemoEventImages(images) {
  state.eventImages = [...state.eventImages, ...images]
}

function removeDemoEventImage(eventImageId) {
  state.eventImages = state.eventImages.filter((image) => image.id !== eventImageId)
}

async function findMysqlAuthMember(username) {
  const [rows] = await getPool().execute(
    `SELECT id, membershipCode, name, username, role, title, branchId, phone, email,
            DATE_FORMAT(dateOfBirth, "%Y-%m-%d") AS dateOfBirth, placeOfBirth, maritalStatus, homeAddress, profession,
            joinedYear, avatar, coverPhoto, passwordHash, status, approvalStatus,
            approvedBy, DATE_FORMAT(approvedAt, "%Y-%m-%dT%H:%i:%s") AS approvedAt, city
     FROM members
     WHERE username = ?
     LIMIT 1`,
    [username],
  )

  return rows[0] ?? null
}

app.use(cors())
app.use(express.json({ limit: '8mb' }))
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', async (_req, res) => {
  const current = await getCurrentState()

  res.json({
    ok: true,
    database: getDatabaseStatus(),
    counts: {
      branches: current.branches.length,
      members: current.members.length,
      events: current.events.length,
    },
  })
})

app.get('/api/bootstrap', async (_req, res) => {
  const current = await getCurrentState()
  res.json({
    ...current,
    database: getDatabaseStatus(),
  })
})

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Enter a valid username and password.' })
    return
  }

  const username = normalizeUsername(parsed.data.username)

  if (isMysqlReady()) {
    const member = await findMysqlAuthMember(username)
    if (!member || !member.passwordHash || !verifyPassword(parsed.data.password, member.passwordHash)) {
      res.status(401).json({ message: 'Incorrect username or password.' })
      return
    }

    if (member.approvalStatus !== 'approved') {
      res.status(403).json({ message: 'Your account is pending approval from the association leadership.' })
      return
    }

    if (member.status !== 'active') {
      res.status(403).json({ message: `This account is currently ${member.status}.` })
      return
    }

    const { passwordHash, ...publicMember } = member
    res.json({ member: publicMember })
    return
  }

  const authRecord = demoCredentials.get(username)
  if (!authRecord || !verifyPassword(parsed.data.password, authRecord.passwordHash)) {
    res.status(401).json({ message: 'Incorrect username or password.' })
    return
  }

  const member = state.members.find((item) => item.id === authRecord.id)
  if (!member) {
    res.status(404).json({ message: 'Member account not found.' })
    return
  }

  res.json({ member })
})

app.post('/api/auth/register', upload.single('photo'), async (req, res) => {
  const parsed = registrationSchema.safeParse({
    ...req.body,
    username: normalizeUsername(req.body?.username ?? ''),
  })

  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid registration data.' })
    return
  }

  const current = await getCurrentState()
  const payload = parsed.data
  const branch = current.branches.find((item) => item.id === payload.branchId)

  if (!branch) {
    res.status(404).json({ message: 'Selected branch not found.' })
    return
  }

  if (current.members.some((item) => normalizeUsername(item.username || '') === payload.username)) {
    res.status(409).json({ message: 'That username is already in use.' })
    return
  }

  const avatar = req.file
    ? buildPhotoUrl(req.file.filename)
    : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(payload.name)}&backgroundColor=165fa6`
  const coverPhoto = defaultMemberCover(payload.branchId)

  const member = {
    id: `m-${Date.now()}`,
    membershipCode: nextMembershipCode(current.members, payload.branchId),
    name: payload.name,
    username: payload.username,
    role: 'member',
    title: 'Member',
    branchId: payload.branchId,
    phone: payload.phone,
    email: payload.email,
    dateOfBirth: normalizeDateOnly(payload.dateOfBirth),
    placeOfBirth: payload.placeOfBirth,
    maritalStatus: payload.maritalStatus,
    homeAddress: payload.homeAddress,
    profession: payload.profession,
    joinedYear: new Date().getFullYear(),
    avatar,
    coverPhoto,
    status: 'active',
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    city: payload.city || branch.location,
  }

  try {
    if (isMysqlReady()) {
      await getPool().execute(
        `INSERT INTO members
         (id, membershipCode, name, username, role, title, branchId, phone, email, dateOfBirth, placeOfBirth, maritalStatus, homeAddress, profession, joinedYear, avatar, coverPhoto, passwordHash, status, approvalStatus, approvedBy, approvedAt, city)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          member.id,
          member.membershipCode,
          member.name,
          member.username,
          member.role,
          member.title,
          member.branchId,
          member.phone,
          member.email,
          member.dateOfBirth,
          member.placeOfBirth,
          member.maritalStatus,
          member.homeAddress,
          member.profession,
          member.joinedYear,
          member.avatar,
          member.coverPhoto,
          hashPassword(payload.password),
          member.status,
          member.approvalStatus,
          member.approvedBy,
          member.approvedAt,
          member.city,
        ],
      )
      state = await loadMysqlState()
    } else {
      state.members.unshift(member)
      demoCredentials.set(member.username, { id: member.id, passwordHash: hashPassword(payload.password) })
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: 'That username is already in use.' })
      return
    }

    throw error
  }

  res.status(201).json({
    message: 'Registration submitted. Your account will be activated after approval.',
  })
})

app.post('/api/branches', async (req, res) => {
  const parsed = branchSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid branch data.' })
    return
  }

  const current = await getCurrentState()
  const payload = parsed.data
  const branch = {
    id: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    ...payload,
    photo:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    color: branchColor(current.branches.length),
    highlights: ['New branch setup', 'Membership drive', 'Local support'],
    coordinatorName: 'To be assigned',
    treasurerName: 'To be assigned',
  }

  if (isMysqlReady()) {
    await getPool().execute(
      'INSERT INTO branches (id, name, location, description, meetingDay, photo, color, highlights, coordinatorName, treasurerName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        branch.id,
        branch.name,
        branch.location,
        branch.description,
        branch.meetingDay,
        branch.photo,
        branch.color,
        JSON.stringify(branch.highlights),
        branch.coordinatorName,
        branch.treasurerName,
      ],
    )
    state = await loadMysqlState()
  } else {
    state.branches.unshift(branch)
  }

  res.status(201).json(branch)
})

app.put('/api/branches/:id', async (req, res) => {
  const branchId = req.params.id
  const parsed = branchSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid branch update.' })
    return
  }

  const current = await getCurrentState()
  const existing = current.branches.find((item) => item.id === branchId)
  if (!existing) {
    res.status(404).json({ message: 'Branch not found.' })
    return
  }

  if (isMysqlReady()) {
    const next = { ...existing, ...parsed.data }
    await getPool().execute(
      'UPDATE branches SET name = ?, location = ?, description = ?, meetingDay = ?, photo = ?, color = ?, highlights = ?, coordinatorName = ?, treasurerName = ? WHERE id = ?',
      [
        next.name,
        next.location,
        next.description,
        next.meetingDay,
        next.photo,
        next.color,
        JSON.stringify(next.highlights),
        next.coordinatorName,
        next.treasurerName,
        branchId,
      ],
    )
    state = await loadMysqlState()
    res.json(next)
    return
  }

  let updatedBranch = null
  state.branches = state.branches.map((item) => {
    if (item.id !== branchId) {
      return item
    }

    updatedBranch = { ...item, ...parsed.data }
    return updatedBranch
  })

  res.json(updatedBranch)
})

app.delete('/api/branches/:id', async (req, res) => {
  const branchId = req.params.id

  if (isMysqlReady()) {
    try {
      await getPool().execute('DELETE FROM branches WHERE id = ?', [branchId])
      state = await loadMysqlState()
      res.status(204).end()
      return
    } catch {
      res.status(409).json({ message: 'Branch cannot be deleted while linked members exist.' })
      return
    }
  }

  state.branches = state.branches.filter((item) => item.id !== branchId)
  state.members = state.members.filter((item) => item.branchId !== branchId)
  res.status(204).end()
})

app.post('/api/members', upload.single('photo'), async (req, res) => {
  const parsed = memberSchema.safeParse({
    ...req.body,
    username: normalizeUsername(req.body?.username ?? ''),
  })

  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid member data.' })
    return
  }

  const current = await getCurrentState()
  const payload = parsed.data
  const branch = current.branches.find((item) => item.id === payload.branchId)

  if (!branch) {
    res.status(404).json({ message: 'Selected branch not found.' })
    return
  }

  if (current.members.some((item) => normalizeUsername(item.username || '') === payload.username)) {
    res.status(409).json({ message: 'That username is already in use.' })
    return
  }

  const avatar = req.file
    ? buildPhotoUrl(req.file.filename)
    : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(payload.name)}&backgroundColor=165fa6`
  const coverPhoto = defaultMemberCover(payload.branchId)

  const member = {
    id: `m-${Date.now()}`,
    membershipCode: nextMembershipCode(current.members, payload.branchId),
    name: payload.name,
    username: payload.username,
    role: payload.role,
    title: payload.title,
    branchId: payload.branchId,
    phone: payload.phone,
    email: payload.email,
    dateOfBirth: normalizeDateOnly(payload.dateOfBirth),
    placeOfBirth: payload.placeOfBirth,
    maritalStatus: payload.maritalStatus,
    homeAddress: payload.homeAddress,
    profession: payload.profession,
    joinedYear: new Date().getFullYear(),
    avatar,
    coverPhoto,
    status: 'active',
    approvalStatus: 'approved',
    approvedBy: 'Administrative enrollment',
    approvedAt: new Date().toISOString(),
    city: payload.city || branch.location,
  }

  try {
    if (isMysqlReady()) {
      await getPool().execute(
        `INSERT INTO members
         (id, membershipCode, name, username, role, title, branchId, phone, email, dateOfBirth, placeOfBirth, maritalStatus, homeAddress, profession, joinedYear, avatar, coverPhoto, passwordHash, status, approvalStatus, approvedBy, approvedAt, city)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          member.id,
          member.membershipCode,
          member.name,
          member.username,
          member.role,
          member.title,
          member.branchId,
          member.phone,
          member.email,
          member.dateOfBirth,
          member.placeOfBirth,
          member.maritalStatus,
          member.homeAddress,
          member.profession,
          member.joinedYear,
          member.avatar,
          member.coverPhoto,
          hashPassword(payload.password),
          member.status,
          member.approvalStatus,
          member.approvedBy,
          mysqlDateTime(new Date(member.approvedAt)),
          member.city,
        ],
      )
      state = await loadMysqlState()
    } else {
      state.members.unshift(member)
      demoCredentials.set(member.username, { id: member.id, passwordHash: hashPassword(payload.password) })
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: 'That username is already in use.' })
      return
    }

    throw error
  }

  res.status(201).json(member)
})

app.patch('/api/members/:id/approval', async (req, res) => {
  const parsed = approvalSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid approval update.' })
    return
  }

  const memberId = req.params.id
  const current = await getCurrentState()
  const member = current.members.find((item) => item.id === memberId)
  if (!member) {
    res.status(404).json({ message: 'Member not found.' })
    return
  }

  const approvedAt = parsed.data.approvalStatus === 'approved' ? mysqlDateTime(new Date()) : null

  if (isMysqlReady()) {
    await getPool().execute(
      'UPDATE members SET approvalStatus = ?, approvedBy = ?, approvedAt = ? WHERE id = ?',
      [parsed.data.approvalStatus, parsed.data.approvedBy, approvedAt, memberId],
    )
    state = await loadMysqlState()
  } else {
    state.members = state.members.map((item) =>
      item.id === memberId
        ? {
            ...item,
            approvalStatus: parsed.data.approvalStatus,
            approvedBy: parsed.data.approvedBy,
            approvedAt: approvedAt ? approvedAt.replace(' ', 'T') : null,
          }
        : item,
    )
  }

  const nextState = await getCurrentState()
  res.json(nextState.members.find((item) => item.id === memberId))
})

app.patch('/api/members/:id/status', async (req, res) => {
  const status = req.body?.status
  if (!['active', 'suspended', 'dismissed'].includes(status)) {
    res.status(400).json({ message: 'Invalid member status.' })
    return
  }

  const memberId = req.params.id
  const current = await getCurrentState()
  if (!current.members.some((item) => item.id === memberId)) {
    res.status(404).json({ message: 'Member not found.' })
    return
  }

  if (isMysqlReady()) {
    await getPool().execute('UPDATE members SET status = ? WHERE id = ?', [status, memberId])
    state = await loadMysqlState()
  } else {
    state.members = state.members.map((item) =>
      item.id === memberId ? { ...item, status } : item,
    )
  }

  const nextState = await getCurrentState()
  res.json(nextState.members.find((item) => item.id === memberId))
})

app.put('/api/members/:id', upload.single('photo'), async (req, res) => {
  const parsed = memberUpdateSchema.safeParse({
    ...req.body,
    username: normalizeUsername(req.body?.username ?? ''),
  })
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid member update.' })
    return
  }

  const memberId = req.params.id
  const current = await getCurrentState()
  const existing = current.members.find((item) => item.id === memberId)
  if (!existing) {
    res.status(404).json({ message: 'Member not found.' })
    return
  }

  const branch = current.branches.find((item) => item.id === parsed.data.branchId)
  if (!branch) {
    res.status(404).json({ message: 'Selected branch not found.' })
    return
  }

  if (
    current.members.some(
      (item) => item.id !== memberId && normalizeUsername(item.username || '') === parsed.data.username,
    )
  ) {
    res.status(409).json({ message: 'That username is already in use.' })
    return
  }

  const branchChanged = existing.branchId !== parsed.data.branchId
  const membershipCode = branchChanged
    ? nextMembershipCode(current.members.filter((item) => item.id !== memberId), parsed.data.branchId)
    : existing.membershipCode
  const nextMember = {
    ...existing,
    ...parsed.data,
    membershipCode,
    dateOfBirth: normalizeDateOnly(parsed.data.dateOfBirth),
    avatar: req.file ? buildPhotoUrl(req.file.filename) : existing.avatar,
    city: parsed.data.city || branch.location,
  }

  if (isMysqlReady()) {
    await getPool().execute(
      `UPDATE members
       SET membershipCode = ?, name = ?, username = ?, role = ?, title = ?, branchId = ?, phone = ?, email = ?,
           dateOfBirth = ?, placeOfBirth = ?, maritalStatus = ?, homeAddress = ?, profession = ?, avatar = ?, city = ?
       WHERE id = ?`,
      [
        nextMember.membershipCode,
        nextMember.name,
        nextMember.username,
        nextMember.role,
        nextMember.title,
        nextMember.branchId,
        nextMember.phone,
        nextMember.email,
        nextMember.dateOfBirth,
        nextMember.placeOfBirth,
        nextMember.maritalStatus,
        nextMember.homeAddress,
        nextMember.profession,
        nextMember.avatar,
        nextMember.city,
        memberId,
      ],
    )
    state = await loadMysqlState()
  } else {
    state.members = state.members.map((item) => (item.id === memberId ? nextMember : item))
  }

  const nextState = await getCurrentState()
  res.json(nextState.members.find((item) => item.id === memberId))
})

app.patch('/api/members/:id/profile', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
]), async (req, res) => {
  const parsed = ownProfileSchema.safeParse(req.body)
  const uploadedFiles = req.files || {}
  const photoFile = uploadedFiles.photo?.[0] || null
  const coverPhotoFile = uploadedFiles.coverPhoto?.[0] || null
  const hasProfileFields = ['phone', 'email', 'maritalStatus', 'homeAddress', 'profession'].some(
    (field) => typeof req.body?.[field] !== 'undefined',
  )

  if ((!parsed.success && hasProfileFields) || (!parsed.success && !photoFile && !coverPhotoFile)) {
    res.status(400).json({ message: 'Invalid profile update.' })
    return
  }

  const memberId = req.params.id
  const current = await getCurrentState()
  const existing = current.members.find((item) => item.id === memberId)
  if (!existing) {
    res.status(404).json({ message: 'Member not found.' })
    return
  }

  const nextMember = {
    ...existing,
    ...(parsed.success ? parsed.data : {}),
    avatar: photoFile ? buildPhotoUrl(photoFile.filename) : existing.avatar,
    coverPhoto: coverPhotoFile ? buildPhotoUrl(coverPhotoFile.filename) : existing.coverPhoto,
  }

  if (isMysqlReady()) {
    await getPool().execute(
      `UPDATE members
       SET phone = ?, email = ?, maritalStatus = ?, homeAddress = ?, profession = ?, avatar = ?, coverPhoto = ?
       WHERE id = ?`,
      [
        nextMember.phone,
        nextMember.email,
        nextMember.maritalStatus,
        nextMember.homeAddress,
        nextMember.profession,
        nextMember.avatar,
        nextMember.coverPhoto,
        memberId,
      ],
    )
    state = await loadMysqlState()
  } else {
    state.members = state.members.map((item) => (item.id === memberId ? nextMember : item))
  }

  const nextState = await getCurrentState()
  res.json(nextState.members.find((item) => item.id === memberId))
})

app.delete('/api/members/:id', async (req, res) => {
  const memberId = req.params.id

  if (isMysqlReady()) {
    await getPool().execute('DELETE FROM members WHERE id = ?', [memberId])
    state = await loadMysqlState()
  } else {
    state.members = state.members.filter((item) => item.id !== memberId)
  }

  res.status(204).end()
})

app.post('/api/contributions', async (req, res) => {
  const parsed = contributionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid contribution payload.' })
    return
  }

  const current = await getCurrentState()
  const payload = parsed.data
  const member = current.members.find((item) => item.id === payload.memberId)
  const event = current.events.find((item) => item.id === payload.eventId)

  if (!member) {
    res.status(404).json({ message: 'Member not found.' })
    return
  }

  if (!event) {
    res.status(404).json({ message: 'Event not found.' })
    return
  }

  if (!isActiveApprovedMember(member)) {
    res.status(409).json({ message: 'Only approved active members can be recorded for contributions.' })
    return
  }

  if (!isEligibleForEvent(member, event)) {
    res.status(409).json({ message: 'This member is not eligible for the selected event scope.' })
    return
  }

  const contribution = {
    id: `c-${Date.now()}`,
    eventId: payload.eventId,
    memberId: payload.memberId,
    branchId: member.branchId,
    amount: payload.amount,
    date: new Date().toISOString().slice(0, 10),
    kind: payload.kind,
  }

  if (isMysqlReady()) {
    await getPool().execute(
      'INSERT INTO contributions (id, eventId, memberId, branchId, amount, `date`, kind) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        contribution.id,
        contribution.eventId,
        contribution.memberId,
        contribution.branchId,
        contribution.amount,
        contribution.date,
        contribution.kind,
      ],
    )
    await getPool().execute('UPDATE events SET raisedAmount = raisedAmount + ? WHERE id = ?', [
      contribution.amount,
      contribution.eventId,
    ])
    state = await loadMysqlState()
  } else {
    state.contributions.unshift(contribution)
    updateDemoEventRaisedAmount(contribution.eventId, contribution.amount)
  }

  res.status(201).json(contribution)
})

app.patch('/api/events/:id/finance', async (req, res) => {
  const parsed = eventFinanceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid event finance payload.' })
    return
  }

  const eventId = req.params.id
  const current = await getCurrentState()
  const event = current.events.find((item) => item.id === eventId)

  if (!event) {
    res.status(404).json({ message: 'Event not found.' })
    return
  }

  if (isMysqlReady()) {
    await getPool().execute('UPDATE events SET expenditure = ? WHERE id = ?', [
      parsed.data.expenditure,
      eventId,
    ])
    state = await loadMysqlState()
  } else {
    updateDemoEventExpenditure(eventId, parsed.data.expenditure)
  }

  const nextState = await getCurrentState()
  res.json(nextState.events.find((item) => item.id === eventId))
})

app.post('/api/events/:id/images', upload.array('images', 12), async (req, res) => {
  const eventId = req.params.id
  const files = Array.isArray(req.files) ? req.files : []
  if (!files.length) {
    res.status(400).json({ message: 'Select one or more gallery images to upload.' })
    return
  }

  const current = await getCurrentState()
  const event = current.events.find((item) => item.id === eventId)
  if (!event) {
    res.status(404).json({ message: 'Event not found.' })
    return
  }

  if (event.status !== 'past') {
    res.status(409).json({ message: 'Gallery images can only be added to past events.' })
    return
  }

  const startOrder =
    Math.max(
      0,
      ...current.eventImages
        .filter((item) => item.eventId === eventId)
        .map((item) => Number(item.sortOrder || 0)),
    ) + 1

  const createdImages = files.map((file, index) => ({
    id: createId('event-image'),
    eventId,
    imageUrl: buildPhotoUrl(file.filename),
    sortOrder: startOrder + index,
    createdAt: mysqlDateTime(new Date()),
  }))

  if (isMysqlReady()) {
    for (const image of createdImages) {
      await getPool().execute(
        'INSERT INTO event_images (id, eventId, imageUrl, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?)',
        [image.id, image.eventId, image.imageUrl, image.sortOrder, image.createdAt],
      )
    }
    state = await loadMysqlState()
  } else {
    addDemoEventImages(createdImages)
  }

  const nextState = await getCurrentState()
  res.status(201).json(nextState.eventImages.filter((item) => item.eventId === eventId))
})

app.delete('/api/event-images/:id', async (req, res) => {
  const eventImageId = req.params.id
  const current = await getCurrentState()
  const existingImage = current.eventImages.find((item) => item.id === eventImageId)
  if (!existingImage) {
    res.status(404).json({ message: 'Event image not found.' })
    return
  }

  if (isMysqlReady()) {
    await getPool().execute('DELETE FROM event_images WHERE id = ?', [eventImageId])
    state = await loadMysqlState()
  } else {
    removeDemoEventImage(eventImageId)
  }

  if (existingImage.imageUrl.startsWith('/uploads/')) {
    const filePath = path.join(uploadsDir, existingImage.imageUrl.replace('/uploads/', ''))
    await fs.unlink(filePath).catch(() => undefined)
  }

  res.status(204).end()
})

app.post('/api/posts', async (req, res) => {
  const parsed = postSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid post payload.' })
    return
  }

  const current = await getCurrentState()
  const author = current.members.find((item) => item.id === parsed.data.authorId)
  if (!author) {
    res.status(404).json({ message: 'Author not found.' })
    return
  }

  const post = {
    id: `p-${Date.now()}`,
    authorId: parsed.data.authorId,
    branchId: author.branchId,
    type: parsed.data.type,
    content: parsed.data.content,
    createdAt: new Date().toISOString(),
    media:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    attachments: parsed.data.type === 'file' ? ['Shared-note.pdf'] : [],
    reactions: 0,
    comments: 0,
  }

  if (isMysqlReady()) {
    await getPool().execute(
      'INSERT INTO posts (id, authorId, branchId, type, content, createdAt, media, attachments, reactions, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        post.id,
        post.authorId,
        post.branchId,
        post.type,
        post.content,
        post.createdAt,
        post.media,
        JSON.stringify(post.attachments),
        post.reactions,
        post.comments,
      ],
    )
    state = await loadMysqlState()
  } else {
    state.posts.unshift(post)
  }

  res.status(201).json(post)
})

app.post('/api/announcements', async (req, res) => {
  const parsed = announcementSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid announcement payload.' })
    return
  }

  const announcement = {
    id: `a-${Date.now()}`,
    title: parsed.data.title,
    message: parsed.data.message,
    audience: parsed.data.audience,
    createdAt: new Date().toISOString(),
    authorId: parsed.data.authorId,
    channel: parsed.data.channel,
  }

  if (isMysqlReady()) {
    await getPool().execute(
      'INSERT INTO announcements (id, title, message, audience, createdAt, authorId, channel) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        announcement.id,
        announcement.title,
        announcement.message,
        announcement.audience,
        announcement.createdAt,
        announcement.authorId,
        announcement.channel,
      ],
    )
    state = await loadMysqlState()
  } else {
    state.announcements.unshift(announcement)
  }

  res.status(201).json(announcement)
})

async function registerFrontendRoutes() {
  try {
    await fs.access(distIndexPath)
  } catch {
    return
  }

  app.use(express.static(distDir))
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(distIndexPath)
  })
}

async function start() {
  await fs.mkdir(uploadsDir, { recursive: true })
  await initDatabase()
  await ensureDatabaseSchema()
  await seedDatabaseIfEmpty()
  state = await getCurrentState()
  await registerFrontendRoutes()

  app.listen(port, () => {
    console.log(`Circle of Friends server running on http://localhost:${port}`)
    console.log(getDatabaseStatus().message)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
