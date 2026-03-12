import { NextResponse } from "next/server"
import { verificarEstadoPago } from "@/lib/google-sheets"

export async function POST(request: Request) {
  try {
    const { numeroCarnet } = await request.json()
    if (!numeroCarnet) {
      return NextResponse.json({ error: "Falta el número de carnet" }, { status: 400 })
    }
    const estaAlCorriente = await verificarEstadoPago(numeroCarnet)
    return NextResponse.json({ estaAlCorriente })
  } catch (error) {
    return NextResponse.json({ error: "Error al verificar el estado de pago" }, { status: 500 })
  }
} 