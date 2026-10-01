import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const read = async path => (await readFile(new URL(path, root), 'utf8')).replace(/^\uFEFF/, '')
const manifest = JSON.parse(await read('docs/manual.json'))
const { version } = JSON.parse(await read('package.json'))
const seen = new Set()
const chapters = []
for (const chapter of manifest.chapters) {
  if (seen.has(chapter.id) || !/^[\w-]+\.md$/.test(chapter.file)) {
    throw new Error(`Capítulo inválido ou duplicado: ${chapter.id}`)
  }
  seen.add(chapter.id)
  chapters.push({ ...chapter, source: await read(`docs/${chapter.file}`) })
}
const anchors = new Map(chapters.map(chapter => [chapter.file, `capitulo-${chapter.id}`]))
const status = version.includes('-') ? 'Edição em desenvolvimento; ainda não publicada.' : 'Edição associada à versão do app.'
const index = chapters.map(chapter => `- [${chapter.title}](#capitulo-${chapter.id})`).join('\n')
const content = chapters.map(chapter => {
  const source = chapter.source.replace(/\[([^\]]+)\]\(([^)]+\.md)\)/g, (match, label, target) => {
    const anchor = anchors.get(target.replace(/^\.\//, ''))
    if (!anchor) throw new Error(`Link fora do manual em ${chapter.file}: ${target}`)
    return `[${label}](#${anchor})`
  })
  return `<a id="capitulo-${chapter.id}"></a>\n\n${source.trim()}`
}).join('\n\n---\n\n')
const output = new URL(`artifacts/manual/wave-manifold-manual-${version}.md`, root)
await mkdir(new URL('artifacts/manual/', root), { recursive: true })
await writeFile(output, `# ${manifest.title}\n\nVersão do app: **${version}**. ${status}\n\nDocumento gerado dos capítulos de docs/; edite os arquivos de origem.\n\n## Conteúdo\n\n${index}\n\n---\n\n${content}\n`, 'utf8')
console.log(`Manual gerado: ${fileURLToPath(output)}`)
