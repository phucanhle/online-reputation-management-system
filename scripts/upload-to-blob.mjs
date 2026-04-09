import { put } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env if running locally
dotenv.config();

async function upload() {
  const filePath = path.join(process.cwd(), 'final-data.db');
  console.log(`Reading file from ${filePath}...`);
  
  try {
    const fileContent = await fs.readFile(filePath);
    console.log(`Uploading ${fileContent.length} bytes to Vercel Blob...`);
    
    const { url } = await put('final-data.db', fileContent, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    console.log(`\n✅ Successfully uploaded!`);
    console.log(`🌍 Cloud Storage URL: ${url}`);
  } catch (error) {
    console.error('❌ Error uploading to Vercel Blob:', error);
    process.exit(1);
  }
}

upload();
