import { NextResponse } from "next/server"
import { base64decode, createRedsysSignature } from "@/lib/redsys";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.formData()
    // Redsys envía los datos como form-urlencoded
    const Ds_Signature = body.get("Ds_Signature") as string
    const Ds_MerchantParameters = body.get("Ds_MerchantParameters") as string
    // Decodificar parámetros
    const decoded = JSON.parse(base64decode(Ds_MerchantParameters));
    // Validar firma
    const { signature } = createRedsysSignature(decoded, process.env.REDSYS_SECRET_KEY!);
    if (signature !== Ds_Signature) {
      return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
    }
    // Si el pago es correcto (Ds_Response < 101)
    if (parseInt(decoded.Ds_Response) < 101) {
      // Crear reserva en la base de datos usando los campos DS_MERCHANT_*
      const db = await connectToDatabase();
      const reserva = {
        nombre: decoded.DS_MERCHANT_TITULAR,
        email: decoded.DS_MERCHANT_MERCHANTDATA,
        instalacion: decoded.DS_MERCHANT_PRODUCTDESCRIPTION,
        fecha: new Date(),
        horaInicio: decoded.DS_MERCHANT_HORAINICIO || "",
        horas: decoded.DS_MERCHANT_HORAS || 1,
        precio: parseFloat(decoded.DS_MERCHANT_AMOUNT) / 100,
        estado: "confirmada",
        order: decoded.DS_MERCHANT_ORDER,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await db.collection("reservas").insertOne(reserva)
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Error en notificación Redsys" }, { status: 500 })
  }
} 