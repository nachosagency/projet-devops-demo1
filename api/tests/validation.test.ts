// Tests unitaires : une fonction, sans base, sans reseau. Ils tournent en une seconde.
import { erreurTitre, TITRE_MAX } from '../src/validation';

describe('erreurTitre', () => {
  test('accepte un titre normal', () => {
    expect(erreurTitre('Preparer le cours')).toBeNull();
  });

  test('refuse un titre vide ou fait d espaces', () => {
    expect(erreurTitre('')).toBe('Le titre est obligatoire');
    expect(erreurTitre('   ')).toBe('Le titre est obligatoire');
  });

  test('refuse un titre trop long', () => {
    expect(erreurTitre('x'.repeat(TITRE_MAX + 1))).toMatch(/depasse/);
  });

  test('refuse ce qui n est pas un texte', () => {
    expect(erreurTitre(42)).toBe('Le titre doit etre un texte');
    expect(erreurTitre(undefined)).toBe('Le titre doit etre un texte');
  });
});
