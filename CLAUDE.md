# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## README
See the main `README.md` file for guidance on this specific repository.

## Development Flow
1. For every new session and/or feature prompted, consult the main README and any docs local to the folders being modified
2. Commit relevant changes after scoped 
changes are complete. Make all changes on the `main` branch for now.
3. Make sure to update the README.md after any/every change

## Core modeling principle
Everything in DNA is modeled as **resources and relationships** — nodes with typed edges in the graph. When designing or extending any layer (Operational, Product, Technical):
* Every new construct must be defined as a **`resource_type`** (a resource primitive — a named node type in the graph)
* Every connection between constructs must be defined as a **`relationship_type`** (a relationship primitive — a named, typed, directed edge in the graph)

No behavioral state or structural hierarchy should live outside the graph.

## Conventions
* In general, run commands separately, without `&&`

## OpenSpec workflow (default)
Non-trivial changes go through OpenSpec, not ad-hoc edit-then-commit. Use the slash commands:
* `/opsx:propose <name-or-description>` — scaffold proposal/design/specs/tasks before coding
* `/opsx:apply [name]` — implement against the tasks checklist
* `/opsx:archive [name]` — move the change to `openspec/changes/archive/` and sync `openspec/specs/`
* `/opsx:explore` — think-mode for shaping a change before proposing

Skip OpenSpec only for genuinely small or contained work: typo fixes, version bumps, formatting, single-file refactors with no behavior change.