-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "chunkCount" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "QueryLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "answeredSuccessfully" BOOLEAN NOT NULL DEFAULT true,
    "responseTimeMs" INTEGER,
    "tokenCount" INTEGER,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QueryLog" ADD CONSTRAINT "QueryLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryLog" ADD CONSTRAINT "QueryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
