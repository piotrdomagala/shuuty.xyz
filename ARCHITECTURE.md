# Workspace Architecture

## Scope

This file defines the current relationship between the two repositories in this workspace.
It describes ownership, responsibility boundaries, and change rules.

It is intentionally about the architecture of the workspace, not about aspirational future structure.

## Current State

This workspace currently contains two related but asymmetric repositories:

- `S-` - the product system
- `Shuuty APP` - the public presentation layer

They share branding, terminology, and product messaging.
They do not currently share product logic, domain ownership, or API ownership.

## Agent Quickstart

Use this section first before making changes.

1. Classify the request:

- product behavior, API, data, auth, tasks, meetings, chat, subscriptions -> `S-`
- landing, SEO, copy, screenshots, legal, support -> `Shuuty APP`
- verification, short links, app-open redirects -> inspect `S-/web` first, then decide whether `Shuuty APP` also needs public UX alignment

2. Default to the smallest valid scope:

- prefer changing one repo
- change both repos only for naming consistency, brand alignment, or verification handoff UX

3. When in doubt:

- default to `S-` for product truth
- ask before creating shared code, mirrored models, or new cross-repo abstractions

## Repository Roles

### 1. `S-` (Primary Product System)

**Role**

This is the main product repository.
It contains the real product surface, the backend, and the product-owned data model.

**Contains**

- mobile application
- backend API and business rules
- domain entities and persistence
- product flows such as auth, tasks, meetings, conversations, mentions, and verification
- app-facing subscription handling
- product-adjacent web flows under `S-/web`

**Authority**

- canonical source for product behavior
- canonical source for API contracts
- canonical source for domain modeling
- canonical source for product terminology

**Important nuance**

Within `S-`, the strongest technical source of truth is the backend and schema layer, while the mobile app is the primary client experience.

Some billing truth may also live in external providers such as App Store, Google Play, or RevenueCat, but application-level subscription handling still belongs in `S-`.

### 2. `S-/web` (Product-Adjacent Web Surface)

**Role**

This is not the marketing site.
It is a narrow functional web surface tied to product flows.

**Use it for**

- email verification flows
- short-link resolution
- deep-link handoff into the app
- lightweight product-owned web entry points

**Do not treat it as**

- the public marketing site
- a full web client for the product
- an admin panel

### 3. `Shuuty APP` (Marketing / Presentation Layer)

**Role**

This repository is currently a marketing microsite around the mobile product.
It is presentation-first, public-facing, and intentionally lightweight.

**Contains**

- landing page
- product explanation and screenshots
- legal and support pages
- public verification / deep-link fallback UX
- brand presentation and public messaging

**Does not currently contain**

- canonical domain models
- planner, task, meeting, or chat implementations
- authenticated product flows
- backend runtime
- product API ownership
- admin or dashboard implementation
- shared product state management

**Important nuance**

If product features appear in `Shuuty APP`, they should be treated as descriptive copy unless the repository clearly implements them.
Do not treat landing content or legal text as evidence that the web repo owns the feature.

## Source of Truth

Current ownership is:

- product domain, business rules, and API contracts -> `S-/backend`
- primary end-user product client -> `S-` mobile app
- product-owned web entry flows -> `S-/web`
- public marketing, legal, support, and SEO surface -> `Shuuty APP`

## Core Architecture Rule

- `S-` is the product system
- `Shuuty APP` is the presentation layer

Do not mix those responsibilities.

## Agent Hard Rules

- MUST treat `S-` as authoritative for product logic
- MUST treat `Shuuty APP` as presentation-first unless code clearly proves otherwise
- MUST inspect `S-/web` before changing public verification or short-link flows
- MUST NOT infer feature ownership from marketing copy, legal text, screenshots, or design-only assets
- MUST NOT introduce shared packages, shared state, or duplicated domain layers across repos without explicit approval
- SHOULD ask the user before turning the long-term vision into current implementation

## AI and Developer Rules

### 1. Do not mirror product logic into `Shuuty APP`

Do not copy or recreate:

- task systems
- planner logic
- chat logic
- backend logic
- API contract logic
- domain state machines

### 2. Treat `S-` as authoritative

If there is a conflict about product behavior, naming, flow ownership, or data shape, `S-` wins.

### 3. Keep `Shuuty APP` lightweight

Web should remain:

- fast
- clear
- persuasive
- easy to maintain

Do not add complex infrastructure there unless the product scope actually changes.

### 4. Avoid premature sharing

Do not introduce shared packages, shared domain layers, mirrored models, or synchronized state across repos unless there is a real second product client that needs them.

### 5. Keep naming consistent

Even when logic is not shared:

- names should stay consistent
- terminology should match the product
- marketing should describe existing concepts rather than invent alternate labels

If the product uses `Task`, the presentation layer should not casually rename it to `Activity`.

### 6. Keep brand consistency without coupling logic

Brand language, screenshots, visual direction, and product vocabulary should feel consistent across repos.
That does not justify sharing business logic or inflating the marketing layer.

## Important Distinction: Two Web Surfaces Exist

There are two different web concerns in the workspace:

- `S-/web` handles product-adjacent functional web flows
- `Shuuty APP` handles public presentation and marketing

Do not collapse them into one conceptual layer.

If a task involves verification, app redirects, or short links, inspect `S-/web` first and check whether `Shuuty APP` also needs aligned public UX.

## When Cross-Repo Thinking Applies

Cross-repo thinking is appropriate when changing:

- branding
- visual language
- product terminology
- screenshots and feature descriptions
- download messaging
- public verification entry or fallback UX

Cross-repo thinking is not appropriate when changing:

- business rules
- domain models
- persistence
- API contracts
- client-side product state
- planner, meeting, task, or chat implementation

## UX Relationship

Today the product relationship is:

- mobile in `S-` is interactive and operational
- web in `Shuuty APP` is informative and persuasive

The marketing site should help users understand and trust the product.
It should not simulate a full product architecture that does not exist on the web yet.

## Typical Mistakes to Avoid

- treating `Shuuty APP` as a full web app
- duplicating planner logic in `Shuuty APP`
- creating fake API layers in `Shuuty APP`
- synchronizing state across repos without real need
- assuming marketing copy equals implementation
- confusing `S-/web` with the marketing site

## Change Routing Guide

Start in `S-` when changing:

- tasks
- meetings
- groups
- chat
- auth behavior
- verification rules
- subscriptions
- APIs
- schema or persistence
- short-link behavior

Start in `Shuuty APP` when changing:

- landing page structure
- public messaging
- SEO
- screenshots
- legal pages
- support copy
- store call-to-actions

Check both repos when changing:

- naming consistency
- brand presentation
- verification handoff UX
- app-open / store fallback journeys

## Routing Examples

- add or change task logic -> `S-`
- add or change meeting or chat behavior -> `S-`
- change email verification behavior -> `S-/web`
- update landing copy or screenshots -> `Shuuty APP`
- update legal or support pages -> `Shuuty APP`
- align verification fallback copy or store CTA -> inspect `S-/web` first, then update `Shuuty APP` only if the public-facing experience should stay aligned
- create a shared domain package or shared API layer -> stop and ask first

## Escalation Rules

Ask before:

- introducing shared packages, shared types, or shared state between repos
- moving behavior from `Shuuty APP` into `S-/web` or the reverse
- treating `Shuuty APP` as an authenticated product surface, admin panel, or dashboard
- implementing the long-term vision as if it were already the current architecture

## Long-Term Vision

The system may evolve into:

- mobile app (primary)
- web app (full version)
- admin panel

At that stage:

- shared architecture will be required
- API contracts should be unified deliberately
- domain ownership should be centralized explicitly
- shared packages may become justified
- shared design tokens and components may become justified

This is not the current state.

Until that transition is explicitly started, treat the workspace as:

- `S-` = product system
- `Shuuty APP` = presentation layer

## Final Rule

Use the simplest architecture that matches the current product reality.
Do not build tomorrow's shared platform inside today's marketing site.
