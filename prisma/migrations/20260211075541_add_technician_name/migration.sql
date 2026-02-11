-- DropForeignKey
ALTER TABLE `services` DROP FOREIGN KEY `services_technician_id_fkey`;

-- DropIndex
DROP INDEX `services_technician_id_fkey` ON `services`;

-- AlterTable
ALTER TABLE `services` MODIFY `technician_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_technician_id_fkey` FOREIGN KEY (`technician_id`) REFERENCES `technicians`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
