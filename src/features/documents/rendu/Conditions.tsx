import { QrIllustratif } from './QrIllustratif'
import type { ChartePage, DocumentRendu } from './types'

interface Props {
  document: DocumentRendu
  charte: ChartePage
}

/** Conditions et moyens de paiement, textes réglementaires, remerciement et bon pour accord. */
export function Conditions({ document, charte }: Props) {
  const { type, textes, mentions, totaux, bonPourAccord } = document
  const acompte = type === 'devis' && totaux.acompte && totaux.acompte.pourcentage > 0 ? totaux.acompte.pourcentage : 0
  const avoir = type === 'avoir'
  return (
    <div className="doc-conditions">
      <div className="doc-conditions__cols">
        {!avoir && (
          <div>
            <div className="doc-etiquette">Conditions de paiement</div>
            <p>{document.conditionsPaiement}{acompte ? ` (acompte de ${acompte} %).` : '.'}</p>
          </div>
        )}
        <div>
          <div className="doc-etiquette">{avoir ? 'Remboursement' : 'Moyens de paiement'}</div>
          <p>{avoir ? 'Montant déduit de votre prochaine facture ou remboursé par virement.' : document.moyensPaiement.join(', ') || '—'}</p>
          {type !== 'devis' && mentions.iban && <p className="doc-banque">IBAN {mentions.iban}{mentions.bic ? ` · BIC ${mentions.bic}` : ''}</p>}
        </div>
        {charte.options.afficherQr && !avoir && (
          <div className="doc-qr"><QrIllustratif /><span>Payer par virement<br />en scannant ce code</span></div>
        )}
      </div>
      {type === 'devis' && document.texteLibre && <p className="doc-notes">{document.texteLibre}</p>}
      {type === 'devis' && <p className="doc-petit">{[textes.validite, textes.conditions].filter(Boolean).join(' ')}</p>}
      {type === 'facture' && <p className="doc-petit">{[textes.penalites, textes.indemnite].filter(Boolean).join(' ')}</p>}
      <div className="doc-cloture">
        {textes.remerciement && <p className="doc-merci">{textes.remerciement}</p>}
        {type === 'devis' && bonPourAccord && charte.options.afficherSignature && (
          <div className="doc-signature">
            <div className="doc-etiquette">Bon pour accord</div>
            <p>{bonPourAccord.mention}</p>
          </div>
        )}
      </div>
    </div>
  )
}
