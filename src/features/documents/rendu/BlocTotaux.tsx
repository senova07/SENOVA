import { formaterTaux } from '../../../lib/format'
import { formaterMontantDocument, formaterQuantite } from './affichage'
import type { ChartePage, DocumentRendu } from './types'

interface Props {
  document: DocumentRendu
  charte: ChartePage
}

/** Totaux déjà calculés : le rendu les met seulement en forme. */
export function BlocTotaux({ document, charte }: Props) {
  const { type, totaux } = document
  const montant = (n: number) => formaterMontantDocument(type, n)
  // Style « sans TVA » avec un seul taux : une ligne de TVA agrégée suffit.
  const tvaAgregee = charte.styleTableau === 'sans-tva' && totaux.tva.length <= 1
  const { acompte, resteAPayer } = totaux

  return (
    <div className="doc-totaux">
      <dl>
        {!!totaux.remise && totaux.sousTotalHt !== undefined && (
          <>
            <div><dt>Sous-total HT</dt><dd>{montant(totaux.sousTotalHt)}</dd></div>
            <div><dt>Remise</dt><dd>{montant(-totaux.remise)}</dd></div>
          </>
        )}
        <div><dt>Total HT</dt><dd>{montant(totaux.totalHt)}</dd></div>
        {tvaAgregee
          ? <div><dt>TVA {totaux.tva[0] ? formaterTaux(totaux.tva[0].taux) : ''}</dt><dd>{montant(totaux.totalTva)}</dd></div>
          : totaux.tva.map((v) => <div key={v.taux}><dt>TVA {formaterTaux(v.taux)}</dt><dd>{montant(v.montant)}</dd></div>)}
        <div className="doc-totaux__ttc"><dt>{type === 'avoir' ? 'Avoir TTC' : 'Total TTC'}</dt><dd>{montant(totaux.totalTtc)}</dd></div>
      </dl>
      {type === 'devis' && acompte && acompte.pourcentage > 0 && (
        <div className="doc-acompte"><span>Acompte à la commande ({formaterQuantite(acompte.pourcentage)} %)</span><strong>{montant(acompte.montant)}</strong></div>
      )}
      {type === 'facture' && acompte && acompte.montant > 0 && resteAPayer !== undefined && (
        <>
          <div className="doc-totaux__ligne"><span>Acompte déjà versé</span><span>{montant(-acompte.montant)}</span></div>
          <div className="doc-acompte"><span>Reste à payer</span><strong>{montant(resteAPayer)}</strong></div>
        </>
      )}
    </div>
  )
}
