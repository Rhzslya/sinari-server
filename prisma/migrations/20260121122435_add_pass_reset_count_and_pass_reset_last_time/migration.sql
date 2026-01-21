-- AlterTable
ALTER TABLE `users` ADD COLUMN `pass_reset_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `pass_reset_last_time` DATETIME(3) NULL;
