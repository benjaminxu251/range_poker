# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Range Poker - a card drafting game against a dealer. **Read `PRD.md` first for product requirements.**

## Quick Reference

- **Easy Mode**: Player takes or passes revealed cards until they have 5; dealer gets 8; best 5-card hand wins
- **Hard Mode**: Player defines stopping conditions (card ranges); dealer deals until match; player gets match, dealer gets the rest

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- No backend required (client-side only)

## Development Commands

```bash
cd C:/Users/hyper/Projects/web_apps/range_poker
npm install
npm run dev      # Dev server
npm run build    # Production build
```
