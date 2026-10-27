import { PrismaClient } from '@prisma/client';
import { createApp } from './app';

const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 3000);

// 0.0.0.0 et pas localhost : dans un conteneur, localhost n'est joignable que
// de l'interieur du conteneur lui-meme.
createApp(prisma).listen(port, '0.0.0.0', () => {
  console.log(`API sur le port ${port}`);
});
