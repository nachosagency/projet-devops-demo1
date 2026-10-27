import './style.css';

// Le front appelle /api, a sa propre adresse. C'est son serveur (nginx en
// production, Vite en developpement) qui relaie vers l'API. Aucune adresse n'est
// donc figee dans les fichiers construits : la meme image sert en test, en
// acceptation et en production.
const API = '/api';

interface Tache {
  id: number;
  title: string;
  done: boolean;
}

const formulaire = document.querySelector('#formulaire') as HTMLFormElement;
const saisie = document.querySelector('#saisie') as HTMLInputElement;
const liste = document.querySelector('#liste') as HTMLUListElement;
const etat = document.querySelector('#etat') as HTMLParagraphElement;

async function appeler(chemin: string, options?: RequestInit): Promise<Response> {
  const reponse = await fetch(`${API}${chemin}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!reponse.ok && reponse.status !== 204) throw new Error(`HTTP ${reponse.status}`);
  return reponse;
}

function ligne(tache: Tache): HTMLLIElement {
  const li = document.createElement('li');
  if (tache.done) li.classList.add('faite');

  const titre = document.createElement('span');
  titre.textContent = tache.title;
  titre.addEventListener('click', async () => {
    await appeler(`/tasks/${tache.id}`, { method: 'PATCH' });
    await afficher();
  });

  const bouton = document.createElement('button');
  bouton.textContent = 'Supprimer';
  bouton.addEventListener('click', async () => {
    await appeler(`/tasks/${tache.id}`, { method: 'DELETE' });
    await afficher();
  });

  li.append(titre, bouton);
  return li;
}

async function afficher(): Promise<void> {
  try {
    const taches: Tache[] = await (await appeler('/tasks')).json();
    liste.replaceChildren(...taches.map(ligne));
    etat.textContent = `${taches.length} tâche(s) · API : ${API}`;
  } catch (erreur) {
    etat.textContent = `API injoignable sur ${API} (${(erreur as Error).message})`;
  }
}

formulaire.addEventListener('submit', async (e) => {
  e.preventDefault();
  await appeler('/tasks', { method: 'POST', body: JSON.stringify({ title: saisie.value }) });
  saisie.value = '';
  await afficher();
});

afficher();
