import { MongoClient, Db, GridFSBucket } from "mongodb";

// Module and global-level caching for Vercel / serverless execution environments
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _mongoDb: Db | undefined;
  // eslint-disable-next-line no-var
  var _gridFSBucket: GridFSBucket | undefined;
}

let isConnecting = false;
let lastConnectionError: string | null = null;

export interface MongoConnectionResult {
  client: MongoClient | null;
  db: Db | null;
  connected: boolean;
  error?: string;
}

export const DEFAULT_DATABASE_NAME = "ems_database";
export const DATABASE_NAME = process.env.MONGODB_DB_NAME?.trim() || DEFAULT_DATABASE_NAME;

/**
 * Validates whether the provided URI is syntactically valid for MongoDB.
 */
function isValidMongoUri(uri?: string): boolean {
  if (!uri || typeof uri !== "string") return false;
  const trimmed = uri.trim();
  return trimmed.startsWith("mongodb://") || trimmed.startsWith("mongodb+srv://");
}

/**
 * Ensures credentials with special characters in MongoDB URI are safely percent-encoded.
 */
function sanitizeMongoUri(rawUri: string): string {
  try {
    const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (match) {
      const [, proto, user, pass, rest] = match;
      const encodedUser = encodeURIComponent(decodeURIComponent(user));
      const encodedPass = encodeURIComponent(decodeURIComponent(pass));
      return `${proto}${encodedUser}:${encodedPass}@${rest}`;
    }
  } catch {
    // fallback to original
  }
  return rawUri;
}

/**
 * Connects to MongoDB Atlas using connection pooling and reuse.
 * Gracefully handles missing MONGODB_URI or network/authentication errors without crashing the server.
 */
export async function connectToDatabase(): Promise<MongoConnectionResult> {
  const uri = process.env.MONGODB_URI?.trim();

  // Graceful handling when MONGODB_URI is missing or not configured
  if (!uri || !isValidMongoUri(uri)) {
    lastConnectionError = !uri
      ? "MONGODB_URI is not set in environment variables."
      : "MONGODB_URI format is invalid. It must start with mongodb:// or mongodb+srv://.";
    return {
      client: null,
      db: null,
      connected: false,
      error: lastConnectionError
    };
  }

  // Reuse existing cached connection in serverless or long-running environments
  if (globalThis._mongoClient && globalThis._mongoDb) {
    try {
      // Ping to verify connection is alive
      await globalThis._mongoDb.command({ ping: 1 });
      return {
        client: globalThis._mongoClient,
        db: globalThis._mongoDb,
        connected: true
      };
    } catch {
      // Connection dropped, proceed to reconnect
      globalThis._mongoClient = undefined;
      globalThis._mongoDb = undefined;
      globalThis._mongoClientPromise = undefined;
      globalThis._gridFSBucket = undefined;
    }
  }

  try {
    if (!globalThis._mongoClientPromise) {
      isConnecting = true;
      const cleanUri = sanitizeMongoUri(uri);

      // Fast non-blocking timeout (2.5s) to avoid delaying application startup
      const client = new MongoClient(cleanUri, {
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        retryWrites: true,
        w: "majority"
      });

      globalThis._mongoClientPromise = client.connect();
    }

    const client = await globalThis._mongoClientPromise;
    // Explicitly use "ems_database" (or MONGODB_DB_NAME if set) instead of default "test"
    const db = client.db(DATABASE_NAME);

    globalThis._mongoClient = client;
    globalThis._mongoDb = db;
    globalThis._gridFSBucket = new GridFSBucket(db, { bucketName: "documents" });
    lastConnectionError = null;
    isConnecting = false;

    console.log(`[MongoDB Atlas] Successfully connected to database: "${db.databaseName}"`);

    return {
      client,
      db,
      connected: true
    };
  } catch (err: any) {
    isConnecting = false;
    globalThis._mongoClientPromise = undefined;

    const errMsg = err.message || "";
    const isSslAlert80 = errMsg.includes("SSL alert number 80") || errMsg.includes("alert internal error");

    if (isSslAlert80) {
      lastConnectionError = "MongoDB Atlas TLS handshake rejected (SSL alert 80). The Atlas cluster IP Whitelist requires adding '0.0.0.0/0' (Allow Access From Anywhere) in the MongoDB Atlas Network Access console.";
      console.info(`[MongoDB Atlas Notice] Cluster reachable but requires IP Whitelist (0.0.0.0/0).`);
    } else {
      lastConnectionError = errMsg || "Failed to connect to MongoDB Atlas";
      console.info(`[MongoDB Atlas Notice] Connection unavailable (${lastConnectionError}).`);
    }

    return {
      client: null,
      db: null,
      connected: false,
      error: lastConnectionError
    };
  }
}

/**
 * Returns the currently active MongoDB Db instance, or null if not connected.
 */
export function getMongoDb(): Db | null {
  return globalThis._mongoDb || null;
}

/**
 * Returns the currently active MongoClient instance, or null if not connected.
 */
export function getMongoClient(): MongoClient | null {
  return globalThis._mongoClient || null;
}

/**
 * Returns the GridFSBucket instance for document storage.
 */
export function getGridFSBucket(): GridFSBucket | null {
  return globalThis._gridFSBucket || null;
}

/**
 * Checks if MongoDB is currently connected.
 */
export function isMongoConnected(): boolean {
  return !!(globalThis._mongoClient && globalThis._mongoDb);
}

/**
 * Diagnostic status information for health check endpoints.
 */
export function getDatabaseStatus() {
  const uri = process.env.MONGODB_URI?.trim();
  const configured = isValidMongoUri(uri);
  const connected = isMongoConnected();
  const isProd = process.env.NODE_ENV === "production";

  return {
    connected,
    configured,
    databaseName: connected ? globalThis._mongoDb?.databaseName : undefined,
    error: lastConnectionError,
    mode: connected ? "mongodb_atlas" : (isProd ? "disconnected" : "in_memory_fallback"),
    persistence: connected ? "mongodb_atlas" : "none",
    persistent: connected,
    guidance: connected
      ? "Connected to MongoDB Atlas cluster with active connection pooling."
      : (isProd
          ? "Production mode requires active MongoDB connection. In-memory fallback is disabled in production to prevent data loss."
          : "Operating in in-memory fallback mode for local development/testing. Persistent MongoDB storage is inactive.")
  };
}

/**
 * Gracefully closes the MongoDB client connection.
 */
export async function closeMongoConnection(): Promise<void> {
  if (globalThis._mongoClient) {
    try {
      await globalThis._mongoClient.close();
      globalThis._mongoClient = undefined;
      globalThis._mongoDb = undefined;
      globalThis._mongoClientPromise = undefined;
      globalThis._gridFSBucket = undefined;
      console.log("[MongoDB] Closed database connection pool.");
    } catch (err) {
      console.error("[MongoDB] Error closing connection:", err);
    }
  }
}
