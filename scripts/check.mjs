import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const root = new URL('../', import.meta.url)
const steps = [
  ['Análise de código', ['node_modules/eslint/bin/eslint.js', '.']],
  ['Testes', ['--test', 'tests/*.test.js']],
  ['Build', ['node_modules/vite/bin/vite.js', 'build']],
]
await mkdir(new URL('artifacts/check/', root), { recursive: true })
const logPath = new URL('artifacts/check/latest.log', root)
let log = ''
for (const [label, args] of steps) {
  const started = performance.now()
  const result = await new Promise(resolve => {
    let output = ''
    const child = spawn(process.execPath, args, { cwd: fileURLToPath(root), windowsHide: true })
    child.stdout.on('data', data => { output += data })
    child.stderr.on('data', data => { output += data })
    child.on('error', error => resolve({ code: 1, output: error.message }))
    child.on('close', code => resolve({ code, output }))
  })
  log += `\n${label}\n${result.output}\n`
  await writeFile(logPath, log, 'utf8')
  console.log(`${label}: ${result.code === 0 ? 'OK' : 'FALHOU'} (${((performance.now() - started) / 1000).toFixed(1)} s)`)
  if (result.code !== 0) {
    console.error(result.output.split(/\r?\n/).slice(-80).join('\n'))
    process.exitCode = 1
    break
  }
  if (label === 'Testes') {
    console.log(result.output.split(/\r?\n/).filter(line => /(?:tests|pass|fail) \d+$/.test(line)).join(' · '))
  }
  if (label === 'Build' && result.output.includes('larger than 500')) console.log('Aviso: biblioteca 3D ainda ultrapassa 500 kB.')
}
console.log(`Log completo: ${fileURLToPath(logPath)}`)
