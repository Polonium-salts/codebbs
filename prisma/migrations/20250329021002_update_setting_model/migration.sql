/*
  Warnings:

  - The primary key for the `Setting` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flag" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'string',

    PRIMARY KEY ("key", "type")
);
INSERT INTO "new_Setting" ("key", "type", "value") SELECT "key", "type", "value" FROM "Setting";
DROP TABLE "Setting";
ALTER TABLE "new_Setting" RENAME TO "Setting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");
