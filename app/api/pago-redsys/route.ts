import { NextResponse } from "next/server"
import { getRedsysForm } from "@/lib/redsys"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { precio, nombre, email, instalacion, reservaId } = body
    if (!precio || !nombre || !email || !instalacion) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }
    if (!process.env.REDSYS_MERCHANT_CODE) {
      return NextResponse.json({ error: "Falta REDSYS_MERCHANT_CODE" }, { status: 500 });
    }
    if (!process.env.REDSYS_TERMINAL) {
      return NextResponse.json({ error: "Falta REDSYS_TERMINAL" }, { status: 500 });
    }
    if (!process.env.REDSYS_SECRET_KEY) {
      return NextResponse.json({ error: "Falta REDSYS_SECRET_KEY" }, { status: 500 });
    }
    // Generar un número de pedido único (order)
    let order = reservaId
      ? reservaId.padStart(12, "0").slice(-12)
      : Math.random().toString().slice(2, 14).padStart(12, "0").slice(-12)
    const form = getRedsysForm({
      amount: precio,
      order,
      merchantName: "Ayuntamiento de La Llosa",
      productDescription: instalacion,
      titular: nombre,
      email,
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/redsys-notificacion`,
      okUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/redsys-retorno?status=ok&order=${order}`,
      koUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/redsys-retorno?status=ko&order=${order}`,
    })
    return NextResponse.json(form)
  } catch (error) {
    console.error("[REDSYS] Error generando pago Redsys:", error)
    return NextResponse.json({ error: "Error generando pago Redsys" }, { status: 500 })
  }
} 