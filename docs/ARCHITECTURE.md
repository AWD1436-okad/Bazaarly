# Tradex Architecture

## Overview

Tradex is a server-rendered Next.js application backed by PostgreSQL through Prisma. In production, the app is hosted on Vercel and the shared database is hosted on Neon. The app uses one shared database and one shared market state so every player exists in the same world.

## Main Layers

- `app/`
  App Router pages, layouts, POST routes, and styling
- `components/`
  Reusable UI like navigation, cards, and small interactive pieces
- `lib/`
  Business logic, auth helpers, Prisma access, simulation, ranking, and catalog data
- `prisma/`
  Schema, SQL migrations, and seed data

## Request Flow

1. The user loads a Next.js page or submits a form
2. A route handler validates and processes the request
3. Prisma writes or reads shared data from Neon Postgres
4. The page re-renders with updated marketplace state

## Core Domain Models

- `User`
  Account, balance, onboarding status
- `Shop`
  One shop per player
- `Product`
  Predefined catalog item with category, AUD base price, and dedicated unit label
- `Inventory`
  Owned stock and allocated stock
- `Listing`
  Active or sold-out shop listing
- `Cart` and `CartItem`
  Buyer cart state
- `Order` and `OrderLineItem`
  Checkout history
- `Notification`
  Sale and low-stock messages
- `MarketProductState`
  Supplier price, demand score, and market averages
- `BotCustomer` and `MarketEvent`
  Economy simulation inputs

## Important Design Choices

- Authentication is database-backed, not in-memory
- Checkout is transaction-safe and updates money, stock, orders, and notifications together
- Listings reserve inventory rather than duplicating stock
- Product supply is controlled by a predefined safe catalog
- Product categories now use a 15-category source-of-truth catalog and products store unit labels separately from names
- Marketplace state is shared globally, not per user

## Deployment Notes

- Production hosting is on Vercel
- Production database provider is Neon
- Prisma uses the `postgresql` datasource provider
- `vercel.json` pins the app to `syd1` to stay close to the Australia-hosted database
- Production URL is [https://tradex.vercel.app](https://tradex.vercel.app)
