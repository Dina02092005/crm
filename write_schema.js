const fs = require('fs');
const schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = "postgresql://postgres:password@localhost:5432/crm_db"
}

enum Role {
  ADMIN
  MANAGER
  EMPLOYEE
}

enum LeadSource {
  WEBSITE_1
  WEBSITE_2
  WEBSITE_3
  WEBSITE_4
}

enum LeadStatus {
  NEW
  ASSIGNED
  IN_PROGRESS
  FOLLOW_UP
  CONVERTED
  LOST
}

enum LeadTemperature {
  COLD
  WARM
  HOT
}

enum LeadActivityType {
  NOTE
  CALL
  EMAIL
  WHATSAPP
  STATUS_CHANGE
  TEMPERATURE_CHANGE
  DOCUMENT_UPLOAD
  TASK_CREATED
}

enum TaskStatus {
  PENDING
  COMPLETED
  CANCELLED
}

enum DocumentType {
  QUOTATION
  REQUIREMENT
  ID_PROOF
  OTHER
}

model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role     @default(EMPLOYEE)
  isActive      Boolean  @default(true)
  
  // Auth Verification
  emailVerified DateTime?
  otp           String?
  otpExpiresAt  DateTime?

  employeeProfile EmployeeProfile?

  assignedLeads   LeadAssignment[] @relation("AssignedTo")
  managedLeads    LeadAssignment[] @relation("AssignedBy")
  activities      LeadActivity[]
  tasks           LeadTask[]
  documents       LeadDocument[]
  auditLogs       AuditLog[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model EmployeeProfile {
  id          String @id @default(uuid())
  userId      String @unique
  phone       String?
  department  String?

  user        User   @relation(fields: [userId], references: [id])
}

model Lead {
  id            String           @id @default(uuid())
  name          String
  email         String?
  phone         String
  message       String?
  source        LeadSource

  status        LeadStatus       @default(NEW)
  temperature   LeadTemperature  @default(COLD)

  assignments   LeadAssignment[]
  activities    LeadActivity[]
  tasks         LeadTask[]
  documents     LeadDocument[]

  customer      Customer?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([phone])
  @@index([status])
  @@index([temperature])
}

model LeadAssignment {
  id          String   @id @default(uuid())
  leadId      String
  assignedTo  String
  assignedBy  String

  lead        Lead @relation(fields: [leadId], references: [id])
  employee    User @relation("AssignedTo", fields: [assignedTo], references: [id])
  admin       User @relation("AssignedBy", fields: [assignedBy], references: [id])

  assignedAt  DateTime @default(now())
}

model LeadActivity {
  id        String             @id @default(uuid())
  leadId    String
  userId    String
  type      LeadActivityType
  content   String?
  meta      Json?

  lead      Lead @relation(fields: [leadId], references: [id])
  user      User @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())

  @@index([leadId])
  @@index([type])
}

model LeadTask {
  id          String     @id @default(uuid())
  leadId      String
  assignedTo  String
  title       String
  description String?
  dueAt       DateTime
  status      TaskStatus @default(PENDING)

  lead        Lead @relation(fields: [leadId], references: [id])
  user        User @relation(fields: [assignedTo], references: [id])
  reminders   Reminder[]

  createdAt   DateTime @default(now())
  completedAt DateTime?
}

model Reminder {
  id        String   @id @default(uuid())
  taskId    String
  remindAt  DateTime
  isSent    Boolean  @default(false)

  task      LeadTask @relation(fields: [taskId], references: [id])
}

model LeadDocument {
  id          String       @id @default(uuid())
  leadId      String
  uploadedBy  String
  type        DocumentType
  fileName    String
  fileUrl     String

  lead        Lead @relation(fields: [leadId], references: [id])
  user        User @relation(fields: [uploadedBy], references: [id])

  createdAt   DateTime @default(now())
}

model Customer {
  id          String   @id @default(uuid())
  leadId      String   @unique
  name        String
  email       String?
  phone       String
  onboardedBy String

  lead        Lead @relation(fields: [leadId], references: [id])
  user        User @relation(fields: [onboardedBy], references: [id])

  createdAt   DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String
  entity    String
  entityId  String
  metadata  Json?

  user      User @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
`;
fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('Schema written successfully');
