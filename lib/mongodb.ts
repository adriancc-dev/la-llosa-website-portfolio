"use server";

import { MongoClient, type Db, ObjectId, WithId } from "mongodb";
import type { Reserva, Usuario } from "./database";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lallosa";

// Evitar ejecución en el cliente
if (typeof window !== "undefined") {
  throw new Error("No puedes importar `mongodb.ts` en el cliente.");
}

// Variables globales para evitar múltiples conexiones en desarrollo
declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoDb: Db | undefined;
}

let client: MongoClient;
let db: Db;

export async function connectToDatabase(): Promise<{ db: Db; client: MongoClient }> {
  if (globalThis._mongoClient && globalThis._mongoDb) {
    return { db: globalThis._mongoDb, client: globalThis._mongoClient };
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();

  if (process.env.NODE_ENV !== "production") {
    globalThis._mongoClient = client;
    globalThis._mongoDb = db;
  }

  return { db, client };
}

export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
  }
}

// Funciones para usuarios
export async function getUsuarios(): Promise<Usuario[]> {
  const { db } = await connectToDatabase();
  return (await db.collection<Usuario>("usuarios").find({}).toArray()).map(({ _id, ...rest }) => ({
    ...rest,
    id: _id.toString(),
  }));
}

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  const { db } = await connectToDatabase();
  const user = await db.collection<Usuario>("usuarios").findOne({ _id: new ObjectId(id) });
  return user ? { ...user, id: user._id.toString() } : null;
}

export async function getUsuarioByEmail(email: string): Promise<Usuario | null> {
  const { db } = await connectToDatabase();
  const user = await db.collection<Usuario>("usuarios").findOne({ email });
  return user ? { ...user, id: user._id.toString() } : null;
}

// Funciones para reservas
export async function getReservas(): Promise<Reserva[]> {
  const { db } = await connectToDatabase();
  return (await db.collection<Reserva>("reservas").find({}).toArray()).map(({ _id, ...rest }) => ({
    ...rest,
    id: _id.toString(),
  }));
}

export async function getReservaById(id: string): Promise<Reserva | null> {
  const { db } = await connectToDatabase();
  const reserva = await db.collection<Reserva>("reservas").findOne({ _id: new ObjectId(id) });
  return reserva ? { ...reserva, id: reserva._id.toString() } : null;
}

export async function getReservasByUsuarioId(usuarioId: string): Promise<Reserva[]> {
  const { db } = await connectToDatabase();
  return (await db.collection<Reserva>("reservas").find({ idUsuario: usuarioId }).toArray()).map(({ _id, ...rest }) => ({
    ...rest,
    id: _id.toString(),
  }));
}

export async function getReservasByDate(fecha: Date): Promise<Reserva[]> {
  const { db } = await connectToDatabase();
  const startOfDay = new Date(fecha);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(fecha);
  endOfDay.setHours(23, 59, 59, 999);
  return (await db.collection<Reserva>("reservas").find({ fecha: { $gte: startOfDay, $lte: endOfDay }, estado: { $ne: "cancelada" } }).toArray()).map(({ _id, ...rest }) => ({
    ...rest,
    id: _id.toString(),
  }));
}
