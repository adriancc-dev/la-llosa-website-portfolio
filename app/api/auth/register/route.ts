import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { getUsuarioByEmail } from "@/lib/mongodb"
import { generateToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { nombre, email, telefono, password, tipo } = await request.json()

    // Validar datos
    if (!nombre || !email || !password) {
      return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Verificar si el email ya existe
    const existingUser = await getUsuarioByEmail(email)
    if (existingUser) {
      return NextResponse.json({ message: "El email ya está registrado" }, { status: 400 })
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear nuevo usuario
    const now = new Date()
    const newUser = {
      nombre,
      email,
      telefono,
      password: hashedPassword,
      tipo: tipo || "local",
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("usuarios").insertOne(newUser)
    const userId = result.insertedId.toString()

    // Crear token JWT
    const token = generateToken({
      id: userId,
      email,
    })

    // Preparar objeto de usuario para devolver (sin contraseña)
    const userToReturn = {
      id: userId,
      name: nombre,
      email,
      tipo: tipo || "local",
    }

    return NextResponse.json({
      message: "Usuario registrado correctamente",
      user: userToReturn,
      token,
    })
  } catch (error: any) {
    console.error("Error al registrar usuario:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

