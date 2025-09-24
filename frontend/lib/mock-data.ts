import type { Registro, TiempoViaje, TiempoEspera, KPIs, ChartDataPoint, TopInternoData } from "./types"

export class MockDataGenerator {
  static generateRegistros(count = 100): Registro[] {
    const tipos = ["Entrada", "Salida", "Parada", "Mantenimiento"]
    const servicios = ["Policial", "Regular", "Especial", "Reserva"]
    const conductores = ["Juan Perez", "Maria Gomez", "Luis Lopez", "Laura Diaz"]
    const lugares = ["Terminal Rosario", "Taller MV", "Deposito Central", "Base Norte"]

    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      fecha: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      hora: `${Math.floor(Math.random() * 24).toString().padStart(2, "0")}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`,
      interno: (Math.floor(Math.random() * 50) + 5000).toString(),
      tipo: tipos[Math.floor(Math.random() * tipos.length)],
      lugar: lugares[Math.floor(Math.random() * lugares.length)],
      conductor: conductores[Math.floor(Math.random() * conductores.length)],
      servicio: servicios[Math.floor(Math.random() * servicios.length)],
    }))
  }

  static generateTiemposViaje(count = 50): TiempoViaje[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      fecha: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      servicio: ["Policial", "Regular", "Especial"][Math.floor(Math.random() * 3)],
      interno: (Math.floor(Math.random() * 50) + 5000).toString(),
      minutosViaje: Math.floor(Math.random() * 120) + 15,
    }))
  }

  static generateTiemposEspera(count = 50): TiempoEspera[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      fecha: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      servicio: ["Policial", "Regular", "Especial"][Math.floor(Math.random() * 3)],
      interno: (Math.floor(Math.random() * 50) + 5000).toString(),
      minutosEspera: Math.floor(Math.random() * 30) + 2,
    }))
  }

  static generateKPIs(): KPIs {
    return {
      viajesTotales: Math.floor(Math.random() * 1000) + 500,
      tiempoViajePromedio: Math.floor(Math.random() * 60) + 30,
      tiempoEsperaPromedio: Math.floor(Math.random() * 15) + 5,
      serviciosActivos: Math.floor(Math.random() * 8) + 5,
    }
  }

  static generateChartData(): ChartDataPoint[] {
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - index))

      return {
        fecha: date.toISOString().split("T")[0],
        minutosViaje: Math.floor(Math.random() * 40) + 30,
        minutosEspera: Math.floor(Math.random() * 10) + 5,
      }
    })
  }

  static generateTopInternos(): TopInternoData[] {
    return Array.from({ length: 10 }, (_, index) => ({
      interno: (index + 5000).toString(),
      viajes: Math.floor(Math.random() * 100) + 20,
    })).sort((a, b) => b.viajes - a.viajes)
  }
}
