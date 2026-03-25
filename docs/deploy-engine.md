# Lume Deploy Engine Specifications

The Lume Deploy Engine (M12) empowers developers to control, status check, and orchestrate cloud infrastructure deployments directly through English-Mode primitives (e.g., `Deploy to render from main branch`).

## Supported Compile Targets
- **Render.com**

## Environmental Dependencies (Crucial)
The compiler's execution context depends completely on ambient OS-level credential availability to securely push deployment boundaries. The `deploy` keyword actively delegates to localized shell subprocess hooks.

For `deploy to render` to successfully compile and execute, **the executing terminal must map the following dependencies:**

1. **Git Toolchain & SSH Binding:**
   The Deploy Engine executes literal `git push <remote>` sequences during execution. Your local machine MUST be authenticated with GitHub, Render, or the designated hosting target via configured SSH keys or cached HTTPS credentials.
   * `ssh-add -l` should output your target keys prior to compiling `deploy` macros.

2. **Render CLI (Optional but Recommended):**
   While git-push triggers standard builds, complex deployments and status polling matrices rely on the `RENDER_API_KEY` environment variable.
   * Define `export RENDER_API_KEY="rnd_..."` locally.
   * The Deploy Engine leverages this key when performing programmatic `deploy status` checks and `deploy rollback` commands.

## Architecture

When evaluating a deployment node out of Layer A or B, the transpiler emits `execSync` Node hooks pointing toward standard binaries rather than re-implementing network deployment logic natively inside the compiler.
