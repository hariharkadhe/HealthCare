import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let memoryServer: any = null;

export async function connectDB(): Promise<string> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medicare_pro';
  const useMemory = process.env.USE_MEMORY_DB;

  if (useMemory === 'true') {
    return await startMemoryDB();
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3500,
    });
    console.log(`[MongoDB] Connected successfully to: ${uri}`);
    return uri;
  } catch (err: any) {
    if (useMemory === 'auto' || !process.env.MONGODB_URI) {
      console.warn(`[MongoDB] External MongoDB connection failed (${err.message}). Initializing embedded database fallback...`);
      return await startMemoryDB();
    } else {
      console.error('[MongoDB] Connection error:', err.message);
      throw err;
    }
  }
}

async function startMemoryDB(): Promise<string> {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'medicare_pro',
      },
      spawn: {
        timeout: 120000,
      },
    });
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Connected to embedded MongoDB at: ${memoryUri}`);
    return memoryUri;
  } catch (err: any) {
    console.error('[MongoDB] Failed to initialize embedded MongoDB:', err.message);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[MongoDB] Disconnected successfully');
  } catch (err: any) {
    console.error('[MongoDB] Disconnect error:', err.message);
  }
}
