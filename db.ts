import sql from "mssql"

export type SqlType = sql.ISqlTypeFactory

export interface SqlParameter {
  name: string
  type: SqlType
  value: unknown
}

const globalCache = globalThis as typeof globalThis & {
  __MSSQL_POOL__?: sql.ConnectionPool
  __MSSQL_POOL_PROMISE__?: Promise<sql.ConnectionPool>
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback
  }
  return value.toLowerCase() === "true"
}

function parseConnectionString(connectionString: string): sql.config {
  const sanitized = connectionString.replace(/^sqlserver:\/\//i, "")
  const segments = sanitized.split(";").map((segment) => segment.trim()).filter(Boolean)

  let server: string | undefined
  let database: string | undefined
  let user: string | undefined
  let password: string | undefined
  let encrypt = true
  let trustServerCertificate = true

  segments.forEach((segment, index) => {
    if (!segment) {
      return
    }

    const equalsIndex = segment.indexOf("=")

    if (equalsIndex === -1) {
      if (index === 0) {
        server = segment
      }
      return
    }

    const key = segment.slice(0, equalsIndex).trim().toLowerCase()
    const value = segment.slice(equalsIndex + 1).trim()

    switch (key) {
      case "server":
        server = value
        break
      case "data source":
        server = value
        break
      case "address":
        server = value
        break
      case "addr":
        server = value
        break
      case "network address":
        server = value
        break
      case "database":
      case "initial catalog":
        database = value
        break
      case "user":
      case "user id":
      case "uid":
        user = value
        break
      case "password":
      case "pwd":
        password = value
        break
      case "encrypt":
        encrypt = parseBoolean(value, true)
        break
      case "trustservercertificate":
        trustServerCertificate = parseBoolean(value, true)
        break
      default:
        break
    }
  })

  if (!server || !database || !user || !password) {
    throw new Error("DATABASE_URL is missing required connection options")
  }

  return {
    server,
    database,
    user,
    password,
    options: {
      encrypt,
      trustServerCertificate,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  }
}

function resolveConfig(): sql.config {
  if (process.env.DATABASE_URL) {
    return parseConnectionString(process.env.DATABASE_URL)
  }

  const serverEnv = process.env.DB_SERVER
  const database = process.env.DB_NAME
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD

  if (!serverEnv || !database || !user || !password) {
    throw new Error("Database configuration is incomplete. Set DATABASE_URL or DB_SERVER/DB_NAME/DB_USER/DB_PASSWORD.")
  }

  let server = serverEnv
  let port: number | undefined

  if (serverEnv.includes(",")) {
    const [hostPart, portPart] = serverEnv.split(",")
    server = hostPart.trim()
    const parsedPort = Number.parseInt(portPart.trim(), 10)
    if (!Number.isNaN(parsedPort)) {
      port = parsedPort
    }
  }

  const encrypt = parseBoolean(process.env.DB_ENCRYPT, true)
  const trustServerCertificate = parseBoolean(process.env.DB_TRUST_SERVER_CERTIFICATE, true)
  const maxPool = process.env.DB_POOL_MAX ? Number.parseInt(process.env.DB_POOL_MAX, 10) : 10
  const minPool = process.env.DB_POOL_MIN ? Number.parseInt(process.env.DB_POOL_MIN, 10) : 0

  const config: sql.config = {
    server,
    database,
    user,
    password,
    options: {
      encrypt,
      trustServerCertificate,
    },
    pool: {
      max: Number.isNaN(maxPool) ? 10 : maxPool,
      min: Number.isNaN(minPool) ? 0 : minPool,
      idleTimeoutMillis: process.env.DB_POOL_IDLE ? Number.parseInt(process.env.DB_POOL_IDLE, 10) : 30000,
    },
  }

  if (port !== undefined) {
    config.port = port
  }

  return config
}

export async function getConnectionPool(): Promise<sql.ConnectionPool> {
  if (globalCache.__MSSQL_POOL__ && globalCache.__MSSQL_POOL__.connected) {
    return globalCache.__MSSQL_POOL__
  }

  if (!globalCache.__MSSQL_POOL_PROMISE__) {
    const config = resolveConfig()
    globalCache.__MSSQL_POOL_PROMISE__ = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        globalCache.__MSSQL_POOL__ = pool
        pool.on("close", () => {
          globalCache.__MSSQL_POOL__ = undefined
          globalCache.__MSSQL_POOL_PROMISE__ = undefined
        })
        return pool
      })
      .catch((error) => {
        globalCache.__MSSQL_POOL_PROMISE__ = undefined
        throw error
      })
  }

  return globalCache.__MSSQL_POOL_PROMISE__
}

export async function createRequest(parameters: SqlParameter[] = []) {
  const pool = await getConnectionPool()
  const request = pool.request()
  parameters.forEach((param) => {
    request.input(param.name, param.type, param.value)
  })
  return request
}

export { sql }
