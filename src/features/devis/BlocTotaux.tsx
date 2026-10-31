import { formaterEuro, formaterTaux } from '@/lib/format'
import { ChampNombre } from './ChampNombre'
import { SaisieRemise } from './SaisieRemise'
import { calculerTotaux, type Devis } from './donnees'

interface BlocTotauxProps {
  devis: Devis
  onChange(patch: Partial<Devis>): void
}

export function BlocTotaux({ devis, onChange }: BlocTotauxProps) {
  const t = calculerTotaux(devis.lignes, devis.remise, devis.acomptePourcent)

  return (
    <section className="espace-bloc" aria-labelledby="espace-totaux">
      <h2 className="espace-bloc__titre" id="espace-totaux">
        Totaux
      </h2>
      <dl className="espace-totaux">
        <div className="espace-totaux__ligne">
          <dt>Total HT brut</dt>
          <dd>{formaterEuro(t.totalHtBrut)}</dd>
        </div>
        <div className="espace-totaux__ligne">
          <dt>Remise globale</dt>
          <dd className="espace-totaux__remise">
            <SaisieRemise
              remise={devis.remise}
              totalHtBrut={t.totalHtBrut}
              remiseMontant={t.remiseMontant}
              onChange={(remise) => onChange({ remise })}
            />
            <span data-testid="remise-montant">
              {t.remiseMontant > 0 ? `− ${formaterEuro(t.remiseMontant)}` : formaterEuro(0)}
            </span>
          </dd>
        </div>
        <div className="espace-totaux__ligne espace-totaux__ligne--fort">
          <dt>Total HT</dt>
          <dd>{formaterEuro(t.totalHt)}</dd>
        </div>
        {t.tva.map((v) => (
          <div className="espace-totaux__ligne espace-totaux__ligne--doux" key={v.taux}>
            <dt>
              TVA {formaterTaux(v.taux)} <span>sur {formaterEuro(v.base)}</span>
            </dt>
            <dd>{formaterEuro(v.montant)}</dd>
          </div>
        ))}
        <div className="espace-totaux__ligne espace-totaux__ligne--ttc">
          <dt>Total TTC</dt>
          <dd data-testid="total-ttc">{formaterEuro(t.totalTtc)}</dd>
        </div>
        <div className="espace-totaux__ligne">
          <dt>Acompte demandé</dt>
          <dd className="espace-totaux__remise">
            <span className="espace-acompte">
              <ChampNombre
                aria-label="Acompte demandé en pourcentage"
                valeur={devis.acomptePourcent}
                min={0}
                max={100}
                onValeur={(acomptePourcent) => onChange({ acomptePourcent })}
              />
              <span aria-hidden="true">%</span>
            </span>
            <span data-testid="acompte-montant">{formaterEuro(t.acompte)}</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
