import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function runBackup() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("Error: Variabel DATABASE_URL atau DIRECT_URL tidak ditemukan di environment.");
    process.exit(1);
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

  console.log(`Memulai backup database PostgreSQL OMPN 2026...`);
  console.log(`Target file: ${backupFile}`);

  try {
    // Jalankan pg_dump menggunakan url koneksi
    execSync(`pg_dump "${dbUrl}" --no-owner --no-privileges -F p -f "${backupFile}"`, {
      stdio: "inherit",
    });
    console.log(`\nBackup database berhasil disimpan di: ${backupFile}`);
  } catch {
    console.warn("\nCatatan: Perintah 'pg_dump' memerlukan utilitas PostgreSQL Client terinstall pada sistem.");
    console.log(`Untuk restore database dari file backup, jalankan:`);
    console.log(`psql "<DATABASE_URL>" < "${backupFile}"`);
  }
}

runBackup();
