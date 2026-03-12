import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { getUsuarioByEmail } from "@/lib/mongodb"
import { generateToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validar datos
    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Conectar a la base de datos
    await connectToDatabase()

    // Buscar usuario por email
    const user = await getUsuarioByEmail(email)
    if (!user) {
      return NextResponse.json({ message: "Credenciales incorrectas" }, { status: 401 })
    }
    // Asegurarse de que el usuario tiene la propiedad 'id' igual a '_id'
    const userId = user.id || (user._id ? user._id.toString() : undefined)
    if (!userId) {
      return NextResponse.json({ message: "Usuario sin id válido" }, { status: 500 })
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Credenciales incorrectas" }, { status: 401 })
    }

    // Crear token JWT (incluyendo role)
    const token = generateToken({
      id: userId,
      email: user.email,
      role: user.tipo, // Se asume que "tipo" representa el rol del usuario
    })

    // Preparar objeto de usuario para devolver (sin contraseña)
    const userToReturn = {
      id: userId,
      name: user.nombre,
      email: user.email,
      tipo: user.tipo,
      dni: user.dni,
    }

    return NextResponse.json({
      message: "Inicio de sesión exitoso",
      user: userToReturn,
      token,
    })
  } catch (error: any) {
    console.error("Error al iniciar sesión:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
