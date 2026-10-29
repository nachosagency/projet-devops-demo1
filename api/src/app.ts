import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { erreurTitre } from './validation';

// L'application est creee par une fonction : les tests la construisent sans
// lancer de serveur, avec leur propre client Prisma.
export function createApp(prisma: PrismaClient) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const inutile = 42;

  // Sonde de sante : le deploiement et Docker l'appellent pour savoir si
  // l'API repond ET si elle joint sa base.
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', version: process.env.APP_VERSION ?? 'dev' });
    } catch {
      res.status(503).json({ status: 'base injoignable' });
    }
  });

  app.get('/tasks', async (_req, res) => {
    const tasks = await prisma.task.findMany({ orderBy: { id: 'asc' } });
    res.json(tasks);
  });

  app.post('/tasks', async (req, res) => {
    const erreur = erreurTitre(req.body?.title);
    if (erreur) {
      res.status(400).json({ error: erreur });
      return;
    }
    const task = await prisma.task.create({ data: { title: req.body.title.trim() } });
    res.status(201).json(task);
  });

  app.patch('/tasks/:id', async (req, res) => {
    const id = Number(req.params.id);
    const existante = await prisma.task.findUnique({ where: { id } });
    if (!existante) {
      res.status(404).json({ error: 'Tache introuvable' });
      return;
    }
    const task = await prisma.task.update({ where: { id }, data: { done: !existante.done } });
    res.json(task);
  });

  app.delete('/tasks/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { count } = await prisma.task.deleteMany({ where: { id } });
    res.status(count ? 204 : 404).end();
  });

  return app;
}
