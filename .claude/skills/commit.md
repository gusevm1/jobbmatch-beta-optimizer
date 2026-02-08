---
name: commit
description: Create structured git commits and push to remote
user_invocable: true
---

Create a well-structured git commit following conventional commits format, then push.

## Steps

1. Run `git status` to see all changed files
2. Run `git diff` to review the actual changes
3. Categorize the changes:
   - `feat(<scope>):` — New feature or functionality
   - `fix(<scope>):` — Bug fix
   - `docs(<scope>):` — Documentation only
   - `style(<scope>):` — Formatting, no logic change
   - `refactor(<scope>):` — Code restructuring, no behavior change
   - `test(<scope>):` — Adding or updating tests
   - `chore(<scope>):` — Build, config, maintenance
4. Scope should be: `backend`, `frontend`, `config`, or omitted for cross-cutting
5. Stage the relevant files (prefer specific files over `git add -A`)
6. Create the commit:

```
<type>(<scope>): <short imperative description>

- Bullet point details of what changed
- And why

Co-Authored-By: Claude <noreply@anthropic.com>
```

7. Push to remote: `git push` (or `git push -u origin <branch>` if new branch)
8. Update `.claude/CLAUDE.md` — mark the current task as `[x]` and update CURRENT STATE section

## Rules
- One logical change per commit
- Message under 72 chars for the first line
- Always include Co-Authored-By
- Always push after committing
- Always update CLAUDE.md task status after committing
