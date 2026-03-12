import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const reservaId = searchParams.get("reservaId")
  // Aquí puedes mostrar una página bonita o redirigir según el resultado
  if (status === "ok") {
    return NextResponse.redirect(`/reserva-exitosa?reservaId=${reservaId}`)
  } else {
    return NextResponse.redirect(`/reserva-error?reservaId=${reservaId}`)
  }
} 