-- CreateTable
CREATE TABLE `store_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `store_name` VARCHAR(100) NOT NULL,
    `store_address` TEXT NOT NULL,
    `store_phone` VARCHAR(20) NOT NULL,
    `store_email` VARCHAR(100) NULL,
    `store_website` VARCHAR(100) NULL,
    `warranty_text` TEXT NOT NULL,
    `payment_info` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
