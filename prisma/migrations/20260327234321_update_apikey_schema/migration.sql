/*
  Warnings:

  - You are about to drop the column `key` on the `ApiKey` table. All the data in the column will be lost.
  - Added the required column `keyHash` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyPrefix` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApiKey_key_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "key",
ADD COLUMN     "keyHash" TEXT NOT NULL,
ADD COLUMN     "keyPrefix" TEXT NOT NULL,
ADD COLUMN     "rateLimit" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "revokedAt" TIMESTAMP(3);
