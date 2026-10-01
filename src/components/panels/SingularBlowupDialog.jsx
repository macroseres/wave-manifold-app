import { useEffect } from 'react'

export default function SingularBlowupDialog({ data, onClose }) {
  const { label, zStar, b2 } = data
  const aprime = b2 - 2 * zStar
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div onMouseDown={e => { if (e.target === e.currentTarget) onClose?.() }} style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(0,0,0,.35)',display:'grid',placeItems:'center'}}>
    <div style={{width:520,maxWidth:'92vw',background:'#071522',border:'1px solid #334155',borderRadius:10,padding:16,color:'#e2e8f0',boxShadow:'0 18px 60px rgba(0,0,0,.45)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><b>Blow-up local em {label}: z*={zStar.toFixed(5)}</b><button onClick={onClose} style={{background:'transparent',color:'#e2e8f0',border:'1px solid #475569',borderRadius:5}}>×</button></div>
      <div style={{fontSize:12,color:'#94a3b8',marginTop:6}}>A(z)=1+b₂z−z², A'(z*)={aprime.toFixed(5)}≠0. Use ξ=A(z). Transversalmente, a variedade é ξv̄=0.</div>
      <svg viewBox="0 0 460 260" width="100%" style={{marginTop:10,background:'#04101c',borderRadius:8}}>
        <circle cx="230" cy="130" r="72" fill="none" stroke="#e2e8f0" strokeWidth="2"/>
        <line x1="45" y1="130" x2="415" y2="130" stroke="#22d3ee" strokeWidth="4"/>
        <line x1="230" y1="20" x2="230" y2="240" stroke="#fb7185" strokeWidth="4"/>
        <circle cx="158" cy="130" r="5" fill="#64748b"/><circle cx="302" cy="130" r="5" fill="#64748b"/>
        <circle cx="230" cy="58" r="7" fill="#facc15"/><circle cx="230" cy="202" r="7" fill="#facc15"/>
        <polygon points="230,82 224,94 236,94" fill="#facc15"/><polygon points="230,178 224,166 236,166" fill="#facc15"/>
        <text x="315" y="122" fill="#67e8f9" fontSize="12">v̄=0 (ramo geométrico)</text><text x="238" y="42" fill="#fda4af" fontSize="12">ξ=0</text>
        <text x="305" y="155" fill="#cbd5e1" fontSize="11">r=0: divisor excepcional</text>
        <text x="244" y="72" fill="#fde68a" fontSize="11">rarefação</text>
      </svg>
      <div style={{fontSize:12,lineHeight:1.5,marginTop:8}}>
        <div>Blow-up polar: <b>ξ=r cosθ</b>, <b>v̄=r sinθ</b>. Então ξv̄=r²cosθ sinθ=0. Geometricamente, os dois ramos encontram o divisor em θ=0, π/2, π, 3π/2.</div>
        <div style={{marginTop:7,color:'#fde68a'}}><b>Campo de rarefação.</b> No ramo ξ=0 (isto é, z=z*), a direção característica do app é (dū,dv̄)∥(z*,1), logo podemos normalizar <b>dv̄/ds=1</b> e <b>dξ/ds=0</b>. Portanto o levantamento físico chega ao divisor somente pelas direções <b>θ=π/2</b> e <b>θ=3π/2</b>.</div>
        <div style={{marginTop:7,color:'#94a3b8'}}>Nos pontos θ=0 e π está o levantamento do ramo geométrico v̄=0, mas, para A(z)≠0, a condição de tangência A(z)·dv̄/ds=0 força dv̄/ds=0; ele não fornece uma rarefação de estado não constante. Assim, não atribuímos separatrizes físicas a θ=0,π.</div>
        <div style={{marginTop:7}}>As coordenadas ū e Y permanecem livres na descrição geométrica; no campo de rarefação sobre a característica, Y=0 e dū/ds=z* após a normalização dv̄/ds=1.</div>
      </div>
    </div>
  </div>
}
