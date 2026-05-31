import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('用法: node scripts/backup-db.js "postgresql://连接字符串"')
  console.error('或设置环境变量 DATABASE_URL 后运行: node scripts/backup-db.js')
  process.exit(1)
}

const dbDir = path.resolve('db')
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

const timestamp = new Date().toISOString().slice(0, 10)

// 1. 导出完整数据库结构（表、视图、函数、触发器、索引、约束等）
console.log('正在导出数据库结构...')
const schemaPath = path.join(dbDir, `schema_${timestamp}.sql`)
execSync(
  `pg_dump "${DATABASE_URL}" --schema-only --no-owner --no-privileges --no-comments -f "${schemaPath}"`,
  { stdio: 'inherit' }
)
console.log(`结构导出完成: ${schemaPath}`)

// 2. 导出所有数据
console.log('正在导出数据库数据...')
const dataPath = path.join(dbDir, `data_${timestamp}.sql`)
execSync(
  `pg_dump "${DATABASE_URL}" --data-only --no-owner --no-privileges --no-comments -f "${dataPath}"`,
  { stdio: 'inherit' }
)
console.log(`数据导出完成: ${dataPath}`)

// 3. 合并为完整备份
const fullPath = path.join(dbDir, `backup_${timestamp}.sql`)
const header = `-- ========================================\n-- 产学研项目管理系统 - 完整数据库备份\n-- 时间: ${new Date().toISOString()}\n-- 包含: 表结构 + 触发器 + 函数 + 数据\n-- ========================================\n\n`
const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
const dataContent = fs.readFileSync(dataPath, 'utf-8')
fs.writeFileSync(fullPath, header + schemaContent + '\n-- ========================================\n-- 数据部分\n-- ========================================\n\n' + dataContent, 'utf-8')

// 删除临时文件，只保留完整备份和结构文件
fs.unlinkSync(dataPath)

console.log(`\n完整备份完成: ${fullPath}`)
console.log(`结构文件: ${schemaPath}`)
