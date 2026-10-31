import type { CSSProperties } from 'react'
import { formaterEuro } from '@/lib/format'
import {
  EMETTEUR,
  calculerTotaux,
  dateFinValidite,
  sousTotalSection,
  totalLigneHt,
  type Devis,
  type ModeleDevis,
} from './donnees'
import { POLICES, couleurSurAccent } from './styleFeuille'
import './apercu.css'

interface ApercuDevisProps {
  devis: Devis
  modele: ModeleDevis
}

const dateFr = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR')
const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

const initiales = (nom: string) =>
  nom
    .split(/\s+/)
    .map((m) => m[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** Feuille A4 du devis, dessinée selon le modèle choisi. */
export function ApercuDevis({ devis, modele }: ApercuDevisProps) {
  const { afficher: a } = modele
  const totaux = calculerTotaux(devis.lignes, devis.remise, devis.acomptePourcent)
  const style = {
    '--accent': modele.couleurAccent,
    '--sur-accent': couleurSurAccent(modele.couleurAccent),
    fontFamily: POLICES[modele.police],
  } as CSSProperties
  // Désignation + Qté + Unité + PU + Total, plus les colonnes optionnelles.
  const nbColonnes = 5 + (a.remiseParLigne ? 1 : 0) + (a.tvaParLigne ? 1 : 0)
  const conditions = devis.conditions || modele.conditions

  const emetteur = (
    <div className="feuille-emetteur">
      {a.logo ? (
        <span className="feuille-logo" aria-hidden="true">
          {initiales(EMETTEUR.nom)}
        </span>
      ) : null}
      <div>
        <p className="feuille-emetteur__nom">{EMETTEUR.nom}</p>
        <p className="feuille-multiligne">{EMETTEUR.adresse}</p>
        <p>
          {EMETTEUR.telephone} · {EMETTEUR.email}
        </p>
        <p>
          SIRET {EMETTEUR.siret} · TVA {EMETTEUR.tvaIntracom}
        </p>
      </div>
    </div>
  )

  const titre = (
    <div className="feuille-titre">
      <p className="feuille-titre__mot">DEVIS</p>
      <p className="feuille-titre__numero">{devis.numero}</p>
      <p>Date : {dateFr(devis.dateCreation)}</p>
      <p>Valable jusqu’au {dateFr(dateFinValidite(devis))}</p>
    </div>
  )

  const client = (
    <div className="feuille-client">
      <p className="feuille-client__etiquette">Destinataire</p>
      <p className="feuille-client__nom">{devis.clientNom}</p>
      <p className="feuille-multiligne">{devis.clientAdresse}</p>
    </div>
  )

  return (
    <article
      className={`feuille-a4 feuille-a4--${modele.tableau} feuille-a4--${modele.densite}`}
      style={style}
    >
      {modele.entete === 'bandeau' ? (
        <>
          <header className="feuille-bandeau">
            {emetteur}
            {titre}
          </header>
          <div className="feuille-bandeau__suite">{client}</div>
        </>
      ) : modele.entete === 'centre' ? (
        <header className="feuille-entete feuille-entete--centre">
          {emetteur}
          {titre}
          {client}
        </header>
      ) : (
        <header className="feuille-entete">
          {emetteur}
          {titre}
          <span />
          {client}
        </header>
      )}

      <h2 className="feuille-objet">{devis.objet}</h2>
      {modele.texteIntro ? <p className="feuille-intro">{modele.texteIntro}</p> : null}

      <table className="feuille-table">
        <thead>
          <tr>
            <th>Désignation</th>
            <th className="feuille-num feuille-col-qte">Qté</th>
            <th className="feuille-col-unite">Unité</th>
            <th className="feuille-num feuille-col-pu">PU HT</th>
            {a.remiseParLigne ? <th className="feuille-num feuille-col-petit">Remise</th> : null}
            {a.tvaParLigne ? <th className="feuille-num feuille-col-petit">TVA</th> : null}
            <th className="feuille-num feuille-col-total">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {devis.lignes.map((l, i) => {
            if (l.genre === 'texte')
              return (
                <tr key={l.id} className="feuille-ligne-texte">
                  <td colSpan={nbColonnes}>{l.designation}</td>
                </tr>
              )
            if (l.genre === 'section')
              return (
                <tr key={l.id} className="feuille-ligne-section">
                  <td colSpan={nbColonnes - 1}>{l.designation}</td>
                  <td className="feuille-num">{formaterEuro(sousTotalSection(devis.lignes, i))}</td>
                </tr>
              )
            return (
              <tr key={l.id}>
                <td>
                  <span className="feuille-designation">{l.designation}</span>
                  {a.references && l.reference ? (
                    <span className="feuille-ref"> · {l.reference}</span>
                  ) : null}
                  {l.description ? (
                    <span className="feuille-description">{l.description}</span>
                  ) : null}
                </td>
                <td className="feuille-num">{nombre.format(l.quantite)}</td>
                <td>{l.unite}</td>
                <td className="feuille-num">{formaterEuro(l.prixUnitaireHt)}</td>
                {a.remiseParLigne ? (
                  <td className="feuille-num">
                    {l.remisePourcent > 0 ? `${nombre.format(l.remisePourcent)} %` : '–'}
                  </td>
                ) : null}
                {a.tvaParLigne ? (
                  <td className="feuille-num">{nombre.format(l.tauxTva)} %</td>
                ) : null}
                <td className="feuille-num feuille-total">{formaterEuro(totalLigneHt(l))}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <section className="feuille-totaux" aria-label="Totaux">
        <dl>
          <div>
            <dt>Total HT brut</dt>
            <dd>{formaterEuro(totaux.totalHtBrut)}</dd>
          </div>
          {totaux.remiseMontant > 0 ? (
            <div>
              <dt>Remise</dt>
              <dd>− {formaterEuro(totaux.remiseMontant)}</dd>
            </div>
          ) : null}
          <div className="feuille-totaux__fort">
            <dt>Total HT</dt>
            <dd>{formaterEuro(totaux.totalHt)}</dd>
          </div>
          {totaux.tva.map((t) => (
            <div key={t.taux}>
              <dt>TVA {nombre.format(t.taux)} %</dt>
              <dd>{formaterEuro(t.montant)}</dd>
            </div>
          ))}
          <div className="feuille-totaux__ttc">
            <dt>Total TTC</dt>
            <dd>{formaterEuro(totaux.totalTtc)}</dd>
          </div>
          {devis.acomptePourcent > 0 ? (
            <div>
              <dt>Acompte demandé ({nombre.format(devis.acomptePourcent)} %)</dt>
              <dd>{formaterEuro(totaux.acompte)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {a.conditions && conditions ? (
        <section className="feuille-bloc">
          <h3>Conditions de règlement</h3>
          <p>{conditions}</p>
          <p>Devis valable jusqu’au {dateFr(dateFinValidite(devis))}.</p>
        </section>
      ) : null}

      {a.signature ? (
        <section className="feuille-signature">
          <p>Bon pour accord, date et signature</p>
          <div className="feuille-signature__zone" />
        </section>
      ) : null}

      {modele.piedDePage ? <footer className="feuille-pied">{modele.piedDePage}</footer> : null}
    </article>
  )
}
