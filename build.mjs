/**
 * dsh-auto-collapse 构建脚本。
 *
 * 产出：
 *   lib/index.js   —— host half（静态文件，见 lib/index.js，无需构建）
 *   lib/client.js  —— browser bundle：自包含 iife，执行时向
 *                     window.__ModuleLoader__.load({ id, factory }) 注册。
 *   lib/types/     —— tsc 从 src 生成的发布声明（唯一事实是源码；手工编辑会被下次构建覆盖）。
 *
 * 构建器：本地 devDependency esbuild（JS API）。不用 spawn CLI：Windows 下
 * 经 shell 传 banner/footer 这类含引号与括号的参数会被 cmd 拆坏。
 */
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const CLIENT_OPTIONS = {
  entryPoints: ['src/client.ts'],
  bundle: true,
  format: 'iife',
  globalName: '__dshcfBundle',
  platform: 'browser',
  target: 'es2020',
  outfile: 'lib/client.js',
  external: ['react'],
  banner: { js: 'window.__ModuleLoader__.load({id:"dsh-auto-collapse",factory:function(require){' },
  footer: { js: 'return __dshcfBundle;}});' },
}

console.log('[dsh-auto-collapse] building lib/client.js …')
try {
  const esbuild = require('esbuild')
  await esbuild.build(CLIENT_OPTIONS)
} catch (error) {
  if (error?.code === 'MODULE_NOT_FOUND') {
    throw new Error(
      '[dsh-auto-collapse] esbuild is a devDependency of this package; run `npm install` first',
      { cause: error },
    )
  }
  throw error
}
console.log('[dsh-auto-collapse] done: lib/client.js')

console.log('[dsh-auto-collapse] generating lib/types declarations …')
const tscResult = spawnSync(process.execPath, [require.resolve('typescript/lib/tsc'), '-p', 'tsconfig.types.json'], { stdio: 'inherit' })
if (tscResult.error !== undefined) throw tscResult.error
if (tscResult.status !== 0) throw new Error(`tsc -p tsconfig.types.json 退出码 ${tscResult.status}`)

// 源码经 allowImportingTsExtensions 用 './x.ts' 相对导入；发布声明改回无扩展名，
// 让未开启该选项的消费者也能解析（bundler/node 布局下均命中同级 .d.ts）。
const typesDir = join(root, 'lib/types')
for (const entry of readdirSync(typesDir)) {
  if (!entry.endsWith('.d.ts')) continue
  const file = join(typesDir, entry)
  const fixed = readFileSync(file, 'utf8').replace(/(from\s+'\.\/[A-Za-z0-9_-]+)\.ts'/g, "$1'")
  writeFileSync(file, fixed)
}
// 旧的手工声明目录布局（lib/types/client/index.d.ts）已由扁平生成物取代；
// force+recursive 让本步骤在迁移后的每个构建里保持幂等。
rmSync(join(typesDir, 'client'), { recursive: true, force: true })
console.log('[dsh-auto-collapse] done: lib/types')

