# SaaS Roadmap (Nallas Connect)

## Objective
Build a production-ready B2B SaaS hiring platform with multi-tenant security, subscriptions, and self-serve onboarding.

## Phase 1: SaaS Core (Now)
- Public website conversion and trust pages (`/pricing`, `/privacy`, `/terms`)
- Role-based application access and protected routes
- Performance baseline (lazy-loaded app/auth routes)
- Basic onboarding flows (signup, login, setup)

## Phase 2: Multi-Tenant Foundation
- Tenant model with strict row-level tenant scoping
- Organization workspace onboarding (name, domain, admin user)
- Invite-based team management and seat controls
- Audit trails for admin and security actions

## Phase 3: Billing and Plans
- Plan catalog (Starter, Pro, Enterprise)
- Metered limits (active jobs, users, assessments)
- Subscription lifecycle (trial, active, past_due, canceled)
- Invoice + payment provider integration (Stripe recommended)

## Phase 4: Product-Led Growth
- In-app upgrade prompts and usage limit warnings
- Trial expiration and conversion flows
- Feature gating by plan
- Email lifecycle: activation, trial reminders, renewal

## Phase 5: Enterprise Readiness
- SSO/SAML, SCIM, and advanced RBAC
- Data retention policies and compliance exports
- Status page + uptime SLA reporting
- Backup/restore and incident runbooks

## Immediate Technical Backlog
- Fix client TypeScript build blockers in `CollegeDashboardPage.tsx`
- Add ESLint flat config for v9 and enforce CI checks
- Add route-level analytics (landing conversion, signup funnel)
- Add API rate limiting + bot protection on auth/public forms
