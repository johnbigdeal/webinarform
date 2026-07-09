-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "webinarEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "youtubeVideoId" TEXT;

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_formId_idx" ON "ChatMessage"("formId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
