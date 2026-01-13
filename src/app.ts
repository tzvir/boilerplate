import express, { Request, Response } from 'express';

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Node.js Docker boilerplate with TypeScript' });
});

export default app;
