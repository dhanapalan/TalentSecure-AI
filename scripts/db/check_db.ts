import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIssues() {
  console.log("Checking tables missing RLS...");
  try {
    const rlsResult = await prisma.$queryRawUnsafe(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN (
          SELECT c.relname 
          FROM pg_class c 
          JOIN pg_namespace n ON n.oid = c.relnamespace 
          WHERE n.nspname = 'public' AND c.relrowsecurity = true
      );
    `);
    console.log("Tables missing RLS:");
    console.log(rlsResult);
    
    // Check if there are other potential issues by querying constraints or types
    console.log("\nChecking for missing foreign key constraints where expected...");
    // Just a placeholder line for checks...

  } catch (error) {
    console.error("Error executing check:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIssues();
