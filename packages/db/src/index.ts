import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
// Use generated client (required for Prisma 7 + deploy). Do not use "@prisma/client" here.
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString })
const prismaClient = new PrismaClient({ adapter })

export { prismaClient }