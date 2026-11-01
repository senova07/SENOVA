import { formaterEuro, formaterTaux } from '@/lib/format'
import type { Totaux } from './types'

/** Totaux HT, remise, TVA par taux, TTC et acompte, tels qu'ils figurent sur le devis. */
export function SectionRecap({ totaux, acomptePourcent }: { totaux: Totaux; acomptePourcent: number }) {
  return (
    <dl className="devis-recap">
      {totaux.remiseMontant > 0 ? (
        <>
          <div>
            <dt>Sous-total HT</dt>
            <dd>{formaterEuro(totaux.totalHtBrut)}</dd>
          </div>
          <div>
            <dt>Remise</dt>
            <dd>− {formaterEuro(totaux.remiseMontant)}</dd>
          </div>
        </>
      ) : null}
      <div>
        <dt>Total HT</dt>
        <dd>{formaterEuro(totaux.totalHt)}</dd>
      </div>
      {totaux.tva.map((t) => (
        <div key={t.taux}>
          <dt>
            TVA {formaterTaux(t.taux)} <small>sur {formaterEuro(t.base)}</small>
          </dt>
          <dd>{formaterEuro(t.montant)}</dd>
        </div>
      ))}
      <div className="devis-recap__ttc">
        <dt>Total TTC</dt>
        <dd>{formaterEuro(totaux.totalTtc)}</dd>
      </div>
      {acomptePourcent > 0 ? (
        <div className="devis-recap__acompte">
          <dt>Acompte demandé ({formaterTaux(acomptePourcent)})</dt>
          <dd>{formaterEuro(totaux.acompte)}</dd>
        </div>
      ) : null}
    </dl>
  )
}
