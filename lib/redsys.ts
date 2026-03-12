import crypto from "crypto"

// Redsys config desde variables de entorno
const MERCHANT_CODE = process.env.REDSYS_MERCHANT_CODE || ""
const TERMINAL = process.env.REDSYS_TERMINAL || ""
const SECRET_KEY = process.env.REDSYS_SECRET_KEY || ""
const REDSYS_URL = "https://sis-t.redsys.es:25443/sis/realizarPago" // TPV pruebas

if (!MERCHANT_CODE) {
  throw new Error("REDSYS_MERCHANT_CODE no está definido en las variables de entorno");
}
if (!TERMINAL) {
  throw new Error("REDSYS_TERMINAL no está definido en las variables de entorno");
}
if (!SECRET_KEY) {
  throw new Error("REDSYS_SECRET_KEY no está definido en las variables de entorno");
}

export function buildMerchantParams(obj: any) {
  const json = JSON.stringify(obj)
  return Buffer.from(json).toString("base64")
}

export function signWithRedsys(merchantParams: string) {
  const key = Buffer.from(SECRET_KEY, "base64")
  return crypto.createHmac("sha256", key).update(merchantParams).digest("base64")
}

export function getRedsysForm({
  amount,
  order,
  merchantName,
  productDescription,
  titular,
  email,
  callbackUrl,
  okUrl,
  koUrl,
}: {
  amount: number
  order: string
  merchantName: string
  productDescription: string
  titular: string
  email: string
  callbackUrl: string
  okUrl: string
  koUrl: string
}) {
  const params = {
    DS_MERCHANT_AMOUNT: Math.round(amount * 100).toString(), // céntimos, string
    DS_MERCHANT_ORDER: order,
    DS_MERCHANT_MERCHANTCODE: MERCHANT_CODE,
    DS_MERCHANT_CURRENCY: "978",
    DS_MERCHANT_TRANSACTIONTYPE: "0",
    DS_MERCHANT_TERMINAL: TERMINAL,
    DS_MERCHANT_MERCHANTURL: callbackUrl,
    DS_MERCHANT_URLOK: okUrl,
    DS_MERCHANT_URLKO: koUrl,
    DS_MERCHANT_MERCHANTNAME: merchantName,
    DS_MERCHANT_PRODUCTDESCRIPTION: productDescription,
    DS_MERCHANT_TITULAR: titular,
    DS_MERCHANT_CONSUMERLANGUAGE: "1",
    DS_MERCHANT_MERCHANTDATA: email,
  }
  const merchantParams = buildMerchantParams(params)
  const signature = signWithRedsys(merchantParams)
  return {
    url: REDSYS_URL,
    merchantParams,
    signature,
    merchantCode: MERCHANT_CODE,
  }
} 