# Node.js + Docker Boilerplate

Quick starter for a Node.js app containerized with Docker.

Run locally:

```bash
npm install
npm run dev
```

Run with Docker (production):

```bash
docker build -t boilerplate-node-docker .
docker run -p 3000:3000 boilerplate-node-docker
```

Run with Docker Compose (development):

```bash
docker-compose up --build
```

Open http://localhost:3000
