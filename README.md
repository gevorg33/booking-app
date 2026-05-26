# OptiSchedule — AI-Native Scheduling & Operational Orchestration Platform

An AI operator system where users express intent and AI agents coordinate, plan, and optimize business operations on top of a deterministic scheduling and workflow execution engine.

## Core Architecture

```
Event / Intent
  → Context Builder (business state, constraints, schedules)
  → Planner Agent (structured multi-step plan)
  → Critic / Policy Agent (validates safety + constraints)
  → Workflow Compiler (converts plan into DAG)
  → Workflow Orchestration Engine
  → Deterministic Execution Layer
  → Event Store + Audit Log
```

**Critical Principle:** AI NEVER directly modifies system state. AI proposes plans → system validates → deterministic engine executes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query |
| Backend | NestJS 11, TypeScript, TypeORM |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| Real-time | WebSockets (Socket.IO) |
| Architecture | Modular monolith, DDD, Event-driven |

## Project Structure

```
├── backend/
│   └── src/
│       ├── main.ts                          # App bootstrap
│       ├── app.module.ts                    # Root module
│       ├── config/                          # Configuration (DB, App, Redis)
│       ├── database/                        # Database module, migrations
│       ├── common/                          # Guards, filters, decorators, interceptors
│       ├── modules/                         # Domain modules
│       │   ├── auth/                        # Authentication (JWT, register, login)
│       │   ├── user/                        # User entity
│       │   ├── business/                    # Multi-tenant business
│       │   ├── employee/                    # Employee management
│       │   ├── customer/                    # Customer management
│       │   ├── service/                     # Service catalog
│       │   ├── schedule/                    # Schedule templates, assignments, overrides
│       │   └── booking/                     # Booking CRUD + availability
│       ├── engine/                          # Core engines
│       │   ├── scheduling/                  # Deterministic scheduling engine
│       │   ├── workflow/                    # DAG workflow engine (compiler + executor)
│       │   ├── policy/                      # Policy & safety engine
│       │   └── agent/                       # AI agent framework
│       ├── events/                          # Event system
│       │   └── store/                       # Event store (audit log)
│       └── websocket/                       # Real-time gateway
├── frontend/
│   └── src/
│       ├── app/                             # Next.js App Router
│       │   ├── (auth)/                      # Login, Register
│       │   └── (dashboard)/                 # Dashboard, Bookings, Schedule, AI Ops
│       ├── components/                      # Shared components
│       └── lib/                             # API client, store
└── docker-compose.yml                       # PostgreSQL + Redis
```

## Core Systems

### 1. Deterministic Scheduling Engine
- **10-minute slot granularity** — all bookings align to 10-minute boundaries
- **UTC-based storage** — timezone conversion at presentation layer
- **Double-booking prevention** — pessimistic locking in PostgreSQL transactions
- **Supports:** employee schedules, breaks, vacations, service durations, buffer times
- **Source of truth** for all availability calculations

### 2. Workflow Engine (DAG)
- AI outputs compile into executable DAGs
- Each step: deterministic, idempotent, retryable, logged, auditable
- Saga pattern for compensation on failure
- Retry policies with exponential backoff
- Full execution history persisted

### 3. Policy & Safety Engine
- Pre-execution validation for all workflows
- Rules: max bookings/day, buffer enforcement, business hours, bulk operation safety
- Risk scoring (low → medium → high → critical)
- Execution modes: suggestion only, requires approval, autonomous (safe ops only)

### 4. AI Agent Framework
- **Scheduling Optimization Agent** — analyzes utilization, identifies gaps
- **Cancellation Recovery Agent** — recovers cancelled slots, proposes reassignment
- **Conflict Resolution Agent** — detects overlaps, proposes resolutions
- Agents produce structured plans, NEVER execute directly
- All plans pass through policy validation before execution

### 5. Event System
- All state changes emit domain events
- Persisted in event store for audit trail
- Powers reactive AI, system sync, and real-time WebSocket updates
- Event types: booking.*, schedule.*, employee.*, workflow.*, agent.*

## Multi-Tenant Model

- **Individuals** are businesses with a single employee
- No separate logic paths — unified model
- Registration creates: User → Business → BusinessMember → Employee

## Database Schema

```
users ──────────────────┐
  │                     │
  ├── business_members ─┤
  │                     │
businesses ─────────────┤
  │                     │
  ├── employees ────────┤
  │   └── bookings      │
  ├── customers ────────┤
  │   └── bookings      │
  ├── services          │
  ├── schedule_templates│
  │   └── schedule_assignments
  └── schedule_overrides│

event_store             # Audit log
workflow_executions     # Workflow history
agent_tasks             # AI task history
```

## API Design

### Authentication
```
POST /auth/register     # Create account + business
POST /auth/login        # Get JWT token
```

### Business Resources
```
GET    /businesses/my                          # My businesses
GET    /businesses/:id                         # Business details
PUT    /businesses/:id                         # Update business

GET    /businesses/:id/employees               # List employees
POST   /businesses/:id/employees               # Create employee
PUT    /businesses/:id/employees/:eid          # Update employee

GET    /businesses/:id/services                # List services
POST   /businesses/:id/services                # Create service

GET    /businesses/:id/customers               # List customers
POST   /businesses/:id/customers               # Create customer
```

### Scheduling
```
GET    /businesses/:id/schedules/templates     # List templates
POST   /businesses/:id/schedules/templates     # Create template
POST   /businesses/:id/schedules/assignments   # Assign to employee
GET    /businesses/:id/schedules/assignments/:eid
POST   /businesses/:id/schedules/overrides     # Vacation, sick leave, etc.
```

### Bookings
```
GET    /businesses/:id/bookings/availability   # Get available slots
POST   /businesses/:id/bookings                # Create booking
GET    /businesses/:id/bookings                # List bookings
PUT    /businesses/:id/bookings/:bid/cancel    # Cancel booking
```

### AI Operations
```
POST   /businesses/:id/agents/intent           # Submit AI intent
GET    /businesses/:id/agents/tasks             # List agent tasks
GET    /businesses/:id/agents/tasks/:tid        # Task details
PUT    /businesses/:id/agents/tasks/:tid/approve # Approve & execute
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for PostgreSQL + Redis)

### Setup

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Install backend dependencies
cd backend && npm install

# 3. Start backend (auto-syncs DB schema in dev)
npm run start:dev

# 4. Install frontend dependencies (new terminal)
cd frontend && npm install

# 5. Start frontend
npm run dev
```

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:3000

## Architecture Principles

1. **Correctness over features** — deterministic behavior always
2. **AI proposes, system disposes** — strict plan → validate → execute pipeline
3. **Event-driven** — everything emits events for reactivity and auditability
4. **Multi-tenant by default** — individuals = single-employee businesses
5. **Modular monolith** — clean DDD boundaries, ready for service extraction

## Scaling Strategy

| Phase | Architecture | When |
|-------|-------------|------|
| MVP | Modular monolith | 0-1000 businesses |
| Growth | Extract scheduling engine as service | 1000-10000 |
| Scale | Full microservices (scheduling, workflow, agents) | 10000+ |
| Enterprise | Multi-region, dedicated agent compute | 100000+ |

## Execution Safety Model

```
User Intent
  ↓
Agent (advisory only, no state mutation)
  ↓
Structured Plan (deterministic output)
  ↓
Policy Engine (validate constraints, risk score)
  ↓ DENY → reject, log, notify
  ↓ REQUIRES_APPROVAL → queue for human review
  ↓ ALLOW → proceed
Workflow Compiler (plan → DAG)
  ↓
Workflow Executor (step-by-step, with retries + compensation)
  ↓
State Change (via deterministic engine only)
  ↓
Event Store (full audit trail)
```
