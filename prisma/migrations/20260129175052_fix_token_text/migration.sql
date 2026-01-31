-- DropIndex
DROP INDEX `users_token_key` ON `users`;

-- AlterTable
ALTER TABLE `users` MODIFY `token` TEXT NULL;
