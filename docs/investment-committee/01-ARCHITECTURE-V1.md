# Hermes Investment Committee System — Architecture V1

**Document:** `01-ARCHITECTURE-V1.md`
**Date:** 2026-09-02
**Input treated as authoritative:** `00-PHASE-0-CONTEXT-PACK.md`
**Scope:** design only. No stock analysis, no code, no Hermes changes, no canonical-note edits.
**Status:** draft for adversarial review in Session 2.

Keyword conventions used in this document:

| Keyword | Meaning |
|---|---|
| `MUST` / `MUST NOT` | Invariant. Violating it is a defect, not a trade-off. |
| `SHOULD` | Default. Deviation requires a written reason in the Architecture Decision Log. |
| `MAY` | Permitted, not required. |
| `VERIFY BEFORE BUILD` | Depends on a Hermes v0.21.0 feature or semantic that was not confirmed in the read-only review. |
| `DECISION REQUIRED` | Otta must decide. The architecture does not guess. |

---

## 1. Executive Summary

The V1 system is a **pipeline with one human gate**, not a committee of bots.

- **Four execution units, zero new permanent agents.** An Evidence Pipeline (deterministic scripts plus one cheap-tier model call), one ephemeral Analyst worker, one ephemeral Red Team worker on a different model lineage, and the CIO, which is direct reasoning inside the interactive session Otta already talks to. A fifth component, the Canonical Writer, is a deterministic script and the only thing that may touch canonical memory.
- **Files are the state machine.** Every run writes immutable artifacts into a run directory outside the vault. A run manifest records which stage completed. Nothing has to stay alive while Otta thinks. Kanban, cron, and webhooks are not needed for V1.
- **Scripts produce numbers; models produce assumptions and interpretation.** Normalization, standalone-quarter derivation, ratios, valuation formulas, sensitivity tables, limit checks, staleness checks, hashing, and citation checks are deterministic. An LLM never performs arithmetic that ends up in a memo.
- **The system is allowed to stop.** `INSUFFICIENT_EVIDENCE`, `INVESTIGATE`, and `NO_DECISION` are first-class outcomes. A Red Team `BLOCK` forces the recommendation field to one of those; the CIO cannot argue its way past it.
- **Nine records, three storage classes.** Canonical (vault, one writer), append-only history (vault, one writer), run artifacts (outside vault, immutable). Existing notes are reconciled into this scheme by an explicit migration, not by a parallel taxonomy.
- **Monitoring is V2.** V1 is manually invoked. Monitoring is designed here only to the level of its contract, and `MUST NOT` be built until the manual workflow passes the controlled fixtures.

The most important thing this design removes: the six-agent committee from the June 2026 spec, Mixture of Agents as a verification mechanism, single target prices, and a single composite decision score.

---

## 2. Confirmed Constraints from the Context Pack

Each line below is taken from the Context Pack and is treated as binding.

**Authority**
- C1. The system recommends; Otta decides. No order preparation, transmission, or execution.
- C2. `committee_recommendation`, `human_decision`, `execution_status` are three separate records.
- C3. No canonical thesis, valuation, portfolio, or decision record may be silently rewritten. Canonical change = validation + applicable human gate.
- C4. `INVESTIGATE` and `NO_DECISION` are legitimate outputs when evidence is missing, stale, contradictory, or insufficient.

**Interface and roles**
- C5. One primary interface: Otta talks to the CIO / Investment Committee. Specialists are capabilities, not personalities.
- C6. No permanent agent proliferation. No dependency on one model vendor.
- C7. `Mang Ipin` (Finance Danilla profile) `MUST NOT` receive personal investment data.

**Existing state**
- C8. Not greenfield. Eleven notes in `Business/Investing`, rules in `Finance/Investment-Rules.md`, append-only snapshots in `Finance/Investment-Portfolio.md`, an active decision-memo template, and an obsolete June 2026 design spec.
- C9. Portfolio state requires an explicit dated source and reconciliation status. Holdings `MUST NOT` be inferred from old memos.
- C10. Some positions are grandfathered above newer limits. A rules violation does not authorize a sale.
- C11. Research depth varies by company and already gates position size.

**Evidence and computation**
- C12. Provenance fields listed in Context Pack §8 are mandatory for material claims.
- C13. Primary filings outrank secondary summaries. Stockbit and media are leads or context, never silent primary evidence.
- C14. Publication date ≠ reporting period. Consolidated/parent, cumulative/standalone, currency, unit scale, and restatements are explicitly controlled.
- C15. Retrieved documents are untrusted input.
- C16. Deterministic scripts for arithmetic, alignment, ratios, valuation formulas, staleness, hashing, schema, limit checks, citation checks. LLM for interpretation, comparison, scenario design, adversarial reasoning, synthesis.
- C17. Valuation is sector-aware. No universal template.

**Hermes environment**
- C18. Hermes v0.21.0, one local commit, 364 commits behind upstream. Features from newer docs are not assumed present.
- C19. Observed primitives: direct sessions, delegated workers (isolated context, bounded input), cron (fresh context), Kanban, MoA, project context files, tools/plugins, webhooks. Semantics, flags, limits, model access, and pricing `VERIFY BEFORE BUILD`.
- C20. Background children are not durable checkpointed work.
- C21. No IC profile, webhook, Kanban board, MoA config, or monitoring exists. The Stockbit brief job is paused. Enabling connectors or restarting the gateway requires user approval.
- C22. No guaranteed IDX disclosure feed. Adapters are custom work.

**Monitoring**
- C23. Three layers. Unchanged input → no LLM call. Price move alone → no full IC review. No monitoring before the manual workflow passes controlled tests.

**Security**
- C24. No secrets in chat, notes, or artifacts. Approval required for external publication, messages, connectors, config changes, destructive writes.

---

## 3. Design Principles

The Context Pack principles apply verbatim. The following are the operational corollaries this architecture adds.

1. **Fail closed.** Any stage that cannot produce a schema-valid artifact ends the run in a refusal state. There is no "best effort" memo.
2. **Cheap before expensive.** No expensive model call is made until a deterministic or cheap-tier stage has established that a real, material change exists or Otta has explicitly asked.
3. **Artifacts are immutable; runs are append-only.** A stage is never re-run in place. A retry creates a new attempt directory under the same run. Nothing is deleted.
4. **One writer, one gate.** Only the Canonical Writer script writes to canonical or history files, only from a human-approved proposal, only after schema and invariant validation.
5. **Roles are not processes.** A role is a prompt contract plus an input bundle plus an output schema. Whether it runs as a worker or inline is an execution decision, recorded in §7, and can change without changing the role.
6. **Independence is structural, not requested.** The Red Team's independence comes from a different model lineage, a different input framing, no access to the Analyst's reasoning trace, and its own retrieval budget. Asking a model to "disagree" is not a control.
7. **Every number has a parent.** Every numeric value in a memo traces to a script output, which traces to normalized data cells, which trace to `EvidenceRecord` ids. A number without a parent fails validation.
8. **Every claim has a label.** `DIRECT`, `DERIVED`, `INFERRED`, `ASSUMED`, `SCENARIO`. Unlabeled claims fail validation.
9. **The original thesis is frozen.** It is hashed at establishment and the Canonical Writer refuses any patch that changes it.
10. **The human edits through the gate file, never around it.** Otta records decisions in the `DecisionMemo` decision block. Editing canonical notes by hand is allowed (it is Otta's vault) but the next run detects the drift via hash and raises it.
11. **Delete what does not earn its cost.** Every component in §5–§7 carries a "why a simpler primitive is insufficient" line. If that line is weak, the component is not in V1.

---

## 4. Existing-State Reconciliation

Classification uses only what the Context Pack states about each asset. Where content is unknown, the classification is `UNRESOLVED` with the migration step that resolves it.

| Asset | Classification | Role in V1 | Migration / reconciliation action |
|---|---|---|---|
| `Business/IDX Investing System.md` | `CANONICAL` (operating overview) | Human-facing entry point describing how the system works | `SHOULD` be updated once, after Session 4, to point to the record types and directories in §19. Until then unchanged. |
| `Finance/Investment-Rules.md` | `CANONICAL` (rules source of truth) | Input to the deterministic limit checker (position caps by research depth, sector limits, position counts, gates) | Incomplete fields and ledgers are `UNRESOLVED` items inside a canonical file. Migration extracts the machine-checkable rules into a structured rules block (frontmatter or fenced YAML) that the limit checker reads. Prose stays. `DECISION REQUIRED` for every rule value that is blank today. |
| `Finance/Investment-Portfolio.md` | `CANONICAL` history (append-only dated snapshots) | Source of `PortfolioSnapshot`; the newest snapshot with `reconciliation_status: RECONCILED` is the current state | Each existing dated snapshot becomes one `PortfolioSnapshot` entry with `reconciliation_status: LEGACY_UNVERIFIED`. First V1 run requires Otta to append one fresh reconciled snapshot. |
| `Finance/Investment Transaction Log.md` | `CANONICAL` history (append-only execution ledger), completeness `UNRESOLVED` | Source of `execution_status` for decisions; reconciliation input for `PortfolioSnapshot` | Not a live ledger. V1 treats it as human-maintained. The limit checker `MUST NOT` derive holdings from it; it derives holdings only from the reconciled snapshot. |
| `Business/Investing/Template - Emiten Decision Memo.md` | `CANONICAL` template | Starting shape of `DecisionMemo` | `SHOULD` be revised into the `DecisionMemo` contract of §11 (adds the separate `committee_recommendation` / `human_decision` / `execution_status` blocks and evidence-id citations). Old template retained as `HISTORICAL`. |
| `Business/Investment Committee - Design Spec.md` (June 2026) | `OBSOLETE`, retained as `HISTORICAL` | None | `MUST NOT` be used as an input to any run. Superseded by this document. Not deleted. |
| `Business/Sistem Riset Emiten — Progress.md` | `HISTORICAL` (progress log) | None in runs | `DECISION REQUIRED`: continue as a human-maintained log, or freeze. Either way not read by the system. |
| `Business/Checklist Riset Emiten.md` | `CANONICAL` (procedural), pending reconciliation | Defines what "research depth" means; input to the depth score that gates position size | `VERIFY`: reconcile its depth tiers with the depth-based caps in `Investment-Rules.md`. If they conflict, `Investment-Rules.md` wins and the checklist is patched. |
| Company notes (11 in `Business/Investing`, incl. ARNA, BBRI, BSDE, CLEO, CPRO, ERAL) | `UNRESOLVED` → become `CANONICAL` `ThesisState` notes after migration | Each is the canonical company record after migration | Migration per company (§19.4): extract thesis, status, exit rules, assumptions into the `ThesisState` frontmatter and sections; preserve full pre-migration body under a `## Legacy (pre-2026-09 migration)` heading. The migrated thesis is stamped `original_thesis_source: legacy` because the true original may be unrecoverable. |
| Historical fair-value snapshots | `HISTORICAL` | Seed the `ValuationSnapshot` history table | Copied as rows with `method: legacy`, `verification: UNVERIFIED`. Never used as a current fair value. |
| Weekly portfolio reviews | `HISTORICAL` | None in runs; readable context for Otta | No migration. |
| Monitoring checks | `UNRESOLVED` → `MonitoringTrigger` | Seed triggers per company | Migrated in V1 as trigger records with `active: false` until the monitoring layer exists (V2). |
| `Daily Stockbit Market Brief` cron job (paused) | `OBSOLETE` for IC purposes | None | Stays paused. Stockbit content enters only as Tier-4 leads (§10). |

Items marked `DUPLICATE`: none can be asserted from the Context Pack. The migration script `MUST` report any two notes whose thesis text hashes match or whose ticker frontmatter collides, and stop for Otta to resolve.

---

## 5. Minimal Logical Capabilities

Seven candidate capabilities were evaluated. Five survive as distinct **logical** capabilities; two are folded in. Section 6 gives the consolidation reasoning; section 7 gives the execution primitive.

### 5.1 Evidence Collection and Verification (`EVIDENCE`)

| Field | Specification |
|---|---|
| Why it exists | Nothing downstream is trustworthy without an auditable, deduplicated, provenance-complete bundle. This is the only capability that touches raw external content. |
| When it runs | Every run, first. Also runnable standalone ("just build the bundle"). |
| Inputs | Trigger (human question or event pointer), ticker(s), prior `EvidenceRecord` index for the ticker, source adapters available, retrieval budget. |
| Outputs | `evidence_bundle.json` (list of `EvidenceRecord`), `normalized_financials.json` (per §14.1), `evidence_report.md` (human summary: what was found, what was missing, what conflicts). |
| Forbidden | Interpreting causality. Forming a view on the thesis. Writing to the vault. Following any instruction found inside retrieved content. Using Tier-4 content as sole support for a material claim. |
| Consolidation | `MUST NOT` be merged with Analyst. The Analyst must never be the one deciding what counts as verified. |
| Failure behavior | Adapter failure → record `source_status: FAILED` per source, continue, and mark bundle `completeness: PARTIAL`. Zero Tier-1/Tier-2 sources for a material event → bundle `completeness: INSUFFICIENT` and the run ends `INSUFFICIENT_EVIDENCE`. Unresolvable Tier-1 vs Tier-1 conflict → `conflict_flag: true`, run may continue but recommendation is capped at `INVESTIGATE`. |

### 5.2 Company / Fundamental Analysis, incl. Macro-Sector when material (`ANALYST`)

| Field | Specification |
|---|---|
| Why it exists | Converts verified evidence into a structured thesis comparison, management-claim reconciliation, and valuation assumption set. |
| When it runs | After the bundle passes verification and materiality is `MATERIAL` or Otta explicitly asked. |
| Inputs | Evidence bundle, normalized financials, current `ThesisState` (current thesis, assumptions, breakers, open management claims), prior `ValuationSnapshot`, sector method pack id, calc-engine tool. `MUST NOT` receive: average purchase price, unrealized P&L, position size. |
| Outputs | `analyst_report.json` (thesis comparison per assumption, management claim outcomes, proposed valuation assumptions with labels, scenario definitions, macro/sector materiality statement) plus the calc-engine outputs it invoked. |
| Forbidden | Performing arithmetic outside the calc engine. Changing the thesis text. Recommending an action. Reading the portfolio. Seeing cost basis. |
| Consolidation | Absorbs macro/sector analysis (as a gated sub-section) and the assumption-setting half of valuation. See §6. |
| Failure behavior | Cannot map an assumption to evidence → label it `ASSUMED` with an explicit "no evidence" note; the citation checker then counts unsupported assumptions and the run is flagged. Calc engine rejects inputs → Analyst `MUST` stop and report, not estimate. |

### 5.3 Financial Impact and Valuation Computation (`CALC`)

| Field | Specification |
|---|---|
| Why it exists | Reproducibility. Every number in a memo must be recomputable from inputs. |
| When it runs | Invoked by Analyst and Red Team as a tool; also runnable standalone by Otta. |
| Inputs | Normalized financials, assumption set (JSON, labeled), sector method pack id, scenario definitions. |
| Outputs | `calc_output.json`: derived metrics, standalone quarters, scenario fair-value ranges, sensitivity tables, limit-check results, each output row carrying the ids of its input cells. |
| Forbidden | Choosing assumptions. Filling missing inputs. Emitting a single point fair value. |
| Consolidation | Stays a script. Not a role. |
| Failure behavior | Missing required input → refuse with the list of missing cells. Never impute. |

### 5.4 Adversarial Review (`RED_TEAM`)

| Field | Specification |
|---|---|
| Why it exists | The only defense against articulate, internally consistent, wrong analysis. |
| When it runs | After `analyst_report.json` exists. Mandatory for any run that could produce `BUY`, `ADD`, `TRIM`, `EXIT`. `MAY` be skipped only for runs whose materiality is `NOT_MATERIAL` and whose only possible outputs are `UNCHANGED`/`HOLD`/`WATCH` — and even then Otta can demand it. |
| Inputs | Evidence bundle, normalized financials, `analyst_report.json`, current `ThesisState`, the attack checklist (§16), its own retrieval budget, calc-engine tool. `MUST NOT` receive: Analyst's reasoning trace or chat, CIO draft, portfolio, cost basis. |
| Outputs | `red_team_report.json`: objections (each with evidence ids or a demonstrated logical flaw, severity, and what would resolve it), disconfirming evidence found, circularity findings, verdict `PROCEED` / `MORE_RESEARCH` / `BLOCK`. |
| Forbidden | Writing a competing recommendation. Rewriting the thesis. Accepting the Analyst's assumptions as inputs without testing at least the top three by valuation sensitivity. |
| Consolidation | `MUST NOT` be merged with Analyst or CIO. Cannot run on the same model lineage as Analyst in the same run. |
| Failure behavior | Cannot complete its checklist (tool failure, budget exhausted) → verdict defaults to `MORE_RESEARCH`, never `PROCEED`. |

### 5.5 CIO Synthesis and Portfolio Opportunity-Cost Comparison (`CIO`)

| Field | Specification |
|---|---|
| Why it exists | One place where evidence, analysis, challenge, and portfolio context become a decision-support memo that Otta can act on, and the one voice Otta talks to. |
| When it runs | After Red Team. Also handles the initial question intake and the memory proposal. |
| Inputs | Everything above plus the reconciled `PortfolioSnapshot`, limit-check results, rules block, prior `DecisionMemo`s for the ticker, candidate alternatives list. This is the first stage allowed to see position size and cost basis (needed for `ADD`/`TRIM` sizing and tax/liquidity context), and it `MUST` state explicitly in the memo that cost basis was not an input to the fundamental conclusion. |
| Outputs | `DecisionMemo` draft (committee recommendation block only), `memory_proposal.json` (proposed canonical patches and history appends), monitoring trigger proposals. |
| Forbidden | Writing canonical files. Overriding a Red Team `BLOCK` in the recommendation field. Filling the `human_decision` block. Performing arithmetic. |
| Consolidation | Absorbs portfolio/opportunity-cost comparison (judgment half); the deterministic half is a script. See §6. |
| Failure behavior | Portfolio stale → recommendation restricted to the "no-capital-action" subset (§17). Red Team `BLOCK` → recommendation forced to `INVESTIGATE` or `NO_DECISION`. Citation check fails → memo not released to Otta until fixed or run ends `SCHEMA_INVALID`. |

### 5.6 Canonical Writer (`WRITER`)

Not a candidate in the prompt, but required by the "one canonical writer" principle.

| Field | Specification |
|---|---|
| Why it exists | Enforces C3. The single code path that mutates canonical and history files. |
| When it runs | Only after Otta approves a `memory_proposal.json`. |
| Inputs | Approved proposal, current canonical file hashes, schema, invariant rules. |
| Outputs | Patched canonical note(s), appended history rows, `write_receipt.json` in the run directory. |
| Forbidden | Being called by any worker. Modifying the frozen original-thesis block. Deleting history rows. Applying a proposal whose base hash no longer matches the file. |
| Failure behavior | Hash mismatch (someone edited the note since the proposal) → refuse, report the diff, require re-approval. |

### 5.7 Folded capabilities

- **Macro / sector analysis** → sub-section of `ANALYST`, produced only when the Evidence stage or Otta flags a macro/sector driver as material to a thesis assumption. Not a separate worker in V1.
- **Portfolio / opportunity-cost comparison** → split: hard checks (limits, concentration, liquidity vs position, staleness) are a script inside `CALC`; the judgment (ranking alternatives under uncertainty) is inside `CIO`.

---

## 6. Role Consolidation Decisions

| Candidate role | Decision | Reason |
|---|---|---|
| Evidence collector + verifier | Keep as one capability, script-first | Verification is mostly deterministic (hash, tier, date, period, schema). The LLM part is extraction into a fixed schema, which is cheap-tier work. |
| Company analyst + macro/sector analyst | **Merge** | A separate macro worker produces macro commentary on every run whether or not it matters. Gating it as a section inside the Analyst, triggered by a materiality flag, removes a worker and a source of unfocused prose. If a run needs deep sector work, the Analyst worker `MAY` be re-invoked with a sector-only brief; still ephemeral. |
| Valuation analyst | **Split** into script (`CALC`) + Analyst section | A "valuation agent" that chooses assumptions and computes is exactly the failure mode the Context Pack forbids. Assumptions are Analyst output; computation is a script. |
| Adversarial reviewer | Keep, isolated | Cannot be merged with anything without destroying independence. |
| Portfolio manager | **Split** into script + CIO section | Limit checks are arithmetic. The comparison judgment is the CIO's job because it is the same judgment that produces the recommendation. A separate "PM agent" would either duplicate the CIO or argue with it. |
| CIO | Keep, as direct reasoning | This is the interface. It is not a worker. |
| Six permanent agents (June spec) | **Rejected** | Permanent agents accumulate context, drift, and cost. No stage in this pipeline needs to remember anything between runs that a file cannot hold. |
| Mixture of Agents for any stage | **Rejected** | Multiple models agreeing on one evidence bundle is correlated error, not verification (Context Pack §11). Independence in V1 comes from the Red Team's separate retrieval and lineage, not from voting. |

Net: **2 ephemeral workers per run** (Analyst, Red Team), **1 interactive reasoning role** (CIO), **1 script family** (Evidence, Calc, Limits, Writer, Validators). Zero new profiles by default (see D-01 in §27).

---

## 7. Hermes Execution-Primitive Mapping

| Component | Primitive | Why a simpler primitive is insufficient | Verification status |
|---|---|---|---|
| Source adapters (IDX disclosures, issuer IR, reports, optional price) | External data dependency + custom plugin/tool | No native feed exists (C22). | `VERIFY BEFORE BUILD`: plugin/tool registration API in v0.21.0; whether tools can be scoped to specific workers. `DECISION REQUIRED` D-05: which adapters are in V1 (recommendation: manual file drop + IDX disclosure page + issuer IR page; no price feed). |
| Normalization, hashing, dedup, staleness, period alignment, standalone-quarter derivation | Deterministic script | Pure computation. An LLM here is slower, costlier, and wrong sometimes. | None. |
| Claim extraction into `EvidenceRecord` schema; materiality classification | Deterministic script calling a cheap-tier model with structured output; no tools | Extraction from prose needs a model, but it needs no reasoning, no web, and no memory. Running it inside a delegated worker adds context isolation that a script call already has. | `VERIFY BEFORE BUILD`: can a script invoke a model with a tier/role selector and enforce JSON output in v0.21.0? |
| Analyst | Ephemeral delegated worker | Needs multi-step reasoning with tool calls (calc engine) over a bounded bundle. Direct CIO reasoning would pollute the CIO context with the Analyst's trace, which the Red Team must not see and the CIO should not be anchored by. | `VERIFY BEFORE BUILD`: delegated worker accepts file-path inputs, can be given a restricted tool set, can be given a model selector; output size limits. |
| Calc engine (metrics, sector valuation packs, sensitivity, limit checks) | Deterministic script exposed as custom tool | Must be callable by workers and by Otta directly. | `VERIFY BEFORE BUILD`: tool exposure to delegated workers. |
| Red Team | Ephemeral delegated worker, distinct model lineage from Analyst | Same as Analyst plus isolation is the point. | `VERIFY BEFORE BUILD`: per-worker model selection. If not possible in v0.21.0, `DECISION REQUIRED` D-02: run Red Team via a script-driven model call instead. |
| CIO synthesis and Q&A | Direct CIO reasoning in the interactive session, activated by a project context file | It is the interface. A worker cannot converse with Otta. | `VERIFY BEFORE BUILD`: project context file loading semantics; whether the IC context can be loaded on demand rather than always. |
| Run durability and checkpoints | Obsidian/file contract (run directory + `run_manifest.json`) | A run can pause for days at the human gate. Files survive; sessions do not. Kanban would add a second state store to keep in sync. | None. Kanban `MAY` be adopted in V2 if Otta wants a board view (D-06). |
| Human decision gate | Obsidian/file contract (`DecisionMemo` note with a `human_decision` block Otta edits) | Otta already works in Obsidian. A chat-only approval is not durable or auditable. | None. |
| Canonical Writer + validators | Deterministic script, invoked by Otta's explicit command after approval | Must be the only writer. | None. |
| Monitoring (V2) | Cron job → deterministic collection script → cheap classification → creates a run proposal | Fresh-context cron is fine because the script loads state from files. | `VERIFY BEFORE BUILD` in V2. Not built in V1. |
| Event ingestion from external systems (V2+) | Webhook | Not needed until there is an external emitter. | Not V1. |
| Investment Committee profile | Separate persistent profile | Not needed for V1; the main profile with an on-demand context file is sufficient. | `DECISION REQUIRED` D-01. |

**Rejected primitive uses:** MoA (any stage), background children as run state, cron in V1, webhook in V1, a persistent IC profile in V1.

---

## 8. Architecture Diagram

```text
                        ┌──────────────────────────────────────────────┐
  Otta ───────────────► │  CIO (direct reasoning, IC context file)      │ ◄──── reads: rules block,
  question / event      │  intake · synthesis · memo draft · proposal   │       PortfolioSnapshot,
                        └───────┬──────────────────────────▲───────────┘       prior memos
                                │ creates run                │ reads artifacts
                                ▼                            │
  ┌──────────────────── runs/<run_id>/  (immutable, outside vault) ────────────────────┐
  │ manifest.json  S1 evidence/  S2 normalized/  S3 analyst/  S4 redteam/  S5 memo/     │
  └───▲──────────────────▲───────────────▲──────────────▲────────────────▲──────────────┘
      │                  │               │              │                │
  ┌───┴────────┐   ┌─────┴──────┐  ┌─────┴──────┐ ┌─────┴──────┐  ┌──────┴──────┐
  │ EVIDENCE   │   │ CALC       │  │ ANALYST    │ │ RED TEAM   │  │ VALIDATORS  │
  │ scripts +  │   │ script /   │  │ ephemeral  │ │ ephemeral  │  │ schema,     │
  │ cheap-tier │   │ tool       │  │ worker     │ │ worker,    │  │ citation,   │
  │ extraction │   │            │◄─┤ (calls     │ │ other      │  │ label,      │
  └───▲────────┘   └────────────┘  │  CALC)     │ │ lineage    │  │ limits      │
      │                            └────────────┘ └────────────┘  └─────────────┘
      │ untrusted content
  ┌───┴────────────────────────────┐
  │ Source adapters (custom):      │
  │ IDX disclosures · issuer IR ·  │
  │ manual file drop · (T4 leads)  │
  └────────────────────────────────┘

  Human gate ───► Otta edits human_decision block in DecisionMemo note
                          │ approves memory_proposal.json
                          ▼
                 ┌──────────────────┐   validated, hash-checked patches
                 │ CANONICAL WRITER │ ─────────────────────────────────►  ObsidianVault
                 │ (script, only    │                                     Business/Investing/<TICKER>.md
                 │  writer)         │                                     Finance/Investment-Portfolio.md
                 └──────────────────┘                                     Business/Investing/Memos/<run_id>.md

  V2 only:  cron ─► collect+hash ─► changed? ─► cheap materiality ─► MATERIAL? ─► propose run
```

Data-flow rules encoded in the diagram: raw content stops at the Evidence stage; Analyst and Red Team never see the portfolio; the CIO never writes the vault; the Writer never reads a worker output directly, only an approved proposal.

---

## 9. End-to-End Workflow

Run id format: `IC-<YYYYMMDD>-<TICKER>-<seq>`. Every stage writes to `runs/<run_id>/S<n>_<stage>/attempt-<k>/` and updates `manifest.json` with `{stage, attempt, status, started, ended, artifact_hashes}`. Statuses: `PENDING`, `RUNNING`, `DONE`, `FAILED`, `REFUSED`, `WAITING_HUMAN`.

| Stage | Name | Executor | Durable artifact (checkpoint) | Retry | Refusal / exit |
|---|---|---|---|---|---|
| S0 | Intake | CIO | `intake.json`: question, ticker(s), trigger type (`HUMAN_QUESTION` / `EVENT_POINTER` / `SCHEDULED` [V2]), held-or-candidate, requested depth, budget cap | n/a | Ticker unknown to vault and Otta did not say "candidate" → ask Otta once, then `NO_DECISION` if unresolved. |
| S1 | Source collection | Evidence scripts + adapters | `S1_collect/raw/` (content-addressed files), `sources.json` with per-source status | 2 per adapter, backoff | All Tier-1/2 adapters failed → `REFUSED: SOURCES_UNAVAILABLE`. Partial → continue with `completeness: PARTIAL`. |
| S2 | Normalization and dedup | Scripts | `documents.json`: one entry per unique document hash, with metadata; duplicate map | 1 | Two documents with equal content hash and different claimed dates → keep both, flag `DUPLICATE_CONTENT`. Never count as two sources. |
| S3 | Extraction and verification | Script + cheap-tier model | `evidence_bundle.json` (`EvidenceRecord[]`), `normalized_financials.json`, `evidence_report.md` | 2 (structured-output failure) | Any Tier-1 claim that fails period/unit/scope validation → record kept with `verification: FAILED`, excluded from downstream. Zero verified material records → `REFUSED: INSUFFICIENT_EVIDENCE`. Injection detector hit → record quarantined, run continues, Otta notified in report. |
| S4 | Materiality classification | Script + cheap-tier model, then deterministic rules | `materiality.json`: `NOT_MATERIAL` / `POSSIBLY_MATERIAL` / `MATERIAL` / `THESIS_BREAKER_CANDIDATE`, mapped to the `ThesisState` assumptions and breakers it touches | 1 | For `HUMAN_QUESTION` triggers this stage is advisory: the run proceeds regardless. For `EVENT_POINTER`: `NOT_MATERIAL` → run ends `DONE: NO_ACTION`, a one-line note is offered for the history log. Any hit on a registered thesis breaker → forced `MATERIAL` and escalation L2 (§18). |
| S5 | Prior state retrieval | Script | `prior_state.json`: current `ThesisState`, last `ValuationSnapshot`, open `ManagementClaim`s, last reconciled `PortfolioSnapshot` with age, prior `DecisionMemo` ids, rules block | 1 | `ThesisState` missing for a held security → `REFUSED: THESIS_NOT_ESTABLISHED` and escalation L2. Missing for a candidate → `thesis_status: NOT_ESTABLISHED`, run continues in candidate mode. Portfolio snapshot age > threshold (D-03) → `portfolio_stale: true`. |
| S6 | Analyst | Ephemeral worker | `analyst_report.json` + calc outputs | 1 (only on schema failure) | Worker output fails schema or citation check after retry → `REFUSED: ANALYST_INVALID`. |
| S7 | Deterministic financial impact and valuation | CALC, invoked within S6 and re-run standalone here for reproducibility | `calc_output.json` recomputed from the Analyst's declared assumptions; hash `MUST` equal the one produced during S6 | 0 | Mismatch → `REFUSED: CALC_NONREPRODUCIBLE`. This catches an Analyst that typed a number. |
| S8 | Red Team | Ephemeral worker, different lineage | `red_team_report.json` | 1 (schema) | Verdict `BLOCK` → downstream recommendation domain restricted to `{INVESTIGATE, NO_DECISION}`. `MORE_RESEARCH` → CIO `MUST` either issue `INVESTIGATE` with the named tasks, or Otta approves a bounded S6 re-run (one extra attempt) addressing them. |
| S9 | Portfolio checks | CALC (limits script) | `portfolio_check.json`: position and sector limits, count limits, research-depth cap, liquidity ratio, concentration deltas for each candidate action | 0 | `portfolio_stale: true` → capital actions (`BUY`, `ADD`, `TRIM`, `EXIT`) removed from the domain. |
| S10 | CIO draft | CIO | `DecisionMemo` draft note in `runs/.../S10_memo/`, `memory_proposal.json`, `trigger_proposal.json` | 1 | Validators fail (citation, label, number-parent, domain) → fix once, else `REFUSED: MEMO_INVALID`. |
| S11 | Human decision gate | Otta, via the memo note | `DecisionMemo` copied to the vault memos folder with `human_decision: PENDING`; manifest `WAITING_HUMAN` | n/a, no timeout | Otta records `human_decision` ∈ {accept, modify, reject, defer} with reason. Nothing else happens until then. |
| S12 | Curated memory proposal review | Otta | `memory_proposal.json` marked `approved` / `edited` / `rejected` per patch item | n/a | Rejected items are logged with reason; nothing written. |
| S13 | Canonical update | Writer | patched notes, appended history rows, `write_receipt.json` | 0 | Base-hash mismatch → refuse; re-run S12. |
| S14 | Monitoring trigger update | Writer (same approval) | `MonitoringTrigger` rows updated in the company note; `active: false` until V2 | 0 | — |

**Checkpoint rule:** a run can be resumed from any `DONE` stage by re-reading artifacts. A stage is never re-executed unless its downstream artifacts are discarded into a new attempt directory. The manifest is the only mutable file in a run.

**Global retry cap:** at most 3 model-backed attempts total across S3, S4, S6, S8, S10 beyond the first attempts. Exceeding it ends the run `REFUSED: BUDGET_EXHAUSTED`.

**Refusal is a terminal, recorded outcome.** Every `REFUSED` run still produces a short `DecisionMemo` with `committee_recommendation: NO_DECISION` or `INVESTIGATE`, the refusal code, and what would unblock it. Refusals are history too.

---

## 10. Evidence Architecture

### 10.1 Source hierarchy

| Tier | Sources | Permitted use |
|---|---|---|
| T1 | IDX disclosures (keterbukaan informasi), audited and reviewed financial statements, annual reports, prospectuses, OJK/IDX regulatory notices, official corporate-action documents | Primary evidence for any claim. |
| T2 | Issuer investor-relations materials: presentations, public expose, official press releases, earnings call transcripts published by the issuer, official guidance | Primary evidence for management claims and guidance; secondary for financial figures (T1 wins on conflict). |
| T3 | Reputable financial media, broker research, industry association data, government statistics, central bank data | Context, sector data, and leads. `MAY` support a material claim only when no T1/T2 source can exist for it (e.g., industry price series), and then the record is labeled `tier_exception: true`. |
| T4 | Stockbit posts, forums, social media, anonymous commentary | Leads and sentiment only. `MUST NOT` be the sole support for any material claim. A T4 record that is not corroborated by T1–T3 within the run is labeled `lead_unconfirmed` and is invisible to the valuation stage. |

Consensus estimates are T3 at best and are labeled `consensus_unverified`. They are never a valuation input in V1.

### 10.2 `EvidenceRecord` provenance fields

Mandatory for every record: `evidence_id` (content-hash based, `EV-<TICKER>-<hash12>`), `source_title`, `source_locator` (URL or vault/run-relative path), `source_tier`, `source_type`, `publication_date`, `retrieval_date`, `reporting_period` (start, end, and `period_kind` ∈ {FY, H1, 9M, Q-cumulative, Q-standalone, point-in-time, n/a}), `page_or_section`, `document_hash`, `claim_text` (verbatim or tight paraphrase with `paraphrase: true`), `claim_kind` ∈ {DIRECT, DERIVED, INFERRED, ASSUMED, SCENARIO}, `scope` ∈ {consolidated, parent-only, segment, unknown}, `currency`, `unit_scale`, `restatement_of` (evidence_id or null), `freshness_status`, `verification_status` ∈ {VERIFIED, UNVERIFIED, FAILED, QUARANTINED}, `contradicts` (list of evidence_ids), `missing_data_flags`, `extractor` (script/model tier id), `run_id`.

### 10.3 Period and date handling

- `publication_date` and `reporting_period` are separate fields and both are mandatory for financial claims. A record with one but not the other is `UNVERIFIED`.
- Cumulative-to-standalone derivation is a script. The derived quarter is a new `DERIVED` record whose `derived_from` lists the two cumulative records. An LLM `MUST NOT` state a standalone-quarter figure that does not exist as a `DERIVED` record.
- Scope, currency, and unit scale are normalized by script into a canonical form (IDR, full units) with the original preserved. A cell whose scope is `unknown` is excluded from ratios and flagged.
- Restatement rule: when a later T1 document restates a figure, the later figure is used, the earlier record gets `superseded_by`, and both remain in the bundle. The memo `MUST` mention the restatement if it moves any headline metric beyond a script-defined tolerance (D-07).

### 10.4 Claim labels

| Label | Definition | Who may create | Validation |
|---|---|---|---|
| `DIRECT` | Stated in a T1/T2 source, quoted or tightly paraphrased | Extraction stage only | `MUST` carry page/section. |
| `DERIVED` | Computed by a script from `DIRECT` cells | CALC only | `MUST` carry input evidence_ids and script version. |
| `INFERRED` | Interpretation by Analyst, Red Team, or CIO | Model stages | `MUST` cite the `DIRECT`/`DERIVED` ids it rests on. Zero citations → validation fails. |
| `ASSUMED` | Chosen input without direct evidence | Analyst (valuation assumptions), CIO (portfolio assumptions) | `MUST` include a one-line rationale and a sensitivity reference where it feeds valuation. |
| `SCENARIO` | Conditional future path | Analyst, Red Team | `MUST` list the `ASSUMED` items it varies. |

### 10.5 Stale-data rules (script-enforced)

| Data | Fresh | Stale (flag, usable with warning) | Expired (excluded) |
|---|---|---|---|
| Financial statements | Latest reported period | Older than the latest period known to exist per IDX calendar | Superseded by restatement |
| Management guidance | Current fiscal year, not superseded | Prior year, not withdrawn | Superseded or past its stated horizon |
| Portfolio snapshot | Age ≤ D-03 threshold and `RECONCILED` | Age > threshold | `LEGACY_UNVERIFIED` |
| Price/liquidity data (if any) | ≤ 5 trading days | ≤ 30 days | Older |
| Sector/macro series | Latest release | One release behind | Two or more behind |

Thresholds other than portfolio are defaults; `DECISION REQUIRED` D-07 to confirm.

### 10.6 Conflicting sources

- Higher tier wins; the loser is retained with `contradicts` populated.
- Same tier, different figures, no restatement link → both `UNVERIFIED`, `conflict_flag` on the bundle, recommendation domain capped at `INVESTIGATE` for any conclusion that depends on the conflicted cell.
- Conflict between a T1 figure and the vault's canonical `ThesisState` assumption → not a source conflict; it is thesis evidence, passed to Analyst as such.

### 10.7 Missing data

- Missing is recorded, never filled. `normalized_financials.json` contains explicit nulls with `missing_reason`.
- CALC refuses any computation whose required inputs are null.
- If the missing item is on the `ThesisState` assumption list or the sector method's required-input list, the run's best possible recommendation is `INVESTIGATE`, and the memo names the missing item as the top "what would change this" entry.

### 10.8 Prompt-injection boundary

- All retrieved content enters the system only through the Evidence stage. It is stored as data files, never concatenated into a system or role prompt.
- The extraction model call receives the content inside a data envelope with fixed framing, has no tools, no file-write access, and produces only schema-constrained JSON. It cannot act on anything the content says.
- A deterministic detector scans content for instruction-like patterns aimed at agents ("ignore previous", "as the assistant", role markers, hidden text markers, unusually long invisible spans). Hits quarantine the record and are surfaced to Otta in `evidence_report.md`. Detection is a heuristic; the structural containment above is the actual control.
- Analyst, Red Team, and CIO receive `EvidenceRecord`s (structured claims with provenance), not raw documents. If they need to read a source page, they read it through the same envelope.
- Any output from any model stage that contains a directive to change configuration, write files, contact an external party, or execute a trade is rejected by the output validator.

### 10.9 Claim-to-source validation (script)

Before any memo reaches Otta: every sentence tagged as a material claim `MUST` reference at least one `evidence_id` that exists in the bundle, is `VERIFIED`, and whose tier is permitted for that claim kind. Every numeric token `MUST` match a value in `calc_output.json` or a `DIRECT` record (exact match after unit normalization; no rounding by the model — the memo template renders numbers from the calc output). Failures block release.

### 10.10 `INSUFFICIENT EVIDENCE`

This is a legitimate output at three levels: a single claim (`verification_status`), a thesis assumption (`assumption_status: INSUFFICIENT_EVIDENCE`), and a run (`REFUSED: INSUFFICIENT_EVIDENCE`). The system `MUST NOT` convert insufficiency into a favorable or unfavorable inference. It converts it into a research task.

---

## 11. State and Artifact Ownership

| Record | Purpose | Storage class | Location | Canonical writer | Lifecycle |
|---|---|---|---|---|---|
| `AnalysisRun` | Manifest of one run: trigger, stages, attempts, artifact hashes, outcome, cost | Run artifact | `runs/<run_id>/manifest.json` (outside vault) | Pipeline scripts (mutable only in status fields) | Created S0. Terminal at `DONE` or `REFUSED`. Never deleted. Summary line appended to the company note's run history on S13. |
| `EvidenceRecord` | One verified or rejected claim with provenance | Run artifact + curated index | `runs/<run_id>/S3_extract/evidence_bundle.json`; curated subset appended to `ic-data/evidence/<TICKER>.jsonl` (append-only, outside vault) on S13 | Evidence scripts (run); Writer (curated index) | Immutable once written. Superseded via `superseded_by`, never edited. |
| `ThesisState` | The company's canonical thesis: frozen original, current, assumptions, breakers, status, exit rules | Canonical | `Business/Investing/<TICKER>.md` frontmatter + sections | Writer only | Established once (`NOT_ESTABLISHED` → `ESTABLISHED`). Current fields change only via approved `ThesisEvent`. Original block frozen. |
| `ThesisEvent` | One approved change to `ThesisState`, with evidence, diff, and reason | Append-only history | `## Thesis history` table in the company note + full JSON in `ic-data/thesis-events/<TICKER>.jsonl` | Writer only | Append only. |
| `ManagementClaim` | A promise, guidance, or target attributed to management, with due date and outcome | Canonical (open items) + history (closed items) | `## Management claims` table in the company note | Writer only | `OPEN` → `MET` / `MISSED` / `PARTIAL` / `WITHDRAWN` / `DEADLINE_MOVED`. A moved deadline creates a new row and closes the old one as `DEADLINE_MOVED`; it never edits the original due date. |
| `ValuationSnapshot` | Sector method, assumptions, scenario ranges, sensitivity reference, evidence basis, at a point in time | Append-only history | `## Valuation history` table in the company note (summary) + full `calc_output.json` in the run | Writer only | Append only. The latest row is "current"; it is never edited. |
| `PortfolioSnapshot` | Dated holdings, weights, cash, sector exposure, reconciliation status and source | Append-only history | `Finance/Investment-Portfolio.md` (existing file, structured block per snapshot) | Otta by hand (V1) or Writer from an Otta-approved reconciliation | Append only. Only `RECONCILED` snapshots feed runs. |
| `DecisionMemo` | The three-block decision record: committee recommendation, human decision, execution status | Canonical per run | `Business/Investing/Memos/<run_id>.md` | Writer (recommendation block, from S10 draft); Otta (human decision block); Otta or Writer from transaction-log reconciliation (execution block) | Recommendation block frozen after S11. Human block editable by Otta until execution block is set. Execution block appended, never edited. |
| `MonitoringTrigger` | A named condition to watch, tied to a thesis assumption or breaker, with check method and cadence | Canonical | `## Monitoring triggers` table in the company note + `ic-data/triggers.json` index | Writer only | `PROPOSED` → `ACTIVE` (V2) / `INACTIVE` / `RETIRED`. |

Storage classes, restated:

- **Canonical** (vault, Writer-only): `ThesisState`, open `ManagementClaim`s, `DecisionMemo` recommendation block, `MonitoringTrigger`, rules block in `Investment-Rules.md`.
- **Append-only history** (vault, Writer-only or Otta-only): `ThesisEvent`, `ValuationSnapshot`, `PortfolioSnapshot`, closed `ManagementClaim`s, execution block, run history lines.
- **Run artifacts** (outside vault, immutable): everything under `runs/`.
- **Raw temporary data** (outside vault, content-addressed, may be pruned by age): `runs/<run_id>/S1_collect/raw/`.
- **Machine indexes** (outside vault, append-only): `ic-data/`.

`DECISION REQUIRED` D-04: whether `ic-data/` lives inside the vault as a hidden folder or outside it. Recommendation: outside, to honor "curated memory, not dumps".

---

## 12. Thesis Management

### 12.1 `ThesisState` structure (per company note)

Frontmatter (machine fields): `ticker`, `company`, `sector_method` (one of §14.2), `thesis_status` ∈ {NOT_ESTABLISHED, ESTABLISHED}, `thesis_assessment` ∈ {UNCHANGED, STRENGTHENED, WEAKENED, BROKEN, INSUFFICIENT_EVIDENCE}, `thesis_version`, `original_thesis_hash`, `research_depth` (per checklist tiers), `held` (true/false, from the last reconciled snapshot, read-only here), `last_run_id`, `last_valuation_id`.

Sections, in fixed order:

1. `## Original thesis (frozen <date>)` — text, falsifiable statement, key assumptions as numbered `A1..An`, thesis breakers `B1..Bn`, exit rules, expected horizon. Hashed. `original_thesis_source: legacy | established_in_run`.
2. `## Current thesis (v<n>)` — same structure. Each assumption carries `status` ∈ {HOLDING, STRENGTHENED, WEAKENED, BROKEN, INSUFFICIENT_EVIDENCE} and the evidence ids behind the latest status.
3. `## Thesis history` — one row per `ThesisEvent`: date, run_id, version from → to, what changed (diff summary), triggering evidence ids, reason, approved by.
4. `## Management claims` — §13.
5. `## Valuation history` — §14.
6. `## Decision history` — one row per `DecisionMemo`: date, run_id, recommendation, human decision, execution status, one-line reason.
7. `## Monitoring triggers` — §20.
8. `## Legacy (pre-migration)` — untouched original content, if any.

### 12.2 Anti-drift rules

- **R1.** The Writer `MUST` refuse any patch touching section 1 after establishment. The only permitted change is appending an erratum line with its own approval.
- **R2.** Any change to section 2 `MUST` be accompanied by a `ThesisEvent` row. A `memory_proposal.json` that patches section 2 without a corresponding event fails validation.
- **R3.** An assumption cannot be deleted. It can be marked `BROKEN` or `RETIRED` with a reason. Retirement of an assumption that is `BROKEN` or `WEAKENED` `MUST` be flagged in the memo as "retiring a failing assumption" and requires escalation L2.
- **R4.** Thesis breakers cannot be weakened (threshold loosened, deadline moved) without a `ThesisEvent` of kind `BREAKER_RELAXED`, which always triggers escalation L2 and is listed permanently in the history. The original breaker text stays in section 1.
- **R5.** `thesis_assessment` is computed by the CIO but validated by a script: if any breaker is marked triggered, the assessment `MUST` be `BROKEN`; if any assumption is `INSUFFICIENT_EVIDENCE` and none is `BROKEN`, the assessment cannot be `STRENGTHENED`.
- **R6.** The Analyst and Red Team receive section 1 and section 2 side by side. The Red Team's checklist includes "compare current thesis to original; identify which assumptions were softened and whether the record shows why."
- **R7.** A candidate (`NOT_ESTABLISHED`) run that ends in `BUY` `MUST` include a proposed original thesis. `BUY` without a falsifiable thesis and exit rule fails validation (matches the existing rule in `Investment-Rules.md`).
- **R8.** Prior decisions and their reasons are never edited. A decision that turned out wrong stays wrong in the record; the later memo says what was learned.

---

## 13. Management Track Record

`ManagementClaim` row fields: `claim_id`, `stated_on` (publication date), `source_evidence_id`, `claim_text` (verbatim), `claim_kind` ∈ {GUIDANCE, TARGET, PROMISE, CAPEX_PLAN, CAPITAL_ALLOCATION, GOVERNANCE_COMMITMENT}, `metric`, `target_value_or_range`, `due_period`, `status`, `outcome_evidence_id`, `outcome_value`, `assessed_in_run`, `notes`.

Rules:

- Claims are extracted by the Evidence stage as `DIRECT` records; the Analyst proposes which become `ManagementClaim` rows; the Writer adds them after approval.
- Outcome assessment is deterministic where the metric is numeric: the calc engine compares `outcome_value` to the range and sets `MET` / `MISSED` / `PARTIAL`. The Analyst may only add interpretation.
- A moved deadline never edits the row. It closes the row as `DEADLINE_MOVED` and opens a new one linked by `supersedes`. The count of `DEADLINE_MOVED` rows per company is a script-computed credibility signal shown in every memo.
- Promotional-language and incentive analysis is an `INFERRED` section of the Analyst report and must cite the claim ids it discusses.
- The memo's answer to "has management execution improved or deteriorated?" is rendered from the table: hit rate over trailing N claims, moved-deadline count, and the list of open claims due next, followed by the Analyst's interpretation. Numbers first, prose second.
- Management credibility deterioration (script-defined: two or more `MISSED`/`DEADLINE_MOVED` in the trailing window, or any `GOVERNANCE_COMMITMENT` missed) is an escalation L2 trigger (§18).

---

## 14. Valuation Architecture

### 14.1 Normalization layer (deterministic, sector-agnostic)

Input: `DIRECT` financial records. Output: `normalized_financials.json`, a cell grid keyed by (line item, period, scope) with per-cell provenance. Operations: period alignment, cumulative-to-standalone, scope filtering (consolidated by default; parent-only only when explicitly required by the sector pack), currency and scale normalization, restatement application, one-off flagging (items tagged one-off require a `DIRECT` record describing them as non-recurring, otherwise they stay in). Ratios and growth are computed here: margins, growth (YoY and standalone QoQ), leverage, interest cover, cash conversion, working-capital days, ROE/ROIC decomposition, per-share figures using the correct share count at period end, dilution-adjusted where a corporate action record exists.

The normalization layer never interprets. It emits `data_quality_flags` (missing cells, unknown scope, unresolved restatement, one-off unconfirmed).

### 14.2 Sector method packs

Each pack defines: required inputs, permitted methods, forbidden methods, assumption slots (with plausibility ranges the Red Team must test), scenario structure, and output form. Every pack outputs a **range per scenario** (bear/base/bull) plus a sensitivity table, never a single point.

| Pack | Primary methods | Mandatory deterministic pieces | Forbidden | LLM judgment slots |
|---|---|---|---|---|
| Banks | Sustainable-ROE vs cost-of-equity to justified P/BV; normalized credit cost; earnings power with normalized provisioning | ROE decomposition, NIM/credit-cost/CIR history, CAR and LDR, justified P/BV formula, sensitivity on ROE and CoE | FCF-based DCF; EV/EBITDA | Sustainable ROE range, through-cycle credit cost, CoE, growth in book |
| Property | RNAV (land bank and projects at estimated market value less liabilities) and discount-to-NAV history; marketing sales and backlog conversion | NAV arithmetic from disclosed inventory and land bank, backlog-to-revenue schedule, net gearing, discount history | P/E on lumpy recognition; single-year DCF | Land value assumptions, discount range, absorption rates |
| Commodity / cyclical | Mid-cycle earnings power on a price deck; EV/EBITDA on normalized EBITDA; replacement-cost or reserve-based cross-check | Cost curve position from disclosed cash cost, sensitivity table over price deck, net debt at spot, cycle-position history | Trailing P/E at cycle extremes without normalization | Price deck scenarios, mid-cycle margin, volume path |
| Consumer / operating | Owner-earnings or FCF yield; EV/EBIT on normalized margin; reverse-DCF for implied growth | Margin history and decomposition, FCF conversion, reverse-DCF solve, sensitivity on margin and growth | Terminal growth above nominal GDP proxy; single-point DCF | Normalized margin range, growth path, competitive-position assessment |
| Industrial | Cycle-adjusted EV/EBIT; ROIC vs WACC spread; backlog and order-book coverage | Capex intensity, ROIC history, backlog coverage months, sensitivity on utilization and margin | Peak-cycle multiples applied to peak earnings | Cycle position, utilization path, pricing power |
| Turnaround | Survival test first (liquidity runway, covenant headroom, refinancing need); then scenario tree with an explicit failure branch; asset or liquidation floor | Runway months, debt maturity ladder, covenant checks, floor-value arithmetic, probability-weighted range with the failure branch shown separately | Any method that assumes the turnaround succeeds as a base case; multiples on projected recovered earnings | Probability weights (labeled `ASSUMED`, tested by Red Team), milestone definitions |

Pack assignment is a `ThesisState` field set at establishment and changed only via `ThesisEvent`. A company can carry a secondary pack (e.g., a property company with a recurring-income arm) — the calc engine then produces a sum-of-parts with each part's method visible.

### 14.3 Boundary between script and judgment

| Task | Executor |
|---|---|
| Any arithmetic, any formula, any table | Script |
| Choosing the method within the permitted set | Analyst (INFERRED, must justify) |
| Choosing assumption values | Analyst (ASSUMED, with rationale and evidence ids where any exist) |
| Testing assumption plausibility | Red Team (must state the range it considers defensible and cite) |
| Deciding whether the fair-value range "materially changed" | Script rule: overlap of new base range with prior base range below threshold D-08, or base midpoint shift beyond D-08 → `MATERIAL_VALUATION_CHANGE: true` |
| Interpreting what the change means | CIO |

### 14.4 Outputs

`ValuationSnapshot`: `valuation_id`, `run_id`, date, `sector_method`, `method_variant`, assumption set (each with label and evidence ids), scenario ranges, probability weights if any (always `ASSUMED`), sensitivity reference, data-quality flags, `material_change_vs_prior`, `red_team_assumption_findings` ids. No single target price exists anywhere in the record.

---

## 15. Portfolio and Opportunity-Cost Process

### 15.1 Inputs

- Latest `PortfolioSnapshot` with `reconciliation_status: RECONCILED`, its age, and its source description.
- Rules block from `Investment-Rules.md`: caps by research depth, sector limits, min/max/target position counts, grandfathered list.
- For the subject and each comparator: latest `ValuationSnapshot` ranges, `thesis_assessment`, `research_depth`, liquidity metric (average daily traded value if a price/volume source is present; else `UNKNOWN`), downside scenario.
- Cash alternative: a stated risk-free IDR proxy return (D-09), treated as a comparator with zero thesis risk.

### 15.2 Deterministic checks (script, S9)

For each candidate action in the domain, the script computes the post-action state and reports: position weight vs depth-based cap, sector weight vs limit, position count vs limits, whether the action moves a grandfathered position toward or away from compliance, position size vs liquidity (days to exit at a fraction of ADTV, if data exists), and a concentration delta. Each check returns `PASS`, `WARN`, or `FAIL` with the rule id. A `FAIL` does not forbid the recommendation but forces the memo to state the violation and require escalation L2. Rules never generate sell orders (C10).

### 15.3 Judgment comparison (CIO)

The CIO produces a **comparison table**, not a score. Rows: the subject, each held position (or the top N by weight plus any with `WEAKENED`/`BROKEN` assessment), the strongest watchlist candidate(s) with an established thesis, and cash. Columns: base-range implied return, bear-scenario drawdown, thesis assessment, research depth, evidence completeness, liquidity, portfolio-fit result, and a one-line reason. The CIO then ranks and states in prose why the subject is or is not the best use of the marginal rupiah.

**Why not a single weighted score:** a score hides gate failures behind averages (a `FAIL` on liquidity can be outweighed by an attractive range), invites false precision (the weights would themselves be `ASSUMED` values nobody tests), and makes the memo unfalsifiable (Otta cannot argue with a number). The lexicographic structure — hard gates first, then a visible ranking with reasons — is more reliable because every step is either deterministic or explicitly argued. A composite score `MAY` be reintroduced in V2 only if a fixture study shows it changes decisions for the better; V1 does not attempt to prove that.

### 15.4 Correlation

V1 handles correlation qualitatively: the CIO `MUST` name shared drivers between the subject and existing holdings (same commodity, same rate sensitivity, same controlling group, same end market) and count them. No statistical correlation matrix in V1 (no reliable price feed, and short IDX histories make it fragile). `DEFERRED` to V2.

### 15.5 Research-depth limits

Research depth caps size (existing rule). Additionally, a `BUY`/`ADD` recommendation whose target size exceeds the cap for the current depth `MUST` be rendered as `INVESTIGATE` with the checklist items still open, unless the size is reduced to fit the cap.

### 15.6 Stale portfolio

If `portfolio_stale: true`, the domain excludes `BUY`, `ADD`, `TRIM`, `EXIT`. The memo can still say what the committee would recommend if the snapshot were confirmed, under a clearly labeled `CONDITIONAL` heading, and asks Otta to append a reconciled snapshot.

---

## 16. Adversarial Review

### 16.1 Independence mechanics

- Separate ephemeral worker, different model lineage from the Analyst in the same run (tier requirement T3 in §21). If per-worker model selection is unavailable in v0.21.0, D-02 applies.
- Input is the evidence bundle, normalized financials, the Analyst's structured report, and the thesis (original + current). The Analyst's reasoning trace, chat, and intermediate notes are excluded. The CIO draft does not exist yet.
- The Red Team has its own retrieval budget and `MUST` spend part of it on searches framed to find disconfirming material: competitor results, regulator actions, related-party disclosures, auditor changes, corporate actions, prior missed guidance. Its report records the queries it ran and what returned nothing, so "I looked and found nothing" is auditable.
- It has the calc engine and `MUST` re-run the valuation with its own assumption values for at least the three assumptions with the highest sensitivity.

### 16.2 Mandatory attack checklist

Each item produces a finding or an explicit "no finding, because …" with evidence ids:

1. **Evidence integrity:** any claim resting only on T3/T4; any duplicate-content records counted as corroboration; any period/scope/unit mismatch that the extractor missed; any unresolved restatement; any quarantined injection hit that affects a claim.
2. **Circularity:** assumptions whose only support is the thesis itself or a prior memo; valuation assumptions that back-solve to the current price; management guidance used as the base case without a track-record check.
3. **Thesis drift:** assumptions softened between original and current without an event; breakers relaxed; missing evidence read favorably.
4. **Valuation:** method choice vs sector pack; assumption values vs defensible range; one-offs; terminal or mid-cycle assumptions; false precision.
5. **Governance and accounting quality:** controlling shareholder actions, related-party transactions, free float, dilution instruments, auditor, restatements, cash vs profit divergence, receivables/inventory behavior.
6. **Cyclicality and macro:** where in the cycle, rupiah and imported-input exposure, regulatory intervention risk.
7. **Opportunity cost:** whether the Analyst's case would still be attractive against the cash proxy and a generic alternative at the same risk.
8. **Management:** claims vs realization, deadline moves, promotional language.

### 16.3 Output and force

`red_team_report.json`: per finding `{id, checklist_item, severity ∈ {LOW, MEDIUM, HIGH, CRITICAL}, basis ∈ {EVIDENCE, LOGIC, NEW_RETRIEVAL}, evidence_ids, statement, what_would_resolve}`, plus `disconfirming_search_log`, `assumption_retests`, and `verdict`.

- A finding with `basis: EVIDENCE` or `NEW_RETRIEVAL` but no evidence ids fails schema.
- A finding with `basis: LOGIC` must show the dependency chain it breaks (assumption ids).
- Findings without either are tagged `RHETORICAL` by the validator and the CIO `MUST` treat them as weight zero. This is how role-play disagreement is neutralized: it is allowed to exist, and it is visibly discounted.
- `verdict: BLOCK` (any CRITICAL finding, or two or more HIGH) → recommendation domain becomes `{INVESTIGATE, NO_DECISION}`. The CIO `MAY` write a dissent paragraph; the recommendation field does not move. Otta, at the gate, can still decide anything, and that is recorded as Otta's decision, not the committee's.
- `verdict: MORE_RESEARCH` → §9 S8 behavior.
- `verdict: PROCEED` → CIO must still address every MEDIUM-or-higher finding in the memo.

---

## 17. Position-Aware Decision States

### 17.1 Vocabulary test

The proposed set was tested against the workflow outcomes in §9 and the portfolio cases in §15.

| State | Domain | Sufficient? | Required qualifiers |
|---|---|---|---|
| `BUY` | not held | Yes | size band (as % of portfolio, within depth cap), conditions, proposed original thesis, exit rules, review-by date |
| `WATCH` | not held | Yes | what would upgrade to `BUY` or downgrade to `PASS`, triggers proposed |
| `PASS` | not held | Yes | reason class (valuation / thesis / governance / opportunity cost / evidence), what would reopen |
| `ADD` | held | Yes | size band, conditions, limit-check result |
| `HOLD` | held | Yes, with a rule | `HOLD` is only valid when `thesis_assessment` ∈ {UNCHANGED, STRENGTHENED, WEAKENED-with-reason}. A `BROKEN` thesis cannot produce `HOLD`; it produces `EXIT` or `INVESTIGATE`. This prevents forcing a bad holding into `HOLD`. |
| `TRIM` | held | Yes | target band, reason class, limit-check result |
| `EXIT` | held | Yes | reason class; execution constraints noted (liquidity, suspension) as information for Otta, never as instructions |
| `INVESTIGATE` | both | Yes | named tasks, owner (system or Otta), what outcome would move to which state |
| `NO_DECISION` | both | Yes | refusal code, what would unblock |

Conclusion: the nine states are sufficient. No new verbs are added. The qualifiers carry the nuance that extra verbs would otherwise encode. Two rules make the set safe: the `HOLD` rule above, and the domain restrictions from Red Team `BLOCK`, stale portfolio, and evidence conflict.

### 17.2 Separate records, restated

`committee_recommendation` (one of the above, with qualifiers, frozen at S11) → `human_decision` (accept / modify / reject / defer, with Otta's state and reason) → `execution_status` (NOT_EXECUTED / PARTIAL / EXECUTED / ABANDONED, with transaction-log reference). The three never share a field. A memo where they disagree is normal and is the point.

---

## 18. Human Approval and Escalation

Levels:

- **L0 Inform:** appears in the memo or evidence report. No action required.
- **L1 Memo review:** the run produces a memo and waits at S11. This is every run.
- **L2 Explicit approval item:** a specific line in the memo or proposal that Otta must individually acknowledge before the Writer applies anything from that run.
- **L3 Human-only:** the system produces no recommendation on the item; it produces a question and the evidence.

| Trigger | Level | Behavior |
|---|---|---|
| Thesis-breaking evidence (registered breaker hit, or Red Team CRITICAL on thesis) | L2 | Memo leads with the breaker; `thesis_assessment: BROKEN` proposed; `HOLD` excluded. |
| Material valuation change (script rule §14.3) | L2 | Both ranges shown side by side with the assumptions that moved. |
| Accounting or governance anomaly (Red Team item 5 at HIGH or above, or restatement beyond tolerance) | L2 | Recommendation capped at `INVESTIGATE` until Otta acknowledges. |
| Management credibility deterioration (script rule §13) | L2 | Table shown; Analyst interpretation follows. |
| Large position sizing (any action leaving a position above its cap, or above D-10 absolute threshold) | L2 | Limit-check `FAIL` rendered; Otta acknowledges the violation explicitly. |
| Conflicting primary evidence | L2 | Both records shown; run capped at `INVESTIGATE` on dependent conclusions. |
| Stale portfolio state | L1 + domain restriction | Capital actions removed; Otta asked to reconcile. |
| Proposed canonical-memory change | L2, per patch item | Nothing written without item-level approval; `BREAKER_RELAXED` and assumption retirement additionally require a typed reason. |
| Any trade or execution-related action | L3 | The system stops at the recommendation. It never drafts an order, a broker message, or a quantity beyond a size band. Execution status is recorded after the fact from Otta's log. |
| Enabling a connector, webhook, cron job, or profile; restarting the gateway | L3 | Outside the run entirely; standard Hermes approval. |

Approval is per run and per item. Nothing carries over.

---

## 19. Obsidian Memory Architecture

### 19.1 Layout (target state after migration)

```text
ObsidianVault/
  Finance/
    Investment-Rules.md            CANONICAL  (prose + structured rules block)
    Investment-Portfolio.md        HISTORY    (append-only PortfolioSnapshot blocks)
    Investment Transaction Log.md  HISTORY    (append-only, human-maintained)
  Business/
    IDX Investing System.md        CANONICAL  (overview; updated once after Session 4)
    Investing/
      <TICKER>.md                  CANONICAL + HISTORY sections (ThesisState, claims, valuation, decisions, triggers)
      Memos/<run_id>.md            CANONICAL per run (DecisionMemo, three blocks)
      Templates/
        Emiten Decision Memo.md    CANONICAL template (revised)
      _archive/                    HISTORICAL / OBSOLETE (design spec, old template, progress log if frozen)

outside vault:
  runs/<run_id>/                   run artifacts, immutable
  ic-data/                         machine indexes: evidence/<TICKER>.jsonl, thesis-events/<TICKER>.jsonl, triggers.json
```

### 19.2 What is and is not in the vault

In: everything a human would want to read to understand the thesis, the decisions, and why. Out: raw documents, model transcripts, worker reports, calc outputs, bundles. The memo links to its run directory by id; it does not embed the bundle.

### 19.3 Write discipline

- Writer-only for everything in `Business/Investing/` and the rules block. Otta may still edit by hand; the next run's S5 compares file hashes to the last `write_receipt.json` and, on mismatch, reports "manual edits detected since last write" with a diff summary and asks Otta to confirm they were intentional before proceeding. This keeps Otta's ownership without letting drift go unnoticed.
- Every Writer action produces a receipt in the run directory and appends a line to the company note's run history.
- Delete is never a Writer operation.

### 19.4 Migration plan (one-time, Otta-approved, per company)

1. Migration script reads a company note, proposes a `ThesisState` extraction (frontmatter + sections 1, 2, 4, 5, 6, 7) with every extracted field pointing to the line it came from.
2. Otta reviews the proposal per company; ambiguous fields become `DECISION REQUIRED` in the proposal, not guesses.
3. Writer applies the approved proposal, preserving the original body under `## Legacy`.
4. Legacy fair-value snapshots become valuation history rows with `method: legacy`; legacy monitoring checks become triggers with `active: false`.
5. Migration is complete for a company when its note validates against the schema. Companies not yet migrated cannot be the subject of a run (`REFUSED: NOT_MIGRATED`).

Migration order `DECISION REQUIRED` D-11 (recommendation: held positions first, deepest research first).

---

## 20. Monitoring Architecture (contract only; build in V2)

Three layers, as required:

1. **Deterministic collection and change detection (no model).** Cron-triggered script per source adapter: fetch, content-hash, compare against the last seen hash per (ticker, source). Unchanged → exit. Changed → write the new document into a staging area and emit a `change_event` with the diff scope (new document, changed section, new corporate-action row).
2. **Cheap materiality classification (cheap tier, structured output, no tools).** Runs only on a `change_event`. Input: the changed content in the data envelope, the ticker's assumption and breaker list. Output: `NOT_MATERIAL` / `POSSIBLY_MATERIAL` / `MATERIAL` / `THESIS_BREAKER_CANDIDATE` with the assumption ids touched. Any breaker candidate is escalated regardless of classifier confidence.
3. **Expensive review.** `MATERIAL` or breaker candidate → creates a run proposal (S0 intake pre-filled with `trigger: SCHEDULED`) and notifies Otta. The run does not start until Otta confirms, in V2 by default; `DECISION REQUIRED` D-12 whether `THESIS_BREAKER_CANDIDATE` may auto-start through S8 (still stopping at the human gate).

`MonitoringTrigger` fields: `trigger_id`, `ticker`, `linked_assumption_or_breaker`, `condition` (human-readable), `check_method` ∈ {DISCLOSURE_WATCH, REPORT_DUE, CLAIM_DUE, PRICE_BAND [informational only], MANUAL}, `cadence`, `next_check`, `status`, `last_result`, `created_in_run`.

Rules: price-band triggers `MUST` only produce an L0 note, never a run. Repeated identical `change_event`s (same hash) are dropped by layer 1. The classifier's false-negative rate on the fixture set is a precondition to activating layer 2 (§21). No layer exists in V1 beyond the record type and a manual "check this trigger now" path that runs S1–S4 on demand.

---

## 21. Model Capability Tiers

No vendor or model is named. Each tier is a requirement profile; routing binds a tier to whatever model passes the benchmark at build time and can be rebound without architectural change.

| Tier | Used for | Reasoning | Context | Tools / web | Structured output | Hallucination tolerance | Cost sensitivity | Benchmark before trust | Fallback |
|---|---|---|---|---|---|---|---|---|---|
| T0 None | Hashing, normalization, calc, limits, validators, staleness, dedup | none | n/a | n/a | n/a | zero | n/a | Unit tests on fixtures | None needed |
| T1 Cheap structured | Claim extraction, materiality classification, claim-vs-source consistency checks | low | one document or section | none | strict JSON, schema-validated | low for extraction (verbatim required); false negatives on materiality are the metric that matters | high | Extraction fidelity, false-negative rate on material events, JSON reliability, latency | Retry once; then route the item to T2 or mark `UNVERIFIED` and continue |
| T2 Research synthesis | Analyst | high, multi-step, tool use | full bundle + thesis + calc outputs | calc tool; bounded retrieval | JSON report with free-text fields | low; every inference must cite | medium | Citation fidelity, arithmetic refusal (must call the tool, never compute), schema reliability | Fail run to `ANALYST_INVALID`; do not degrade to T1 |
| T3 Independent adversarial | Red Team | high; must be a different lineage from the T2 model used in the same run | same as T2 plus own retrieval | calc tool; retrieval | JSON findings | low; findings need basis | medium | Same as T2, plus: rate of `RHETORICAL` findings on fixtures, ability to find planted disconfirming evidence | Verdict defaults to `MORE_RESEARCH` if the worker fails |
| T4 CIO synthesis | Intake, synthesis, memo, proposal, conversation with Otta | highest available; rare use | everything for the run plus portfolio | read-only tools | memo template with validated fields | lowest; the memo is the product | low (rare) | Citation fidelity, domain compliance (never recommends outside the allowed set), arithmetic refusal | Run waits; Otta is told the synthesis tier is unavailable. No fallback to a lower tier for capital actions |

Cross-tier rules: T2 and T3 `MUST NOT` be the same lineage in one run. T1 `MUST NOT` be used for anything that can end a run favorably. Benchmarks use the controlled fixtures (Session 3 case pack plus historical events from the migrated companies) and are re-run whenever a tier is rebound.

---

## 22. Cost Controls

- **Gating:** no T2+ call before S4 says `MATERIAL` or the trigger is `HUMAN_QUESTION`. No T3 call without a T2 report. No T4 memo without a T3 verdict for capital actions.
- **Budget per run** (`DECISION REQUIRED` D-13 for values): caps on retrieval count, documents extracted, T1 calls, and exactly one Analyst worker, one Red Team worker, one optional bounded Analyst re-run. Exceeding a cap ends the run `BUDGET_EXHAUSTED` with what was completed.
- **Bundle size limits:** the Analyst receives records, not documents. Full-document reads are budgeted separately.
- **No LLM on unchanged input** (layer 1 rule; also applies in V1 to re-runs: a re-run with an identical bundle hash reuses S3/S4 artifacts).
- **Depth request:** Otta's intake can request `QUICK` (S1–S5 plus a CIO answer from existing state, no workers; output domain limited to `UNCHANGED`-type answers and `INVESTIGATE`) versus `FULL`. Quick answers are labeled as such and never produce capital actions.
- **Cost recorded** in the manifest per stage and summarized in the memo footer.

---

## 23. Failure and Refusal Modes

| Code | Raised at | Meaning | Output |
|---|---|---|---|
| `SOURCES_UNAVAILABLE` | S1 | No T1/T2 adapter succeeded | `NO_DECISION`; retry advice |
| `INSUFFICIENT_EVIDENCE` | S3 | No verified material record | `NO_DECISION` or `INVESTIGATE` with named missing items |
| `CONFLICT_UNRESOLVED` | S3/S10 | Same-tier primary conflict on a load-bearing cell | `INVESTIGATE` |
| `THESIS_NOT_ESTABLISHED` | S5 | Held security without a migrated thesis | `NO_DECISION`; migration required |
| `NOT_MIGRATED` | S5 | Company note not schema-valid | `NO_DECISION` |
| `PORTFOLIO_STALE` | S5/S9 | Snapshot too old or unreconciled | Capital actions excluded; `CONDITIONAL` section allowed |
| `ANALYST_INVALID` | S6 | Schema or citation failure after retry | `NO_DECISION` |
| `CALC_NONREPRODUCIBLE` | S7 | Recomputed outputs differ from worker-time outputs | `NO_DECISION`; flagged for review of the worker |
| `RED_TEAM_BLOCK` | S8 | Critical objection | Domain `{INVESTIGATE, NO_DECISION}` |
| `MEMO_INVALID` | S10 | Validator failure | `NO_DECISION` |
| `BUDGET_EXHAUSTED` | any | Caps hit | Partial artifacts kept; `NO_DECISION` |
| `WRITE_CONFLICT` | S13 | Base hash mismatch | Nothing written; re-approval |
| `INJECTION_QUARANTINE` | S3 | Detector hit | Record excluded; run continues; L0 note |
| `TIER_UNAVAILABLE` | S6/S8/S10 | Required model tier not reachable | Run waits; no downgrade for capital actions |

Every refusal produces a memo. Silence is not a failure mode this system has.

---

## 24. What NOT to Build in V1

- Six permanent specialist agents, or any permanent agent.
- Mixture of Agents, voting, or "consensus" of models as verification.
- A separate Investment Committee profile (unless D-01 says otherwise).
- Cron monitoring, webhooks, or any automatic run start.
- Price feeds as a dependency, and any yfinance-style reliance. Price is optional, informational, and never a trigger.
- Broker connectivity of any kind.
- A single target price. A single composite decision score.
- A universal DCF or any sector-agnostic valuation template.
- Automatic thesis rewriting, automatic assumption retirement, automatic breaker relaxation.
- Vector search or RAG over past conversations. Memory is curated files.
- Statistical correlation analysis.
- Dashboards, Kanban boards, or a web UI. The memo note is the UI.
- Multi-user or multi-portfolio support.
- Full-vault ingestion into any worker.

---

## 25. V1 to V2 Expansion Path

| V2 item | Precondition | Notes |
|---|---|---|
| Monitoring layers 1–3 | Manual workflow passes all Session 3 fixtures; T1 classifier false-negative rate acceptable on fixtures | Cron, fresh-context script, file state |
| More source adapters | Adapter contract from V1 unchanged | Each adapter is a plug-in to S1 |
| Auto-start of runs on breaker candidates | D-12 | Still stops at S11 |
| Kanban view of runs | D-06 | Read-only mirror of manifests |
| Correlation module | Reliable price/volume source | Deterministic; qualitative drivers stay |
| Sector-only Analyst brief | Evidence of need from runs | Same worker, different input bundle |
| Composite score experiment | Fixture study showing improvement | Otherwise never |
| Separate IC profile | Demonstrated context bleed in main profile | D-01 |
| Peer/relative valuation cross-checks | Curated peer data with provenance | Never consensus estimates |

Nothing in V2 changes a V1 record contract; V2 adds fields and adapters.

---

## 26. Example Lifecycle Without Stock-Specific Analysis

Company X is a held position, sector pack "consumer / operating", research depth "full", thesis established with assumptions A1 (volume growth path), A2 (gross-margin normalization), A3 (no dilutive capital raise), breaker B1 (two consecutive standalone quarters of negative operating cash flow).

1. **Intake.** Otta writes: "X just released H1. Does anything change?" CIO creates `IC-20260902-X-01`, trigger `HUMAN_QUESTION`, mode `FULL`.
2. **Collection.** Adapters fetch the H1 financial statements (T1), the IDX disclosure (T1), and the results presentation (T2). One Stockbit thread is captured as T4. A T3 news article duplicates the presentation; S2 links them by content overlap and counts one source.
3. **Extraction.** T1 cells are extracted with period `H1`, scope `consolidated`, IDR full units. Standalone Q2 is derived by script from H1 minus Q1 (both records cited). One presentation slide contains text resembling agent instructions; it is quarantined and reported. A guidance statement becomes a `DIRECT` record and a proposed `ManagementClaim`.
4. **Materiality.** Advisory here (human question), but the script notes that derived Q2 operating cash flow touches B1's first condition. `POSSIBLY_MATERIAL`, breaker watch.
5. **Prior state.** Thesis v2 loaded with A1–A3, B1. Last valuation range loaded. Portfolio snapshot is 9 days old and `RECONCILED` (within D-03).
6. **Analyst.** Maps evidence to A1 (`HOLDING`, cites two cells), A2 (`WEAKENED`, cites margin cells and a `DERIVED` decomposition), A3 (`INSUFFICIENT_EVIDENCE`, no disclosure either way). Proposes assumption updates labeled `ASSUMED` with rationale; calls the calc engine for the consumer pack; receives scenario ranges and a sensitivity table. Records the guidance claim as open with a due period. Notes that B1 is one quarter into a two-quarter condition: not triggered.
7. **Reproducibility.** S7 recomputes from the declared assumptions; hashes match.
8. **Red Team.** Different lineage. Finds: the margin normalization assumption relies on a management statement with no track record; runs the calc with a lower margin path; identifies that A3's `INSUFFICIENT_EVIDENCE` was silently treated as neutral by the Analyst and demands a check of the disclosure calendar for capital-raise filings; retrieval finds none in the window and logs the query. Two MEDIUM findings, no HIGH. Verdict `PROCEED`.
9. **Portfolio checks.** Current weight within depth cap; sector within limit; `ADD` of one band would still pass; liquidity metric `UNKNOWN` (no price source), rendered as such.
10. **CIO draft.** Answers the ten questions in order. Thesis assessment `WEAKENED` (A2). Fair-value range moved; script says below the material-change threshold: "not materially changed". Management table: one open claim, no misses yet. Comparison table against the two largest holdings and cash. Recommendation `HOLD` with a review-by date at the next quarterly release and a condition tied to B1. What would change it: a second negative-OCF quarter (→ `EXIT` domain), or evidence on A3. Monitoring proposals: `REPORT_DUE` for Q3, `CLAIM_DUE` for the guidance. Memory proposal: A2 status change, new claim row, valuation row, run line. Validators pass.
11. **Gate.** Memo written to `Memos/IC-20260902-X-01.md` with `human_decision: PENDING`. Otta reads it the next day and records `accept`, adds a note.
12. **Proposal review.** Otta approves all patch items.
13. **Write.** Writer verifies base hashes, applies the A2 status change and a `ThesisEvent` row (v2 → v3, assumption status only, thesis text unchanged), appends the valuation row, adds the claim, appends the decision row, adds two triggers `active: false`, writes the receipt.
14. **Later.** Otta makes no trade. Execution block: `NOT_EXECUTED` with reason "HOLD accepted". The run is terminal.

Nothing above required a permanent agent, a price feed, or a number typed by a model.

---

## 27. Open Questions and `DECISION REQUIRED` Items

| ID | Question | Recommendation |
|---|---|---|
| D-01 | Separate persistent IC profile, or the main profile with an on-demand IC context file? | Main profile + context file for V1. Revisit only on demonstrated context bleed. |
| D-02 | If per-worker model selection is not available in v0.21.0, how is Red Team lineage independence achieved? | Script-driven model call for the Red Team with its own selector. `VERIFY BEFORE BUILD` first. |
| D-03 | Portfolio snapshot staleness threshold. | 14 days, or any day on which the transaction log has an entry newer than the snapshot. |
| D-04 | `ic-data/` inside or outside the vault. | Outside. |
| D-05 | V1 source adapters. | Manual file drop, IDX disclosure page, issuer IR page. No price feed. |
| D-06 | Kanban mirror of runs. | Not V1. |
| D-07 | Tolerances: restatement mention threshold; staleness defaults for guidance, price, macro. | Values in §10.5 as defaults; Otta confirms. |
| D-08 | Material valuation change rule (range overlap and midpoint shift thresholds). | Overlap < 50% of the prior base range, or midpoint shift > 15%, either triggers. |
| D-09 | Cash proxy return for opportunity-cost comparison. | A stated IDR risk-free proxy, set in the rules block, reviewed quarterly by Otta. |
| D-10 | Absolute large-position threshold for L2 escalation, independent of caps. | Otta sets; the architecture only requires it to exist. |
| D-11 | Migration order and which of the eleven notes are in scope first. | Held positions first, deepest research first. |
| D-12 | May a `THESIS_BREAKER_CANDIDATE` auto-start a run through S8 in V2? | Yes in V2, still stopping at S11. Not V1. |
| D-13 | Per-run budget caps (retrievals, documents, T1 calls, tokens). | Otta sets after the first fixture runs show actual usage. |
| D-14 | Which blank fields in `Investment-Rules.md` block the limit checker? | Enumerated during migration; each blank is a decision item, not a default. |
| D-15 | Does `Sistem Riset Emiten — Progress.md` continue? | Freeze as historical. |

`VERIFY BEFORE BUILD` register (all Hermes v0.21.0): delegated worker input passing by file path; per-worker tool restriction; per-worker model selection; project context file on-demand loading; script-initiated model calls with structured output; tool exposure to workers; cron fresh-context file access (V2); output size limits for workers.

---

## 28. Architecture Decision Log

| ADR | Decision | Alternatives rejected | Reason |
|---|---|---|---|
| ADR-01 | Two ephemeral workers per run (Analyst, Red Team); CIO is direct reasoning; everything else is scripts | Six permanent agents; one do-everything agent | Independence needs two isolated contexts; nothing else needs a context at all. |
| ADR-02 | File-based run directory with manifest is the durable state | Kanban tasks; background children | Runs pause for days at the human gate; files survive that trivially. |
| ADR-03 | One Canonical Writer script; human approval per patch item | CIO writes the vault; workers write their sections | C3. Also the only way hand edits and system edits can coexist detectably. |
| ADR-04 | Frozen original thesis with hash; changes only via `ThesisEvent` | Editable thesis with version history | History alone does not stop a rewrite from becoming the new "original" in the reader's mind. Freezing does. |
| ADR-05 | Red Team `BLOCK` restricts the recommendation domain; CIO cannot override the field | Advisory red team | An overridable objection is a formality. |
| ADR-06 | Calc engine outputs are recomputed at S7 and hash-compared | Trust the worker's tool calls | Catches a model that typed or "adjusted" a number. |
| ADR-07 | Sector packs with ranges; no target price | Universal DCF; point estimates | C17 and false precision. |
| ADR-08 | Lexicographic gates + visible ranking; no composite score | Weighted score | Averages hide gate failures; weights are untested assumptions. |
| ADR-09 | Analyst and Red Team never see portfolio or cost basis; CIO does, with a stated firewall sentence | Everyone sees everything | Average purchase price must not influence fundamental conclusions. |
| ADR-10 | Materiality classification is advisory on human questions and gating on events | Always gating | Otta asking is itself the materiality signal. |
| ADR-11 | Stale portfolio removes capital actions from the domain rather than refusing the run | Refuse entirely | The analysis is still useful; the sizing is not. |
| ADR-12 | MoA rejected everywhere | MoA for CIO or Red Team | Correlated errors are not independence. |
| ADR-13 | Monitoring is contract-only in V1 | Build layer 1 now "since it is deterministic" | C23. Also, layer 1 without layer 2 produces noise Otta would have to read. |
| ADR-14 | Manual vault edits allowed but detected by hash at the next run | Lock the vault | It is Otta's vault. Detection preserves ownership and auditability. |
| ADR-15 | T4 sources never support material claims | Weighted credibility | A weight is a way to let it in. |

---

## 29. Architecture Invariants

1. The system `MUST NOT` place, prepare, transmit, or draft broker orders, order quantities beyond a size band, or broker messages.
2. `committee_recommendation`, `human_decision`, and `execution_status` `MUST` be distinct fields written by distinct actors.
3. Only the Canonical Writer `MUST` write canonical or history files, only from an item-level human-approved proposal, only after schema, invariant, and base-hash validation.
4. The original thesis block `MUST` be immutable after establishment.
5. Every numeric value in a memo `MUST` trace to a script output or a `DIRECT` record. No model-generated arithmetic reaches a memo.
6. Every material claim `MUST` carry a label from {DIRECT, DERIVED, INFERRED, ASSUMED, SCENARIO} and cite verified evidence ids appropriate to its label.
7. T4 content `MUST NOT` be the sole support of any material claim. Consensus estimates `MUST NOT` be valuation inputs.
8. Retrieved content `MUST` enter only through the Evidence stage, inside a data envelope, and `MUST NOT` be able to direct any action.
9. A Red Team `BLOCK` `MUST` restrict the recommendation to `{INVESTIGATE, NO_DECISION}`.
10. Analyst and Red Team `MUST NOT` run on the same model lineage in one run and `MUST NOT` receive portfolio weights or cost basis.
11. A stale or unreconciled portfolio `MUST` exclude `BUY`, `ADD`, `TRIM`, `EXIT`.
12. A `BROKEN` thesis `MUST NOT` produce `HOLD`.
13. `INSUFFICIENT_EVIDENCE`, `INVESTIGATE`, and `NO_DECISION` `MUST` always be available outcomes and `MUST NOT` be converted into a directional inference.
14. Unchanged input `MUST NOT` trigger a model call. Price movement alone `MUST NOT` trigger a run.
15. No permanent agent, profile, cron job, webhook, or connector `MUST` be created in V1 without Otta's explicit approval outside the run.
16. Personal investment data `MUST NOT` be routed through the Finance Danilla profile.
17. No secrets in any artifact, note, or prompt.
18. A refusal `MUST` still produce a memo.
19. Fair value `MUST` be expressed as scenario ranges with assumptions; a single target price `MUST NOT` exist in any record.
20. History `MUST NOT` be deleted or edited; supersession is by new rows.

---

## 30. NEXT SESSION HANDOFF

### Decisions made

- Four execution units: Evidence pipeline (scripts + T1 extraction), Analyst (ephemeral worker), Red Team (ephemeral worker, different lineage), CIO (direct reasoning). Plus the Canonical Writer script. No permanent agents.
- File-based run directory and manifest as the durable state; human gate is a `DecisionMemo` note with three separate blocks.
- Nine records with owners and lifecycles (§11); three storage classes; migration plan for existing notes (§4, §19.4).
- Frozen original thesis; `ThesisEvent` for every change; breaker relaxation and assumption retirement are escalated and permanent in history.
- Six sector packs producing scenario ranges; normalization and all arithmetic deterministic; S7 recomputation check.
- Lexicographic portfolio gates plus a visible comparison table; no composite score; cash is a comparator.
- Nine decision states confirmed sufficient with qualifiers and the `HOLD` rule.
- Red Team with a mandatory checklist, evidence-or-logic basis requirement, `RHETORICAL` tagging, and binding `BLOCK`.
- Five model tiers by requirement profile; no vendor named; fixture benchmarks required before routing is trusted.
- Monitoring contract only; build in V2 after fixtures pass.

### Decisions rejected

- Six permanent agents; a separate IC profile in V1; MoA or any model voting; Kanban as run state; cron or webhooks in V1; price feeds as dependency or trigger; single target price; single weighted decision score; universal DCF; automatic thesis edits; RAG over conversations; statistical correlation in V1.

### Non-negotiable invariants

See §29, items 1–20. The five most load-bearing: no execution (1); one writer with human item-level approval (3); frozen original thesis (4); no model arithmetic in memos (5); binding Red Team `BLOCK` (9).

### Assumptions

- Hermes v0.21.0 delegated workers can receive file-path inputs, a restricted tool set, and a model selector. All `VERIFY BEFORE BUILD`.
- A script can call a T1 model with enforced JSON output.
- Otta will maintain `PortfolioSnapshot` reconciliation by hand in V1.
- The eleven company notes contain enough structure to migrate with human review; unrecoverable original theses are labeled `legacy`.
- The controlled case pack in Session 3 will exercise at least: a material result with a restatement, a non-material event, conflicting primary sources, an injection attempt, a stale portfolio, a breaker hit, and a not-held candidate.

### Unresolved questions

D-01 through D-15 in §27, and the `VERIFY BEFORE BUILD` register.

### Highest-risk areas for red-team review

1. **Extraction stage as single point of trust.** If T1 extraction mislabels period, scope, or units and validation misses it, every downstream number is wrong and reproducible. Attack the S3 validators and the standalone-quarter derivation.
2. **Red Team independence in practice.** Different lineage on the same bundle may still share the Analyst's framing. Attack whether the checklist and own-retrieval budget are enough, and whether `RHETORICAL` tagging can be gamed by adding token citations.
3. **Materiality classifier false negatives** (V2, but the contract is here). A cheap model missing a breaker candidate is the worst silent failure.
4. **Migration of legacy theses.** A badly migrated "original" thesis becomes frozen and wrong. Attack the migration proposal review.
5. **CIO seeing cost basis.** The firewall is a stated sentence and an input-ordering rule. Attack whether that is a control or a hope.
6. **Manual vault edits.** Hash detection reports drift; it does not prevent a hand edit from becoming the base for the next proposal. Attack the "confirm intentional" step.
7. **Sector pack assumption slots.** Plausibility ranges are where false precision re-enters. Attack the turnaround and commodity packs specifically.
8. **Stale-portfolio domain restriction** relies on Otta reconciling. Attack what happens when snapshots are reconciled carelessly.
9. **Duplicate-content detection** by hash misses near-duplicates (same press release, different wrapper). Attack corroboration counting.
10. **Refusal fatigue.** A system that refuses often may push Otta to bypass it. Attack whether the refusal codes give enough to act on.

### Exact files required by Session 2

- `00-PHASE-0-CONTEXT-PACK.md`
- `01-ARCHITECTURE-V1.md` (this document)

Session 2 must produce `02-RED-TEAM-AND-ARCHITECTURE-V2.md` containing the failure-mode register, the mitigation disposition log, a revised Architecture V2, and its own handoff, per the Session 2 prompt.
