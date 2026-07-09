# AI Behavioral Guidelines — Backend (NestJS + GraphQL)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add a resolver" → "Ensure `npx tsc --noEmit` passes and the query/mutation returns correct data"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Add new module" → "Confirm module is registered in AppModule and type-checks cleanly"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 5. Project Specific Rules
Always refer to these specialized guideline files when performing related tasks:
- **For Technology Stack (NestJS, GraphQL, TypeORM, Libraries)**: Read `e:\Project\Personal\mobiles\portfolio-tracking\portfolio-tracking-backend\.agents\rule\tech_stack.md`
- **For Backend Architecture & Module Structure**: Read `e:\Project\Personal\mobiles\portfolio-tracking\portfolio-tracking-backend\.agents\rule\clean_architecture.md`
- **For API Design (GraphQL Schema, Resolvers, DTOs)**: Read `e:\Project\Personal\mobiles\portfolio-tracking\portfolio-tracking-backend\.agents\rule\api_design.md`
- **For Folder Structure (Module, Resolver, Service placement)**: Read `e:\Project\Personal\mobiles\portfolio-tracking\portfolio-tracking-backend\.agents\rule\project_structure.md`
- **For Performance, Security & Testing Rules**: Read `e:\Project\Personal\mobiles\portfolio-tracking\portfolio-tracking-backend\.agents\rule\advanced_guidelines.md`

## 6. Default Workflow (Auto Develop)
Unless specified otherwise, treat every feature implementation or bug fixing request as an **"auto_develop"** task. You MUST work autonomously end-to-end: write code, implicitly run terminal checks (e.g., `npx tsc --noEmit`), self-fix any errors in a loop, and ONLY stop and report back to the user when the feature is completely functional and error-free. Do not stop to ask trivial questions.
