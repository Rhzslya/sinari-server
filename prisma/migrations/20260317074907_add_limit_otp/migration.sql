-- AlterTable
ALTER TABLE `trusted_devices` ADD COLUMN `otp_failed_attempts` INTEGER NOT NULL DEFAULT 0;
