# Sinari App - Server (Backend)

![Bun](https://img.shields.io/badge/Bun-Black?style=for-the-badge&logo=bun&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E34F26?style=for-the-badge&logo=hono&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

This is the backend API for **Sinari**. Built with a focus on high performance, strict type safety, clean architecture, and automated customer communication using modern web technologies.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [Hono](https://hono.dev)
- **Language:** TypeScript
- **Database & ORM:** MariaDB with Prisma V7
- **Caching & Rate Limiting:** Redis (Upstash)
- **Media Storage:** Cloudinary
- **Bot Integration:** whatsapp-web.js
- **Mailing:** Nodemailer
- **Validation:** Zod
- **Logging:** Winston

## Key Features

- **Authentication & Authorization:**
  - Secure Login & Registration using Email/Password (Bcrypt hashing).
  - **Google OAuth 2.0 Integration** for seamless sign-in.
  - Role-Based Access Control (RBAC) to protect specific routes and internal data.
- **Store Management & Service Tracking:**
  - Comprehensive API for inventory and product management.
  - Real-time customer service tracking utilizing unique identifier tokens.
- **Automated Communication:**
  - **WhatsApp Bot Integration:** Automated customer support, product status checking, and greeting messages.
  - Email notification system powered by Nodemailer.
- **Performance & Security:**
  - Redis-backed caching for high-speed data retrieval.
  - Robust API Rate Limiting to prevent abuse and ensure stability.
  - Centralized error handling and structured logging with Winston.
- **Media Management:**
  - Integrated image uploading and cloud processing via Cloudinary.

## Prerequisites

Before running this project, ensure you have the following installed and configured:

- [Bun](https://bun.sh) (latest version recommended)
- MariaDB or MySQL Database
- Redis Server (or Upstash Redis URL)
- Cloudinary Account Credentials
- Google OAuth Client ID & Secret
- WhatsApp Account (for bot QR code authentication)

## Installation

1. **Clone the Repository**

   ```bash
   git clone [https://github.com/Rhzslya/sinari-app-server.git](https://github.com/Rhzslya/sinari-app-server.git)
   cd sinari-app-server
   ```

2. **Install Dependencies**

   ```bash
   bun install
   ```

3. **Setup Environment Variables**

   ```bash
   cp .env.example .env
   ```

4. **Database Migration**

   ```bash
   bunx prisma db push
   ```

5. **Start the Server**
   ```bash
   bun run dev
   ```

## Testing

To run the test suite, execute the following command:

```bash
bun test
```

## Deployment
