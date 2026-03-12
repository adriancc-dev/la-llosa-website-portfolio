import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("Falta la variable de entorno obligatoria: JWT_SECRET")
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded as { id: string; email: string; role?: string; exp: number }
  } catch (error) {
    return null
  }
}

export function generateToken(payload: { id: string; email: string; role?: string }) {
  return jwt.sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
    },
    JWT_SECRET,
  )
}
