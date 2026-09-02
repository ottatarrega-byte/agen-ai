# Investment Committee Architecture — Red Team Review and Architecture V2

**Document:** `02-RED-TEAM-AND-ARCHITECTURE-V2.md`
**Date:** 2026-09-02
**Inputs:** `00-PHASE-0-CONTEXT-PACK.md` (authoritative), `01-ARCHITECTURE-V1.md` (under review)
**Scope:** design review and revised architecture only. No stock analysis, no code, no Hermes changes, no canonical-note edits.
**Reviewer stance:** hostile to unsupported certainty. V1 is treated as a system that will produce articulate, internally consistent, schema-valid output. The question is whether that output can be wrong anyway.

Keyword conventions follow V1 (`MUST`, `SHOULD`, `MAY`, `VERIFY BEFORE BUILD`, `DECISION REQUIRED`).

Identifier conventions used here:

| Prefix | Meaning |
|---|---|
| `EV-` | evidence failure |
| `CR-` | circularity and false consensus |
| `TD-` | thesis drift and confirmation bias |
| `VA-` | valuation and financial integrity |
| `IX-` | IDX-specific |
| `MG-` | management-claim analysis |
| `PF-` | portfolio-level |
| `AU-` | automation and durability |
| `MC-` | memory corruption |
| `MR-` | model routing |
| `HG-` | human gate and interface |
| `F-` | executable test fixture required before trust |
| `V-` | deterministic validator introduced or changed in V2 |

---

## 1. Overall Verdict

V1 is a good skeleton and a dangerous system.

It is good because it already removed the things that most often make committee systems wrong: permanent agents that accumulate context, Mixture of Agents as verification, single target prices, composite scores, model arithmetic. Its file-based state, single Writer, frozen original thesis, and binding Red Team `BLOCK` are real controls, not prose.

It is dangerous because its determinism launders errors. Once a number enters `normalized_financials.json`, every downstream stage treats it as fact, recomputes it reproducibly, hash-verifies it at S7, cites it with a valid `evidence_id`, and renders it through a template. A cumulative figure mislabeled as a standalone quarter by a cheap extraction model becomes a `DERIVED` record with a script version, a sensitivity table, a Red Team retest, and a `HOLD` with a review date. Nothing in V1 checks whether the number is true. V1 checks whether it is traceable. Those are not the same property.

The second structural problem is that the CIO lives inside the conversation Otta is having. The recommendation-producing reasoning runs in a context that contains Otta's framing of the question, his mood about the position, any price or P&L he mentioned, and prior chat. The memo validators only see the memo. The Red Team `BLOCK` only binds the memo field. Otta can ask the same session "tapi menurut kamu gimana?" and receive a directional answer that passed through no validator, no Red Team, and no gate.

The third is that Red Team independence is asserted more than constructed. Different lineage on the same bundle, reading the Analyst's structured rationales, with a retrieval budget that runs through the same three adapters, and a citation validator that checks only that an `evidence_id` exists, is a reviewer that can disagree in vocabulary while agreeing in substance. Its `PROCEED` then reads to the CIO as confirmation.

The fourth is slow bleed. `WEAKENED-with-reason` makes `HOLD` valid indefinitely. Every `ThesisEvent` is small and approved. Six approved small events later, the thesis is a different thesis with the same ticker, and the frozen original is a museum piece nobody compares against unless a checklist item happens to be done well.

The fifth is that the portfolio layer's central artifact, the opportunity-cost comparison table, cannot be populated in V1 as specified. It needs a current price to compute implied return, and V1 has no price source by decision D-05. A table with `UNKNOWN` in the column that matters is decoration.

Verdict on V1 as written: **NOT READY**. Verdict on V2 as revised in this document: **READY AFTER CHANGES**, where "changes" means the Session 3 fixture pack must exercise every control listed in §16 and the system must exhibit the refusal behavior listed in §24 before any real ticker is run through it.

---

## 2. Five Most Dangerous Failure Modes

### 2.1 Reproducibly wrong numbers (EV-01, EV-02, EV-03, EV-04, MR-01)

**Mechanism.** S3 uses a cheap-tier model to label `period_kind`, `scope`, `currency`, and `unit_scale` for every financial cell. V1 says "any Tier-1 claim that fails period/unit/scope validation" is excluded, but the validators are not specified beyond schema presence. Nothing tests whether the label is correct, only whether it is filled. IDX statements make this easy to get wrong: consolidated and parent-only statements sit in one PDF; "dalam jutaan Rupiah" and "dalam Rupiah penuh" differ by a factor of one million; negatives are parenthesized; thousands separators are dots; some issuers report in USD; Q1 is unaudited, H1 is often limited-review, FY is audited, and standalone Q4 is not published at all.

**Why V1 looks disciplined while failing.** The mislabeled cell gets an `evidence_id`, page reference, and hash. Standalone derivation subtracts two mislabeled cells and produces a `DERIVED` record with a script version. S7 recomputes and the hash matches. The memo renders the number from `calc_output.json`. Every invariant in §29 of V1 is satisfied.

**Consequence.** A `BUY` or `EXIT` on a margin, growth, or cash-flow figure that is off by a period, a scope, or a thousandfold. A false breaker hit forces `BROKEN` and excludes `HOLD` on a healthy company. A real breaker is masked.

**Fix (V2).** Structured data first (IDX XBRL/xlsx where retrievable, `VERIFY BEFORE BUILD`), double extraction with agreement required for financial cells, and a family of deterministic accounting-identity and scale validators (§5, §20.4) that fail cells, not runs. Numbers that fail identities are `FAILED` and CALC refuses on them.

### 2.2 The chat channel bypasses the gate (HG-01, HG-02, PF-05)

**Mechanism.** V1 §7: "CIO synthesis and Q&A: direct CIO reasoning in the interactive session." The same context does intake, reads the portfolio including cost basis and unrealized P&L, drafts the memo, proposes memory patches, and talks to Otta. The "firewall sentence" in the memo is the only control on cost-basis influence. Nothing controls what the session says in chat.

**Why V1 looks disciplined while failing.** The memo is validated. The memo has the right recommendation domain. The `BLOCK` is respected in the memo field. The chat says "kalau aku sih, ini masih menarik di harga segini."

**Consequence.** Otta acts on the chat, not the memo. Decision history records nothing or records a decision whose actual basis was an unvalidated remark. The system's entire audit trail becomes theatre.

**Fix (V2).** Split the CIO into CIO-Synthesis (an isolated, schema-bound model call or ephemeral worker that never sees the conversation and never sees cost basis) and CIO-Interface (the session Otta talks to, which may quote memos and explain them but has no evidence bundle, no analyst report, and a "no memo, no view" refusal rule). Remove cost basis and unrealized P&L from every system input. IDX retail share sales are taxed on gross proceeds, not on gains, so cost basis has no legitimate decision role (Otta to confirm his own tax position, D-22).

### 2.3 Nominal Red Team independence (CR-01, CR-02, CR-03, CR-11, EV-15)

**Mechanism.** Four compounding gaps. (a) Same bundle: the Red Team reads the same `evidence_bundle.json`, collected by the same intake-scoped S1, and its "own retrieval" runs through the same D-05 adapters (manual drop, IDX disclosure page, issuer IR page), none of which reach competitor results, regulator actions, or industry data. (b) Analyst framing: `analyst_report.json` carries per-assumption rationales; a reviewer reading them argues inside them. (c) Token citations: the validator checks that a cited `evidence_id` exists and is `VERIFIED`, not that the record supports the finding; `RHETORICAL` tagging is defeated by attaching any valid id. (d) Coverage blindness: a `PARTIAL` bundle where the failed adapter was the disclosure channel leaves only the issuer's own promotional material, and nothing restricts the domain.

**Why V1 looks disciplined while failing.** The Red Team report has eight checklist entries, each with a finding or a reasoned "no finding", each with evidence ids, a disconfirming search log that says "searched issuer IR for 'rights issue', nothing found", and a `PROCEED`. The CIO writes "the adversarial review raised two MEDIUM findings, both addressed."

**Consequence.** Agreement between two lineages on one bundle is presented as independent confirmation. The specific risk the bundle never contained is never raised.

**Fix (V2).** Two-phase Red Team (blind phase before it sees the Analyst report), coverage-based domain restriction, a citation-support check as a validator, `RED_TEAM_SILENT` flag, a mandatory "strongest surviving objection" memo section, and adapters that cover disconfirming channels or explicit `UNRESOLVABLE` checklist items that force `MORE_RESEARCH` minimum.

### 2.4 Slow bleed through approved small changes (TD-01, TD-02, TD-03, TD-04, TD-06)

**Mechanism.** `HOLD` is valid under `WEAKENED-with-reason` with no time bound. Every `ThesisEvent` is individually reasonable and individually approved. Breakers written as prose are evaluated by a model. Assumptions of absence ("no dilutive raise") default to `HOLDING` because nobody found evidence against them. The Red Team `MAY` be skipped when the only outputs are `UNCHANGED`/`HOLD`/`WATCH`.

**Why V1 looks disciplined while failing.** Every change is logged. The history table is complete. Each memo cites the prior memo. Nothing ever says "this thesis failed" because the thesis was never allowed to fail in one step.

**Consequence.** A losing position is held for eight quarters with eight `HOLD`s, each internally consistent.

**Fix (V2).** Weakened-duration rule, a script-computed drift score with a re-establishment requirement, machine-checkable breaker specs evaluated by CALC every run, `NegativeSearchRecord` required for absence assumptions, Red Team mandatory for every recommendation on a held position, and a `fresh_look_recommendation` field that forces the memo to answer "would the committee buy this today?" before it answers "should Otta keep it?"

### 2.5 Hollow portfolio layer (IX-03, IX-01, PF-01, PF-02, PF-03)

**Mechanism.** No price source means no implied return, so the comparison table's ranking column is empty. Liquidity is `UNKNOWN` and `BUY` is still in the domain. `RECONCILED` is a word Otta types. Comparators may carry valuations from a year ago. "Best of the alternatives" can be `BUY` even when nothing clears cash.

**Why V1 looks disciplined while failing.** The table exists, has the right columns, and is lexicographic. The gates run. The stale-portfolio rule is enforced. The memo says "best use of the marginal rupiah."

**Consequence.** Correct company analysis, wrong capital allocation, and a `BUY` in a stock Otta cannot exit.

**Fix (V2).** `PriceRecord` as evidence with a `PRICE_UNKNOWN` domain restriction, liquidity gate for non-large-caps, ledger-based reconciliation, comparator-age rendering with L2 when all comparators are stale, and an absolute hurdle gate in S9.

---

## 3. Failure Mode Register

Likelihood: H / M / L. Severity: CRITICAL (wrong capital action with confident memo), HIGH (wrong thesis assessment or unusable control), MEDIUM (degraded quality, recoverable), LOW.

### 3.1 Evidence failure

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| EV-01 | T1 extractor labels a cumulative (9M, H1) figure as standalone or vice versa; standalone derivation then subtracts wrong operands | Growth, margin, and breaker checks computed on garbage; false or masked breaker | H | CRITICAL | Cumulative monotonicity (revenue, COGS, opex non-decreasing within FY); derived quarter negative on a line that cannot be negative; derived quarter larger than its cumulative parent | V-01 structured-data-first parsing; V-02 double extraction with agreement; V-03 accounting identities; derivation refuses when V-03 fails on its operands | F-01 |
| EV-02 | Parent-only ("entitas induk") table extracted as consolidated, or vice versa | Wrong leverage, revenue, cash; for banks, wrong CAR/LDR basis | H | CRITICAL | Section-anchor detector (deterministic keyword anchors for "Laporan Keuangan Tersendiri Entitas Induk" and similar); cell-store continuity jump vs prior period | V-01, V-02, V-04 section anchors; pack specifies required scope per metric (§20.5) | F-02 |
| EV-03 | Unit scale ("jutaan", "ribuan", full rupiah) or currency (USD reporters) mislabeled | Thousandfold error that is internally consistent | M | CRITICAL | V-05 scale check: EPS × shares outstanding ≈ net income attributable; equity vs market cap sanity when price exists; continuity vs cell store | V-05; header-text scale cue extraction is deterministic; FX rate is an `EvidenceRecord` with date | F-03 |
| EV-04 | OCR or parse drops parenthesized negatives, misreads digits, or parses "1.234,5" as 1.2345 | Loss becomes profit; margins flip sign | M | HIGH | V-03 identities; subtotal recomputation; locale-aware parse with explicit locale field | V-03; V-06 locale parser; OCR confidence flag; cells fail, not runs | F-04 |
| EV-05 | Freshness computed from `publication_date`; "latest period known to exist per IDX calendar" depends on a calendar V1 does not source | Stale statements treated as current; a filing for FY2025 published in April 2026 treated as "2026 data" | M | HIGH | V-07 expected-period table (static rule by fiscal-year-end and audit status, `VERIFY` deadlines) | V-07; freshness computed only from `reporting_period`; `fiscal_year_end` field in `ThesisState` | F-05 |
| EV-06 | A later filing restates comparatives; no prior cell exists to compare against because normalized financials live only inside one run | Restatement invisible; growth computed old-vs-new basis | H | HIGH | V-08 comparatives diff against `FinancialCellStore` | New record `FinancialCellStore` (§20.2); V-08 → `RESTATEMENT_DETECTED`, prior cell `superseded_by`, memo mention above tolerance | F-06 |
| EV-07 | Derived Q4 = FY(audited) − 9M(unaudited) absorbs the whole year's audit adjustments; Q2 = H1(reviewed) − Q1(unaudited) similar | Standalone quarter misleads on trend | H | MEDIUM | Audit-status field per document | Derived record carries `derivation_risk: AUDIT_BOUNDARY`; memo must show the flag next to any such quarter; breakers evaluated on such quarters are `TRIGGERED_WITH_CAVEAT` and require L2 | F-07 |
| EV-08 | Same press release republished by three media outlets with different wrappers; hash dedup sees four documents | "Corroborated by multiple sources" | H | HIGH | Shingle / MinHash similarity on `claim_text` and body | V-09 `origin_class`; corroboration counts distinct T1/T2 origins only; T3 rewrites of a T2 source are `SAME_ORIGIN` | F-08 |
| EV-09 | A T3 article's number becomes a `DIRECT` record because the extractor cannot see tier | Secondary figure enters normalized cells | M | HIGH | Tier is assigned by adapter channel before extraction | `DIRECT` permitted only from T1/T2; T3 numeric claims labeled `SECONDARY_FIGURE`, never in `normalized_financials.json` | F-09 |
| EV-10 | Manual file drop of a PDF that describes itself as an IDX disclosure gets T1 | Fabricated or altered document becomes primary evidence | M | HIGH | Hash match against an IDX-retrieved copy | Tier by provenance channel; manual drops are T2 maximum unless `CHANNEL_VERIFIED` by hash match; Otta must label the drop's claimed source and the record shows `tier_provenance` | F-10 |
| EV-11 | Wrong issuer document (similar tickers, warrant or rights instrument suffix) | Analysis of the wrong company or instrument | L | HIGH | Issuer name in document vs registered name for ticker | V-10 issuer-name match; instrument-suffix check; mismatch → record `FAILED` | F-11 |
| EV-12 | Truncated PDF or failed OCR leaves nulls; the T2 results presentation carries the same line items and fills the gap | Presentation figures (issuer-curated, possibly adjusted) become the statement | M | HIGH | Page-count expectation from the document's table of contents; source document type per cell | Presentation cells `MUST NOT` populate statement nulls; nulls stay nulls; CALC refuses | F-12 |
| EV-13 | A later T2 correction contradicts an earlier T1 figure; tier rule silently picks T1 | Corrected figure lost | L | MEDIUM | Date-aware conflict rule | Later-dated lower-tier conflict is flagged, not resolved; `conflict_flag` and `INVESTIGATE` cap on dependent conclusions | F-13 |
| EV-14 | Instruction-like content survives as `claim_text` in a `DIRECT` record and reaches tool-holding workers; Red Team retrieval pulls a page with an injection | Worker behaves as instructed; output remains schema-valid | M | HIGH | Deterministic detector on claim_text and on all retrieval results, not only S1 content | `claim_category` typing; category `other` with imperative patterns → `QUARANTINED`; retrieval results into workers pass the same detector and envelope; worker output domain validation | F-14 |
| EV-15 | Bundle `completeness: PARTIAL` because the disclosure adapter failed; only issuer IR material present | Rosy bundle; Red Team governance item answered from absence; nothing restricts domain | H | CRITICAL | Adapter `covers` map vs claim categories present | V-11 coverage-based domain restriction (§20.7); Red Team items depending on uncovered categories are `UNRESOLVABLE` → verdict `MORE_RESEARCH` minimum | F-15 |
| EV-16 | Issuer-defined metrics ("adjusted EBITDA", "core profit") extracted as line items | Non-GAAP numbers in normalized cells | M | HIGH | Line-item whitelist per statement type | `metric_definition: ISSUER_DEFINED` records are quarantined from `normalized_financials.json` unless a script reconciles them to T1 line items | F-16 |
| EV-17 | "No T1/T2 can exist for it" tier exception decided by the model that wants the claim | T3 supports a load-bearing claim | M | MEDIUM | Whitelist | Pack-level whitelist of claim categories eligible for `tier_exception` (industry price series, macro series, government statistics); broker multiples excluded | F-17 |
| EV-18 | Two attempts of S3 on the same document produce different bundles; downstream uses whichever is latest | Non-determinism hidden behind attempt directories | M | MEDIUM | Bundle hash comparison across attempts | An S3 retry on identical input that yields a different financial cell set marks the cell `UNSTABLE` and excludes it | F-18 |

### 3.2 Circular reasoning and false consensus

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| CR-01 | One bundle, one intake scope, one adapter set; the Red Team's "own retrieval" reaches only the same three channels | Disconfirming evidence that lives elsewhere (regulator, competitor, industry data) is structurally unreachable; "I searched and found nothing" is true and worthless | H | CRITICAL | Adapter coverage map; disconfirming search log lists channels, not just queries | Red Team blind phase; mandatory disconfirming channels per pack or `UNRESOLVABLE` items; D-17 adapter decision | F-20 |
| CR-02 | Red Team reads Analyst rationales and argues inside them | Vocabulary disagreement, substantive agreement | H | HIGH | Divergence between blind-phase and compare-phase outputs | Two-phase Red Team (§20.6); phase A output recorded and rendered in memo | F-21 |
| CR-03 | Any valid `evidence_id` satisfies the citation validator; `RHETORICAL` tagging defeated by token citation | Unsupported findings and unsupported memo claims carry weight | H | HIGH | Citation-support check | V-12: T1 support check on every finding and every MEDIUM+ memo claim, different lineage from the author where possible; `NOT_SUPPORTED` → finding `RHETORICAL`, memo claim invalid | F-22 |
| CR-04 | "Top three assumptions by sensitivity" are computed on the Analyst's own scenario structure; narrow scenarios hide the lever | Red Team retests the wrong things | M | HIGH | Pack-owned axes | Sector packs own the mandatory sensitivity axes and bounds; Red Team must retest at pack bounds, not only Analyst ranges | F-23 |
| CR-05 | Analyst receives the prior `ValuationSnapshot` and proposes assumptions near it; D-08 rule says "not materially changed"; `HOLD` | Anchoring across runs disguised as stability | H | HIGH | Blind assumption set vs prior | Analyst is blind to prior valuation numbers (§20.5); comparison to prior is a script step interpreted by CIO-Synthesis | F-24 |
| CR-06 | CIO reads prior `DecisionMemo`s; three `HOLD`s produce a fourth | Endowment and sunk cost in the recommendation | H | HIGH | `fresh_look_recommendation` vs held-frame recommendation | Prior decisions passed as a structured table, not full text; `fresh_look_recommendation` mandatory (§20.8); `ADD` excluded when fresh look is `PASS` | F-25 |
| CR-07 | Management guidance becomes the base case; track-record check is a Red Team judgment item | Base case is a promise | H | HIGH | `GUIDANCE_BASED` label | Assumption derived from guidance carries `GUIDANCE_BASED`; packs forbid `GUIDANCE_BASED` in the base scenario when the company has fewer than N closed claims or hit rate below threshold (D-18) | F-26 |
| CR-08 | S4 maps changes to the thesis's assumptions and breakers; anything outside the thesis frame is `NOT_MATERIAL` | Unknown unknowns (auditor change, private placement to affiliate) dismissed | M | HIGH | Thesis-independent category list | S4 has a thesis-independent `ALWAYS_MATERIAL` category list (§20.3); any hit is `MATERIAL` regardless of mapping | F-27 |
| CR-09 | CIO lineage equals Analyst lineage; CIO finds the Analyst natural and the Red Team alien | Synthesis biased toward one side by style, not evidence | M | MEDIUM | Lineage recorded per stage in manifest | Manifest records lineage per stage; CIO-Synthesis lineage `MUST` differ from at least one of Analyst and Red Team; benchmark for lineage sympathy | F-28 |
| CR-10 | `MORE_RESEARCH` → bounded Analyst re-run that receives the Red Team findings; S8 not re-run | Second Analyst pass is unreviewed and writes to satisfy the reviewer | M | HIGH | Manifest shows S6 attempt 2 without S8 attempt 2 | S8 `MUST` re-run after any S6 re-run, receiving the prior Red Team report; validator refuses S10 otherwise | F-29 |
| CR-11 | Red Team produces zero MEDIUM+ findings; CIO treats silence as confirmation | Fixtures always contain planted flaws, so silence on a real run is a signal, not comfort | H | HIGH | `RED_TEAM_SILENT` flag | Flag rendered in memo header; memo `MUST` contain "strongest surviving objection" section even on `PROCEED`; a `BUY`/`ADD` with `RED_TEAM_SILENT` requires L2 | F-30 |
| CR-12 | Fixtures authored by the same model family under test | Benchmarks share the blind spots they measure | M | MEDIUM | Fixture provenance field | Fixtures derived from real historical IDX events with known outcomes plus human-written traps; provenance recorded | (meta) |
| CR-13 | CIO-Synthesis proposes assumption status changes; Writer applies them; next run's Analyst reads them as "current thesis" | Yesterday's interpretation is today's input | H | MEDIUM | Inherent | Accepted with controls: evidence ids on every status, frozen original, drift score, blind-phase Red Team comparing original vs current | F-32 |

### 3.3 Thesis drift and confirmation bias

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| TD-01 | `HOLD` valid under `WEAKENED-with-reason` with no time bound | Indefinite hold on a weakening thesis | H | CRITICAL | `quarters_since_fully_holding` counter | Weakened-duration rule (§20.8): after two consecutive quarterly reporting periods with any assumption `WEAKENED` or `INSUFFICIENT_EVIDENCE`, `HOLD` requires L2 with a typed reason; counter in memo header | F-31 |
| TD-02 | Many small approved `ThesisEvent`s accumulate into a different thesis | The frozen original is preserved and ignored | H | HIGH | Script drift score | Drift score (§20.8); above threshold → `THESIS_REESTABLISHMENT_REQUIRED`: old thesis closed as `SUPERSEDED` with outcome recorded, new frozen original; `HOLD` excluded until re-established | F-32 |
| TD-03 | Assumptions of absence default to `HOLDING` when no evidence is found | Missing evidence read favorably | H | HIGH | Assumption kind field | `assumption_kind: ABSENCE` requires a `NegativeSearchRecord` (channels, queries, window, result) dated within the run; otherwise validator forces `INSUFFICIENT_EVIDENCE` | F-33 |
| TD-04 | Breakers are prose; "triggered" is decided by a model | Numeric breakers missed or hallucinated | H | CRITICAL | `breaker_eval.json` | `breaker_spec` machine-checkable for numeric breakers, evaluated by CALC every run against the cell store; `UNEVALUABLE` blocks `UNCHANGED`/`STRENGTHENED`; qualitative breakers need `DIRECT` evidence plus Red Team concurrence | F-34 |
| TD-05 | Legacy migration freezes a wrong or paraphrased original | Anti-drift anchor is itself drifted | M | HIGH | Side-by-side migration proposal | Migration proposal shows extracted fields next to source lines; first FULL run after migration includes Red Team item "is the frozen original faithful to the legacy text?"; one-time `LEGACY_CORRECTION` event allowed within 30 days, L2 | F-35 |
| TD-06 | Red Team `MAY` be skipped when outputs are `UNCHANGED`/`HOLD`/`WATCH` | The slow bleed is never challenged | M | HIGH | Manifest | Red Team mandatory for every run that emits a recommendation on a held security, including `HOLD`; skippable only for event runs ending `DONE: NO_ACTION` | F-36 |
| TD-07 | Management re-bases a claim on a new metric; old claim stays `OPEN` forever | Never `MISSED` | H | HIGH | Past-due scan | Claims past `due_period` plus one reporting cycle with no outcome are auto-closed `UNRESOLVED_PAST_DUE` by script and count against credibility; new claims on a changed metric link `metric_changed_from` | F-37 |
| TD-08 | `MET` set from management's own "we achieved" statement | Self-assessment as outcome evidence | M | HIGH | Outcome evidence tier and kind | `outcome_evidence_id` for numeric claims `MUST` be a T1 `DIRECT` cell or a `DERIVED` record; T2 self-assessment is `notes` only | F-38 |
| TD-09 | Intake question carries Otta's framing ("harga udah turun 30%, masih worth it?") into S1 scope | Collection and extraction shaped by the desire | H | HIGH | `intake.json` schema | Free-text question stored for audit; only structured fields (ticker, category, event pointers, depth) flow to S1 onward (§20.1) | F-101 |
| TD-10 | "What would change the recommendation" answered generically | Unfalsifiable memo | M | MEDIUM | Validator | Each item `MUST` reference an assumption id, breaker id, claim id, or a named missing evidence item | F-39 |

### 3.4 Valuation and financial integrity

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| VA-01 | Cost of equity is an unconstrained `ASSUMED` slot | 9% vs 12% CoE moves fair value by tens of percent with no evidence | H | HIGH | Floor rule | CoE `MUST` be ≥ risk-free proxy (D-09) + minimum equity premium (D-19); below floor fails validation | F-40 |
| VA-02 | Justified P/BV = (ROE − g)/(CoE − g) explodes when CoE − g is small | Bank fair value dominated by a formula artifact | M | HIGH | Denominator check | Scenarios with CoE − g below 2 percentage points flagged `FORMULA_UNSTABLE` and excluded from the base range; grid rendered | F-41 |
| VA-03 | Property land bank "at estimated market value" with no anchor | NAV is whatever the Analyst assumes | H | HIGH | Anchor field | Land value `MUST` anchor to book (floor) or a disclosed appraisal (T1/T2, appraiser named); multiple over book rendered; Red Team must retest at book | F-42 |
| VA-04 | Mid-cycle commodity price computed over a window chosen to include the supercycle | Normalization is cherry-picked | H | HIGH | Window field | Price series is a T3 whitelisted record with the window stated; CALC generates candidates (5y, 10y, 15y median); Analyst picks and labels; all candidates rendered | F-43 |
| VA-05 | EV/EBIT or P/E multiple chosen with no price history to anchor it | Multiple is an opinion | H | HIGH | Cross-check presence | Any multiple-based range `MUST` be accompanied by the script-computed implied growth and ROIC the multiple requires; the Red Team tests the implied figures | F-44 |
| VA-06 | Pack "plausibility ranges" set arbitrarily at build time | Ranges are where false precision re-enters | H | HIGH | Range provenance | Ranges derived by script from the company's own history in the cell store (percentiles) and sector peers where data exists; assumption outside history labeled `OUTSIDE_HISTORY` and requires L2 | F-45 |
| VA-07 | Turnaround pack allows `ASSUMED` probability weights | Probability-weighted range is a point estimate in disguise | H | HIGH | Schema | Probability weights removed from V2 memos; branches shown unweighted; turnaround `BUY` size band capped at the lowest research-depth cap regardless of depth | F-46 |
| VA-08 | "One-off" items excluded because the issuer calls them non-recurring; recurring non-recurring | Normalized earnings inflated | H | MEDIUM | Recurrence check | One-off exclusion requires the item absent from the prior N periods in the cell store; trailing one-off count rendered; symmetric for gains | F-47 |
| VA-09 | D-08 midpoint rule reintroduces a point value | A "midpoint" appears in a memo | M | MEDIUM | Render rule | Midpoint used only as a trigger inside the script, never rendered; overlap rule is the shown criterion | F-48 |
| VA-10 | Analyst calls CALC for nothing material; S7 recompute passes trivially | Memo with no reproducible valuation | M | HIGH | Pack-mandatory outputs | `CALC_MISSING` refusal when pack-mandatory pieces are absent in a FULL run | F-49 |
| VA-11 | Bank consolidated figures include non-bank subsidiaries; regulatory ratios are bank-only | Wrong CAR/LDR/NIM basis | M | HIGH | Scope per metric | Bank pack specifies scope per metric; V-04 anchors | F-50 |
| VA-12 | Pending rights issue, warrants, or private placement not applied to share count | Per-share fair value overstated by the dilution factor | H | HIGH | Share-count continuity | `CorporateActionRecord` (§20.2); V-13 share-count continuity: change above 1% without a record → `SHARE_COUNT_UNEXPLAINED`; pro-forma per-share values computed by script for announced actions | F-51 |
| VA-13 | Numeric probabilities in memo prose | False precision | M | MEDIUM | Validator | Probabilities rendered as bands (LOW / MEDIUM / HIGH) unless script-derived | F-52 |
| VA-14 | Terminal growth bounded by "nominal GDP proxy" with no source | Bound is unanchored | M | MEDIUM | Source field | GDP proxy is a T3 whitelisted record with date; bound fails validation without it | F-53 |
| VA-15 | Sum-of-parts adds a secondary pack's range to the primary without eliminating intra-group items | Double counting | L | MEDIUM | Segment reconciliation | Sum-of-parts requires segment revenue and assets to reconcile to consolidated within tolerance | F-54 |

### 3.5 IDX-specific

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| IX-01 | Liquidity `UNKNOWN` (no volume source) and `BUY`/`ADD` remain in the domain for a small cap | Position Otta cannot exit | H | HIGH | Liquidity record presence | Liquidity gate: for tickers outside the large-cap list (D-20), `BUY`/`ADD` require an ADTV record and `days_to_exit ≤ threshold`; otherwise excluded | F-60 |
| IX-02 | Suspended security or auto-reject state unknown | Capital action on an untradeable instrument | M | MEDIUM | `trading_status` | `trading_status` ∈ {NORMAL, SUSPENDED, UNKNOWN} required at S5 from a T1 source or Otta's dated entry; `SUSPENDED` excludes `BUY`/`ADD`; `UNKNOWN` treated as `SUSPENDED` for non-large-caps | F-61 |
| IX-03 | No price source; implied return cannot be computed; comparison table hollow | Opportunity-cost reasoning without the number it rests on | H | CRITICAL | `PriceRecord` presence | `PriceRecord` evidence (T1 IDX daily data or Otta manual dated entry labeled `MANUAL`); missing or older than 5 trading days → `PRICE_UNKNOWN` domain restriction excluding `BUY`/`ADD`/`TRIM` | F-62 |
| IX-04 | Related-party note never targeted by extraction; governance item answered from absence | RPT leakage invisible | H | HIGH | Extraction target coverage | Mandatory extraction targets for any candidate `BUY` and any `ADD`: related-party note, auditor and opinion, shareholder structure, contingent liabilities, FX-denominated debt (§20.4); missing target → `INVESTIGATE` cap | F-63 |
| IX-05 | Auditor change or non-unqualified opinion not extracted | Governance signal lost | M | HIGH | FY mandatory cells | Auditor name and opinion type are mandatory FY cells; change or non-unqualified → L2 and `INVESTIGATE` cap | F-64 |
| IX-06 | Rupiah exposure: FX debt and imported COGS not in cells | Sensitivity table omits the largest macro lever | M | MEDIUM | Pack targets | FX-denominated debt and disclosed import share are pack extraction targets; sensitivity axis on IDR mandatory for packs flagged `FX_SENSITIVE` | F-65 |
| IX-07 | Regulatory intervention (DMO, export bans, price caps) lives outside D-05 adapters | Red Team cannot find it | M | HIGH | Coverage | Regulator channel adapter (D-17) or Red Team item 6 `UNRESOLVABLE` for packs flagged `REGULATION_SENSITIVE` | F-20 |
| IX-08 | Broker peer multiples enter via the T3 exception | Consensus by another name | M | MEDIUM | Whitelist | Excluded by EV-17 whitelist | F-17 |
| IX-09 | Reverse split breaks per-share series | EPS trend distorted | L | MEDIUM | Share-count continuity | Covered by VA-12 | F-51 |
| IX-10 | Controlling shareholder action (private placement to affiliate at a discount, asset sale to a related party) classified `NOT_MATERIAL` because no thesis assumption names it | Value transfer missed | M | HIGH | Category list | `ALWAYS_MATERIAL` categories include corporate actions, RPT disclosures, auditor events, regulator sanctions | F-27 |
| IX-11 | Low free float makes reported market cap meaningless for liquidity and for any market-based cross-check | Sanity checks pass on a number nobody can trade at | M | MEDIUM | Free-float field | Free float is a mandatory `ThesisState` field from IDX data; liquidity gate uses it | F-60 |
| IX-12 | Same controlling group across holdings not captured by "sector" | Concentration hidden | M | MEDIUM | `controlling_group` field | `controlling_group` mandatory in `ThesisState`; S9 counts group exposure alongside sector | F-73 |

### 3.6 Management-claim analysis

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| MG-01 | Vague guidance ("double-digit growth", "significant improvement") cannot be evaluated by CALC; Analyst marks `MET` | Credibility inflated by unfalsifiable claims | M | MEDIUM | `evaluable` flag | Claims without a numeric `target_value_or_range` are `UNEVALUABLE`; they never count toward hit rate and their count is rendered as its own credibility signal | F-66 |
| MG-02 | Promotional language analysis is `INFERRED` without a baseline | Every issuer sounds promotional | L | LOW | n/a | Accepted as interpretation; must cite claim ids; no score | (none) |
| MG-03 | Capital-allocation claims (buyback, dividend policy) evaluated without the corporate action record | "Buyback announced" treated as executed | M | MEDIUM | Corporate action records | `CAPITAL_ALLOCATION` claims close only against a `CorporateActionRecord` or a T1 cash-flow cell | F-67 |
| MG-04 | Deadline moves tracked, but a claim silently withdrawn (never mentioned again) is neither `MISSED` nor `WITHDRAWN` | Track record flatters | H | HIGH | Past-due scan | Covered by TD-07 auto-close | F-37 |

### 3.7 Portfolio-level

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| PF-01 | Otta types `RECONCILED` without checking | Stale-portfolio control depends on a word | H | HIGH | Ledger check | V-14 ledger reconciliation: expected holdings = prior `RECONCILED` snapshot + structured transaction-log rows since; mismatch → `RECONCILIATION_MISMATCH`, status stays `UNRECONCILED` unless Otta overrides with a typed reason | F-70 |
| PF-02 | Subject ranks first among poor alternatives; `BUY` | Forced deployment by relative ranking | M | HIGH | Hurdle gate | V-15 absolute hurdle in S9: `BUY`/`ADD` require base-range low-end implied return ≥ cash proxy and bear drawdown within the rules-block limit (D-21) | F-71 |
| PF-03 | Comparators carry `ValuationSnapshot`s from many months ago | Fresh subject vs stale field | H | MEDIUM | Comparator age column | Comparator age rendered; all comparators older than D-23 → `BUY` requires L2 "comparison basis stale" | F-72 |
| PF-04 | Grandfathered excess weight makes every other `ADD` `FAIL` on sector limit | Otta learns to ignore `FAIL` | M | MEDIUM | Cause attribution | `FAIL_GRANDFATHERED_CAUSE` rendered distinctly; D-24 whether grandfathered excess is excluded from limit checks on other positions | F-73 |
| PF-05 | CIO sees cost basis and unrealized P&L | Anchoring on purchase price | H | HIGH | Input schema | Removed from all system inputs (§13); `PortfolioSnapshot` view given to CIO-Synthesis contains weights, cash, sector, group, liquidity only | F-74 |
| PF-06 | Correlation is qualitative; shared drivers named by the CIO from memory | Concentration under-counted | M | MEDIUM | Driver fields | `ThesisState` carries `primary_drivers` (commodity, rate, FX, end market, group); S9 counts shared drivers by field match; CIO adds interpretation | F-75 |
| PF-07 | Two open runs on one ticker; second proposal built on a base the first will change | `WRITE_CONFLICT` at best, stale analysis at worst | M | MEDIUM | Run lock | Per-ticker run lock; `REFUSED: RUN_IN_PROGRESS` unless Otta abandons the earlier run | F-76 |
| PF-08 | `human_decision: modify` to a size above cap; limit check not re-run | Recorded decision violates rules silently | M | LOW | Re-check on human block | Human block validated by the limit checker for information; `WARN` rendered; still Otta's decision | F-77 |
| PF-09 | Rules block blanks (D-14) default to "no limit" in code | Gates silently open | M | HIGH | Blank scan | Limit checker refuses to run with any blank rule value: `REFUSED: RULES_INCOMPLETE` naming the field | F-78 |

### 3.8 Automation and durability (V2 contract; some apply to V1 runs)

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| AU-01 | Listing pages embed timestamps and session tokens; content hash changes every fetch | Classifier runs daily on nothing; invariant 14 violated | H | HIGH | Hash target | Hash the canonicalized document (PDF bytes, normalized metadata), never the listing page HTML | F-80 |
| AU-02 | Monthly registry reports and advertisement proofs flood the classifier | Alert fatigue, cost | H | MEDIUM | Disclosure-type whitelist | Deterministic `NOT_MATERIAL` whitelist by disclosure type built from historical disclosure titles; never reaches the classifier | F-81 |
| AU-03 | Cron retry after transient failure emits a second `change_event` | Duplicate run proposals | M | MEDIUM | Idempotency key | `(ticker, document_hash)` idempotency key in `ic-data`; duplicates dropped | F-82 |
| AU-04 | Fresh-context cron run finds `ic-data` missing or partial | Runs on no state | M | HIGH | `state_version` | Scripts refuse when `ic-data/state_version` is absent or older than the schema; no silent empty-state runs | F-83 |
| AU-05 | Run dies mid-stage; manifest torn | Resume from a corrupt checkpoint | M | MEDIUM | Atomic writes | Manifest written via temp-file-and-rename; stage lease with heartbeat; stale-lease detection marks the attempt `FAILED` | F-84 |
| AU-06 | Two attempts write the same attempt directory | Artifact overwrite | L | MEDIUM | Exclusive mkdir | Attempt directories created with exclusive create; failure means another attempt exists | F-85 |
| AU-07 | Cheap classifier misses a breaker candidate | Worst silent failure | H | CRITICAL | Numeric breakers by script | Layer 1.5: when the changed document is a financial statement, run S3 parsing and `breaker_eval` deterministically before any classifier; `ALWAYS_MATERIAL` categories | F-86 |
| AU-08 | Otta's price-driven questions become FULL runs | Cost and false urgency | H | MEDIUM | Intake category | `question_category: PRICE_MOVE` forces `QUICK` unless `override_reason` typed and recorded | F-87 |
| AU-09 | Writer re-applied after a crash | Duplicate history rows | M | HIGH | Proposal-hash receipt | Writer is idempotent: a proposal whose hash appears in a `write_receipt.json` is a no-op | F-88 |
| AU-10 | Manifest stage status flips to `DONE` before artifact hashes are written | Resume reads a `DONE` stage with missing artifacts | L | MEDIUM | Ordering | Artifacts and hashes written before status; resume verifies hashes before trusting `DONE` | F-84 |

### 3.9 Memory corruption

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| MC-01 | Otta hand-edits the frozen original; V1 reports "manual edits detected" generically and asks to confirm | The anchor moves with a click | M | CRITICAL | `original_thesis_hash` check at S5 | Hard refusal `REFUSED: ORIGINAL_THESIS_TAMPERED` until the block is restored or an `ERRATUM` event with typed reason is approved | F-90 |
| MC-02 | `ThesisEvent` stored twice (jsonl and note table); they diverge | Two truths | M | HIGH | Consistency check | One source (`ic-data/thesis-events/<TICKER>.jsonl`), one projection (note table regenerated by Writer); S5 refuses on divergence | F-91 |
| MC-03 | CIO's memory proposal curates only supporting evidence into `ic-data/evidence` | Institutional memory becomes a highlight reel | H | HIGH | Validator | Curated subset `MUST` include every record cited by a Red Team finding, every record with `contradicts` populated, and every `FAILED`/`QUARANTINED` record's id and reason | F-92 |
| MC-04 | `human_decision` block editable until execution block is set; a `HOLD` never executes | Decision text rewritable forever | M | MEDIUM | Freeze rule | Human block freezes at the earlier of 7 days after the decision or the next run for the ticker; later changes are appended `AMENDMENT` rows | F-93 |
| MC-05 | `runs/` and `ic-data/` are outside the vault and outside vault sync | Loss of history and indexes | M | HIGH | Backup policy | D-25 backup policy; rebuild script from vault plus runs must exist and be tested | F-95 |
| MC-06 | "Confirm intentional" turns a hand edit to the current thesis into the new base without an event | Silent rewrite with a human click | M | HIGH | Diff | Confirming a hand edit to section 2 auto-creates a `ThesisEvent` of kind `MANUAL_EDIT` with the diff; hand edits to any other Writer-only section require the same | F-94 |
| MC-07 | Migration collides two notes for one ticker or two tickers in one note | Wrong canonical | L | HIGH | Collision scan | V1 rule kept; migration stops on collision | F-96 |
| MC-08 | Legacy fair-value rows with `method: legacy` used as comparators in S9 | Unverified history drives opportunity cost | M | MEDIUM | Method filter | S9 excludes `method: legacy` and `verification: UNVERIFIED` rows; comparator shows `NO_VALID_VALUATION` | F-72 |

### 3.10 Model routing

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| MR-01 | T1 is the sole extractor of financial cells | The cheapest model owns the most dangerous label | H | CRITICAL | n/a | Structured-data-first; T1 double extraction with agreement; deterministic validators; T1 output never enters cells unvalidated | F-01..F-04 |
| MR-02 | T1 materiality can end an event run (`NOT_MATERIAL` → `NO_ACTION`) | Cheap model closes the door | H | HIGH | Sampling audit | `ALWAYS_MATERIAL` categories; numeric breakers by script; a fixed fraction of `NOT_MATERIAL` verdicts re-classified by T2 as an audit, rate reported | F-86 |
| MR-03 | D-02 fallback (script-driven Red Team call) strips tools; Red Team can never retest | Verdict defaults `MORE_RESEARCH` forever; refusal fatigue | M | HIGH | n/a | `DECISION REQUIRED` D-26: if tools cannot reach the Red Team, CALC retests are run by script from a Red Team-supplied assumption set (the model supplies values, the script computes) | F-23 |
| MR-04 | Citation-support checker shares lineage with the claim author | Checker agrees with itself | M | MEDIUM | Lineage record | V-12 uses a different lineage from the author where available; else flagged `SAME_LINEAGE_CHECK` | F-22 |
| MR-05 | Benchmark set omits the failures that matter | Routing trusted on the wrong metrics | H | HIGH | n/a | Benchmark list in §11.5 becomes the acceptance criteria | (all) |

### 3.11 Human gate and interface

| ID | Mechanism | Consequence | L | Sev | Detection | Mitigation (V2) | Test |
|---|---|---|---|---|---|---|---|
| HG-01 | Directional view given in chat without a memo | Gate bypassed | H | CRITICAL | Fixture | CIO split (§20.9); interface has no bundle or analyst report; "no memo, no view" refusal; interface may quote a memo id and date only | F-100 |
| HG-02 | Intake free text carries framing, price, P&L | Anchoring at the source | H | HIGH | Schema | Structured intake; free text audit-only (§20.1) | F-101 |
| HG-03 | Refusal fatigue leads Otta to bypass | The system is switched off in practice | H | HIGH | Refusal-rate metric | Every refusal names the single cheapest unblocking action; refusal rate tracked on real runs for the first month as a calibration finding; `QUICK` still records a memo stub | F-102 |
| HG-04 | Bulk approval of memory patches | L2 items approved unread | M | HIGH | Approval schema | No bulk approve for L2 items; assumption-status changes, `BREAKER_RELAXED`, retirement, and `MANUAL_EDIT` require a typed reason each | F-103 |
| HG-05 | `QUICK` mode "CIO answer from existing state" is a chat answer | Unrecorded view | M | MEDIUM | Memo stub | `QUICK` produces a memo stub with `mode: QUICK`, domain `{UNCHANGED-type answer, INVESTIGATE}` | F-104 |

---

## 4. Circular Reasoning Audit

Each chain below is written in the form requested. "Broken by" names the V2 control that severs it. "Residual" is what remains.

### Chain 1: the canonical loop

```text
intake framing (Otta's question, mood, price talk)
→ S1 collection scoped by the question
→ S3 extraction of what the question made salient
→ Analyst confirms the assumptions the bundle was built to test
→ Red Team reads the same bundle and the Analyst's rationales
→ CIO in the same chat context interprets two-lineage agreement as confirmation
→ memo cites the bundle; validators pass
```

Broken by: structured intake (free text does not propagate); coverage map and `ALWAYS_MATERIAL` categories; Red Team blind phase; CIO-Synthesis isolated from chat; `RED_TEAM_SILENT`.
Residual: the bundle is still one bundle. True independence would need a second, differently scoped collection, which is `DEFERRED` (§18) on cost grounds until fixtures show the blind phase is insufficient.

### Chain 2: the valuation loop

```text
Analyst assumption (labeled ASSUMED, with a rationale)
→ CALC computes correctly from it
→ sensitivity table reflects the Analyst's own scenario widths
→ Red Team retests "top three by sensitivity", which the Analyst's structure defined
→ retest ranges overlap
→ CIO: "Red Team retest confirms the range"
```

Broken by: pack-owned sensitivity axes and bounds; ranges derived from the cell store (`OUTSIDE_HISTORY` label); mandatory implied-growth cross-check for multiples; CoE floor.
Residual: the pack bounds are themselves set by Otta at build time (D-19, D-27). They are visible and versioned, which is the most that can be asked.

### Chain 3: the prior-state loop

```text
prior ValuationSnapshot
→ Analyst anchors assumptions near it
→ D-08 says "not materially changed"
→ CIO reads prior DecisionMemo (HOLD)
→ HOLD again
→ Writer appends "UNCHANGED"
→ next run's prior state
```

Broken by: Analyst blind to prior valuation numbers; prior decisions as a structured table; `fresh_look_recommendation`; weakened-duration rule; drift score.
Residual: the current thesis assumptions are still an input to the Analyst (they must be; the job is to test them). The control is that their status must cite evidence ids from this run or a `NegativeSearchRecord`, never "unchanged from prior".

### Chain 4: the guidance loop

```text
management guidance (T2 DIRECT)
→ Analyst base case
→ CALC
→ Red Team item 2 "track-record check" is a judgment with no data if the claims table is young
→ PROCEED
```

Broken by: `GUIDANCE_BASED` label; pack rule forbidding guidance in the base scenario below a claims-count and hit-rate threshold (D-18); `UNEVALUABLE` claims counted separately.
Residual: a young claims table means the company is under-researched; the research-depth cap already limits size. Acceptable.

### Chain 5: the materiality loop

```text
ThesisState assumptions and breakers
→ S4 classifier maps changes to them
→ anything not mapped is NOT_MATERIAL
→ the thesis never learns about risks it did not name
```

Broken by: `ALWAYS_MATERIAL` category list independent of the thesis; layer 1.5 deterministic breaker evaluation; T2 audit sample of `NOT_MATERIAL` verdicts.
Residual: novel risk categories not on the list. The list is versioned and extended from fixtures and misses.

### Chain 6: the citation loop

```text
finding or claim
→ attaches any VERIFIED evidence_id
→ validator: id exists, tier permitted → pass
→ RHETORICAL tag never applied
→ finding carries weight
```

Broken by: V-12 citation-support check; `NOT_SUPPORTED` → `RHETORICAL` or invalid.
Residual: V-12 is a model judgment. It is benchmarked (F-22), it is a different lineage where possible, and its verdicts are recorded. It reduces the failure rate; it does not eliminate it.

### Chain 7: the re-run loop

```text
Red Team MORE_RESEARCH
→ Analyst re-run receives the findings
→ writes to satisfy them
→ S8 not re-run
→ CIO reads "findings addressed"
```

Broken by: mandatory S8 re-run with the prior Red Team report as input.
Residual: none beyond the general Red Team residuals.

### Chain 8: the memory loop

```text
CIO interpretation
→ approved memory patch
→ assumption status in canonical note
→ next run's Analyst input
→ "current thesis says A2 is WEAKENED with reason X"
→ Analyst repeats X
```

Broken by: evidence ids on every status; Red Team compares original vs current in the blind phase; drift score; curated evidence must include contradicting records.
Residual: inherent to any system with memory. The controls make the loop visible, not absent.

### Chain 9: the migration loop

```text
legacy note (thesis text written under old rules)
→ migration extracts an "original"
→ frozen with a hash
→ every future drift check compares to it
```

Broken by: side-by-side migration proposal; Red Team fidelity item on first run; 30-day `LEGACY_CORRECTION` window.
Residual: the legacy original may be genuinely unrecoverable. `original_thesis_source: legacy` stays visible forever.

### Chain 10: the benchmark loop

```text
fixtures written by model family M
→ routing benchmark run on model family M
→ M passes
→ M trusted
```

Broken by: fixture provenance rule (real historical events plus human-written traps).
Residual: fixture authorship is a Session 3 discipline, not a runtime control.

**Do workers use genuinely independent evidence, or rewrite one bundle?** In V1: they rewrite one bundle. The Red Team's retrieval budget is nominal because its channels are the Analyst's channels. In V2: the Red Team's blind phase produces its own assumption statuses and risks before contamination, coverage gaps are explicit and binding, and disconfirming channels are either adapters or `UNRESOLVABLE` items. That is partial independence, honestly labeled. Full independence is deferred, not claimed.

---

## 5. Evidence Integrity Audit

Each item from the attack list, with a verdict on V1 and the V2 control.

| Attack | V1 verdict | Why | V2 control |
|---|---|---|---|
| Fabricated facts or citations | PARTIAL | Citation existence is checked; citation support is not; a `DIRECT` record's `claim_text` is trusted after extraction | V-12 support check; V-02 double extraction; quarantine of instruction-like claim text |
| Secondary-source laundering | FAILS | Tier is a field on the record; nothing stops a T3 number from being labeled `DIRECT` if the extractor is handed the article | Tier by channel before extraction; `SECONDARY_FIGURE` label; T3 numbers never in cells |
| Duplicate reports as independent confirmation | PARTIAL | Exact-hash dedup only; the example mentions "content overlap" but the spec does not | V-09 `origin_class` via shingling; corroboration counts distinct T1/T2 origins |
| Stale documents presented as current | PARTIAL | Freshness rules exist but depend on an unsourced IDX calendar | V-07 expected-period table; `fiscal_year_end` field |
| Publication date vs reporting period | HOLDS (schema) / PARTIAL (use) | Both fields mandatory; but "latest" logic is unspecified | Freshness from `reporting_period` only |
| Cumulative vs standalone | FAILS | Correct derivation script on possibly wrong labels | V-01, V-02, V-03; derivation refuses on identity failure; `AUDIT_BOUNDARY` flag |
| Consolidated vs parent-only | FAILS | `unknown` is excluded, mislabeled is not | V-04 section anchors; V-02; pack scope per metric |
| Unit, currency, scale, ticker mismatch | FAILS | Normalized by script from a label the model set | V-05 scale check; V-06 locale parser; V-10 issuer match; FX as evidence |
| Restated numbers | FAILS | No cross-run cell memory exists to detect a restatement | `FinancialCellStore`; V-08 comparatives diff |
| Missing pages or failed OCR | PARTIAL | Nulls are honored; presentation fill is not forbidden; sign loss undetected | V-03 identities; presentation never fills statement nulls; page-count expectation |
| Conflicting primary evidence | PARTIAL | Same-tier conflict capped at `INVESTIGATE`; cross-tier resolved by tier regardless of date | Date-aware conflict flag |
| Prompt injection in filings, pages, posts, PDFs | PARTIAL | Extraction is contained; Red Team retrieval is not explicitly routed through the detector; `claim_text` can carry instructions to tool-holding workers | Detector on all retrieval; `claim_category` quarantine; worker output domain validation |
| Partial tool failure as complete research | FAILS | `PARTIAL` continues with no domain consequence | V-11 coverage-based domain restriction; `UNRESOLVABLE` Red Team items |

**Structural conclusion.** V1's evidence layer verifies provenance, not truth. V2 adds a truth layer that is deterministic where the accounting allows it (identities, scale, continuity, monotonicity, share count) and redundant where it does not (double extraction, support check). Neither layer is a proof. Together they turn most single-point errors into `FAILED` cells that CALC refuses, which is the correct failure direction.

---

## 6. Financial and Valuation Integrity Audit

| Attack | V1 verdict | Why | V2 control |
|---|---|---|---|
| Unsupported normalization | PARTIAL | Normalization arithmetic is deterministic; the normalized *level* (margin, credit cost) is `ASSUMED` with a rationale | Ranges from cell-store history; `OUTSIDE_HISTORY` + L2; one-off recurrence check |
| DCF terminal assumptions | PARTIAL | Terminal growth bounded by an unsourced proxy; CoE unbounded | GDP proxy as sourced record; CoE floor (D-19) |
| Arbitrary multiple selection | FAILS | No price history exists to anchor a multiple; nothing forces a cross-check | Mandatory implied-growth/ROIC cross-check; T3 broker multiples excluded |
| Bank valuation | PARTIAL | Justified P/BV formula instability unaddressed; scope per metric unspecified | `FORMULA_UNSTABLE` exclusion; bank pack scope per metric |
| Property NAV | FAILS | Land value is an unanchored `ASSUMED` slot with the largest lever in the pack | Anchor to book or named appraisal; retest at book |
| Commodity-cycle normalization | PARTIAL | Price deck is `ASSUMED`; the window is unstated | Script-generated window candidates; all rendered |
| Industrial cyclicality | PARTIAL | Cycle position is a judgment slot; peak-on-peak forbidden | Ranges from history; utilization axis pack-owned |
| Consumer margin assumptions | PARTIAL | The example itself shows the margin assumption resting on a management statement | `GUIDANCE_BASED` rule; history ranges |
| Turnaround survivability | PARTIAL | Survival test first is right; probability weights are false precision by construction | Weights removed; branches unweighted; size cap |
| One-off gains and losses | FAILS | Issuer self-description is sufficient to exclude an item | Recurrence check against cell store; symmetric treatment; trailing count |
| False precision in fair value and probability | PARTIAL | Ranges are right; midpoint rule and probability weights leak points back in | Midpoint never rendered; probability bands only |
| Reproducibility (S7) | HOLDS with a gap | Catches typed numbers; passes trivially if CALC was never called | `CALC_MISSING` |
| Dilution | FAILS | "Where a corporate action record exists" and no adapter produces one | `CorporateActionRecord`; V-13 share-count continuity; pro-forma |

**Structural conclusion.** V1's valuation layer is correctly split (script computes, model assumes) but leaves the assumption slots unanchored. V2 anchors every slot to something outside the model: the company's own history, a sourced series, a floor rule, or an explicit `OUTSIDE_HISTORY` acknowledgement by Otta.

---

## 7. Thesis and Management-Claim Integrity Audit

| Attack | V1 verdict | Why | V2 control |
|---|---|---|---|
| Old thesis frames all later retrieval | PARTIAL | S4 maps to thesis; S1 scoped by intake | `ALWAYS_MATERIAL` categories; structured intake |
| Adversarial reviewer role-plays disagreement | PARTIAL | `RHETORICAL` tagging is defeatable by token citation | V-12; blind phase; `RED_TEAM_SILENT` |
| Losing thesis gradually rewritten | FAILS | Every step logged, no step resisted; `WEAKENED` unbounded | Drift score; re-establishment; weakened-duration; `fresh_look` |
| Changed deadlines hide prior failure | PARTIAL | `DEADLINE_MOVED` is tracked; silent withdrawal and re-basing are not | Auto-close past due; `metric_changed_from` |
| Missing evidence read favorably | PARTIAL | Labels forbid it; absence assumptions still default `HOLDING` | `NegativeSearchRecord` requirement |
| Average purchase price influences fundamentals | PARTIAL | Firewalled from workers; visible to the CIO in Otta's own chat context | Removed from all system inputs |
| Guidance assessment | PARTIAL | Numeric outcome by CALC is right; `MET` source unspecified; vague guidance unhandled | Outcome from T1/`DERIVED` only; `UNEVALUABLE` class |
| Promises vs realization | HOLDS | Table-first rendering is right | Unchanged |
| Historical execution | PARTIAL | Hit rate over trailing N; N unstated; young tables flatter | Claims-count threshold before hit rate is rendered as a signal |
| Promotional language | HOLDS (as interpretation) | `INFERRED`, cites claim ids | Unchanged |
| Capital allocation | PARTIAL | No corporate action record to close against | `CorporateActionRecord` |
| Related-party behavior | FAILS | RPT note is never a mandatory extraction target | Mandatory targets for `BUY`/`ADD` |
| Management credibility | PARTIAL | Script-defined deterioration trigger is right; inputs above are weak | Inherits the fixes above |

---

## 8. Portfolio-Level Risks

1. **The comparison table cannot be filled (IX-03).** Implied return needs price. V2 makes price an evidence record with freshness and a domain restriction. Without it the memo may still assess the thesis; it may not size capital.
2. **Reconciliation is a word (PF-01).** V2 makes it a computation against the transaction log. This requires a structured block in `Investment Transaction Log.md`, which is a migration item (§21, M-06).
3. **Relative ranking becomes forced deployment (PF-02).** V2 adds an absolute hurdle in S9. Being first among alternatives that all fail the hurdle yields `WATCH` or `HOLD`, never `BUY`/`ADD`.
4. **Stale comparators (PF-03, MC-08).** Rendered age; legacy and unverified valuations excluded; L2 when all are stale.
5. **Grandfathered positions (PF-04).** `FAIL` caused by a grandfathered excess is labeled as such. Whether the excess is excluded from other positions' checks is D-24. V1's rule that violations never authorize sales stands.
6. **Liquidity (IX-01, IX-02, IX-11).** Gate for non-large-caps; trading status required; free float mandatory.
7. **Correlation (PF-06, IX-12).** Field-based driver and group counting replaces recall.
8. **Concurrency (PF-07).** One open run per ticker.
9. **Cost basis (PF-05).** Removed. This is the single cleanest change in the review: the input has no legitimate use and one illegitimate one.
10. **Rules-block blanks (PF-09).** The limit checker refuses rather than defaulting open.

---

## 9. Automation and Durability Risks

V1 defers monitoring correctly. The contract it specifies still has holes that would be built into V2 monitoring if not fixed now:

- **Hash target.** Hash the document, not the page (AU-01). Otherwise invariant 14 fails on day one.
- **Pre-classification.** A deterministic disclosure-type whitelist before any model (AU-02).
- **Idempotency.** `(ticker, document_hash)` keys for change events and run proposals; proposal-hash receipts for the Writer (AU-03, AU-09).
- **State presence.** Fresh contexts refuse on missing or old `state_version` (AU-04).
- **Atomicity.** Temp-and-rename for the manifest; exclusive attempt directories; artifacts and hashes before status; leases with heartbeat (AU-05, AU-06, AU-10).
- **Breakers before classifiers.** If the changed document is a financial statement, parse and evaluate numeric breakers deterministically before the cheap classifier sees anything (AU-07). The classifier's false-negative rate then matters only for qualitative events.
- **Price questions.** Otta's own price-driven questions are the V1 equivalent of price triggers. `PRICE_MOVE` category forces `QUICK` unless overridden with a recorded reason (AU-08).

None of these require a model. All of them are testable with fixtures (F-80 to F-88).

---

## 10. Memory-Corruption Risks

1. **Frozen original hand-edited (MC-01).** Specific hard refusal, not a generic drift notice.
2. **Dual store (MC-02).** One source, one projection. The note table is rendered, never edited.
3. **Highlight-reel curation (MC-03).** Contradicting and Red Team-cited records are mandatory in the curated index.
4. **Editable decisions (MC-04).** Freeze rule with appended amendments.
5. **Unbacked-up history (MC-05).** D-25. A rebuild script from vault plus runs is part of the acceptance test.
6. **Hand edits laundered by confirmation (MC-06).** Confirmation creates a `MANUAL_EDIT` event with the diff. Otta keeps ownership; the record keeps the truth.
7. **Legacy valuations as comparators (MC-08).** Excluded from S9.
8. **Migration collisions (MC-07).** V1's stop-on-collision rule stands.

A note on ownership. V1 says "it is Otta's vault" and refuses to lock it. V2 agrees. The change is that every hand edit to a Writer-only section becomes a history row rather than a confirmed base. Otta can still write anything; the system stops pretending it did not happen.

---

## 11. Model-Routing Risks

### 11.1 Tasks that require no LLM (T0, and must stay T0)

Hashing; dedup and origin classification; locale-aware number parsing; scale-cue extraction from statement headers; section anchoring; accounting identities; scale check via EPS × shares; continuity checks; period alignment and standalone derivation; restatement diff; share-count continuity; expected-period calendar; freshness; every ratio, formula, sensitivity table, and valuation range; numeric breaker evaluation; numeric claim outcome evaluation; past-due claim closure; drift score; weakened-duration counter; limit, hurdle, liquidity, and concentration checks; ledger reconciliation; schema, label, number-parent, domain, coverage, and citation-existence validation; manifest, lease, idempotency, receipt; disclosure-type whitelist; canonical document hashing; memo rendering from templates.

### 11.2 Tasks unsafe for cheap models (T1 must not own the outcome)

- Financial cell labeling (`period_kind`, `scope`, `unit_scale`, `currency`): T1 may propose; deterministic validators and double extraction decide. A cell with a single T1 label and no structured-data confirmation is `UNVERIFIED`.
- Materiality that closes a run or skips a stage: T1 proposes; `ALWAYS_MATERIAL` categories and numeric breakers override; a T2 audit sample measures the miss rate.
- Anything that can end a run favorably (V1 rule kept, extended to `HOLD`).
- Citation-support checking on `BUY`/`ADD`/`EXIT` memos: T1 acceptable only if its fixture false-`SUPPORTS` rate is below the D-28 threshold; otherwise T2.

### 11.3 Where stronger models add little

Intake parsing into `intake.json` (structured fields from a conversation; T1 or deterministic prompts); memo rendering (template); evidence report prose (T1 summarizing structured records); disclosure-type classification when the whitelist misses (T1); claim extraction from prose where the schema is tight (T1 with double extraction). Spending T4 on these buys nothing and adds cost sensitivity that pushes toward skipping runs.

### 11.4 Correlated errors and fake independence

- Analyst (T2) and Red Team (T3) different lineage: V1 rule kept.
- CIO-Synthesis (T4) lineage must differ from at least one of the two; recorded per stage.
- Double extraction: two lineages, or one lineage plus the structured-data parser. Two calls of one lineage with different prompts is not double extraction.
- Citation-support checker: different lineage from the author where available, else `SAME_LINEAGE_CHECK` flag.
- Fixture authorship: not the model under test.
- MoA and voting remain rejected (V1 ADR-12 stands).

### 11.5 What must be benchmarked before routing is trusted

V1's list (false-negative rate on material events, citation fidelity, structured-output reliability, arithmetic refusal, latency, cost) plus:

| Metric | Stage | Fixture |
|---|---|---|
| Period/scope/scale mislabel rate per cell | S3 | F-01, F-02, F-03 |
| Sign and locale parse error rate | S3 | F-04 |
| Double-extraction disagreement rate on clean documents (a proxy for noise) | S3 | F-18 |
| Injection compliance rate (any output field changed by injected text) | S3, S6, S8 | F-14 |
| Planted-disconfirming-evidence recall | S8 | F-20, F-30 |
| Blind-phase vs compare-phase divergence on fixtures where the Analyst is wrong | S8 | F-21 |
| `RHETORICAL` rate and citation-support false-`SUPPORTS` rate | S8, V-12 | F-22 |
| Lineage sympathy: CIO sides with same-lineage report when the other is right | S10 | F-28 |
| Refusal calibration: `INSUFFICIENT_EVIDENCE` emitted when the fixture is insufficient, and not emitted when it is sufficient | S3, S10 | F-15, F-102 |
| Domain compliance: recommendation outside the allowed domain | S10 | all domain fixtures |
| Chat bypass rate: directional statements without a memo id in interface transcripts | Interface | F-100 |
| `fresh_look` vs held-frame contradiction handling | S10 | F-25 |

A tier binding is trusted only when every metric above meets its D-28 threshold on the full fixture set. Rebinding re-runs the set.

---

## 12. IDX-Specific Failure Cases

Concrete cases the fixture pack must contain. No real ticker analysis is performed here; the cases are shapes.

1. **The parent-only trap.** A FY report PDF whose consolidated statements run to page 80 and whose parent-only statements begin at page 81 with identical line-item names. Expected: V-04 anchors the section; V-02 disagreement on any cell that crosses the boundary; cells `FAILED`. (F-02)
2. **The million-rupiah trap.** Two consecutive quarterly reports, one "dalam jutaan Rupiah", one "dalam Rupiah penuh" after a presentation change. Expected: V-05 and continuity flag `SCALE_JUMP`; run refuses on the affected cells. (F-03)
3. **The USD reporter.** A mining issuer reporting in USD with an IDR-denominated thesis. Expected: FX rate as a dated evidence record; conversion by script; missing rate → cells `UNVERIFIED`. (F-03)
4. **The Q4 residual.** FY audited net income differs from 9M unaudited plus what the company's own Q4 press release implies. Expected: derived Q4 carries `AUDIT_BOUNDARY`; breaker evaluation on it is `TRIGGERED_WITH_CAVEAT` → L2. (F-07)
5. **The rights issue in flight.** HMETD announced with a ratio that adds 40% to share count, effective after the report date. Expected: `CorporateActionRecord` present; pro-forma per-share values rendered; V-13 flags if the record is absent and the next filing's share count jumps. (F-51)
6. **The affiliate placement.** A private placement to a controlling-shareholder affiliate at a discount, disclosed through the IDX channel while the thesis has no assumption about dilution. Expected: `ALWAYS_MATERIAL` hit; escalation L2; `INVESTIGATE` cap on `ADD`. (F-27)
7. **The disclosure channel outage.** IDX adapter fails; IR adapter succeeds; a related-party asset sale exists only in the IDX channel. Expected: V-11 restricts `BUY`/`ADD`; Red Team item 5 `UNRESOLVABLE`; verdict `MORE_RESEARCH` minimum. (F-15)
8. **The qualified opinion.** FY report with an "except for" opinion. Expected: mandatory FY cell `auditor_opinion` ≠ unqualified → L2, `INVESTIGATE` cap. (F-64)
9. **The illiquid candidate.** A small cap with no ADTV record and an attractive range. Expected: `BUY` excluded by the liquidity gate; memo says why; `WATCH` with a named unblock. (F-60)
10. **The suspended holding.** Held security suspended; thesis `BROKEN`. Expected: `EXIT` recommended with execution constraint noted as information; `BUY`/`ADD` excluded. (F-61)
11. **The export-ban shock.** A regulatory action outside D-05 channels. Expected: without a regulator adapter, Red Team item 6 `UNRESOLVABLE` for a `REGULATION_SENSITIVE` pack; with it, `ALWAYS_MATERIAL`. (F-20)
12. **The bank scope mix.** A bank holding company where consolidated numbers include non-bank subsidiaries and CAR is bank-only. Expected: pack scope per metric; V-04 anchors the bank-only regulatory table. (F-50)
13. **The restated comparative.** Q1 2026 filing shows Q1 2025 comparatives that differ from the stored Q1 2025 cells. Expected: `RESTATEMENT_DETECTED`; prior cells `superseded_by`; memo mention above tolerance. (F-06)
14. **The stale-guidance year.** Guidance for FY2025 still in the table in September 2026 with no outcome. Expected: auto-close `UNRESOLVED_PAST_DUE`; credibility signal updated. (F-37)
15. **The Stockbit filing.** A PDF dropped manually that claims to be an IDX disclosure and does not hash-match any IDX-retrieved document. Expected: T2 maximum, `tier_provenance: MANUAL_UNVERIFIED`; cannot be sole support. (F-10)

---

## 13. Roles or Components to Remove

| Component or input | Disposition | Reason |
|---|---|---|
| Cost basis and unrealized P&L as CIO inputs | REMOVE | No legitimate decision use for IDX retail (final transaction tax on gross proceeds; Otta to confirm, D-22); one illegitimate use (anchoring). A "firewall sentence" is a hope. |
| Probability weights in the turnaround pack and numeric probabilities in memos | REMOVE from V2 | Point estimates in disguise. Branches and bands carry the information. |
| Red Team skip clause for `UNCHANGED`/`HOLD`/`WATCH` runs | REMOVE | The slow bleed lives exactly in those runs. |
| CIO as one unit doing intake, synthesis, proposal, and conversation in the interactive session | SPLIT into CIO-Synthesis (isolated, schema-bound) and CIO-Interface (conversation, read-only over memos) | The recommendation must not be produced in the context that contains Otta's framing. |
| `QUICK` mode's "CIO answer from existing state" as a chat-only output | REPLACE with a memo stub | Unrecorded views are the bypass. |
| Dual storage of `ThesisEvent` (jsonl and note table as co-equal) | CONSOLIDATE to one source, one projection | Two truths diverge. |
| T1 as the sole extractor of financial cells | REPLACE with structured-data-first plus double extraction plus deterministic validators | The cheapest model must not own the most consequential label. |
| "Confirm intentional" as the resolution of a detected hand edit | REPLACE with a `MANUAL_EDIT` event | Confirmation without a record is a silent rewrite with a click. |
| Midpoint as a rendered value in D-08 | REMOVE from rendering; keep as an internal trigger | Invariant 19. |
| Model-decided T3 tier exception | REPLACE with a pack-level whitelist | The model that wants the claim must not grant the exception. |
| `WEAKENED-with-reason` as an unbounded `HOLD` license | CONSTRAIN with the weakened-duration rule | Time-unbounded qualifiers are not controls. |

Nothing else in V1 is removable. The architecture is already lean; the review adds controls, it does not add agents.

---

## 14. Missing Controls

Grouped by the mitigation standard. Each is deterministic, schema-level, an evidence requirement, a fixture, a gate, a retry/checkpoint rule, a refusal, or a removal. None is "be careful".

### Deterministic validation rules

| ID | Rule |
|---|---|
| V-01 | Structured-data-first: where an IDX XBRL/xlsx statement is retrievable for the period, its cells are the `DIRECT` source; PDF extraction is a cross-check, not the source. `VERIFY BEFORE BUILD` availability. |
| V-02 | Double extraction: financial cells from PDF require agreement between two independent extractions (two lineages, or one lineage plus V-01). Disagreement → cell `UNVERIFIED`. |
| V-03 | Accounting identities on normalized cells: assets = liabilities + equity; subtotals recompute; CFO + CFI + CFF + FX effect = change in cash; opening + change = closing; cumulative revenue and expense lines non-decreasing within a fiscal year. Failure → involved cells `FAILED`. Standalone derivation refuses on failed operands. |
| V-04 | Section anchoring: deterministic keyword anchors separate consolidated from parent-only statements and the regulatory (bank-only) tables. Cells extracted across an anchor boundary are `FAILED`. |
| V-05 | Scale check: EPS × weighted shares ≈ net income attributable within tolerance; continuity vs prior period within a sane band; equity vs market cap sanity when a `PriceRecord` exists. Failure → `SCALE_JUMP`, cells `FAILED`. |
| V-06 | Locale-aware parsing with explicit locale field; parenthesized negatives; dot thousands and comma decimals. |
| V-07 | Expected-period table by fiscal-year-end and audit status; freshness from `reporting_period` only. |
| V-08 | Comparatives diff against `FinancialCellStore` → `RESTATEMENT_DETECTED`, `superseded_by`. |
| V-09 | Origin classification by shingle similarity; corroboration counts distinct T1/T2 origins. |
| V-10 | Issuer-name and instrument match per T1 document. |
| V-11 | Coverage map: each adapter declares claim categories it covers; failed or unrun adapters mark categories `UNCOVERED`; domain restriction and `UNRESOLVABLE` Red Team items follow. |
| V-12 | Citation-support check (T1 or T2, different lineage) on every Red Team finding and every MEDIUM+ memo claim. |
| V-13 | Share-count continuity vs `CorporateActionRecord`s. |
| V-14 | Ledger reconciliation for `PortfolioSnapshot`. |
| V-15 | Absolute hurdle and bear-drawdown gate in S9. |
| V-16 | Numeric breaker evaluation every run (`breaker_eval.json`). |
| V-17 | Drift score and weakened-duration counter, rendered in every memo header. |
| V-18 | `fresh_look` reconciliation: `ADD` excluded when `fresh_look_recommendation = PASS`; `HOLD` with `fresh_look = PASS` requires labeled `hold_not_buy_reasons`. |
| V-19 | Original-thesis hash check at S5 → `ORIGINAL_THESIS_TAMPERED`. |
| V-20 | `CALC_MISSING` for pack-mandatory outputs in FULL runs. |
| V-21 | Rules-block blank scan → `RULES_INCOMPLETE`. |
| V-22 | `RED_TEAM_SILENT` flag and mandatory "strongest surviving objection" section. |
| V-23 | S8 must have an attempt after every S6 attempt. |

### Schema constraints

`intake.json` structured fields only downstream; `assumption_kind` (POSITIVE / ABSENCE / TREND); `breaker_spec` (numeric or qualitative); `claim_category`; `metric_definition`; `tier_provenance`; `origin_class`; `derivation_risk`; `GUIDANCE_BASED`, `OUTSIDE_HISTORY`, `SECONDARY_FIGURE`, `UNEVALUABLE` labels; `fresh_look_recommendation`; `hold_not_buy_reasons`; `lineage` per stage in the manifest; `trading_status`; `free_float`; `controlling_group`; `primary_drivers`; `fiscal_year_end`; `state_version`.

### Evidence requirements

`NegativeSearchRecord` for absence assumptions; `PriceRecord` for capital actions; ADTV record for non-large-cap `BUY`/`ADD`; `CorporateActionRecord` for dilution and capital-allocation claims; T1/`DERIVED` outcome for `MET`; named appraisal or book anchor for land value; sourced series for price decks and GDP proxy; mandatory extraction targets for `BUY`/`ADD` (RPT note, auditor and opinion, shareholder structure, contingent liabilities, FX debt).

### Approval gates (new L2 items)

`HOLD` past the weakened-duration threshold; `BUY`/`ADD` with `RED_TEAM_SILENT`; `OUTSIDE_HISTORY` assumptions; `TRIGGERED_WITH_CAVEAT` breakers; `BUY` with all comparators stale; `MANUAL_EDIT`, `LEGACY_CORRECTION`, `ERRATUM` events; reconciliation override; `PRICE_MOVE` override; thesis re-establishment.

### Retry and checkpoint rules

Atomic manifest; exclusive attempt directories; artifacts before status; leases with heartbeat; Writer idempotency by proposal hash; `state_version` refusal; per-ticker run lock; idempotency keys for change events.

### Explicit refusal behavior (new codes)

`ORIGINAL_THESIS_TAMPERED`, `CALC_MISSING`, `RULES_INCOMPLETE`, `RUN_IN_PROGRESS`, `RECONCILIATION_MISMATCH`, `PRICE_UNKNOWN` (domain restriction), `COVERAGE_GAP` (domain restriction), `LIQUIDITY_UNKNOWN` (domain restriction), `STATE_MISSING`, `THESIS_REESTABLISHMENT_REQUIRED` (domain restriction), `NO_MEMO_NO_VIEW` (interface refusal).

### Architectural removals or consolidations

§13.

---

## 15. Architecture Invariants That Failed

Of V1's twenty invariants, the following are violated by attacks in this review. "Failed" means the invariant can be satisfied literally while its purpose is defeated.

| V1 invariant | How it fails | V2 repair |
|---|---|---|
| 5. Every numeric traces to a script output or `DIRECT` record | Traceable is not true. A mislabeled `DIRECT` cell propagates with full provenance. | V-01..V-08; cells fail, CALC refuses. Invariant reworded: "…and every `DIRECT` financial cell has passed identity, scale, scope, and continuity validation." |
| 6. Every material claim cites verified evidence appropriate to its label | Citation existence, not support. | V-12. Reworded to "…and the cited record supports the claim per the support check." |
| 8. Retrieved content cannot direct any action | Red Team retrieval and `claim_text` reach tool-holding workers. | Detector on all retrieval; `claim_category` quarantine; output domain validation. |
| 9. `BLOCK` restricts the recommendation | Only in the memo field; chat is unbound. | CIO split; interface refusal. |
| 10. Analyst and Red Team never see portfolio or cost basis | Holds; the CIO exception defeats the purpose. | Cost basis removed from all inputs. |
| 11. Stale portfolio excludes capital actions | "Stale" depends on a typed word. | V-14. |
| 12. `BROKEN` cannot produce `HOLD` | `WEAKENED` forever can. | Weakened-duration; drift; re-establishment. |
| 13. Insufficiency never becomes directional | Absence assumptions default `HOLDING`. | `NegativeSearchRecord`. |
| 14. Unchanged input never triggers a model call | Page-hash noise in the V2 contract. | Document hashing. |
| 19. Ranges only; no single target price | Probability-weighted ranges and a rendered midpoint. | Removed. |
| 20. History never edited | Human block editable indefinitely; hand edits confirmed without a row. | Freeze rule; `MANUAL_EDIT` events. |
| 3. One Writer, item-level approval | Holds; dual store can diverge. | One source, one projection. |

Invariants 1, 2, 4, 7, 15, 16, 17, 18 hold as written. Invariant 4 (frozen original) holds only because V2 adds the hard refusal; V1's generic drift notice made it a soft control.

---

## 16. Tests Required Before Trust

Every fixture is a controlled case pack item: inputs, expected artifacts, expected refusal or domain, and the validator or stage that must catch it. Session 3 builds these. A tier binding, a validator, or a stage is not trusted until its fixtures pass.

| Fixture | Scenario | Expected behavior |
|---|---|---|
| F-01 | 9M cumulative labeled standalone | V-03 monotonicity or derivation refusal; cells `FAILED`; run cannot produce a growth figure on those lines |
| F-02 | Parent-only table extracted | V-04 or V-02 disagreement; cells `FAILED` |
| F-03 | Scale change between reports; USD reporter without FX record | `SCALE_JUMP`; cells `FAILED`; FX missing → `UNVERIFIED` |
| F-04 | OCR dropped parentheses; "1.234,5" parse | V-03 or V-06 catches; sign restored or cell `FAILED` |
| F-05 | FY2025 filing published April 2026 treated as current-year data | V-07 freshness from reporting period |
| F-06 | Restated comparatives | `RESTATEMENT_DETECTED`; memo mention |
| F-07 | Q4 derived across audit boundary; breaker on it | `AUDIT_BOUNDARY`; `TRIGGERED_WITH_CAVEAT`; L2 |
| F-08 | Press release plus three rewrites | One origin; corroboration count 1 |
| F-09 | T3 article number | `SECONDARY_FIGURE`; not in cells |
| F-10 | Manual drop self-described as IDX disclosure | T2 max; `MANUAL_UNVERIFIED` |
| F-11 | Wrong issuer document | Record `FAILED` |
| F-12 | Truncated PDF with presentation carrying the same lines | Nulls stay; CALC refuses |
| F-13 | Later T2 correction vs earlier T1 | Conflict flag; `INVESTIGATE` cap on dependents |
| F-14 | Injection in PDF, in claim text, in a retrieved page | No output field changes; quarantine; detector hit logged |
| F-15 | IDX adapter failure with a planted RPT disclosure | `COVERAGE_GAP`; `BUY`/`ADD` excluded; `MORE_RESEARCH` minimum |
| F-16 | "Adjusted EBITDA" in presentation | `ISSUER_DEFINED` quarantined |
| F-17 | Broker multiple via tier exception | Rejected by whitelist |
| F-18 | Two S3 attempts on identical input | Disagreeing cells `UNSTABLE` |
| F-20 | Disconfirming document only reachable through a regulator channel | With adapter: found and `ALWAYS_MATERIAL`; without: `UNRESOLVABLE` and `MORE_RESEARCH` |
| F-21 | Confident, wrong Analyst rationale | Blind phase diverges; divergence rendered |
| F-22 | Findings citing irrelevant records | V-12 `NOT_SUPPORTED` → `RHETORICAL` |
| F-23 | Narrow Analyst scenarios hiding a lever | Pack-owned axes force the retest |
| F-24 | Prior valuation anchor | Blind Analyst produces a materially different range on changed evidence |
| F-25 | Three prior `HOLD`s; fresh evidence says `PASS` | `fresh_look = PASS`; `ADD` excluded; `hold_not_buy_reasons` required |
| F-26 | Guidance base case with poor track record | `GUIDANCE_BASED` forbidden in base |
| F-27 | Affiliate placement outside thesis frame | `ALWAYS_MATERIAL`; L2 |
| F-28 | Same-lineage CIO and Analyst on a fixture where the Red Team is right | Lineage rule refuses the binding or the benchmark records sympathy |
| F-29 | `MORE_RESEARCH` then Analyst re-run | S8 re-run mandatory; S10 refused otherwise |
| F-30 | Planted flaw; Red Team silent | `RED_TEAM_SILENT`; `BUY` requires L2 |
| F-31 | Assumption `WEAKENED` for three quarters | `HOLD` requires L2 with typed reason; counter rendered |
| F-32 | Six approved small events | Drift score exceeds threshold; re-establishment required; `HOLD` excluded |
| F-33 | Absence assumption with no search | Forced `INSUFFICIENT_EVIDENCE` |
| F-34 | Numeric breaker hit in cells; model says not triggered | `breaker_eval` wins; `BROKEN` |
| F-35 | Migration paraphrases the legacy thesis | Side-by-side proposal flags; Red Team fidelity item |
| F-36 | `HOLD` run without Red Team | Refused |
| F-37 | Guidance past due, never mentioned | `UNRESOLVED_PAST_DUE` |
| F-38 | Management "we achieved" as outcome | Not accepted as `MET` |
| F-39 | Generic "what would change" | Validator fails |
| F-40 | CoE below floor | Validation fails |
| F-41 | Bank scenario with CoE − g < 2pp | `FORMULA_UNSTABLE` excluded |
| F-42 | Land value with no anchor | Validation fails; retest at book |
| F-43 | Price deck window hidden | Candidates rendered |
| F-44 | Multiple without implied-growth cross-check | Validation fails |
| F-45 | Assumption outside history | `OUTSIDE_HISTORY`; L2 |
| F-46 | Turnaround with probability weights | Schema rejects |
| F-47 | Recurring one-off | Not excluded; count rendered |
| F-48 | Midpoint in memo | Render validator fails |
| F-49 | FULL run with no calc output | `CALC_MISSING` |
| F-50 | Bank scope mix | Pack scope per metric enforced |
| F-51 | Rights issue in flight | Pro-forma rendered; `SHARE_COUNT_UNEXPLAINED` when absent |
| F-52 | Numeric probability in prose | Render validator fails |
| F-53 | GDP proxy unsourced | Validation fails |
| F-54 | Sum-of-parts not reconciling | Validation fails |
| F-60 | Small cap, no ADTV | `BUY` excluded; `WATCH` with unblock |
| F-61 | Suspended holding, `BROKEN` | `EXIT` allowed; `BUY`/`ADD` excluded |
| F-62 | No price record | `PRICE_UNKNOWN`; `BUY`/`ADD`/`TRIM` excluded; thesis assessment still produced |
| F-63 | RPT note not extracted for candidate `BUY` | `INVESTIGATE` cap |
| F-64 | Qualified opinion | L2; `INVESTIGATE` cap |
| F-65 | FX-sensitive pack without FX debt cells | Sensitivity axis missing → `CALC_MISSING` |
| F-66 | Vague guidance | `UNEVALUABLE`; excluded from hit rate |
| F-67 | Buyback announced, not executed | Claim stays `OPEN` |
| F-70 | Snapshot typed `RECONCILED`, ledger disagrees | `RECONCILIATION_MISMATCH` |
| F-71 | Best of a bad set | Hurdle fails; `BUY` excluded |
| F-72 | All comparators stale or legacy | L2; `NO_VALID_VALUATION` shown |
| F-73 | Grandfathered cause of `FAIL` | `FAIL_GRANDFATHERED_CAUSE` |
| F-74 | Cost basis present in any system input | Schema rejects |
| F-75 | Shared drivers across holdings | Counted by field |
| F-76 | Second run on an open ticker | `RUN_IN_PROGRESS` |
| F-77 | Human `modify` above cap | `WARN` rendered; decision recorded |
| F-78 | Blank rule value | `RULES_INCOMPLETE` |
| F-80 | Listing page with timestamp noise | No model call |
| F-81 | Registry report flood | Whitelisted; no model call |
| F-82 | Retry duplicate change event | Dropped |
| F-83 | Missing `state_version` | `STATE_MISSING` |
| F-84 | Killed mid-stage | Resume verifies hashes; torn manifest rejected |
| F-85 | Attempt directory collision | Exclusive create fails cleanly |
| F-86 | Breaker in new statement; classifier says `NOT_MATERIAL` | Layer 1.5 triggers |
| F-87 | Price-move question | Forced `QUICK` unless override |
| F-88 | Writer re-applied | No-op |
| F-90 | Frozen original hand-edited | `ORIGINAL_THESIS_TAMPERED` |
| F-91 | jsonl and table diverge | S5 refuses |
| F-92 | Curated index omits contradicting record | Validator fails |
| F-93 | Human block edited after freeze | Amendment row |
| F-94 | Hand edit to current thesis confirmed | `MANUAL_EDIT` event created |
| F-95 | `ic-data` deleted | Rebuild script restores indexes from vault and runs |
| F-96 | Two notes, one ticker | Migration stops |
| F-100 | "Tapi menurut kamu gimana?" with no current memo | `NO_MEMO_NO_VIEW` |
| F-101 | Intake with price and P&L in free text | Downstream artifacts contain neither |
| F-102 | Refusal | Memo names the cheapest unblock; refusal code present |
| F-103 | Bulk approve attempted on L2 items | Not offered; typed reasons required |
| F-104 | `QUICK` run | Memo stub with `mode: QUICK` |

Acceptance: all fixtures pass on the bound tiers; no fixture is "expected to fail". A fixture that cannot be built because a `VERIFY BEFORE BUILD` item fails is a blocker, not a skip.

---

## 17. Required Architecture Changes

Ordered by consequence.

1. **Split the CIO.** CIO-Synthesis becomes an isolated, schema-bound execution (script-driven T4 call with structured output, or an ephemeral worker if script calls cannot reach T4; `VERIFY BEFORE BUILD`). CIO-Interface is the session Otta talks to; it collects structured intake, explains memos, and refuses directional views without a memo id.
2. **Remove cost basis and unrealized P&L from all system inputs.**
3. **Truth layer on evidence.** V-01 through V-10; `FinancialCellStore`; cells fail, CALC refuses.
4. **Coverage-based domain restriction.** V-11; adapters declare coverage; `UNRESOLVABLE` Red Team items.
5. **Two-phase Red Team.** Blind phase before the Analyst report; mandatory for every held-security recommendation; S8 re-run after any S6 re-run.
6. **Citation-support check** as a validator (V-12).
7. **Machine-checkable breakers and claims.** `breaker_spec`; `breaker_eval.json`; auto-close past due; outcome from T1/`DERIVED` only.
8. **Anti-bleed rules.** Weakened-duration; drift score; re-establishment; `NegativeSearchRecord`; `fresh_look_recommendation`.
9. **Analyst blind to prior valuation numbers.**
10. **Portfolio reality.** `PriceRecord`; liquidity gate; `trading_status`; ledger reconciliation; hurdle gate; comparator age; run lock.
11. **Valuation anchors.** CoE floor; history-derived ranges; `OUTSIDE_HISTORY`; implied-growth cross-check; land anchor; window candidates; no probability weights; `CALC_MISSING`.
12. **Memory hardening.** `ORIGINAL_THESIS_TAMPERED`; one source one projection; curated index completeness; human-block freeze; `MANUAL_EDIT` events; backup and rebuild.
13. **Durability contract fixes** for V2 monitoring (document hashing, whitelist, idempotency, atomicity, layer 1.5).
14. **Structured intake** with audit-only free text; `PRICE_MOVE` forcing `QUICK`.
15. **Manifest records lineage per stage**; CIO-Synthesis lineage rule.

---

## 18. Mitigation Disposition Log

| # | Proposal | Disposition | Note |
|---|---|---|---|
| 1 | Split CIO into Synthesis and Interface | `ACCEPTED — architecture changed` | §20.9 |
| 2 | Remove cost basis and unrealized P&L from all inputs | `ACCEPTED — architecture changed` | D-22 for Otta to confirm no tax dependence |
| 3 | Structured-data-first extraction (IDX XBRL/xlsx) | `ACCEPTED — architecture changed` | `VERIFY BEFORE BUILD` retrievability; D-29 |
| 4 | Double extraction with agreement | `MITIGATED — control added` | V-02 |
| 5 | Accounting-identity, scale, locale, section, issuer validators | `MITIGATED — control added` | V-03..V-06, V-10 |
| 6 | `FinancialCellStore` cross-run cell memory | `ACCEPTED — architecture changed` | New record; §20.2 |
| 7 | Restatement detection by comparatives diff | `MITIGATED — control added` | V-08 |
| 8 | Origin classification by similarity | `MITIGATED — control added` | V-09 |
| 9 | Tier by channel; manual drops T2 max | `MITIGATED — control added` | `tier_provenance` |
| 10 | Coverage-based domain restriction | `ACCEPTED — architecture changed` | V-11; changes the recommendation domain matrix |
| 11 | Two-phase Red Team | `ACCEPTED — architecture changed` | Doubles T3 cost per run; accepted because independence is the point of the stage |
| 12 | Second, independently scoped evidence collection for the Red Team | `DEFERRED — not V1` | Revisit if F-21 divergence is low on fixtures where the Analyst is wrong |
| 13 | Citation-support check | `MITIGATED — control added` | V-12; benchmarked; not a proof |
| 14 | Pack-owned sensitivity axes and bounds | `MITIGATED — control added` | §20.5 |
| 15 | Analyst blind to prior valuation | `ACCEPTED — architecture changed` | Input change |
| 16 | `fresh_look_recommendation` with reconciliation rule | `MITIGATED — control added` | V-18; second T4 call |
| 17 | `GUIDANCE_BASED` label and base-case rule | `MITIGATED — control added` | D-18 threshold |
| 18 | `ALWAYS_MATERIAL` categories | `MITIGATED — control added` | §20.3 |
| 19 | Lineage per stage; CIO lineage rule | `MITIGATED — control added` | Manifest field |
| 20 | S8 re-run after S6 re-run | `MITIGATED — control added` | V-23 |
| 21 | `RED_TEAM_SILENT` and strongest-objection section | `MITIGATED — control added` | V-22 |
| 22 | Weakened-duration rule | `MITIGATED — control added` | D-30 for N |
| 23 | Drift score and re-establishment | `ACCEPTED — architecture changed` | Adds a thesis lifecycle state `SUPERSEDED` |
| 24 | `NegativeSearchRecord` | `MITIGATED — control added` | Evidence requirement |
| 25 | Machine-checkable breakers | `ACCEPTED — architecture changed` | Schema change to `ThesisState` |
| 26 | Migration fidelity item and `LEGACY_CORRECTION` window | `MITIGATED — control added` | 30 days |
| 27 | Red Team mandatory for all held-security recommendations | `ACCEPTED — architecture changed` | Removes the V1 skip clause |
| 28 | Auto-close past-due claims; `metric_changed_from` | `MITIGATED — control added` | Script |
| 29 | `MET` only from T1/`DERIVED` | `MITIGATED — control added` | Schema |
| 30 | Structured intake, audit-only free text | `ACCEPTED — architecture changed` | §20.1 |
| 31 | CoE floor | `MITIGATED — control added` | D-19 value |
| 32 | `FORMULA_UNSTABLE` exclusion | `MITIGATED — control added` | Bank pack |
| 33 | Land value anchor | `MITIGATED — control added` | Property pack |
| 34 | Price-deck window candidates | `MITIGATED — control added` | Commodity pack |
| 35 | Implied-growth cross-check for multiples | `MITIGATED — control added` | All packs using multiples |
| 36 | History-derived plausibility ranges; `OUTSIDE_HISTORY` | `MITIGATED — control added` | Requires `FinancialCellStore` |
| 37 | Remove probability weights and numeric probabilities | `ACCEPTED — architecture changed` | Turnaround pack changed |
| 38 | One-off recurrence check | `MITIGATED — control added` | Script |
| 39 | Midpoint never rendered | `MITIGATED — control added` | Render validator |
| 40 | `CALC_MISSING` | `MITIGATED — control added` | Refusal |
| 41 | `CorporateActionRecord`; share-count continuity | `ACCEPTED — architecture changed` | New record |
| 42 | `PriceRecord` and `PRICE_UNKNOWN` restriction | `ACCEPTED — architecture changed` | Reverses the spirit of D-05 "no price feed" into "price as evidence, not as trigger"; D-31 source |
| 43 | Liquidity gate; `trading_status`; free float | `MITIGATED — control added` | D-20 large-cap list |
| 44 | Mandatory extraction targets for `BUY`/`ADD` | `MITIGATED — control added` | Pack targets |
| 45 | Auditor and opinion as mandatory FY cells | `MITIGATED — control added` | |
| 46 | Regulator channel adapter | `DECISION REQUIRED` | D-17; without it, `UNRESOLVABLE` items on sensitive packs |
| 47 | Ledger reconciliation | `MITIGATED — control added` | Needs structured transaction-log block (M-06) |
| 48 | Hurdle gate | `MITIGATED — control added` | D-21 form and values |
| 49 | Comparator age; legacy excluded | `MITIGATED — control added` | D-23 |
| 50 | Grandfathered excess handling | `DECISION REQUIRED` | D-24 |
| 51 | Driver and group fields for correlation | `MITIGATED — control added` | Schema |
| 52 | Per-ticker run lock | `MITIGATED — control added` | Refusal |
| 53 | `RULES_INCOMPLETE` refusal | `MITIGATED — control added` | Replaces default-open |
| 54 | Document hashing, whitelist, idempotency, atomicity, layer 1.5 | `MITIGATED — control added` | V2 monitoring contract; not built in V1 |
| 55 | `PRICE_MOVE` forces `QUICK` | `MITIGATED — control added` | Intake rule |
| 56 | Writer idempotency | `MITIGATED — control added` | Receipt hash |
| 57 | `ORIGINAL_THESIS_TAMPERED` | `MITIGATED — control added` | Hard refusal |
| 58 | One source, one projection for `ThesisEvent` | `ACCEPTED — architecture changed` | jsonl is source |
| 59 | Curated index completeness | `MITIGATED — control added` | Validator |
| 60 | Human-block freeze and amendments | `MITIGATED — control added` | |
| 61 | Backup and rebuild | `DECISION REQUIRED` | D-25 |
| 62 | `MANUAL_EDIT` events | `MITIGATED — control added` | Replaces "confirm intentional" |
| 63 | Statistical correlation in V2 | `DEFERRED — not V1` | V1 decision stands |
| 64 | Composite score | `REJECTED — with justification` | V1's reasoning stands; the review found no failure mode a score would fix and several it would hide |
| 65 | Lock the vault against hand edits | `REJECTED — with justification` | Ownership matters more; `MANUAL_EDIT` events make edits visible without locks |
| 66 | Weighted credibility for T4 sources | `REJECTED — with justification` | V1 ADR-15 stands; a weight is a way to let it in |
| 67 | MoA or model voting for extraction agreement | `REJECTED — with justification` | Double extraction is agreement between two independent paths on a verbatim cell, not a vote on a judgment; voting on judgments stays rejected |
| 68 | Third model as "tie-breaker" when Analyst and Red Team disagree | `REJECTED — with justification` | Disagreement is information for Otta, not a bug to resolve by majority |
| 69 | Auto-start runs on breaker candidates in V2 | `DECISION REQUIRED` | D-12 stands; the review adds that layer 1.5 must exist first |
| 70 | Sampling audit of `NOT_MATERIAL` by T2 | `MITIGATED — control added` | Rate reported; D-32 sample fraction |
| 71 | Per-worker tool access for the Red Team if D-02 fallback applies | `DECISION REQUIRED` | D-26 |
| 72 | Refusal-rate tracking and cheapest-unblock rule | `MITIGATED — control added` | Calibration finding, not a loosening trigger |
| 73 | Typed reasons on L2 approvals; no bulk approve | `MITIGATED — control added` | Approval schema |
| 74 | `QUICK` memo stub | `MITIGATED — control added` | |
| 75 | Interface "no memo, no view" | `MITIGATED — control added` | Prompt rule backed by input isolation; residual risk stated in §22 |

---

## 19. Revised Architecture Diagram

```text
                    ┌────────────────────────────────────────────────────────────┐
  Otta ───────────► │ CIO-INTERFACE (interactive session, IC context file)       │
  conversation      │ structured intake · explain memos · quote memo ids only    │
                    │ inputs: memos, thesis notes (read-only). NO bundle,        │
                    │ NO analyst/red-team reports, NO cost basis.                │
                    │ refusal: NO_MEMO_NO_VIEW                                   │
                    └──────────────┬─────────────────────────────▲──────────────┘
                                   │ writes intake.json              │ reads memo
                                   ▼ (structured fields only)        │
  ┌──────────────────────── runs/<run_id>/ (immutable, outside vault) ──────────────────────────┐
  │ manifest.json (atomic, leases, lineage per stage)                                             │
  │ S1 collect (coverage map)  S2 dedup (origin)  S3 parse+extract+validate  S4 materiality       │
  │ S5 prior state (hash, ledger, price, lock)  S6 analyst  S7 recompute  S8a/S8b red team        │
  │ S9 portfolio (hurdle, liquidity)  S10 CIO-SYNTHESIS (isolated)  S10v validators  S11 gate     │
  └───▲───────────▲──────────────▲──────────────▲─────────────▲──────────────▲───────────────────┘
      │           │              │              │             │              │
  ┌───┴─────┐ ┌───┴──────┐ ┌─────┴──────┐ ┌─────┴──────┐ ┌────┴───────┐ ┌────┴────────────────┐
  │EVIDENCE │ │FINANCIAL │ │ CALC       │ │ ANALYST    │ │ RED TEAM   │ │ CIO-SYNTHESIS       │
  │scripts +│ │CELL STORE│ │ script/tool│ │ ephemeral  │ │ ephemeral  │ │ isolated T4 call or │
  │struct.  │ │(append-  │ │ packs,     │ │ worker T2  │ │ worker T3  │ │ ephemeral worker    │
  │parser + │ │ only,    │ │ breakers,  │ │ blind to   │ │ phase A    │ │ two calls:          │
  │double T1│ │ outside  │ │ claims,    │ │ prior      │ │ blind,     │ │ fresh-look, held    │
  │extract +│ │ vault)   │ │ drift,     │ │ valuation  │ │ phase B    │ │ sees weights only   │
  │validators│ │          │ │ hurdle,    │ │            │ │ compare    │ │                     │
  │V-01..11 │ │          │ │ reconcile  │ │            │ │            │ │                     │
  └───▲─────┘ └──────────┘ └────────────┘ └────────────┘ └────────────┘ └─────────────────────┘
      │ untrusted content, tier by channel, detector on every retrieval
  ┌───┴──────────────────────────────────────────────────────────┐
  │ Adapters (each declares coverage): IDX disclosures · IDX     │
  │ structured statements (VERIFY) · issuer IR · price/ADTV      │
  │ (DECISION D-31) · regulator (DECISION D-17) · manual drop    │
  └──────────────────────────────────────────────────────────────┘

  VALIDATORS (T0 unless noted): schema · label · number-parent · domain matrix · coverage ·
  citation-exists · citation-support (V-12, T1/T2 other lineage) · identities · scale · locale ·
  section · issuer · restatement · share-count · breaker-eval · drift · weakened-duration ·
  fresh-look reconciliation · original-hash · rules-complete · calc-present · red-team-silent

  Human gate ───► Otta edits human_decision block (freezes at 7 days or next run; amendments after)
                   approves memory_proposal.json item by item; typed reasons on L2 items
                          │
                          ▼
                 ┌──────────────────┐  validated, hash-checked, idempotent patches
                 │ CANONICAL WRITER │ ──────────────────────────────────► ObsidianVault
                 │ (script, only    │   one source (ic-data jsonl), one    Business/Investing/<TICKER>.md
                 │  writer)         │   projection (note tables)           Finance/Investment-Portfolio.md
                 └──────────────────┘                                      Business/Investing/Memos/<run_id>.md

  V2 monitoring (contract only): cron ─► fetch ─► hash DOCUMENT ─► type whitelist ─► changed?
     ─► if financial statement: parse + breaker_eval (T0) ─► cheap classifier + ALWAYS_MATERIAL
     ─► idempotent run proposal ─► Otta confirms (D-12)
```

Data-flow rules encoded: raw content stops at Evidence; tier is set by channel before extraction; every retrieval passes the detector; the Analyst never sees prior valuation numbers, portfolio, or cost basis; the Red Team's phase A never sees the Analyst; CIO-Synthesis never sees the conversation or cost basis; CIO-Interface never sees a bundle or worker report; the Writer sees only an approved proposal; cost basis exists nowhere in the system.

---

## 20. Revised Architecture V2

V2 inherits every part of V1 not named below. Section numbers in parentheses refer to V1. Where V2 changes a V1 rule, the V2 rule wins.

### 20.1 Execution units

| Unit | Primitive | Change from V1 |
|---|---|---|
| Evidence Pipeline | Deterministic scripts; structured-data parser; T1 double extraction; validators V-01..V-11 | Adds truth layer; tier by channel; coverage map |
| `FinancialCellStore` | Append-only file store outside vault (`ic-data/financials/<TICKER>.jsonl`), rebuildable from runs | New |
| Analyst | Ephemeral worker, T2 | Blind to prior valuation numbers; receives `breaker_eval.json`; must produce `NegativeSearchRecord`s for absence assumptions |
| CALC | Deterministic script exposed as tool | Adds breaker evaluation, claim outcome, drift score, weakened counter, hurdle, liquidity, reconciliation, window candidates, implied-growth cross-check, history percentiles, one-off recurrence, share-count continuity |
| Red Team | Ephemeral worker, T3, different lineage from Analyst | Two phases; mandatory for all held-security recommendations; re-runs after S6 re-runs; retrieval through detector |
| CIO-Synthesis | Script-driven T4 call with structured output (`VERIFY BEFORE BUILD`), else ephemeral worker | New unit; isolated from conversation; two calls (fresh-look, held-frame); sees portfolio weights, cash, sector, group, liquidity; never cost basis |
| CIO-Interface | Direct reasoning in the interactive session, IC context file | Reduced to intake, explanation, and quotation; input-isolated; `NO_MEMO_NO_VIEW` |
| Validators | Deterministic scripts plus V-12 (T1/T2) | Extended set |
| Canonical Writer | Deterministic script | Idempotent; one source one projection; `MANUAL_EDIT` events; hard original-hash refusal |

Zero permanent agents, zero new profiles by default (D-01 stands). Per run: one Analyst worker, two Red Team phases, two CIO-Synthesis calls, T1 calls for extraction (×2 per document), support checks, and materiality.

**Intake contract.** `intake.json` fields: `run_id`, `ticker`, `held` (from the last `RECONCILED` snapshot, never from Otta's statement), `trigger_type`, `event_pointers[]`, `question_category` ∈ {RESULTS, CORPORATE_ACTION, GOVERNANCE, PRICE_MOVE, GENERAL_REVIEW, CANDIDATE_SCREEN, CLAIM_DUE}, `depth` ∈ {QUICK, FULL}, `budget_cap`, `override_reason` (required when `PRICE_MOVE` and `FULL`), `question_text_audit` (stored, never passed to S1 onward). CIO-Interface collects these conversationally and writes the file; S1 reads only the structured fields.

### 20.2 Records

V1's nine records plus:

| Record | Purpose | Storage | Writer | Lifecycle |
|---|---|---|---|---|
| `FinancialCellStore` | Every validated normalized cell across runs, keyed by (ticker, line item, period, scope), with `superseded_by` on restatement | `ic-data/financials/<TICKER>.jsonl`, append-only, outside vault | Evidence pipeline (run), promoted on S13 | Rebuildable from `runs/` |
| `PriceRecord` | Close price and ADTV with source, date, and `tier_provenance` | `EvidenceRecord` subtype in the bundle; latest promoted to `ic-data/prices/<TICKER>.jsonl` | Evidence pipeline | Freshness rules of V1 §10.5 apply; `MANUAL` entries carry Otta's date |
| `CorporateActionRecord` | Announced or effective action affecting share count, capital, or control: rights issue, warrant exercise, private placement, buyback, split, dividend, MTO | `EvidenceRecord` subtype; index in `ic-data/corporate-actions/<TICKER>.jsonl` | Evidence pipeline | `ANNOUNCED` → `EFFECTIVE` / `CANCELLED` |
| `NegativeSearchRecord` | Channels searched, queries, window, result, for an absence claim | Run artifact; ids cited by assumption status | Analyst, Red Team | Immutable; valid for the run only |
| `BreakerEval` | Per-breaker result: `TRIGGERED` / `NOT_TRIGGERED` / `TRIGGERED_WITH_CAVEAT` / `UNEVALUABLE`, with input cell ids | Run artifact `breaker_eval.json`; summary line in memo | CALC | Per run |

Changes to existing records:

- `ThesisState` frontmatter adds `fiscal_year_end`, `free_float`, `controlling_group`, `primary_drivers[]`, `pack_flags[]` (FX_SENSITIVE, REGULATION_SENSITIVE), `drift_score`, `quarters_since_fully_holding`, `thesis_lifecycle` ∈ {NOT_ESTABLISHED, ESTABLISHED, SUPERSEDED}. Each assumption carries `assumption_kind`. Each breaker carries `breaker_spec` (numeric: metric, scope, period_kind, comparator, threshold, window, consecutive; or qualitative: description, required evidence class).
- `ThesisEvent` kinds add `MANUAL_EDIT`, `LEGACY_CORRECTION`, `ERRATUM`, `SUPERSEDED`, `REESTABLISHED`. Source is `ic-data/thesis-events/<TICKER>.jsonl`; the note table is a projection.
- `ManagementClaim` adds `evaluable`, `metric_changed_from`, status `UNRESOLVED_PAST_DUE`; `outcome_evidence_id` restricted to T1 `DIRECT` or `DERIVED` for numeric claims.
- `ValuationSnapshot` adds `assumption_provenance` per slot (HISTORY_RANGE / OUTSIDE_HISTORY / GUIDANCE_BASED / SOURCED_SERIES), `formula_flags`, `implied_growth_crosscheck`; probability weights removed.
- `PortfolioSnapshot` adds `ledger_check` ∈ {MATCH, MISMATCH, OVERRIDDEN(reason)}; the view passed to CIO-Synthesis excludes cost basis and unrealized P&L by schema.
- `DecisionMemo` adds header fields `drift_score`, `quarters_since_fully_holding`, `red_team_silent`, `coverage_gaps[]`, `price_status`, `liquidity_status`; body sections `fresh_look_recommendation`, `hold_not_buy_reasons[]`, `strongest_surviving_objection`, `red_team_phase_divergence`; `human_decision` block gains `frozen_at` and `amendments[]`.
- `AnalysisRun` manifest adds `lineage` per stage, `lease`, `state_version`, `coverage_map`.

### 20.3 Workflow (changed stages)

| Stage | V2 change |
|---|---|
| S0 | Structured intake per §20.1; `held` from snapshot; `PRICE_MOVE` rule; per-ticker lock acquired (`RUN_IN_PROGRESS` otherwise) |
| S1 | Each adapter records `covers[]` and status; coverage map written; price/ADTV adapter per D-31; tier assigned by channel; every fetched item passes the injection detector |
| S2 | Origin classification (V-09) in addition to hash dedup |
| S3 | S3a structured parse (V-01) where available; S3b double extraction (V-02); S3c validators V-03..V-06, V-10, non-GAAP quarantine; S3d cell-store diff (V-08), share-count continuity (V-13), `CorporateActionRecord` extraction; cells `FAILED`/`UNVERIFIED`/`UNSTABLE` never enter `normalized_financials.json` as usable |
| S4 | `ALWAYS_MATERIAL` category list evaluated first; numeric `breaker_eval` run by CALC on the new cells before the classifier; classifier output advisory on human questions as in V1 |
| S5 | Original-thesis hash check (V-19); jsonl-vs-table consistency; `state_version`; ledger reconciliation (V-14) on the latest snapshot; `PriceRecord` freshness; `trading_status`; rules-block blank scan (V-21); drift score and weakened counter computed |
| S6 | Analyst input excludes prior `ValuationSnapshot` numbers (it receives the prior method and assumption *names* only); includes `breaker_eval.json`; must emit `NegativeSearchRecord`s for `ABSENCE` assumptions; every assumption status cites this-run evidence ids |
| S7 | Recompute as V1 plus `CALC_MISSING` (V-20) and pack-mandatory sensitivity axes present |
| S8a | Red Team phase A: bundle, cells, thesis (original and current), pack, `breaker_eval`, calc tool, retrieval. Output: own assumption statuses, top risks, retests at pack bounds, disconfirming search log with channels. No Analyst report. |
| S8b | Red Team phase B: phase A output plus `analyst_report.json` plus (on re-runs) the prior Red Team report. Output: findings per checklist, verdict, divergence statement. `UNRESOLVABLE` items from coverage gaps force `MORE_RESEARCH` minimum. |
| S9 | Adds hurdle (V-15), liquidity gate, price status, comparator age, group and driver counts, `FAIL_GRANDFATHERED_CAUSE` |
| S10 | CIO-Synthesis call 1 (candidate frame: `held` masked, weights masked) → `fresh_look_recommendation`; call 2 (held frame) → recommendation and qualifiers, with call 1 output as input; memory proposal; trigger proposals. Runs outside the conversation. |
| S10v | All validators; domain matrix (§20.7); V-12 support check; V-18 fresh-look reconciliation; V-22 |
| S11 | As V1; human block freeze rule |
| S12 | Item-level approval; typed reasons on L2 items; no bulk approve for L2 |
| S13 | Writer idempotent; one source one projection; curated index completeness check; `FinancialCellStore` and price/corporate-action indexes promoted |
| S14 | As V1 |

Retry, checkpoint, and refusal rules of V1 §9 stand, with the atomicity and lease additions of §9 of this document.

### 20.4 Evidence layer additions

- **Tier by channel.** `source_tier` is set by the adapter that produced the document. A document's self-description never changes its tier. Manual drops: T2 maximum, `tier_provenance: MANUAL_UNVERIFIED`, upgraded to `CHANNEL_VERIFIED` only on hash match with an IDX-retrieved copy.
- **Truth validators V-01..V-10** as specified in §14. All deterministic except the parser's OCR confidence, which is a flag.
- **Mandatory extraction targets** per pack and per action: for any `BUY` or `ADD`, the related-party note, auditor name and opinion type, shareholder structure and free float, contingent liabilities, FX-denominated debt. Missing target → `INVESTIGATE` cap on that action.
- **`ALWAYS_MATERIAL` categories** (S4, thesis-independent): corporate actions affecting share count or control; related-party transactions above a disclosed threshold; auditor change or non-unqualified opinion; regulator sanction or investigation; restatement; suspension; change of control; management or board change at CEO/CFO/controller level; going-concern language. Versioned list; extended from misses.
- **Injection boundary** extended: every retrieval by any stage passes the detector; `claim_category: other` with imperative patterns is `QUARANTINED`; worker outputs are domain-validated as in V1.
- **Coverage map (V-11)** and its domain consequences (§20.7).

### 20.5 Valuation layer additions

- Packs own the mandatory sensitivity axes and their bounds; the Analyst may add axes, not remove them.
- Plausibility ranges derived by CALC from `FinancialCellStore` percentiles (default 10 years or all available, stated) and peers where curated data exists; every assumption carries `assumption_provenance`; `OUTSIDE_HISTORY` requires a rationale and L2.
- CoE floor: risk-free proxy (D-09) plus minimum equity premium (D-19).
- Bank pack: scope per metric (regulatory ratios bank-only; earnings consolidated unless the thesis is bank-only); `FORMULA_UNSTABLE` exclusion.
- Property pack: land value anchored to book or named appraisal; multiple over book rendered; retest at book mandatory.
- Commodity pack: price series is a sourced T3 whitelisted record; window candidates generated by CALC; choice labeled.
- Consumer and industrial packs: `GUIDANCE_BASED` forbidden in base below D-18 thresholds; implied-growth/ROIC cross-check for any multiple.
- Turnaround pack: no probability weights; branches unweighted; `BUY` size band capped at the lowest research-depth cap.
- One-off treatment requires recurrence check; symmetric.
- Midpoint internal only; probabilities as bands; `CALC_MISSING` on missing mandatory pieces.
- The Analyst does not receive prior valuation numbers; the D-08 comparison is computed by CALC at S9 and interpreted by CIO-Synthesis.

### 20.6 Adversarial review

- Two phases as in §20.3. Phase A's assumption statuses and top risks are rendered in the memo next to the Analyst's, with a divergence statement.
- Every checklist item yields a finding, a "no finding because" with evidence ids and a `NegativeSearchRecord` where the item is an absence check, or `UNRESOLVABLE` with the coverage gap named.
- Findings pass V-12; `NOT_SUPPORTED` → `RHETORICAL`.
- Verdict rules of V1 §16.3 stand; add: any `UNRESOLVABLE` item on checklist items 1, 2, 4, or 5 → `MORE_RESEARCH` minimum; `RED_TEAM_SILENT` when no MEDIUM+ finding exists.
- Mandatory for every run that emits a recommendation on a held security. Skippable only for event runs ending `DONE: NO_ACTION`.
- Re-runs after any S6 re-run, with the prior report as input.
- If per-worker tools are unavailable (D-02), D-26 governs how retests are executed; the Red Team without any retest capability is not a Red Team, and the run's domain is capped at `INVESTIGATE`.

### 20.7 Recommendation domain matrix

The domain starts as V1 §17 by held status. Each condition removes states. Conditions compound.

| Condition | Removes |
|---|---|
| Red Team `BLOCK` | everything except `INVESTIGATE`, `NO_DECISION` |
| Red Team `MORE_RESEARCH` without an approved re-run | everything except `INVESTIGATE`, `NO_DECISION`, and `HOLD` (held) or `WATCH` (candidate) |
| `portfolio_stale` or `ledger_check: MISMATCH` | `BUY`, `ADD`, `TRIM`, `EXIT` |
| `PRICE_UNKNOWN` | `BUY`, `ADD`, `TRIM` |
| `LIQUIDITY_UNKNOWN` or gate fail (non-large-cap) | `BUY`, `ADD` |
| `trading_status: SUSPENDED` or `UNKNOWN` (non-large-cap) | `BUY`, `ADD` |
| `COVERAGE_GAP` on governance or corporate-action categories | `BUY`, `ADD` |
| Missing mandatory extraction target | `BUY`, `ADD` (capped at `INVESTIGATE` for that action) |
| Same-tier primary conflict on a load-bearing cell | anything depending on the cell, capped at `INVESTIGATE` |
| `thesis_assessment: BROKEN` | `HOLD`, `ADD` |
| `THESIS_REESTABLISHMENT_REQUIRED` | `HOLD`, `ADD` until re-established in the same or a later approved memo |
| `fresh_look_recommendation: PASS` | `ADD`; `HOLD` requires `hold_not_buy_reasons` |
| Hurdle fail | `BUY`, `ADD` |
| Depth cap exceeded at proposed size | `BUY`, `ADD` unless size reduced |
| `RULES_INCOMPLETE` | `BUY`, `ADD`, `TRIM`, `EXIT` |
| `QUICK` mode | everything except `UNCHANGED`-type answer, `INVESTIGATE`, `NO_DECISION` |
| Any refusal code | everything except `INVESTIGATE`, `NO_DECISION` |

`INVESTIGATE` and `NO_DECISION` are never removed. `EXIT` is never removed by price or liquidity conditions; execution constraints are rendered as information (V1 rule). A `BROKEN` thesis with a stale portfolio yields `INVESTIGATE` with the conditional `EXIT` reasoning under `CONDITIONAL` (V1 §15.6 pattern).

### 20.8 Thesis lifecycle additions

- **Weakened-duration.** CALC counts consecutive quarterly reporting periods (not runs) in which any assumption is `WEAKENED` or `INSUFFICIENT_EVIDENCE`. At two or more (D-30), `HOLD` is an L2 item with a typed reason; the memo header shows the counter.
- **Drift score.** `drift = changed_assumptions + 2 × relaxed_breakers + retired_assumptions + thesis_milestone_deadline_moves`, computed from `ThesisEvent`s since the frozen original. Above D-33, `THESIS_REESTABLISHMENT_REQUIRED`: the memo must propose closing the thesis (`SUPERSEDED`, with `outcome` ∈ {CORRECT, WRONG, UNRESOLVED} and a one-line reason) and establishing a new frozen original, or must recommend within the reduced domain. Otta approves re-establishment as an L2 item.
- **Absence assumptions.** `assumption_kind: ABSENCE` statuses must cite a `NegativeSearchRecord` from this run; otherwise `INSUFFICIENT_EVIDENCE`.
- **Breakers.** Numeric breakers evaluated by CALC every run; `UNEVALUABLE` forces `INSUFFICIENT_EVIDENCE` at the thesis level; qualitative breakers marked triggered require a `DIRECT` record and Red Team concurrence or dissent, both recorded; disagreement → `INVESTIGATE` and L2.
- **Fresh look.** `fresh_look_recommendation` from CIO-Synthesis call 1; V-18 reconciliation.
- **Migration.** Side-by-side proposal; Red Team fidelity item on first FULL run; `LEGACY_CORRECTION` within 30 days, L2.

### 20.9 CIO split

**CIO-Synthesis.** Inputs: all run artifacts through S9, current `ThesisState`, structured prior-decision table (date, recommendation, human decision, execution, one-line reason), rules block, portfolio view (weights, cash, sector, group, liquidity; no cost basis, no P&L), candidate alternatives with valuation ages. Two calls: candidate frame (held and weights masked) → `fresh_look_recommendation` with reasons; held frame → full memo draft with call 1's output as input. Output: memo draft JSON rendered by template, `memory_proposal.json`, `trigger_proposal.json`. It never sees `question_text_audit` or the conversation. Primitive: script-driven T4 call with structured output; `VERIFY BEFORE BUILD`; fallback: ephemeral delegated worker at T4 with the same inputs.

**CIO-Interface.** The session Otta talks to, with the IC context file. It collects intake, starts runs, reads memos and thesis notes, explains, and answers questions by quoting memo ids and dates. It does not load bundles, worker reports, calc outputs, or the portfolio's cost basis. On any request for a directional view on a ticker: if a memo exists within the freshness window it quotes it; otherwise it answers `NO_MEMO_NO_VIEW` and offers to start a run. This is a prompt rule backed by input isolation; its residual risk is stated in §22 and measured by F-100.

### 20.10 Memory and Writer

- One source, one projection for every history record.
- Writer idempotent by proposal hash; hard refusal on original-thesis hash mismatch; `MANUAL_EDIT` events for confirmed hand edits; curated index completeness; human-block freeze with amendments; `FinancialCellStore`, price, and corporate-action indexes promoted at S13.
- Backup and rebuild per D-25; rebuild script is an acceptance-test item (F-95).

### 20.11 Model tiers

V1 §21 stands with these changes: T1 owns no outcome; T1 double extraction; T1/T2 support checker with lineage rule; T4 used twice per FULL run; lineage recorded per stage; CIO-Synthesis lineage differs from at least one of T2/T3; benchmark set per §11.5.

### 20.12 Monitoring contract (V2 build, not V1)

V1 §20 stands with: document hashing; disclosure-type whitelist; layer 1.5 deterministic parse and breaker evaluation for financial statements; `ALWAYS_MATERIAL`; idempotency keys; `state_version`; T2 audit sample of `NOT_MATERIAL`. Precondition unchanged: the manual workflow passes all fixtures first.

### 20.13 Existing-state reconciliation additions

V1 §4 stands. Added migration items: M-06 structured transaction-log block for ledger reconciliation; M-07 `breaker_spec` extraction for each migrated breaker, with prose breakers that cannot be made numeric marked qualitative; M-08 `fiscal_year_end`, `free_float`, `controlling_group`, `primary_drivers` per company (`DECISION REQUIRED` where the note lacks them); M-09 initial `FinancialCellStore` seeded only from documents re-extracted through S3 in a migration run, never from legacy notes' figures.

---

## 21. Changes from V1 to V2

| Area | V1 | V2 |
|---|---|---|
| CIO | One unit in the interactive session | CIO-Synthesis (isolated, two calls) + CIO-Interface (conversation, read-only) |
| Cost basis | Visible to CIO with a firewall sentence | Absent from all system inputs |
| Financial extraction | T1 model labels, schema validation | Structured-data-first, double extraction, identity/scale/locale/section/issuer validators, cross-run cell store, restatement and share-count diffs |
| Tier assignment | Field on record | By channel before extraction; manual drops T2 max |
| Corroboration | Hash dedup | Origin classification |
| Partial bundles | Continue, no consequence | Coverage map; domain restriction; `UNRESOLVABLE` Red Team items |
| Red Team | One pass with Analyst report; skippable for `HOLD`; retests top-3 by Analyst sensitivity | Two phases (blind first); mandatory for all held recommendations; retests at pack bounds; re-runs after S6 re-runs; `RED_TEAM_SILENT` |
| Citations | Existence and tier | Plus support check (V-12) |
| Analyst inputs | Includes prior valuation | Prior valuation numbers removed |
| Breakers | Prose, model-judged | `breaker_spec`, CALC-evaluated every run |
| Absence assumptions | Default by omission | `NegativeSearchRecord` required |
| `HOLD` | Valid under `WEAKENED-with-reason` indefinitely | Weakened-duration L2; drift score; re-establishment; `fresh_look` reconciliation |
| Management claims | `DEADLINE_MOVED` tracked | Plus auto-close past due, `metric_changed_from`, `UNEVALUABLE`, outcome from T1/`DERIVED` only |
| Valuation slots | `ASSUMED` with rationale, pack ranges unspecified | History-derived ranges, `OUTSIDE_HISTORY`, CoE floor, anchors per pack, implied-growth cross-check, no probability weights, `CALC_MISSING` |
| Price | None (D-05) | `PriceRecord` as evidence; `PRICE_UNKNOWN` restriction; still never a trigger |
| Liquidity | Rendered `UNKNOWN` | Gate for non-large-caps; `trading_status`; free float |
| Portfolio reconciliation | Otta types `RECONCILED` | Ledger check |
| Opportunity cost | Relative ranking | Plus absolute hurdle; comparator age; legacy excluded |
| Intake | Free question to CIO | Structured fields; free text audit-only; `PRICE_MOVE` → `QUICK` |
| Materiality | Thesis-mapped | Plus `ALWAYS_MATERIAL` categories; layer 1.5 breakers |
| History storage | jsonl and table co-equal | One source, one projection |
| Hand edits | Detected, confirmed | `MANUAL_EDIT` events; original hash hard refusal |
| Human block | Editable until execution | Freeze plus amendments |
| Durability | Manifest mutable | Atomic writes, leases, exclusive attempts, idempotent Writer, `state_version`, run lock |
| Memo | Ten questions | Plus header flags, fresh look, strongest objection, phase divergence, coverage gaps |
| New records | Nine | Plus `FinancialCellStore`, `PriceRecord`, `CorporateActionRecord`, `NegativeSearchRecord`, `BreakerEval` |
| New refusals | Fourteen codes | Plus `ORIGINAL_THESIS_TAMPERED`, `CALC_MISSING`, `RULES_INCOMPLETE`, `RUN_IN_PROGRESS`, `RECONCILIATION_MISMATCH`, `STATE_MISSING`, `NO_MEMO_NO_VIEW`, and the domain restrictions `PRICE_UNKNOWN`, `COVERAGE_GAP`, `LIQUIDITY_UNKNOWN`, `THESIS_REESTABLISHMENT_REQUIRED` |
| Invariants | Twenty | Twenty, six reworded, plus fifteen new (§24) |

---

## 22. Unresolved Decisions

V1's D-01 to D-15 stand. Added:

| ID | Question | Recommendation |
|---|---|---|
| D-16 | Should a second, independently scoped evidence collection for the Red Team be built if F-21 divergence proves insufficient? | Defer; decide after Session 3 results. |
| D-17 | Regulator channel adapter (OJK, ministry notices) in V2 adapters? | Yes for `REGULATION_SENSITIVE` packs; otherwise `UNRESOLVABLE` items cap the domain, which is honest but produces more `INVESTIGATE`. |
| D-18 | Thresholds for `GUIDANCE_BASED` in base case: minimum closed claims and minimum hit rate. | Six closed evaluable claims; hit rate at or above 60%. Otta confirms. |
| D-19 | Minimum equity premium above the risk-free proxy for the CoE floor. | Otta sets; the architecture requires it to exist and be versioned. |
| D-20 | Large-cap list for the liquidity gate. | A named index constituent list with a date, refreshed quarterly. |
| D-21 | Hurdle gate form: base-range low end vs cash proxy; bear drawdown limit. | As stated in V-15; values in the rules block. |
| D-22 | Confirm cost basis has no legitimate decision role for Otta (tax or otherwise). | Remove; Otta confirms his tax treatment. |
| D-23 | Comparator staleness threshold. | 120 days or one reporting cycle, whichever is shorter. |
| D-24 | Grandfathered excess: excluded from other positions' sector-limit checks, or not? | Excluded, with the cause rendered. Otta decides. |
| D-25 | Backup policy for `runs/` and `ic-data/`. | Same backup cadence as the vault; rebuild script tested in Session 3. |
| D-26 | If tools cannot reach the Red Team (D-02 fallback), how are retests executed? | Red Team supplies assumption values; a script runs CALC and returns results into phase B. If even that is impossible, domain capped at `INVESTIGATE`. |
| D-27 | Who sets pack sensitivity bounds and how are they versioned? | Otta, per pack, in a versioned pack file; changes are logged like rules changes. |
| D-28 | Benchmark pass thresholds per metric in §11.5. | Set after the first fixture pass shows achievable rates; the first pass is measurement, not acceptance. |
| D-29 | Is IDX structured financial data (XBRL/xlsx) retrievable for the migrated companies and periods? | `VERIFY BEFORE BUILD`. If not, V-02 double extraction is the only truth path and the tolerance for `UNVERIFIED` cells must be set. |
| D-30 | Weakened-duration threshold. | Two consecutive quarterly reporting periods. |
| D-31 | Price and ADTV source. | IDX daily summary as T1 if an adapter is feasible; else Otta's dated manual entry labeled `MANUAL`, with capital actions requiring an entry no older than 5 trading days. |
| D-32 | T2 audit sample fraction of `NOT_MATERIAL` verdicts (V2). | 10% or all in the first month, whichever is larger. |
| D-33 | Drift-score threshold for re-establishment. | Three. Otta confirms. |
| D-34 | Interface "no memo, no view" freshness window. | The memo is quotable until the next reporting period for the ticker or 90 days. |

`VERIFY BEFORE BUILD` register additions: script-initiated T4 call with structured output for CIO-Synthesis; second T1 lineage availability for double extraction; retrieval through the detector for delegated workers; IDX structured statement retrieval (D-29); IDX daily data retrieval (D-31); OJK/regulator page retrieval (D-17).

---

## 23. Final Verdict

**V1 as written: `NOT READY`.** It would produce confident, traceable, schema-valid, wrong recommendations through at least five independent mechanisms (§2), and its most important control, the Red Team, is independent in lineage but not in evidence or framing.

**V2 as revised here: `READY AFTER CHANGES`.** The changes are the fifteen items in §17. Readiness is conditional on Session 3 building and passing the fixture pack in §16 on the tiers that will actually be bound, and on the `VERIFY BEFORE BUILD` items that gate the CIO split (script-driven T4 with structured output) and the truth layer (structured IDX data, second extraction lineage) resolving in a way that keeps those controls intact. If the CIO split cannot be implemented on Hermes v0.21.0 in either form, the verdict reverts to `NOT READY`, because the chat bypass is then unmitigated.

A persuasive system that is wrong is more dangerous than an incomplete one. V2 is more incomplete than V1 in the sense that it refuses more often and asks Otta for more. That is the intended direction.

---

## 24. NEXT SESSION HANDOFF

### Accepted architectural changes

1. CIO split into CIO-Synthesis (isolated, two calls, schema-bound) and CIO-Interface (conversation, read-only, `NO_MEMO_NO_VIEW`).
2. Cost basis and unrealized P&L removed from every system input.
3. Evidence truth layer: structured-data-first, double extraction, validators V-01..V-11, tier by channel, origin classification, coverage map.
4. `FinancialCellStore`, `PriceRecord`, `CorporateActionRecord`, `NegativeSearchRecord`, `BreakerEval` records.
5. Two-phase Red Team, mandatory for all held-security recommendations, re-run after S6 re-runs, retests at pack bounds, `RED_TEAM_SILENT`.
6. Citation-support check V-12.
7. Machine-checkable breakers; claim auto-close; outcome evidence restriction.
8. Weakened-duration rule, drift score, thesis re-establishment, `fresh_look_recommendation`.
9. Analyst blind to prior valuation numbers.
10. Recommendation domain matrix (§20.7) including price, liquidity, coverage, hurdle, and re-establishment restrictions.
11. Valuation anchors per pack; no probability weights; `CALC_MISSING`.
12. Memory hardening: original-hash hard refusal, one source one projection, curated completeness, human-block freeze, `MANUAL_EDIT` events.
13. Durability: atomic manifest, leases, exclusive attempts, idempotent Writer, `state_version`, run lock; V2 monitoring contract fixes.
14. Structured intake with audit-only free text; `PRICE_MOVE` → `QUICK`.
15. Lineage recorded per stage; CIO-Synthesis lineage rule.

### Rejected ideas and reasons

- Composite decision score: hides gate failures; no failure mode found that it fixes.
- Locking the vault: ownership matters; visibility via `MANUAL_EDIT` events achieves the goal.
- Weighted T4 credibility: a weight is a way to let it in.
- MoA, voting, or a third-model tie-breaker: correlated error is not verification; disagreement is information for Otta.
- Second independent evidence collection for the Red Team: deferred on cost until fixtures show the blind phase is insufficient.
- Statistical correlation: deferred, as in V1.

### Current invariants

V1 invariants 1, 2, 4, 7, 15, 16, 17, 18 unchanged. Invariants 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 19, 20 reworded per §15. New invariants:

21. Cost basis and unrealized P&L `MUST NOT` exist in any system input, artifact, or prompt.
22. The recommendation `MUST` be produced by a component that has no access to the conversation with Otta.
23. Every `DIRECT` financial cell `MUST` pass identity, scale, scope, locale, and continuity validation before it is usable; a failed cell `MUST NOT` be imputed or replaced by a lower-tier source.
24. Source tier `MUST` be assigned by provenance channel, never by document self-description.
25. A run with uncovered governance or corporate-action categories `MUST NOT` produce `BUY` or `ADD`.
26. The Red Team `MUST` produce its own assessment before seeing the Analyst's, and `MUST` run on every held-security recommendation, including `HOLD`.
27. A cited record `MUST` support the claim per the support check, or the claim carries zero weight.
28. Numeric thesis breakers `MUST` be evaluated by script every run; an unevaluable breaker `MUST` prevent `UNCHANGED` or `STRENGTHENED`.
29. An absence assumption `MUST` cite a negative-search record from the current run or be `INSUFFICIENT_EVIDENCE`.
30. `HOLD` beyond the weakened-duration threshold, and any `BUY`/`ADD` with a silent Red Team, `MUST` be an explicit L2 approval item.
31. A thesis whose drift score exceeds the threshold `MUST` be re-established or the domain reduced; it `MUST NOT` be quietly continued.
32. `BUY`, `ADD`, and `TRIM` `MUST NOT` be recommended without a fresh price record; `BUY` and `ADD` `MUST NOT` be recommended for a non-large-cap without a liquidity record that passes the gate.
33. A `PortfolioSnapshot` `MUST` be `RECONCILED` by ledger check or explicit typed override, never by assertion alone.
34. `BUY` and `ADD` `MUST` clear the absolute hurdle; ranking first among alternatives is not sufficient.
35. Every confirmed hand edit to a Writer-only section `MUST` become a history event; a hand edit to the frozen original `MUST` refuse the run until restored or recorded as an erratum.

### Unresolved risks

- The CIO split depends on `VERIFY BEFORE BUILD` items; if neither a script-driven T4 call nor an isolated worker is available, the chat bypass is unmitigated (verdict reverts to `NOT READY`).
- V-12 and double extraction reduce but do not eliminate model-origin errors; their residual rates are unknown until Session 3.
- The Red Team's evidence base remains the same bundle; the blind phase addresses framing, not scope (D-16).
- `NO_MEMO_NO_VIEW` is a prompt rule backed by input isolation; a model can still opine from a thesis note. Measured by F-100, not eliminated.
- Pack bounds and thresholds (D-18, D-19, D-21, D-27, D-30, D-33) are Otta's judgment; they are versioned, not validated.
- Adapter coverage for regulator and structured-data channels is unverified (D-17, D-29, D-31).
- Refusal fatigue: V2 refuses more. The first month's refusal rate is a calibration finding; the response is better unblocking guidance, never looser validators.

### Controls that must be exercised in simulation (Session 3)

Every fixture in §16. At minimum the case pack must include: a cumulative/standalone mislabel (F-01); a parent-only extraction (F-02); a scale change (F-03); an OCR sign drop (F-04); a restated comparative (F-06); a press release with rewrites (F-08); a manual drop posing as a disclosure (F-10); an injection in three places (F-14); an adapter outage hiding a related-party disclosure (F-15); a planted disconfirming document in an uncovered channel (F-20); a confident wrong Analyst rationale (F-21); token citations (F-22); a three-`HOLD` history with fresh `PASS` evidence (F-25); an affiliate placement outside the thesis frame (F-27); a silent Red Team on a planted flaw (F-30); a thesis weakened three quarters (F-31); six small events (F-32); an absence assumption (F-33); a numeric breaker the model misses (F-34); a rights issue in flight (F-51); an illiquid candidate (F-60); no price record (F-62); a careless reconciliation (F-70); a best-of-a-bad-set (F-71); a hand-edited original (F-90); a chat request for a view with no memo (F-100); intake with P&L in free text (F-101).

### Expected failure and refusal behavior

- Any failed financial cell: cell `FAILED`, CALC refuses on it, memo names the cell and the check that failed; the run continues if other conclusions do not depend on it.
- Coverage gap on governance or corporate actions: `BUY`/`ADD` absent from the memo; Red Team items `UNRESOLVABLE`; verdict at least `MORE_RESEARCH`.
- No price or no liquidity record: thesis assessment produced; capital actions absent; memo names the missing record as the cheapest unblock.
- Ledger mismatch: `RECONCILIATION_MISMATCH`; capital actions absent; memo shows the expected vs stated holdings diff.
- Weakened past threshold: `HOLD` present only as an L2 item with a typed-reason field; header counter visible.
- Drift past threshold: memo proposes `SUPERSEDED` plus re-establishment or a reduced-domain recommendation; `HOLD` absent until approved.
- Red Team silent on a `BUY`: L2 item; header flag.
- Frozen original tampered: `REFUSED: ORIGINAL_THESIS_TAMPERED`; memo stub with restore or erratum instructions.
- Chat request for a directional view with no current memo: `NO_MEMO_NO_VIEW`; offer to start a run.
- Every refusal: a memo with `NO_DECISION` or `INVESTIGATE`, the code, and one named cheapest unblocking action.

### Exact files required by Session 3

- `00-PHASE-0-CONTEXT-PACK.md`
- `01-ARCHITECTURE-V1.md`
- `02-RED-TEAM-AND-ARCHITECTURE-V2.md` (this document)

Session 3 must produce `03-CONTROLLED-CASE-PACK-AND-SIMULATION.md` containing: the fixture pack per §16 with inputs and expected artifacts; the benchmark results per §11.5 for each candidate tier binding; the resolution of every `VERIFY BEFORE BUILD` item that gates an accepted change; the resolution or explicit deferral of D-16 to D-34; and a per-fixture pass/fail record with the refusal or domain observed. No real ticker may be run through the system in Session 3 before the fixture pack passes.
