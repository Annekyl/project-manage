import pg from 'pg'
import fs from 'fs'
import path from 'path'

// 从命令行参数或环境变量获取连接字符串
const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('用法: node scripts/backup-db.js "postgresql://连接字符串"')
  console.error('或设置环境变量 DATABASE_URL 后运行: node scripts/backup-db.js')
  process.exit(1)
}

const TABLES = [
  'projects',
  'contracts',
  'payments',
  'invoices',
  'reimbursements',
  'closures',
  'audit_logs',
  'profiles',
]

async function backup() {
  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('已连接到数据库')

    const lines = []
    lines.push('-- 数据库备份')
    lines.push(`-- 时间: ${new Date().toISOString()}`)
    lines.push('')

    for (const table of TABLES) {
      console.log(`正在导出 ${table}...`)

      // 获取表结构
      const { rows: createRows } = await client.query(
        `SELECT pg_get_tabledef('public', '${table}') as definition`
      ).catch(() => {
        // pg_get_tabledef 可能不存在，用另一种方式
        return { rows: [] }
      })

      // 获取列信息
      const { rows: cols } = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table])

      if (cols.length === 0) {
        console.log(`  表 ${table} 不存在，跳过`)
        continue
      }

      // 获取行数
      const { rows: [{ count }] } = await client.query(`SELECT count(*) FROM "${table}"`)
      console.log(`  共 ${count} 条记录`)

      lines.push(`-- ${table} (${count} 条)`)

      // 分批读取数据
      const BATCH_SIZE = 500
      let offset = 0
      const columnNames = cols.map(c => c.column_name)

      while (true) {
        const { rows } = await client.query(`SELECT * FROM "${table}" ORDER BY 1 LIMIT $1 OFFSET $2`, [BATCH_SIZE, offset])

        if (rows.length === 0) break

        for (const row of rows) {
          const values = columnNames.map(col => {
            const val = row[col]
            if (val === null) return 'NULL'
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
            if (typeof val === 'number') return val
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`
            return `'${String(val).replace(/'/g, "''")}'`
          })

          lines.push(
            `INSERT INTO "${table}" (${columnNames.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`
          )
        }

        offset += BATCH_SIZE
        if (rows.length < BATCH_SIZE) break
      }

      lines.push('')
    }

    const dbDir = path.resolve('db')
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

    const timestamp = new Date().toISOString().slice(0, 10)
    const backupPath = path.join(dbDir, `backup_${timestamp}.sql`)
    fs.writeFileSync(backupPath, lines.join('\n'), 'utf-8')
    console.log(`\n备份完成: ${backupPath}`)
    console.log(`共导出 ${TABLES.length} 张表`)

  } catch (err) {
    console.error('备份失败:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

backup()
