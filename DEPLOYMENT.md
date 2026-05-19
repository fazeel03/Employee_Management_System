# EMS Docker Compose Deployment

This monorepo keeps one Dockerfile per service and uses `docker-compose.prod.yml` at the repository root to run the production stack on EC2. The production database is AWS RDS MySQL, so Compose does not start a MySQL container.

## Create Env Files On EC2

Create real env files from the committed examples:

```bash
mkdir -p env
cp env/api.env.example env/api.env
cp env/reports.env.example env/reports.env
```

Edit `env/api.env` and `env/reports.env` on the EC2 host with real RDS, JWT, domain, and email values. Do not put real passwords or secrets in the example files.

## Validate Compose Config

From the repository root:

```bash
docker compose -f docker-compose.prod.yml config
```

This checks YAML syntax, service names, build contexts, env files, networks, and healthcheck definitions before containers are started.

## Start Services

Build and start the stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check container state:

```bash
docker compose -f docker-compose.prod.yml ps
```

The frontend publishes host port `80`. The API and reports services are private on `employee-network` by default and are reached through frontend nginx.

## View Logs

All services:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

One service:

```bash
docker compose -f docker-compose.prod.yml logs -f employee-api
docker compose -f docker-compose.prod.yml logs -f employee-reports-service
docker compose -f docker-compose.prod.yml logs -f employee-frontend
```

## Restart One Service

```bash
docker compose -f docker-compose.prod.yml restart employee-api
```

Use the same pattern for `employee-reports-service` or `employee-frontend`.

## Pull Or Rebuild After New Code

If EC2 builds images from the checked-out repository:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

If a future CI pipeline pushes images to a registry, update the Compose file to use `image:` tags and deploy with:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Avoid Committing Secrets

Real env files are intentionally ignored by git:

```text
env/*.env
```

Only `env/*.env.example` files should be committed. Before committing, check that no real secrets are staged:

```bash
git status
git diff --cached
```

## GitHub Actions Deployment Secrets

The root workflows live in `.github/workflows` and are monorepo-aware. The production deploy workflow connects to EC2 over SSH and runs the same Compose deployment used manually.

Add these repository secrets in GitHub:

```text
EC2_HOST=your-ec2-public-ip-or-dns
EC2_USER=ubuntu
EC2_SSH_KEY=contents-of-the-private-ssh-key
EC2_SSH_PORT=22
EC2_APP_DIR=/home/ubuntu/employee_management_system
```

`env/api.env` and `env/reports.env` must already exist on EC2. Do not store those application secrets in GitHub Actions unless a future secret-sync process is intentionally designed.

The CI workflow currently treats frontend lint and tests as non-blocking because the existing frontend has pre-existing lint failures. Docker builds and Compose validation remain blocking gates.
