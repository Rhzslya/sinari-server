/*
  Warnings:

  - You are about to drop the column `otp_failed_attempts` on the `trusted_devices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `trusted_devices` DROP COLUMN `otp_failed_attempts`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `otp_failed_attempts` INTEGER NOT NULL DEFAULT 0;
