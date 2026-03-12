import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const { subject, html, text } = await request.json()
    const appEmail = process.env.EMAIL

    if (!appEmail) {
      return NextResponse.json({ error: "Falta la configuración de EMAIL" }, { status: 500 })
    }

    const success = await sendEmail({
      to: appEmail,
      subject,
      html,
      text,
    })

    if (!success) {
      return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en la ruta de envío de correo:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

