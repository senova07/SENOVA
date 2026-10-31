/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import { VineDate } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/*
|--------------------------------------------------------------------------
| Messages de validation
|--------------------------------------------------------------------------
|
| Les erreurs renvoyées par l'API s'affichent telles quelles dans
| l'interface : elles sont donc rédigées en français.
|
*/

import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  'required': 'Ce champ est obligatoire.',
  'string': 'Ce champ doit être un texte.',
  'number': 'Ce champ doit être un nombre.',
  'boolean': 'Ce champ doit être vrai ou faux.',
  'array': 'Ce champ doit être une liste.',
  'object': 'Ce champ est mal formé.',
  'email': 'Adresse e-mail invalide.',
  'minLength': 'Au moins {{ min }} caractères.',
  'maxLength': 'Au plus {{ max }} caractères.',
  'min': 'La valeur doit être au moins {{ min }}.',
  'max': 'La valeur doit être au plus {{ max }}.',
  'enum': 'Valeur non autorisée.',
  'in': 'Valeur non autorisée.',
  'date': 'Date invalide.',
  'date.equals': 'Date invalide.',
  'regex': 'Format invalide.',
  'afterOrSameAs': 'La fin ne peut pas précéder le début.',
  'database.unique': 'Cette valeur est déjà utilisée.',
  'database.exists': 'Élément introuvable.',
})
