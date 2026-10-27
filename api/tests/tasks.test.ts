// Tests d'integration : l'API complete contre une vraie base MySQL.
// En local, la base du docker compose ; dans la CI, un conteneur MySQL fourni
// par GitHub Actions. Dans les deux cas, DATABASE_URL dit ou la trouver.
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app';

const prisma = new PrismaClient();
const app = createApp(prisma);

beforeEach(async () => {
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('API des taches', () => {
  test('GET /health repond ok quand la base est joignable', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /tasks cree une tache', async () => {
    const res = await request(app).post('/tasks').send({ title: '  Ecrire le workflow  ' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Ecrire le workflow');
    expect(res.body.done).toBe(false);
  });

  test('POST /tasks refuse un titre vide', async () => {
    const res = await request(app).post('/tasks').send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('PATCH /tasks/:id bascule la tache', async () => {
    const creee = await request(app).post('/tasks').send({ title: 'Tester la CI' });
    const res = await request(app).patch(`/tasks/${creee.body.id}`);
    expect(res.body.done).toBe(true);
  });

  test('DELETE /tasks/:id supprime, puis renvoie 404', async () => {
    const creee = await request(app).post('/tasks').send({ title: 'A supprimer' });
    expect((await request(app).delete(`/tasks/${creee.body.id}`)).status).toBe(204);
    expect((await request(app).delete(`/tasks/${creee.body.id}`)).status).toBe(404);
  });

  test('GET /tasks liste dans l ordre de creation', async () => {
    await request(app).post('/tasks').send({ title: 'Premiere' });
    await request(app).post('/tasks').send({ title: 'Seconde' });
    const res = await request(app).get('/tasks');
    expect(res.body.map((t: { title: string }) => t.title)).toEqual(['Premiere', 'Seconde']);
  });
});
