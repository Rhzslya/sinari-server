-- AlterTable
ALTER TABLE `users` ADD COLUMN `last_resend_time` DATETIME(3) NULL,
    ADD COLUMN `resend_count` INTEGER NOT NULL DEFAULT 0;
