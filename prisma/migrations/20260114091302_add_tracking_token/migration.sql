/*
  Warnings:

  - A unique constraint covering the columns `[tracking_token]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - The required column `tracking_token` was added to the `services` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `services` ADD COLUMN `tracking_token` VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `services_tracking_token_key` ON `services`(`tracking_token`);
