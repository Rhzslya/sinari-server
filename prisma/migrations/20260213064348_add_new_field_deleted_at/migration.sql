-- AlterTable
ALTER TABLE `services` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `services_deleted_at_idx` ON `services`(`deleted_at`);
