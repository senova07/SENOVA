import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  WrenchIcon, CubeIcon, HardHatIcon, TruckIcon, ArrowsClockwiseIcon, ShapesIcon, XIcon, StarIcon, InfoIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import {
  ARTICLE_TYPES, CATEGORIES, UNITS, VAT_RATES, type Article, type ArticleType,
} from '../../data/articles'
import { formatPrice, formatVat, parsePrice } from '../../lib/format'
import './drawer.css'

const TYPE_ICONS: Record<ArticleType, Icon> = {
  service: WrenchIcon,
  produit: CubeIcon,
  'main-oeuvre': HardHatIcon,
  deplacement: TruckIcon,
  abonnement: ArrowsClockwiseIcon,
  autre: ShapesIcon,
}

const DRAWER_UNITS = ['heure', 'unité', 'forfait', 'jour', 'mois']

export type ArticleInput = Omit<Article, 'id' | 'lastUsedAt'>

interface Props {
  mode: 'create' | 'edit'
  initial?: Partial<Article>
  existing: Article[]
  autoFocus?: boolean
  onClose: () => void
  onSave: (data: ArticleInput) => void
}

const fmtInput = (n?: number) => (n == null ? '' : n.toFixed(2).replace('.', ','))

function suggestReference(type: ArticleType, existing: Article[]) {
  const prefix = ARTICLE_TYPES.find((t) => t.id === type)!.refPrefix
  const nums = existing
    .map((a) => a.reference.match(new RegExp(`^${prefix}-(\\d+)$`)))
    .filter(Boolean)
    .map((m) => Number(m![1]))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  const width = prefix === 'MO' || prefix === 'PR' ? 3 : 2
  return `${prefix}-${String(next).padStart(width, '0')}`
}

export function ArticleDrawer({ mode, initial, existing, autoFocus = true, onClose, onSave }: Props) {
  const initialType: ArticleType = initial?.type ?? 'service'
  const initialUnit = initial?.unit ?? ''
  const unitIsStandard = initialUnit === '' || DRAWER_UNITS.includes(initialUnit)

  const [type, setType] = useState<ArticleType>(initialType)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [reference, setReference] = useState(initial?.reference ?? '')
  const [refTouched, setRefTouched] = useState(mode === 'edit')
  const [unit, setUnit] = useState(unitIsStandard ? initialUnit : 'autre')
  const [customUnit, setCustomUnit] = useState(unitIsStandard ? '' : initialUnit)
  const [unitTouched, setUnitTouched] = useState(mode === 'edit')
  const [price, setPrice] = useState(fmtInput(initial?.priceHT))
  const [vat, setVat] = useState(initial?.vatRate ?? 20)
  const [purchase, setPurchase] = useState(fmtInput(initial?.purchasePrice))
  const [category, setCategory] = useState(initial?.category ?? '')
  const [favorite, setFavorite] = useState(initial?.favorite ?? false)

  const [errors, setErrors] = useState<{ name?: string; price?: string }>({})
  const [closing, setClosing] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [dirty, setDirty] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (autoFocus) nameRef.current?.focus() }, [autoFocus])

  const close = () => {
    setClosing(true)
    window.setTimeout(onClose, 160)
  }
  const requestClose = () => {
    if (dirty && !confirmDiscard) { setConfirmDiscard(true); return }
    close()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const mark = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setDirty(true); setConfirmDiscard(false) }

  const chooseType = (t: ArticleType) => {
    mark(setType)(t)
    if (!refTouched) setReference('')
    if (!unitTouched) setUnit('')
  }

  const priceNum = parsePrice(price)
  const purchaseNum = parsePrice(purchase)
  const margin = useMemo(() => {
    if (priceNum == null || purchaseNum == null || priceNum === 0) return null
    const m = priceNum - purchaseNum
    return { amount: m, rate: (m / priceNum) * 100 }
  }, [priceNum, purchaseNum])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Donnez un nom à l’article pour le retrouver dans vos devis.'
    if (priceNum == null) next.price = price.trim() ? 'Saisissez un montant valide, par exemple 65,00.' : 'Indiquez le prix de vente HT.'
    setErrors(next)
    if (next.name) { nameRef.current?.focus(); return }
    if (next.price) { document.getElementById('art-price')?.focus(); return }
    onSave({
      type,
      name: name.trim(),
      description: description.trim() || undefined,
      reference: reference.trim() || suggestReference(type, existing),
      unit: unit === 'autre' ? customUnit.trim() || 'unité' : unit || ARTICLE_TYPES.find((x) => x.id === type)!.defaultUnit,
      priceHT: priceNum!,
      vatRate: vat,
      purchasePrice: purchaseNum ?? undefined,
      category: category.trim() || undefined,
      favorite,
    })
    close()
  }

  const title = mode === 'create' ? 'Nouvel article' : 'Modifier l’article'
  const TypeIcon = TYPE_ICONS[type]
  const unitLabel = unit === 'autre' ? customUnit || 'unité' : unit || ARTICLE_TYPES.find((x) => x.id === type)!.defaultUnit

  return (
    <div className="drawer-root" data-closing={closing || undefined}>
      <div className="drawer-scrim" onClick={requestClose} aria-hidden />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer__head">
          <div>
            <h2 id="drawer-title" className="drawer__title">{title}</h2>
            <p className="drawer__sub">
              {mode === 'create'
                ? 'Ajoutez un produit ou service à votre catalogue.'
                : <>Référence <span className="mono">{initial?.reference}</span></>}
            </p>
          </div>
          <button type="button" className="icon-btn drawer__close" onClick={requestClose} aria-label="Fermer le panneau">
            <XIcon size={18} weight="bold" aria-hidden />
          </button>
          <span className="drawer__facet" aria-hidden />
        </header>

        <form id="article-form" className="drawer__body" onSubmit={submit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="art-type">Type d’article</label>
            <div className="select-icon">
              <TypeIcon size={18} weight="duotone" className="select-icon__icon" aria-hidden />
              <select id="art-type" className="select" value={type} onChange={(e) => chooseType(e.target.value as ArticleType)}>
                {ARTICLE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="art-name">Nom de l’article</label>
            <input
              ref={nameRef}
              id="art-name"
              className="input"
              placeholder="Ex. : Entretien chaudière annuel"
              value={name}
              onChange={(e) => { mark(setName)(e.target.value); if (errors.name) setErrors({ ...errors, name: undefined }) }}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'art-name-err' : undefined}
            />
            {errors.name && <span id="art-name-err" className="field__error">{errors.name}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="art-desc">Description</label>
            <textarea
              id="art-desc"
              className="textarea"
              rows={3}
              placeholder="Décrivez l’article, son utilisation, ses caractéristiques…"
              value={description}
              onChange={(e) => mark(setDescription)(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label className="field__label" htmlFor="art-ref">Référence interne</label>
              <input
                id="art-ref"
                className="input"
                placeholder={`Ex. : ${suggestReference(type, existing)}`}
                value={reference}
                onChange={(e) => { setRefTouched(true); mark(setReference)(e.target.value.toUpperCase()) }}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="art-cat">Catégorie</label>
              <select id="art-cat" className="select" data-empty={!category || undefined} value={category} onChange={(e) => mark(setCategory)(e.target.value)}>
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                {category && !CATEGORIES.includes(category) && <option value={category}>{category}</option>}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label className="field__label" htmlFor="art-unit">Unité</label>
              <select
                id="art-unit"
                className="select"
                data-empty={!unit || undefined}
                value={unit}
                onChange={(e) => { setUnitTouched(true); mark(setUnit)(e.target.value) }}
              >
                <option value="" disabled hidden>Sélectionner une unité</option>
                {DRAWER_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                <option value="autre">autre…</option>
              </select>
              {unit === 'autre' && (
                <>
                  <label className="sr-only" htmlFor="art-unit-custom">Unité personnalisée</label>
                  <input id="art-unit-custom" className="input" list="unit-list" placeholder="Ex. m², km, lot" value={customUnit} onChange={(e) => mark(setCustomUnit)(e.target.value)} />
                  <datalist id="unit-list">{UNITS.filter((u) => !DRAWER_UNITS.includes(u)).map((u) => <option key={u} value={u} />)}</datalist>
                </>
              )}
            </div>
            <div className="field">
              <label className="field__label" htmlFor="art-price">Prix de vente HT</label>
              <div className="input-affix">
                <input
                  id="art-price"
                  className="input"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => { mark(setPrice)(e.target.value); if (errors.price) setErrors({ ...errors, price: undefined }) }}
                  onBlur={() => { if (priceNum != null) setPrice(fmtInput(priceNum)) }}
                  aria-invalid={!!errors.price}
                  aria-describedby="art-price-hint"
                />
                <span className="input-affix__suffix">€</span>
              </div>
              {errors.price
                ? <span id="art-price-hint" className="field__error">{errors.price}</span>
                : priceNum != null && <span id="art-price-hint" className="field__hint num">soit {formatPrice(priceNum * (1 + vat / 100))} TTC / {unitLabel}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label className="field__label" htmlFor="art-vat">TVA</label>
              <select id="art-vat" className="select" value={vat} onChange={(e) => mark(setVat)(Number(e.target.value))}>
                {VAT_RATES.map((v) => <option key={v} value={v}>{formatVat(v)}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="art-purchase">Prix d’achat <small>(optionnel)</small></label>
              <div className="input-affix">
                <input
                  id="art-purchase"
                  className="input"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={purchase}
                  onChange={(e) => mark(setPurchase)(e.target.value)}
                  onBlur={() => { if (purchaseNum != null) setPurchase(fmtInput(purchaseNum)) }}
                  aria-describedby="art-margin"
                />
                <span className="input-affix__suffix">€</span>
              </div>
              {margin && (
                <span id="art-margin" className="field__hint num" data-negative={margin.amount < 0 ? true : undefined}>
                  Marge <strong className="margin">{formatPrice(margin.amount)}</strong> · {margin.rate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %
                </span>
              )}
            </div>
          </div>

          <label className="fav-row">
            <input type="checkbox" role="switch" className="switch" checked={favorite} onChange={(e) => mark(setFavorite)(e.target.checked)} />
            <StarIcon size={20} weight={favorite ? 'fill' : 'regular'} className="fav-row__star" data-on={favorite || undefined} aria-hidden />
            <span className="fav-row__text">
              <span className="fav-row__label">Ajouter aux favoris</span>
              <span className="field__hint">Cet article sera marqué comme favori pour un accès rapide.</span>
            </span>
          </label>

          {mode === 'edit' && (
            <p className="drawer__note">
              <InfoIcon size={16} weight="duotone" aria-hidden />
              Les devis et factures déjà émis conservent le tarif d’origine. La modification s’applique aux prochains documents.
            </p>
          )}
        </form>

        <footer className="drawer__foot">
          {confirmDiscard ? (
            <>
              <span className="drawer__foot-msg">Modifications non enregistrées.</span>
              <button type="button" className="btn btn--secondary btn--lg" onClick={() => setConfirmDiscard(false)}>Continuer</button>
              <button type="button" className="btn btn--secondary btn--lg btn--danger" onClick={close}>Abandonner</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn--secondary btn--lg drawer__cancel" onClick={requestClose}>Annuler</button>
              <button type="submit" form="article-form" className="btn btn--primary btn--lg drawer__save">
                {mode === 'create' ? 'Enregistrer l’article' : 'Enregistrer les modifications'}
              </button>
            </>
          )}
        </footer>
      </aside>
    </div>
  )
}
