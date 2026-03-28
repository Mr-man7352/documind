-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
ADD COLUMN     "suggestedQuestions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "welcomeMessage" TEXT NOT NULL DEFAULT 'Hi! Ask me anything about our docs.';
