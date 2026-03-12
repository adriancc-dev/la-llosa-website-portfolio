import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const userData = verifyToken(token)
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    const bonoData = await request.json()
    const { instalacion, tipo, fechaInicio, fechaFin } = bonoData

    // Validar datos
    if (!instalacion || !tipo || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        {
          message: "Faltan datos obligatorios",
          data: bonoData,
        },
        { status: 400 },
      )
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Crear nuevo bono
    const now = new Date()
    const nuevoBono = {
      ...bonoData,
      idUsuario: userData.id, // Aseguramos que el ID del usuario sea el del token
      fechaInicio: new Date(fechaInicio), // Convertir a objeto Date
      fechaFin: new Date(fechaFin), // Convertir a objeto Date
      createdAt: now,
      updatedAt: now,
      estado: bonoData.estado || "activo", // Asegurar que tenga un estado
    }

    console.log("Guardando bono:", nuevoBono)
    const result = await db.collection("bonos").insertOne(nuevoBono)

    return NextResponse.json({
      message: "Bono creado correctamente",
      id: result.insertedId.toString(),
    })
  } catch (error: any) {
    console.error("Error al crear bono:", error)
    return NextResponse.json(
      {
        message: "Error al procesar la solicitud",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Se hace un casting a "any" para poder acceder a "role"
    const userData = verifyToken(token) as any
    if (!userData) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const instalacion = searchParams.get("instalacion")
    const usuarioId = searchParams.get("usuarioId")
    const tipo = searchParams.get("tipo")

    // Conectar a la base de datos
    const { db } = await connectToDatabase()

    // Construir filtro
    const filtro: any = {}

    if (instalacion) {
      filtro.instalacion = instalacion
    }

    if (tipo) {
      filtro.tipo = tipo
    }

    if (usuarioId) {
      // Solo permitir ver bonos propios a menos que sea admin
      if (usuarioId !== userData.id && userData.role !== "admin") {
        return NextResponse.json({ message: "No autorizado para ver bonos de otros usuarios" }, { status: 403 })
      }
      filtro.idUsuario = usuarioId
    }

    // Excluir bonos inactivos por defecto a menos que se especifique
    const incluirInactivos = searchParams.get("incluirInactivos") === "true"
    if (!incluirInactivos) {
      filtro.estado = "activo"
    }

    console.log("Filtro de búsqueda bonos:", filtro)

    const bonos = await db.collection("bonos").find(filtro).sort({ fechaInicio: -1 }).toArray()

    // Transformar _id a id en cada bono
    const bonosConId = bonos.map((bono: any) => ({
      ...bono,
      id: bono._id.toString(),
    }))

    console.log(`Se encontraron ${bonosConId.length} bonos`)
    return NextResponse.json(bonosConId)
  } catch (error: any) {
    console.error("Error al obtener bonos:", error)
    return NextResponse.json(
      {
        message: "Error al procesar la solicitud",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

