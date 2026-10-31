import { useMemo } from 'react'

const COTE = 21
const REPERES: [number, number][] = [[0, 0], [14, 0], [0, 14]]
const estRepere = (x: number, y: number) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)

/** Motif de QR code déterministe : il montre l'emplacement, il ne code rien. */
export function QrIllustratif() {
  const cases = useMemo(() => {
    const sortie: [number, number][] = []
    let graine = 7
    for (let y = 0; y < COTE; y++) for (let x = 0; x < COTE; x++) {
      graine = (graine * 9301 + 49297) % 233280
      if (!estRepere(x, y) && graine / 233280 > 0.52) sortie.push([x, y])
    }
    return sortie
  }, [])
  return (
    <svg className="doc-qr__motif" viewBox="-1 -1 23 23" aria-hidden>
      {cases.map(([x, y]) => <rect key={`${x}:${y}`} x={x} y={y} width="1" height="1" />)}
      {REPERES.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" />
          <rect x={x + 1} y={y + 1} width="5" height="5" className="doc-qr__blanc" />
          <rect x={x + 2} y={y + 2} width="3" height="3" />
        </g>
      ))}
    </svg>
  )
}
