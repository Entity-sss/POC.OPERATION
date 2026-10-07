# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Controlled first-Admin provisioning

The initial Admin is created only by `src/provisioning/first-admin-worker.ts`.
It is not part of the Astro application and its dedicated Wrangler configuration
sets `workers_dev: false`; do not deploy it or add a public route.

### Architecture & Secret Handling

- **Target Database**: Remote Cloudflare D1 (`poc-operation-db`), reached securely via Wrangler's `--remote` flag.
- **Worker Execution**: Local only (`localhost:8787`). It is never deployed to the Cloudflare edge.
- **Secret Handling**: When running `wrangler dev`, Wrangler loads secrets exclusively from the local, ignored `.dev.vars` file. Do not use `wrangler secret put` because the worker is not deployed. The token remains strictly local and ephemeral.

### Safe Provisioning Procedure

1. **Apply remote migrations**:

   ```sh
   npm run db:migrate:remote
   ```

2. **Generate a high-entropy, one-time provisioning token**:

   ```sh
   openssl rand -hex 32
   ```

3. **Set the token in local `.dev.vars`** (strictly git-ignored):
   Create `.dev.vars` in the project root:

   ```text
   FIRST_ADMIN_PROVISION_TOKEN=<generated-one-time-token>
   ```

4. **Start the local operational Worker against remote D1**:

   ```sh
   npm run provision:first-admin:remote
   ```

   The worker will listen locally on `http://localhost:8787` (or the port reported by Wrangler).

5. **Execute exactly one local POST request**:
   Send a `POST` request with `Authorization: Bearer <token>` and registration payload (`fullName`, `mobile`, `email`, `currentAddress`, `permanentAddress`, `education`, `priorExperience`, `password`).
   Keep the token and password out of shell history.
   The response returns only `{ success: true, employeeId: "S1001" }`.

6. **Stop the local Worker and delete `.dev.vars` immediately**:
   - Terminate the `npm run provision:first-admin:remote` process (Ctrl+C).
   - Delete `.dev.vars` from the project root.

7. **Verify one-time protection**:
   - Verify login through the main application: `POST /api/auth/login`.
   - Verify role & permissions: `GET /api/auth/me`.
   - Any subsequent call to the provisioner will fail closed with `409 ADMIN_ALREADY_PROVISIONED`.

Provisioning creates immutable UUID identity records, assigns the seeded Admin
role and permissions, writes `FIRST_ADMIN_PROVISIONED` to the audit log, and
refuses both bad secrets and reuse once an active Admin exists.
