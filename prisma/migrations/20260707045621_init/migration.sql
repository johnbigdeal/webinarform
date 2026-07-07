-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'CHOICE', 'MULTI', 'SCALE', 'RATING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "submitLabel" JSONB NOT NULL DEFAULT '{"en":"Submit","es":"Enviar"}',
    "thankYou" JSONB,
    "logoUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#2563eb',
    "webhookUrl" TEXT,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "label" JSONB NOT NULL,
    "helpText" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB NOT NULL DEFAULT '[]',
    "scaleConfig" JSONB,
    "logic" JSONB NOT NULL DEFAULT '[]',
    "points" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDay" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" JSONB NOT NULL,
    "autoTag" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTag" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "FormTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "eventDayId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "attempt" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "responseBody" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");

-- CreateIndex
CREATE INDEX "Form_ownerId_idx" ON "Form"("ownerId");

-- CreateIndex
CREATE INDEX "Question_formId_idx" ON "Question"("formId");

-- CreateIndex
CREATE INDEX "EventDay_formId_idx" ON "EventDay"("formId");

-- CreateIndex
CREATE INDEX "FormTag_formId_idx" ON "FormTag"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "FormTag_formId_tag_key" ON "FormTag"("formId", "tag");

-- CreateIndex
CREATE INDEX "Submission_formId_idx" ON "Submission"("formId");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_submissionId_idx" ON "WebhookDelivery"("submissionId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDay" ADD CONSTRAINT "EventDay_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTag" ADD CONSTRAINT "FormTag_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
