-- AlterTable
ALTER TABLE `product_logs` ADD COLUMN `total_profit` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `total_revenue` INTEGER NOT NULL DEFAULT 0;
