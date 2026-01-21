/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verify_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[password_reset_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `password_reset_expires_at` DATETIME(3) NULL,
    ADD COLUMN `password_reset_token` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_token_key` ON `users`(`token`);

-- CreateIndex
CREATE UNIQUE INDEX `users_verify_token_key` ON `users`(`verify_token`);

-- CreateIndex
CREATE UNIQUE INDEX `users_password_reset_token_key` ON `users`(`password_reset_token`);
