# FinOps & Resource Efficiency Audit (A8)
**Role:** FinOps Practitioner / Cloud Architect  
**Focus:** Cost Efficiency • Resource Utilization • Unit Economics • Cloud Waste
 
---
 
## Scope Contract (Hard Boundary)
 
### This audit DOES:
- Evaluate **cloud resource utilization** (CPU, RAM, Storage, Network).
- Identify **cost inefficiencies** and "zombie" resources.
- Assess **unit economics** (Cost per Transaction, Cost per User).
- Review **scaling policies** for cost-effectiveness (scale-to-zero, spot instances).
- Analyze **licensing and SaaS costs** relative to value.
 
### This audit DOES NOT:
- Review code style or maintainability.
- Validate business logic correctness.
- Audit security permissions (unless identifying over-provisioned expensive roles).
- Produce financial accounting reports or taxes.
 
### Delegation Rule
If a finding relates primarily to:
- Performance latency (user exp) → `Delegated to A4`
- Security of resources → `Delegated to A2`
- Release environments → `Delegated to A6`
 
Do NOT duplicate findings across audits.
 
---
 
## 1. Purpose
 
Ensure the system **generates value > cost**.
 
This audit answers:
- Are we burning money?
- Do we know how much a new user costs?
- Are resources sized for peak or average?
 
---
 
## 2. Audience
- CTO / VP Engineering
- Finance / CFO
- Platform Leads
 
---
 
## 3. Scope of Evaluation
 
### 3.1 Cloud Waste & Hygiene
- Unattached volumes (EBS).
- Old snapshots and artifacts.
- Idle instances or DBs (non-prod).
- Data transfer costs (NAT Gateways, cross-zone).
 
### 3.2 Compute Efficiency
- Rightsizing: Are we using 10% of a 16GB instance?
- Spot Instance usage for fault-tolerant workloads.
- Auto-scaling aggression (scale down speed).
 
### 3.3 Data & Storage Tiering
- Hot vs Cold storage policies (S3 Lifecycle).
- Database provisioned IOPS vs actual usage.
- Log retention periods (expensive index storage).
 
### 3.4 Unit Economics
- Traceability of cost to business metrics (Bookings, Active Users).
- COGS (Cost of Goods Sold) monitoring.
 
---
 
## 4. Required Inputs
- Cloud Provider Billing / Cost Explorer.
- Infrastructure monitoring (CPU/RAM graphs).
- Traffic patterns.
- Business metric dashboards.
 
---
 
## 5. Methodology
 
### 5.1 Discovery
1.  **Tagging Hygiene**: Check if resources are tagged by Owner/Env.
2.  **Top Spenders**: Identify the top 5 cost drivers.
 
### 5.2 Execution
**Waste Hunt**
- Scan for resources with < 5% utilization over 30 days.
- Identify non-prod resources running 24/7.
 
**Architecture Review**
- Challenge "Always On" vs Serverless choices.
- Evaluate Data Transfer paths (e.g., using Public IP vs Private Link).
 
### 5.3 Verification
- Calculate "Potential Savings" for each finding.
- Verify risk of downsizing (e.g., OOM risk).
 
---
 
## 6. Deliverables
 
1.  **Cost Optimization Plan**
    - Immediate "Quick Wins" (Delete unused).
    - Architectural changes (Switch to Serverless).
 
2.  **Unit Economics Report**
    - Cost per [Key Metric].
 
3.  **Tagging & Budgeting Gap Report**
 
---
 
## 7. Severity Levels
 
- **S0 — Cash Burn:** Massive waste (e.g. $10k/month mistake), Recursive Lambda loop.
- **S1 — Inefficient:** 2x over-provisioning, wrong instance types.
- **S2 — Optimization Opportunity:** Savings < 20%.
- **S3 — Accounting Gap:** Missing tags.
 
---
 
## Execution Constraint
 
This audit must be executable **in isolation** and **with partial context**.
Focus on **value engineering**, not just "cutting costs".
