/*
  Warnings:

  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `is_active`,
    ADD COLUMN `deleted_at` DATETIME(3) NULL;
