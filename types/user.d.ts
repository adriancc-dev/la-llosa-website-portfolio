// Extender la interfaz User para incluir las propiedades adicionales
declare global {
    interface User {
      id: string
      name: string
      email: string
      dni?: string
      tipo?: string
      telefono?: string
      imagenPerfil?: string
    }
  }
  
  export {}
  
  