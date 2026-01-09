# Sinari App - Server (Backend)

![Bun](https://img.shields.io/badge/Bun-Black?style=for-the-badge&logo=bun&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E34F26?style=for-the-badge&logo=hono&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)

This is the backend API for **Sinari Cell** (Mobile Service Management & Point of Sale application). It is built with a focus on high performance, strict type safety, and clean architecture using modern web technologies.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [Hono](https://hono.dev)
- **Language:** TypeScript
- **Database:** MariaDB
- **ORM:** Prisma V7
- **Validation:** Zod
- **Testing:** Bun Test
- **Authentication:** JWT (Bearer Token) & Google OAuth 2.0

## Key Features

- **Authentication System:**
  - Secure Login & Registration using Email/Password (Bcrypt hashing).
  - **Google OAuth Integration** for seamless sign-in.
  - Token-based Authentication (Bearer Token).
- **User Management:** Secure profile updates and data retrieval.
- **Robust Error Handling:** Centralized Error Middleware to handle Zod validation errors, Prisma exceptions, and custom application errors.
- **Unit Testing:** Comprehensive test suite covering authentication logic and user flows.
- **Type Safety:** End-to-end type safety from the database schema to the API response.

## Prerequisites

Before running this project, ensure you have the following installed:

- [Bun](https://bun.sh) (v1.0 or later)
- MariaDB or MySQL Database

## Installation

1. **Clone the Repository**

   ```bash
   git clone [https://github.com/YOUR_USERNAME/sinari-app-server.git](https://github.com/YOUR_USERNAME/sinari-app-server.git)
   cd sinari-app-server
   ```

2. **Install Dependencies**

   ```bash
   bun install
   ```

3. **Setup Environment Variables**
   `cp .env.example .env`

4. **Database Migration**

   ```
   bun x prisma migrate dev --name init
   ```

5. **Start the Server**

   ```bash
   bun run dev
   ```
