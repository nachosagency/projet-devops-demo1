// Regles metier pures, sans base de donnees : c'est ce que testent les tests unitaires.

export const TITRE_MAX = 120;

// Renvoie un message d'erreur, ou null si le titre est valide.
export function erreurTitre(titre: unknown): string | null {
  if (typeof titre !== 'string') return 'Le titre doit etre un texte';
  const propre = titre.trim();
  if (propre.length === 0) return 'Titre obligatoire';
  if (propre.length > TITRE_MAX) return `Le titre depasse ${TITRE_MAX} caracteres`;
  return null;
}
