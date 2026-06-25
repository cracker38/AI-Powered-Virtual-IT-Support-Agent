/*
  Warnings:

  - Added the required column `ticketNumber` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expertise" TEXT NOT NULL,
    "currentWorkload" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Technician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicketCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedExpertise" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "technicianId" TEXT,
    "userId" TEXT,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketMessage_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailUpdates" BOOLEAN NOT NULL DEFAULT true,
    "smsUpdates" BOOLEAN NOT NULL DEFAULT false,
    "inAppUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'LOW',
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "assignedTechnicianId" TEXT,
    "estimatedResolutionTime" DATETIME,
    "slaBreachTime" DATETIME,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "resolutionNotes" TEXT,
    "isAutoEscalated" BOOLEAN NOT NULL DEFAULT false,
    "chatHistory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TicketCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_assignedTechnicianId_fkey" FOREIGN KEY ("assignedTechnicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("createdAt", "description", "id", "priority", "status", "title", "updatedAt", "userId") SELECT "createdAt", "description", "id", "priority", "status", "title", "updatedAt", "userId" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Technician_userId_key" ON "Technician"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketCategory_name_key" ON "TicketCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
