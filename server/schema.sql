CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  location VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  meetingDay VARCHAR(120) NOT NULL,
  photo TEXT NOT NULL,
  color VARCHAR(20) NOT NULL,
  highlights JSON NOT NULL,
  coordinatorName VARCHAR(120) NOT NULL,
  treasurerName VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS executives (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  portfolio VARCHAR(120) NOT NULL,
  bio TEXT NOT NULL,
  avatar TEXT NOT NULL,
  phone VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id VARCHAR(64) PRIMARY KEY,
  membershipCode VARCHAR(80) NULL,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(80) NULL,
  role ENUM(
    'member',
    'super_admin',
    'admin',
    'general_coordinator',
    'secretary_general',
    'general_treasurer',
    'branch_coordinator',
    'branch_treasurer'
  ) NOT NULL,
  title VARCHAR(160) NOT NULL,
  branchId VARCHAR(64) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(160) NULL,
  dateOfBirth DATE NULL,
  placeOfBirth VARCHAR(160) NULL,
  maritalStatus ENUM('single', 'married', 'divorced', 'widowed') NULL,
  homeAddress TEXT NULL,
  profession VARCHAR(160) NULL,
  joinedYear INT NOT NULL,
  avatar TEXT NOT NULL,
  coverPhoto TEXT NULL,
  passwordHash TEXT NULL,
  status ENUM('active', 'suspended', 'dismissed') NOT NULL DEFAULT 'active',
  approvalStatus ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  approvedBy VARCHAR(120) NULL,
  approvedAt DATETIME NULL,
  city VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_member_branch FOREIGN KEY (branchId) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  type ENUM('wedding', 'member-funeral', 'family-funeral', 'charity', 'community') NOT NULL,
  status ENUM('upcoming', 'ongoing', 'past') NOT NULL,
  `date` DATE NOT NULL,
  venue VARCHAR(180) NOT NULL,
  summary TEXT NOT NULL,
  minContribution INT NOT NULL,
  targetAmount INT NOT NULL,
  raisedAmount INT NOT NULL,
  expenditure INT NOT NULL DEFAULT 0,
  hero TEXT NOT NULL,
  branchScope VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_images (
  id VARCHAR(64) PRIMARY KEY,
  eventId VARCHAR(64) NOT NULL,
  imageUrl TEXT NOT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_image_event FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contributions (
  id VARCHAR(64) PRIMARY KEY,
  eventId VARCHAR(64) NOT NULL,
  memberId VARCHAR(64) NOT NULL,
  branchId VARCHAR(64) NOT NULL,
  amount INT NOT NULL,
  `date` DATE NOT NULL,
  kind ENUM('ongoing', 'late') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contribution_event FOREIGN KEY (eventId) REFERENCES events(id),
  CONSTRAINT fk_contribution_member FOREIGN KEY (memberId) REFERENCES members(id),
  CONSTRAINT fk_contribution_branch FOREIGN KEY (branchId) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(64) PRIMARY KEY,
  authorId VARCHAR(64) NOT NULL,
  branchId VARCHAR(64) NOT NULL,
  type ENUM('photo', 'video', 'file', 'update') NOT NULL,
  content TEXT NOT NULL,
  createdAt DATETIME NOT NULL,
  media TEXT NOT NULL,
  attachments JSON NOT NULL,
  reactions INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_post_member FOREIGN KEY (authorId) REFERENCES members(id),
  CONSTRAINT fk_post_branch FOREIGN KEY (branchId) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  audience VARCHAR(160) NOT NULL,
  createdAt DATETIME NOT NULL,
  authorId VARCHAR(64) NOT NULL,
  channel ENUM('website', 'website+whatsapp') NOT NULL,
  CONSTRAINT fk_announcement_member FOREIGN KEY (authorId) REFERENCES members(id)
);
