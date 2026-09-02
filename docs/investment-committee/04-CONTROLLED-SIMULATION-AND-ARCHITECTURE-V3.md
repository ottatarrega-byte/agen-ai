# Hermes Investment Committee — Controlled Simulation and Architecture V3

**Document:** `04-CONTROLLED-SIMULATION-AND-ARCHITECTURE-V3.md`
**Session:** 3
**Date:** 2026-09-02
**Inputs:** `00-PHASE-0-CONTEXT-PACK.md` (authoritative), `02-RED-TEAM-AND-ARCHITECTURE-V2.md` (architecture under test), `03-CONTROLLED-CASE-PACK.md` (only permitted evidence)
**Scope:** pre-implementation simulation of Architecture V2 on three fictional fixtures, followed by a system audit and a revised Architecture V3. No web research, no live data, no Hermes changes, no canonical-note edits, no code.
**Status of the securities:** fictional. Nothing here is investment advice and nothing refers to a tradable instrument.

Keyword conventions follow V1 and V2: `MUST`, `SHOULD`, `MAY`, `VERIFY BEFORE BUILD`, `DECISION REQUIRED`. V2 identifiers (`EV-`, `CR-`, `TD-`, `VA-`, `IX-`, `MG-`, `PF-`, `AU-`, `MC-`, `MR-`, `HG-`, `F-`, `V-`, `D-`) are referenced as defined in V2. New identifiers introduced here:

| Prefix | Meaning |
|---|---|
| `A.F##`, `B.F##`, `C.F##` | fixture fact (case-scoped evidence id) |
| `A.D##`, `B.D##`, `C.D##` | derived value computed by script from facts |
| `A.I##`, `B.I##`, `C.I##` | interpretation (secondary analyst, analyst, or committee) |
| `A.M##`, `B.M##`, `C.M##` | management claim |
| `A.U##`, `B.U##`, `C.U##` | unknown that matters to the decision |
| `A.X##`, `B.X##`, `C.X##` | contradiction between records |
| `S3-##` | finding of this simulation about the architecture |
| `V3-##` | architecture change adopted in V3 |
| `G-##` | schema or evidence gap |
| `T-##` | implementation test required before Session 4 trusts a control |

---

## 1. Simulation Method and Evidence Boundary

### 1.1 What was simulated

Each case was pushed through the thirteen stages requested (Stage 0 to Stage 12) as if Architecture V2 were running on Hermes. For each stage the actual artifact was written out, not a description of what a worker would do. Where V2 assigns a stage to a deterministic script, the arithmetic was performed by hand exactly as a script would and is shown with its inputs so the reader can recompute it. Where V2 assigns a stage to a model worker, the text is what that worker would be expected to produce given only the bundle it is allowed to see.

The simulation is honest about one limitation: the workers here were simulated by one author reading one fixture. Real lineage separation between Analyst, Red Team, and CIO-Synthesis was not available. Where that matters (Stage 8, and audit questions 3 and 9) it is stated.

### 1.2 Evidence boundary

The only admissible facts are the sentences in `03-CONTROLLED-CASE-PACK.md`. The following rules were applied throughout:

1. A number in the fixture is a `FACT` with `tier_provenance: FIXTURE`. It stands in for a T1 statement cell but has no document, page, hash, publication date, or calendar reporting period. Those fields are marked `MISSING`, never filled.
2. Anything computed from two or more fixture facts is `DERIVED`. The formula and operands are shown. Where a derivation needs an assumption the fixture does not supply, the result is `DERIVED (conditional)` and the assumption is named.
3. Anything the fixture labels as an analyst's or management's view is an `INTERPRETATION` or a `MANAGEMENT CLAIM` and never becomes a fact.
4. Where the fixture is silent, the field is `UNKNOWN`. No company fact, sector fact, market price, macro figure, or rule value has been imported from model memory or from the real IDX.
5. Fixture percentages are treated as approximate at the precision shown. Derived values are rendered at the precision of the least precise operand, and this turned out to matter (see §5 question 6).

### 1.3 What V2 rules were assumed in force

Every V2 control listed in V2 §20 was assumed active, including: structured intake, tier by channel, the truth validators V-01 to V-23, `PriceRecord` with the five-trading-day freshness rule, the liquidity gate, the coverage-based domain restriction, two-phase Red Team, `fresh_look_recommendation`, the recommendation domain matrix (V2 §20.7), the hurdle gate V-15, the weakened-duration rule, the breaker evaluator V-16, the CIO split, and the single Writer with `human_decision: UNSET` on every proposal.

Where a V2 rule needs a value that V2 leaves as `DECISION REQUIRED` (for example D-21 hurdle values, D-20 large-cap list, D-23 comparator staleness), the simulation used V2's recommended value if one was given (D-23: 120 days; D-30: two periods; D-33: three) and otherwise marked the check `UNEVALUABLE`. It did not invent a value.

### 1.4 Reading the stage artifacts

Every stage artifact is written as the file or table the system would produce. Provenance columns use these statuses:

- `source_type`: `FIXTURE_PRIMARY` (stands in for T1/T2 statement or disclosure content), `FIXTURE_SECONDARY` (stands in for T3), `FIXTURE_RULE` (portfolio or rules content), `FIXTURE_THESIS` (prior thesis content).
- `epistemic`: `DIRECT`, `DERIVED`, `INFERRED`, `ASSUMED`, `SCENARIO`.
- `freshness`: `CURRENT_PERIOD` (the new reporting period in the fixture), `PRIOR_PERIOD`, `STALE(n)` with the fixture's own age, `UNDATED`.
- `verification`: `FIXTURE_ASSERTED` for every record. Nothing in a fixture can be verified against a source; the simulation does not pretend otherwise.

---

## 2. Case A Full Simulation

**Fixture:** `AQUA-A`, existing holding, research level `SCREEN+`, position above cap and grandfathered, recovery thesis with numeric minimums, one new half-year reporting period.

### Stage 0: Run initialization

```text
run_id:                 RUN-20260902-AQUA-A-01
run_directory:          runs/RUN-20260902-AQUA-A-01/   (immutable, outside vault)
intake.question_category: RESULTS
intake.trigger_type:    NEW_FILING (half-year report)
intake.depth:           FULL
intake.held:            TRUE   (source: fixture "existing holding"; V2 requires the last
                               RECONCILED snapshot; none exists in the fixture)
question_text_audit:    "Is the H1 earnings decline temporary pressure or structural
                         impairment, and does it change the thesis?" (stored, not propagated)

as_of_boundary:
  reporting_period:     H1 of the current fiscal year (fixture: "half-year")
  period_calendar:      MISSING (no dates in fixture)
  publication_date:     MISSING
  retrieval_date:       2026-09-02 (simulation date)
  thesis_deadline:      "H1 of the following year" relative to an unstated thesis date
  deadline_alignment:   UNRESOLVED (cannot tell whether this H1 is the deadline period)

position_state:
  held:                 TRUE (fixture-asserted)
  weight:               UNKNOWN (fixture says "above the allowed cap"; value not given)
  research_level:       SCREEN+ (not a level in the Case C cap table; cap value MISSING)
  cap_status:           EXCEEDED, GRANDFATHERED (fixture-asserted)
  top_up_rule:          BLOCKED until research depth and position limits are resolved
  cost_basis:           NOT AN INPUT (V2 invariant 21)

portfolio_state_status:
  snapshot_date:        MISSING
  ledger_check:         UNAVAILABLE (no transaction log in fixture)
  status:               UNRECONCILED  -> V2 matrix removes BUY, ADD, TRIM, EXIT

price_record:           ABSENT -> PRICE_UNKNOWN -> removes BUY, ADD, TRIM
liquidity_record:       ABSENT -> LIQUIDITY_UNKNOWN (large-cap status unknown)
coverage_map:           FINANCIAL_STATEMENTS: COVERED (fixture)
                        GOVERNANCE, CORPORATE_ACTIONS, REGULATOR: UNCOVERED
                        -> COVERAGE_GAP removes BUY, ADD

allowed_evidence:       03-CONTROLLED-CASE-PACK.md, Case A section only
known_missing_inputs:   absolute financial cells (all figures are ratios or growth rates);
                        input-cost and FX sensitivity model; peer set; explanation of
                        recurring Q4 weakness; management guidance on margin recovery;
                        second period (persistence); intrinsic-value model; price; ADTV;
                        ledger; cap value for SCREEN+; thesis date; deadline period;
                        TTM profit "minimum recovery threshold" value

decision_ready_at_init: PARTIAL
  thesis assessment:    READY (numeric thresholds and new period figures exist)
  capital action:       NOT READY (price, ledger, cap resolution, valuation all absent)
  domain_after_S0:      {HOLD, INVESTIGATE, NO_DECISION}
```

The domain is already reduced before any model call. That observation becomes finding S3-01 in §5.

### Stage 1: Incoming information

**FACTS** (fixture-asserted, current period unless stated)

| id | statement | period |
|---|---|---|
| A.F01 | Revenue +6.4% year on year | H1 vs prior H1 |
| A.F02 | Profit attributable to owners −34.4% year on year | H1 vs prior H1 |
| A.F03 | Feed segment = 81.8% of revenue | H1 |
| A.F04 | Feed-segment margin 8.73%, prior 11.34% | H1, prior H1 |
| A.F05 | Consolidated gross margin 18.78%, prior 20.57% | H1, prior H1 |
| A.F06 | Consolidated operating margin 6.63%, prior 9.84% | H1, prior H1 |
| A.F07 | Raw-material usage cost +6.9% | H1 vs prior H1 |
| A.F08 | Factory overhead +15.7% | H1 vs prior H1 |
| A.F09 | Operating FX loss increased materially; close to 10% of operating profit | H1 |
| A.F10 | Half-year operating cash flow = 0.60x half-year profit | H1 |
| A.F11 | TTM operating cash flow ≈ 0.91x TTM profit | TTM to H1 |
| A.F12 | Current ratio 1.19x, prior 1.09x | H1 end vs prior |
| A.F13 | Reported bank covenants still met | H1 (management-reported) |
| A.F14 | Position above research-level cap, grandfathered; no top-up permitted | rules |
| A.F15 | Research level SCREEN+ | rules |

Note on A.F13: "reported" makes this a company statement about a test whose terms are not in the bundle. It is retained as a fact about what was reported, not as an independent verification of covenant compliance.

Note on the fixture line "Revenue growth did not produce operating leverage": this is a true summary of A.F01 and A.F06, so it is recorded as derived (A.D01), not as a separate fact.

**DERIVED VALUES** (script-computable from facts; formulas shown)

| id | value | formula | status |
|---|---|---|---|
| A.D01 | Operating profit ≈ −28.3% yoy | 1.064 × (6.63 ÷ 9.84) − 1 = 0.717 − 1 | DERIVED; confirms "no operating leverage" |
| A.D02 | Gap between operating profit change (−28.3%) and attributable profit change (−34.4%) ≈ 6 points | A.F02 − A.D01 | DERIVED; cause (interest, tax, minorities) UNKNOWN |
| A.D03 | Operating expense ratio incl. operating FX loss: 12.15% of revenue, prior 10.73% | (18.78 − 6.63) vs (20.57 − 9.84) | DERIVED; assumes operating profit = gross profit − opex − operating FX loss |
| A.D04 | Operating expense incl. FX loss ≈ +20.5% yoy | 1.064 × (12.15 ÷ 10.73) − 1 | DERIVED (conditional on A.D03 structure) |
| A.D05 | Operating FX loss ≈ 0.66% of revenue this period | 0.10 × 6.63% | DERIVED from "close to 10%"; approximate |
| A.D06 | Upper bound of FX contribution to the 3.21pp operating-margin decline ≈ 0.66pp, i.e. at most about one fifth | A.D05 ÷ (9.84 − 6.63); prior FX loss > 0 so the true incremental effect is smaller | DERIVED; key result |
| A.D07 | Raw-material cost grew 0.5% faster than revenue (ratio factor 1.069 ÷ 1.064 = 1.005) | A.F07, A.F01 | DERIVED; pp impact needs the raw-material share of revenue: UNKNOWN |
| A.D08 | Factory overhead grew 8.7% faster than revenue (1.157 ÷ 1.064 = 1.087) | A.F08, A.F01 | DERIVED; pp impact needs overhead share: UNKNOWN |
| A.D09 | Feed segment contributes ≈ 7.14% of revenue as segment profit | 0.818 × 8.73% | DERIVED (conditional: segment margin at operating level) |
| A.D10 | Non-feed segments plus unallocated items net ≈ −0.51% of revenue | 6.63% − 7.14% | DERIVED (conditional on A.D09 and on FX loss sitting in unallocated) |
| A.D11 | Prior H2 cash conversion was above 0.91x | H1 at 0.60x below the TTM 0.91x average implies the other half was above it | DERIVED; direction certain, magnitude needs the profit split (UNKNOWN) |
| A.D12 | Cash conversion deteriorated within the TTM window | A.F10, A.F11, A.D11 | DERIVED; direction only |

**INTERPRETATIONS**

| id | statement | author | tier |
|---|---|---|---|
| A.I01 | "The decline is mostly temporary because FX and freight costs should normalize." | secondary analyst | T3 (`FIXTURE_SECONDARY`) |
| A.I02 | "The stock is cheap, so investors should average down." | secondary analyst | T3; contains a capital action recommendation |
| A.I03 | The recovery thesis rests on four levers (pricing, supplier diversification, reformulation, FX control) | prior thesis | `FIXTURE_THESIS`; assumptions, not evidence |

A.I01 is contradicted in part by A.D06: FX explains at most about one fifth of the margin decline, and freight is not quantified anywhere in the bundle. A.I02 is blocked by A.F14 regardless of any valuation view, and no price or valuation exists to support "cheap".

**MANAGEMENT CLAIMS**

None with a deadline and a metric exist in the fixture. The fixture explicitly states there is no management guidance quantifying margin recovery. A.F13 (covenants met) is a management report of a fact, not a forward claim. The claims table for this run is empty.

**UNKNOWN**

| id | unknown | why it matters |
|---|---|---|
| A.U01 | Absolute values for revenue, COGS lines, opex, FX loss, profit, OCF | every derived pp decomposition above is conditional without them |
| A.U02 | Whether the segment margin is gross-level or operating-level | A.D09 and A.D10 depend on it |
| A.U03 | Prior-period feed revenue share | needed to attribute the margin decline between feed and non-feed |
| A.U04 | Prior-period FX loss | needed to size the incremental FX effect; A.D06 is an upper bound only |
| A.U05 | Freight cost and its change | A.I01 relies on it; not in the bundle at all |
| A.U06 | Whether recurring Q4 weakness is structural | fixture names this as unknown; affects the persistence test |
| A.U07 | Thesis date, deadline period, and baseline period | deadline status and "repeatedly" count cannot be evaluated |
| A.U08 | Value of the TTM profit "minimum recovery threshold" | breaker UNEVALUABLE |
| A.U09 | Cap value for research level SCREEN+ | the limit checker cannot compute headroom; outcome is fixture-asserted |
| A.U10 | Cause of the 6-point gap in A.D02 | interest cost, tax rate, or minorities: each has a different implication |
| A.U11 | Dilution, refinancing, related-party, auditor events | uncovered categories; no NegativeSearchRecord possible in a fixture |
| A.U12 | Price, ADTV, trading status | capital-action domain |

**CONTRADICTIONS**

| id | records | nature |
|---|---|---|
| A.X01 | A.I01 vs A.D06, A.F08 | "Mostly FX and freight" vs FX bounded at about one fifth of the decline and overhead +15.7%, which is neither FX nor freight |
| A.X02 | A.I02 vs A.F14 | Averaging down is prohibited by the position rule irrespective of valuation |
| A.X03 | Thesis frame "recover ... to at least 10% feed margin / 8% operating margin" vs A.F04, A.F06 prior-period values 11.34% and 9.84% | The yoy comparative period already exceeded both recovery thresholds. Either the thesis baseline is a later trough (plausibly the weak Q4 the fixture mentions) or the thesis was written against a period that did not need recovering. The fixture cannot resolve this. It is recorded as a contradiction between the thesis frame and the comparative data, not resolved in either direction |
| A.X04 | A.F10 vs A.F11 | Not a contradiction of fact; a divergence in trend that the thesis breaker (TTM basis) does not see. Recorded so it is not lost |

No interpretation was promoted to fact. A.I01's "FX and freight" is retained as an interpretation with a partial deterministic rebuttal attached.

### Stage 2: Evidence bundle

Minimum structured bundle passed to S4 onward. One row per record; provenance fields that the fixture cannot supply are `MISSING`.

| evidence_id | claim | source_type | tier | period | freshness | epistemic | verification | doc/page/hash | contradicts |
|---|---|---|---|---|---|---|---|---|---|
| A.F01..A.F13 | as Stage 1 | FIXTURE_PRIMARY | T1-equivalent | H1 current (calendar MISSING) | CURRENT_PERIOD | DIRECT | FIXTURE_ASSERTED | MISSING | A.F04/06 → A.X03 |
| A.F14, A.F15 | rules and position | FIXTURE_RULE | n/a | UNDATED | UNDATED | DIRECT | FIXTURE_ASSERTED | MISSING | A.I02 |
| A.D01..A.D12 | as Stage 1 | script | n/a | H1 current | CURRENT_PERIOD | DERIVED | recomputable | script version: sim-1 | A.I01 |
| A.I01, A.I02 | secondary analyst view | FIXTURE_SECONDARY | T3 | UNDATED | UNDATED | INFERRED (author's) | FIXTURE_ASSERTED | MISSING | A.D06, A.F14 |
| A.I03 | thesis levers | FIXTURE_THESIS | n/a | thesis date MISSING | UNDATED | ASSUMED | n/a | MISSING | A.X03 |

Bundle flags: `completeness: PARTIAL`; `coverage_map: {FINANCIAL_STATEMENTS: COVERED, GOVERNANCE: UNCOVERED, CORPORATE_ACTIONS: UNCOVERED, REGULATOR: UNCOVERED, PRICE: UNCOVERED}`; `secondary_figures_in_cells: 0` (A.I01 and A.I02 contain no numbers; nothing to quarantine); `injection_detector: no hits` (fixture text contains one imperative, "investors should average down", inside a quoted interpretation; it is classified `claim_category: RECOMMENDATION_T3` and carries no instruction to the system).

### Stage 3: Deterministic checks

Each check below is a script or validator. No LLM performed any of them.

| check | validator | input | result |
|---|---|---|---|
| Period alignment | V-07 | H1 vs prior H1 for all yoy figures; TTM for A.F11 | ALIGNED for A.F01..A.F09; A.F10 (H1) and A.F11 (TTM) are different bases and were not compared to each other except directionally (A.D11); calendar dates MISSING so expected-period freshness cannot run: `FRESHNESS_UNEVALUABLE` |
| Arithmetic | CALC | A.D01..A.D12 | recomputed; all consistent to the precision of inputs |
| Accounting identities | V-03 | none possible | `NO_ABSOLUTE_CELLS`; identity checks cannot run on ratios. Every cell in this run is `UNVERIFIED_BY_IDENTITY` |
| Scale, locale, scope, issuer | V-04, V-05, V-06, V-10 | no documents | NOT RUN (nothing to parse); recorded as `NOT_RUN`, not as passed |
| Position cap | limit checker | research level SCREEN+, weight UNKNOWN, cap UNKNOWN | `ADD_BLOCKED` on fixture-asserted outcome; checker note: `RULES_INCOMPLETE: cap[SCREEN+] undefined` and `SNAPSHOT_INCOMPLETE: weight undefined`. Outcome accepted only because the fixture states it |
| Sector cap | limit checker | sector exposure UNKNOWN | `UNEVALUABLE` |
| Stale data | V-07 | reporting period is the newest in the fixture | CURRENT relative to the fixture; absolute freshness UNEVALUABLE |
| Duplicate detection | V-09 | 15 facts, 2 interpretations | no duplicates; the fixture line "Revenue growth did not produce operating leverage" was recognized as a restatement of A.F01 and A.F06 and collapsed into A.D01 rather than counted as a separate corroborating fact |
| Cash conversion | CALC | A.F10, A.F11 | H1: 0.60x; TTM: 0.91x; thesis minimum 0.8x on TTM basis: `MET`; H1 sub-period below minimum: `TREND_WARNING` (not a breaker) |
| One-off adjustment | recurrence check | none disclosed | no one-off items to adjust; FX loss is recurring in nature ("increased", so it existed before): `NOT_ONE_OFF` |
| Schema completeness | schema validator | bundle | `MISSING: publication_date, reporting_period_calendar, document_hash, page, absolute_cells, price_record, adtv_record, ledger, cap_value` |
| Breaker evaluation | V-16 | see table below | see table |

`breaker_eval.json` (thesis minimums and breakers translated to `breaker_spec` where the fixture makes that possible):

| breaker / minimum | spec | input | result |
|---|---|---|---|
| Feed-segment margin ≥ 10% | numeric, segment, H1 | 8.73% (A.F04) | `NOT_MET` (recovery minimum, not itself a breaker) |
| Consolidated operating margin ≥ 8% | numeric, consolidated, H1 | 6.63% (A.F06) | `NOT_MET` |
| TTM profit ≥ minimum recovery threshold | numeric, threshold value MISSING | −34.4% yoy (A.F02) | `UNEVALUABLE` (threshold undefined); direction is away from recovery |
| TTM OCF ≥ 0.8x TTM profit | numeric, TTM | 0.91x (A.F11) | `MET`; input is "approximately 0.91"; margin over threshold 0.11 exceeds any plausible rounding, so the result is stable |
| Current ratio ≥ 1.1x | numeric | 1.19x (A.F12) | `MET` |
| Liquidity breaker (covenant breach) | qualitative, requires DIRECT evidence | A.F13 "reported ... met" | `NOT_TRIGGERED` on management-reported basis; `evidence_class: MANAGEMENT_REPORTED` |
| Governance breaker | qualitative | no coverage | `UNEVALUABLE` (uncovered category) |
| "Recovery thresholds repeatedly fail by the stated deadline" | composite: count of failing periods at or after deadline ≥ 2 (reading "repeatedly" as at least two) | one period failing; deadline alignment UNRESOLVED (A.U07) | `NOT_TRIGGERED` on count; `UNEVALUABLE` on deadline alignment |

Consequence per V2 §20.8: at least one `UNEVALUABLE` breaker exists, so `UNCHANGED` and `STRENGTHENED` are excluded from thesis status. `BROKEN` is not available because no hard breaker is triggered and the composite breaker's count is 1.

### Stage 4: Thesis comparison

```text
prior_thesis_state (frozen original, fixture):
  claim: feed economics recover via pricing, supplier diversification, reformulation,
         FX control by H1 of the following year
  minimums: feed margin ≥ 10%; op margin ≥ 8%; TTM profit ≥ threshold (value MISSING);
            TTM OCF ≥ 0.8x TTM profit; current ratio ≥ 1.1x
  breakers: repeated failure of minimums by deadline; liquidity or governance breaker
  prior assumption statuses: UNKNOWN (not in fixture)
  quarters_since_fully_holding: UNKNOWN (no history)

new_evidence: A.F01..A.F13, A.D01..A.D12

assumption-by-assumption:
  A1 pricing recovers feed margin        -> WEAKENED   (A.F04: 11.34 -> 8.73; A.F05 gross
                                                        margin down despite revenue growth;
                                                        cites A.F01, A.F04, A.F05, A.D07)
  A2 supplier diversification            -> INSUFFICIENT_EVIDENCE (nothing in bundle;
                                                        raw material +6.9% says nothing
                                                        about supplier mix)
  A3 product reformulation               -> INSUFFICIENT_EVIDENCE (no evidence either way)
  A4 FX control                          -> WEAKENED   (A.F09: FX loss increased materially)
  A5 (ABSENCE) no liquidity breaker      -> HOLDING on management-reported basis (A.F12,
                                                        A.F13); no NegativeSearchRecord
                                                        possible; flagged MANAGEMENT_REPORTED
  A6 (ABSENCE) no governance breaker     -> INSUFFICIENT_EVIDENCE (uncovered; V2 TD-03)

unchanged_assumptions:  none can be marked UNCHANGED (each either weakened or unevidenced)
changed_assumptions:    A1, A4 -> WEAKENED
missing_evidence:       A.U01..A.U12; specifically for the temporary-vs-structural question:
                        (a) segment P&L in absolute terms for two consecutive periods,
                        (b) input-cost and FX sensitivity with disclosed import share,
                        (c) H2 result to test persistence, (d) management quantification
                        of the recovery path, (e) explanation of recurring Q4 weakness
deadline_status:        UNRESOLVED (A.U07). The original deadline is NOT rewritten.
                        The memo records: "deadline period unidentified in current state;
                        M-item required to record thesis_date and deadline_period"

thesis_status:          WEAKENED
```

Why `WEAKENED` and not the alternatives:

- Not `UNCHANGED` or `STRENGTHENED`: two of four levers moved against the thesis and an `UNEVALUABLE` breaker exists (V2 §20.8).
- Not `BROKEN`: no hard breaker is triggered. Current ratio and TTM cash conversion pass their minimums, covenants are reported met, the composite breaker requires repeated failure and only one period has failed, and the deadline may not have arrived. The case pack's control "do not declare the thesis broken solely from one period unless a hard breaker is met" is satisfied by the breaker evaluator, not by judgment.
- Not `INSUFFICIENT_EVIDENCE`: the two core margin minimums are evaluable and both failed with a clear direction. There is enough evidence to say the thesis is worse off. There is not enough to say why, which is a different question and belongs to `INVESTIGATE` in Stage 10.

The temporary-versus-structural question is answered as follows, and only this far: the deterministic decomposition (A.D06, A.D08) shows that at most about one fifth of the operating-margin decline can be FX, and that factory overhead grew 8.7% faster than revenue. That is evidence against "mostly temporary" but is not evidence for "structural". A single half-year cannot prove persistence. The status is `WEAKENED` with `structural_vs_temporary: UNRESOLVED`.

### Stage 5: Management track record

```text
MANAGEMENT CLAIM                              → DEADLINE   → OBSERVED RESULT           → STATUS
(none recorded in fixture)                    → n/a        → n/a                       → CLAIMS_TABLE_EMPTY

Thesis levers are NOT management claims; they are thesis assumptions of unknown origin.
If any lever was in fact management guidance, no claim record with owner, date, metric,
or deadline exists to score it. The system MUST NOT infer a MISSED from the thesis text.

credibility_signal:     NOT_RENDERED (zero closed evaluable claims; below D-18 threshold)
guidance_in_base_case:  FORBIDDEN (no track record); irrelevant this run since no guidance exists
```

The fixture's "No management guidance quantifying margin recovery" is itself decision-relevant: a company whose margins fell 3.2pp and offered no quantified path is a company whose next filing must be read for one. That is recorded as monitoring item A-MON-04, not as a credibility deduction.

### Stage 6: Financial impact

Direction only. Every row cites the facts it rests on. No absolute figures exist, so no rupiah impact is stated.

| line | direction | magnitude class | basis | confidence |
|---|---|---|---|---|
| Revenue | UP | mid single digit | A.F01 | HIGH (fact) |
| Gross margin | DOWN | ≈1.8pp | A.F05 | HIGH (fact); attribution between raw material and overhead UNKNOWN (A.D07, A.D08) |
| Operating margin | DOWN | ≈3.2pp | A.F06 | HIGH (fact); at most ≈0.66pp attributable to FX (A.D06) |
| Operating profit | DOWN | ≈ −28% | A.D01 | HIGH (derived from facts) |
| Attributable profit | DOWN | −34.4% | A.F02 | HIGH (fact); 6-point excess over operating decline unexplained (A.D02) |
| Operating cash flow, H1 | DOWN relative to profit | 0.60x conversion | A.F10 | HIGH (fact) |
| Operating cash flow, TTM | above thesis minimum, trend deteriorating | 0.91x | A.F11, A.D12 | HIGH on level; direction derived |
| Working capital / liquidity | IMPROVED | current ratio 1.09 → 1.19 | A.F12 | HIGH (fact); drivers UNKNOWN (an inventory build would also raise the current ratio and would be consistent with weak H1 cash conversion; the fixture cannot distinguish) |
| Leverage / covenants | STABLE as reported | covenants met | A.F13 | MEDIUM (management-reported; terms unknown) |
| Dilution risk | UNKNOWN | n/a | A.U11 | no coverage; no negative search possible |
| Liquidity risk | LOW on current evidence | n/a | A.F12, A.F13 | MEDIUM |

Where this table adds nothing beyond Stage 1 and Stage 3 it says so by construction: the only non-trivial rows are the current-ratio caveat and the FX upper bound. That observation is carried to §6.

### Stage 7: Valuation

```text
method_category:        earnings-power valuation for an input-cost-sensitive processor:
                        normalized (through-cycle) operating margin × revenue, with a
                        balance-sheet check and a multiple cross-check requiring the
                        implied-growth test (V2 VA-05). Pack: consumer/agri-processor.
                        NOT a bank, property, or commodity-producer template.

valid_inputs:           none sufficient for a range. Available: margin trajectory (ratios),
                        cash-conversion ratios, current ratio. All ratios; no revenue base,
                        no share count, no net debt, no price.

invalid_or_stale:       A.I02 "cheap" (no price, no valuation; T3 opinion)
                        any midpoint or single value (V2 invariant 19)

assumptions_that_would_be_required:
                        normalized feed margin (history-derived percentile range required;
                        FinancialCellStore empty in fixture -> OUTSIDE_HISTORY by default);
                        input-cost and FX sensitivity (A.U01, A.U04, A.U05);
                        cost of equity (floor rule D-19: value unset)

defensible_range:       NO. `CALC_MISSING` per V2 V-20: pack-mandatory pieces (normalized
                        margin range, sensitivity axes, implied-growth cross-check) cannot
                        be produced. This is a refusal code in V2 and reduces the domain
                        to {INVESTIGATE, NO_DECISION}.

calculation_artifact_required:
                        calc_output.json with: (1) absolute segment P&L for ≥ 2 periods,
                        (2) sensitivity table on axes {feed margin, raw-material index,
                        IDR rate}, pack-owned bounds, (3) history percentiles once the
                        cell store has ≥ 3 years, (4) share count and net debt for
                        per-share values, (5) implied-growth cross-check for any multiple.
                        None can be produced from the fixture.

target_price:           NOT PRODUCED (none is supportable)
```

### Stage 8: Independent adversarial review

Phase A (blind: bundle, cells, thesis, breaker_eval; no Analyst report). Phase B (compare). Both rendered.

**Phase A output (blind)**

Own assumption statuses: A1 WEAKENED, A2 INSUFFICIENT_EVIDENCE, A3 INSUFFICIENT_EVIDENCE, A4 WEAKENED, A5 HOLDING (management-reported), A6 INSUFFICIENT_EVIDENCE. Identical to the Analyst. Divergence statement: `LOW DIVERGENCE; same 15 facts; treat agreement as same-bundle agreement, not confirmation` (V2 CR-11 logic applied to phase divergence).

Top risks identified blind, in the reviewer's order:

1. **The thesis frame may be wrong, not just weakened (A.X03).** The comparative period already exceeded the recovery thresholds. If the thesis was written against a Q4 trough, the correct question is not "will it recover" but "is H1 strength itself seasonal and now eroding". The Analyst's `WEAKENED` accepts the thesis's own frame.
2. **Overhead, not FX, is the largest identifiable mover (A.F08, A.D08).** Factory overhead is the cost line most associated with fixed-cost absorption. Growing 8.7% faster than revenue while revenue grows is consistent with under-utilization or with cost inflation the company cannot pass on. Neither is "temporary" by default.
3. **Cash conversion halved within the year (A.D12).** A TTM ratio that passes its minimum while the latest half sits at 0.60x is a breaker that will trigger next period if H2 repeats H1. The thesis's TTM basis delays recognition by one period.
4. **Liquidity comfort rests on a management report (A.F13) and a ratio whose drivers are unknown (A.F12).** A current ratio can rise because inventory rose. With H1 conversion at 0.60x that is plausible. Nothing in the bundle rules it out.

Retests at pack bounds: none possible (no CALC inputs). Disconfirming search log: channels available in fixture: none beyond the case text. `UNRESOLVABLE` items: governance (checklist item 5), corporate actions (item 4), regulator (item 6).

**Phase B output (with Analyst report)**

Strongest credible case that the base analysis is wrong, in both directions, without strawmen:

*Too lenient.* The base analysis stops at `WEAKENED` because the breaker evaluator says no hard breaker fired. But the evaluator was fed a breaker whose deadline is unidentified and whose profit threshold is undefined. Two of the five minimums are unevaluable by construction, and the analysis leans on that unevaluability to avoid `BROKEN`. Combined with A.X03, a reviewer could argue the thesis has no working definition of success and should be re-established rather than scored. The base analysis names this (A.U07, A.U08) but does not escalate it. Finding: `MEDIUM`, `THESIS_SPEC_INCOMPLETE`; propose an L2 item to record `thesis_date`, `deadline_period`, and the TTM profit threshold before the next run, else the thesis should be treated as drifted.

*Too harsh.* The base analysis treats one half-year as evidence against "temporary". But A.D06 is an upper bound on FX using this period's FX loss; the fixture says FX loss "increased materially", so the swing in FX between periods could be a larger share of the change in margin than the level suggests. Freight is unquantified in both directions. Revenue grew, the current ratio improved, and the TTM cash-conversion minimum was met. A reviewer could argue that `WEAKENED` with two `INSUFFICIENT_EVIDENCE` levers is the honest floor and that the memo's tone should not lean toward "structural". Finding: `LOW`: the base memo must not use the word "structural" without the H2 result; the status is `UNRESOLVED`.

Audit items:

- *Circular assumptions:* the four levers were scored against evidence collected to test them; nothing in the bundle could have surfaced a fifth lever or a risk outside the frame. `ALWAYS_MATERIAL` categories were unreachable (uncovered). Circularity acknowledged, not broken, by this fixture.
- *Source quality:* every figure is fixture-asserted. In production, all margin figures would be T1 cells requiring V-03 identities; none could be checked here. The T3 interpretation (A.I01, A.I02) was correctly kept out of every derived value.
- *Omitted downside:* dilution and refinancing (A.U11); the inventory reading of the current ratio; a covenant test whose terms are unknown.
- *Management narrative:* absent; the only narrative in the bundle is the secondary analyst's, and the base analysis rebutted it deterministically (A.D06). Correct.
- *False precision:* the base analysis renders 8.73%, 6.63%, 0.91x as exact. The fixture says "approximately 0.91x". The breaker margin is wide here, but the memo should render approximate inputs as approximate. Finding: `LOW`: precision leakage (becomes S3-06).
- *Governance:* uncovered. `UNRESOLVABLE`.
- *Opportunity cost:* no comparator, no price, no cash proxy. Not assessable. The base analysis says so.

Verdict: `MORE_RESEARCH`. Not `BLOCK`: no finding shows the base analysis to be wrong on the evidence; the findings show its evidence to be thin, which the base analysis already states. `RED_TEAM_SILENT: false` (one MEDIUM finding). V-12 support check on findings: each cites A-ids that support it; none `RHETORICAL`.

### Stage 9: Portfolio comparison

```text
alternatives_in_bundle:     none (Case A fixture contains no other holdings or candidates)
cash_comparison:            UNEVALUABLE (no implied return for AQUA-A: no valuation, no price;
                            no cash proxy in rules block)
portfolio_constraints:      position above cap for research level (A.F14) -> ADD blocked;
                            weight and sector exposure UNKNOWN -> concentration UNEVALUABLE
uncertainty_and_downside:   thesis WEAKENED; structural vs temporary UNRESOLVED; dilution
                            UNKNOWN; H1 cash conversion 0.60x
research_depth_limits:      SCREEN+ (undefined level). A position above cap at a research
                            level that lacks a valuation model is, by the rules block's own
                            logic, a position awaiting a research upgrade or a size decision.
                            The rules block says a violation does not authorize a sale.
fresh_look_frame (candidate, held masked):
                            would the committee BUY AQUA-A today? No valuation, no price,
                            weakened thesis, uncovered governance: fresh_look = INVESTIGATE
                            (not PASS: nothing in the bundle shows the business is
                            un-investable; not BUY: nothing supports it)
comparison_table:           NOT RENDERED (no rows)
```

### Stage 10: CIO draft recommendation

```text
position_frame:             HELD
domain_after_all_gates:     {INVESTIGATE, NO_DECISION}
  removed by:               UNRECONCILED snapshot (BUY, ADD, TRIM, EXIT)
                            PRICE_UNKNOWN (BUY, ADD, TRIM)
                            COVERAGE_GAP governance/corporate actions (BUY, ADD)
                            depth cap exceeded (ADD)
                            CALC_MISSING refusal (everything except INVESTIGATE, NO_DECISION)

recommendation:             INVESTIGATE
thesis_status:              WEAKENED (structural_vs_temporary: UNRESOLVED)
fresh_look_recommendation:  INVESTIGATE
interim_posture:            no action. Operationally the position is kept while the
                            named items are obtained. The committee does not certify HOLD:
                            it cannot answer "is this the best use of this capital" without
                            a valuation, and it cannot answer "would we buy it today"
                            either. Nothing supports EXIT: no hard breaker, liquidity
                            minimums met, covenants reported met.

rationale (evidence-cited):
  1. Both margin minimums failed this period (A.F04, A.F06) and operating profit fell
     about 28% on 6.4% revenue growth (A.D01). The thesis is worse off.
  2. FX explains at most about one fifth of the operating-margin decline (A.D06);
     factory overhead grew 8.7% faster than revenue (A.D08). The "mostly temporary"
     reading (A.I01) is not supported by the bundle. Neither is "structural": one period.
  3. No hard breaker is triggered (breaker_eval). BROKEN is not available.
  4. ADD is blocked by the position rule (A.F14) before any valuation question arises,
     and by PRICE_UNKNOWN, COVERAGE_GAP, and an unreconciled snapshot besides.
  5. No defensible valuation exists (Stage 7). No fair value is stated.

data_quality:               all figures fixture-asserted ratios; no absolute cells; no
                            identity checks possible; two breakers UNEVALUABLE; thesis
                            deadline unidentified; governance uncovered.
confidence:                 HIGH that the thesis weakened; LOW on cause; NONE on value.
                            (Bands only, per V2 VA-13.)

missing_evidence (ranked by cost to obtain, cheapest first):
  E1  thesis_date, deadline_period, TTM profit threshold value   [Otta, minutes; from the
      original note]  -> unblocks breaker evaluation
  E2  cap value for SCREEN+ and current weight                   [Otta, minutes]
  E3  absolute segment P&L, two periods, from the H1 report      [extraction run, hours]
  E4  FX loss and import share, prior and current period         [extraction, hours]
  E5  H2 report                                                   [wait one period]
  E6  management quantification of the recovery path             [next filing or public call]
  E7  governance channel coverage (RPT, auditor, corporate actions) [adapter or manual]

what_would_change_the_recommendation:
  -> HOLD (certified): E1..E4 obtained AND a defensible normalized-margin range exists
     AND fresh look ≠ PASS AND snapshot RECONCILED.
  -> EXIT (proposed): feed margin < 10% AND operating margin < 8% in H2 as well
     (composite breaker count reaches 2), OR TTM OCF/profit < 0.8x, OR current ratio < 1.1x,
     OR a covenant breach, OR any governance breaker from a covered channel.
  -> TRIM (proposed): requires a PriceRecord, a RECONCILED snapshot, and a valuation
     range showing the position's weight is not justified by expected return; none exist.

next_monitoring_trigger:    H2 report (breaker_eval re-run on feed margin, operating margin,
                            TTM OCF/profit, current ratio) and any ALWAYS_MATERIAL disclosure.

human_decision:             UNSET
execution_status:           n/a
```

### Stage 11: Proposed memory changes

```text
1. immutable run artifact:
   runs/RUN-20260902-AQUA-A-01/{intake.json, evidence_bundle.json, breaker_eval.json,
   analyst_report.json, red_team_phase_a.json, red_team_phase_b.json, memo_draft.json,
   memory_proposal.json, trigger_proposal.json, manifest.json}
   status: WRITTEN (immutable). Contains the T3 interpretation records A.I01, A.I02 with
   their contradiction links (V2 MC-03: contradicting records must be kept).

2. proposed current-thesis change (NOT applied):
   thesis_status: WEAKENED
   A1 pricing: WEAKENED         evidence: A.F01, A.F04, A.F05, A.D07
   A2 supplier diversification: INSUFFICIENT_EVIDENCE   evidence: none this run
   A3 reformulation: INSUFFICIENT_EVIDENCE             evidence: none this run
   A4 FX control: WEAKENED       evidence: A.F09, A.D05, A.D06
   A5 liquidity (ABSENCE): HOLDING, basis MANAGEMENT_REPORTED   evidence: A.F12, A.F13
   A6 governance (ABSENCE): INSUFFICIENT_EVIDENCE      evidence: coverage gap, no search
   deadline: UNCHANGED (original text preserved verbatim; alignment flagged UNRESOLVED)
   quarters_since_fully_holding: NOT SET (prior history unknown; Writer must refuse to
     initialize a counter without a basis; proposal carries basis: FIRST_OBSERVATION and
     value 1 for Otta to accept or reject as an L2 item)
   structural_vs_temporary: UNRESOLVED (new qualifier field; see G-07)

3. proposed append-only thesis event:
   {kind: STATUS_CHANGE, from: UNKNOWN, to: WEAKENED, run_id: RUN-20260902-AQUA-A-01,
    evidence: [A.F04, A.F06, A.F09, A.D01, A.D06], reason: "both margin minimums failed
    in H1; FX bounded at about one fifth of the decline; no hard breaker"}
   {kind: SPEC_GAP_NOTED, fields: [thesis_date, deadline_period, ttm_profit_threshold],
    action_required: L2}

4. proposed valuation snapshot:
   NONE. Record instead in the run: valuation_status: ABSENT, reason: CALC_MISSING,
   required_inputs: E3, E4 plus share count and net debt. A snapshot with no method
   and no range MUST NOT be written to the valuation history.

5. proposed management-claim update:
   NONE (claims table empty). Note for next run: extract any quantified recovery
   guidance from the H2 filing as new claims with due periods.

6. committee_recommendation: INVESTIGATE (thesis WEAKENED)
7. human_decision: UNSET
8. approval_required_before_canonical_update: YES
   L1 items: thesis event (2), assumption statuses A1..A6
   L2 items: counter initialization (typed reason), SPEC_GAP_NOTED resolution
```

Excluded from the proposal because not decision-useful: the secondary analyst's text beyond its id and contradiction link; the Stage 6 table (fully regenerable from cells); the memo prose.

### Stage 12: Future monitoring

```text
deterministic scheduled checks (T0, no model):
  A-MON-01  on next financial statement: breaker_eval on feed margin (≥10%), operating
            margin (≥8%), TTM OCF/profit (≥0.8x), current ratio (≥1.1x); composite
            failure count increments if both margin minimums fail again
  A-MON-02  share-count continuity (V-13) and CorporateActionRecord scan
  A-MON-03  covenant disclosure presence in notes (cell: covenant_status)
  A-MON-04  guidance extraction: any numeric margin or cost target -> new ManagementClaim
  A-MON-05  thesis spec completeness: run refuses `UNCHANGED`/`STRENGTHENED` while
            deadline_period and ttm_profit_threshold are unset

cheap materiality classification (T1, only after a real document change):
  new disclosures not on the NOT_MATERIAL whitelist; management commentary on cost
  pass-through, supplier changes, reformulation, hedging

events that trigger expensive research / IC review:
  H2 report (persistence test); any quantified recovery guidance; segment disclosure
  change; FX-hedging policy disclosure; import-share disclosure

events that require human escalation (L2 or immediate):
  covenant breach or waiver; going-concern language; rights issue or private placement
  (ALWAYS_MATERIAL); auditor change or non-unqualified opinion; second consecutive
  failure of both margin minimums (composite breaker count = 2 -> BROKEN candidate);
  TTM OCF/profit < 0.8x; current ratio < 1.1x

NOT a trigger: price movement alone (V2 AU-08; PRICE_MOVE forces QUICK)
The original recovery deadline is not moved by any monitoring item above.
```

---

## 3. Case B Full Simulation

**Fixture:** `INDU-B`, watchlist candidate, not held, cyclical industrial services, research level "preliminary", no approved thesis, four prior management claims, one new reporting period, conflicting evidence on customer concentration and capex.

### Stage 0: Run initialization

```text
run_id:                 RUN-20260902-INDU-B-01
intake.question_category: CANDIDATE_SCREEN
intake.trigger_type:    NEW_FILING (period containing Q2 end; fixture calls it "the
                        reporting period"; whether it is a Q2 or H1 report is not stated)
intake.depth:           FULL (V2 has no SCREEN depth for candidates; see S3-09)
intake.held:            FALSE (candidate; no snapshot needed to establish held = FALSE,
                        but a RECONCILED snapshot is needed for any BUY sizing: MISSING)
question_text_audit:    "Is the improvement real, and is INDU-B a BUY?" (stored only)

as_of_boundary:
  reporting_period:     period ending Q2 of the current year (calendar MISSING)
  publication_date:     MISSING
  claims_baseline:      "six months earlier" than the reporting date
  price_record:         market price dated 45 days BEFORE the reporting date
                        -> older than 5 trading days -> PRICE_UNKNOWN
  contract_expiry:      "within nine months" of the reporting date (date MISSING)

position_state:         NOT HELD; research_level: preliminary (not in the Case C cap
                        table: DEEP 15% / SCREEN 8% / unresearched 4%). Mapping of
                        "preliminary" to a cap is undefined -> RULES_INCOMPLETE for sizing
portfolio_state_status: MISSING (fixture: "current portfolio alternatives" unknown)
coverage_map:           FINANCIAL_STATEMENTS: COVERED; SECTOR_VOLUME_SERIES: COVERED (T3
                        whitelisted class: industry volume series); GOVERNANCE (RPT,
                        auditor, shareholder structure): UNCOVERED; CORPORATE_ACTIONS:
                        PARTIAL (one negative statement on rights issue as of the report
                        date); CUSTOMER_CONTRACTS: PARTIAL (expiry known, terms unknown)
allowed_evidence:       Case B section only
known_missing_inputs:   sustainable margin at normalized utilization; contract renewal
                        probability; maintenance capex; full-cycle earnings; independent
                        support for a multi-year runway; current price; portfolio
                        alternatives; net debt level; covenant terms; capacity base for
                        utilization; share count; mandatory extraction targets for BUY
                        (RPT note, auditor and opinion, shareholder structure, contingent
                        liabilities, FX debt): all absent
decision_ready_at_init: thesis establishment: READY (enough to draft a candidate thesis)
                        BUY assessment: NOT READY (PRICE_UNKNOWN; COVERAGE_GAP; mandatory
                        targets absent)
domain_after_S0:        {WATCH, PASS, INVESTIGATE, NO_DECISION}  (BUY removed three ways)
```

### Stage 1: Incoming information

**FACTS**

| id | statement | period |
|---|---|---|
| B.F01 | New facility started commercial operation in the final month of Q2 | Q2 |
| B.F02 | Utilization 72%, prior 58% | reporting period vs prior comparable |
| B.F03 | Revenue +15% yoy | reporting period |
| B.F04 | Gross margin 25%, prior 22% | reporting period vs prior |
| B.F05 | Core operating profit +24% yoy | reporting period |
| B.F06 | Reported profit attributable to owners +80% yoy | reporting period |
| B.F07 | 35% of reported profit came from a one-off asset sale | reporting period |
| B.F08 | Operating cash flow before asset-sale proceeds = 1.05x core operating profit | reporting period |
| B.F09 | Receivable days 76, prior 92 | reporting period vs prior |
| B.F10 | Net debt increased because of facility construction; covenant headroom remained | reporting period (headroom is management-reported) |
| B.F11 | No rights issue announced as of the reporting date | as of report date |
| B.F12 | Primary sector-volume series +9% yoy | reporting period |
| B.F13 | Two of the three largest customers = 46% of revenue | reporting period |
| B.F14 | One major customer contract expires within nine months | as of report date |
| B.F15 | No firm renewal disclosed | as of report date |
| B.F16 | Maintenance capital requirements for the new facility not disclosed | as of report date |
| B.F17 | Valuation snapshot uses a price 45 days before the reporting date | snapshot |

**DERIVED VALUES**

| id | value | formula | status |
|---|---|---|---|
| B.D01 | Recurring attributable profit ≈ +17% yoy (band 16% to 18% on rounding of 80% and 35%) | 1.80 × (1 − 0.35) − 1 = 0.17 | DERIVED (conditional: prior-year profit contained no one-offs; "35% of reported profit" refers to attributable profit). Both conditions UNKNOWN |
| B.D02 | Recurring attributable growth (+17%) trails core operating profit growth (+24%) by ≈ 6 points; relative drag ≈ −5.6% | 1.17 ÷ 1.24 − 1 | DERIVED; consistent with higher interest on increased net debt (B.F10) but attribution UNKNOWN |
| B.D03 | Revenue outgrew the sector volume series by ≈ 5.5% | 1.15 ÷ 1.09 − 1 | DERIVED; price vs share vs mix UNKNOWN; volume series is T3 whitelisted class |
| B.D04 | Core operating margin rose ≈ 7.8% in relative terms | 1.24 ÷ 1.15 − 1 | DERIVED; absolute margin level UNKNOWN |
| B.D05 | Gross margin +3pp on utilization +14pp | B.F04, B.F02 | DERIVED; consistent with fixed-cost absorption; direction only |
| B.D06 | Receivables balance fell ≈ 5% despite revenue +15% | (76 ÷ 92) × 1.15 = 0.95 | DERIVED (assumes same day-count convention both periods); implies working-capital release |
| B.D07 | Facility contributed at most about one month of the period's operations | B.F01 | DERIVED; its steady-state effect is not in these numbers |
| B.D08 | Revenue at risk from the expiring contract lies in [0%, 46%] | B.F13, B.F14 | DERIVED bound; the expiring customer's own share is UNKNOWN |
| B.D09 | Price staleness: 45 days > 5 trading days | B.F17 vs V2 D-31 rule | DERIVED; PRICE_UNKNOWN |

**INTERPRETATIONS**

| id | statement | author |
|---|---|---|
| B.I01 | "Demand remains strong" | management (narrative) |
| B.I02 | "Utilization has reached our target earlier than expected" | management (self-assessment of claim B.M02) |
| B.I03 | "The new facility creates a multi-year growth runway" | management (forward narrative; no metric, no date) |
| B.I04 | The improvement is genuine operating improvement (Analyst reading of B.F03..B.F09) | Analyst; must not be promoted to fact |

**MANAGEMENT CLAIMS** (recorded six months before the reporting date)

| id | claim | metric | deadline | evaluable |
|---|---|---|---|---|
| B.M01 | New facility operational by end of Q2 | binary: commercial operation | end Q2 | YES |
| B.M02 | Utilization above 70% by year-end | utilization ≥ 70% | year-end | YES |
| B.M03 | Working-capital discipline would improve | none numeric | none | NO (V2 MG-01) |
| B.M04 | Growth would not require a dilutive rights issue during the current year | binary: no rights issue | year-end | YES |

**UNKNOWN**

| id | unknown | why it matters |
|---|---|---|
| B.U01 | Whether prior-year profit had one-offs | B.D01 collapses if it did |
| B.U02 | What "35% of reported profit" is 35% of (attributable, pre-tax, or net) | B.D01 |
| B.U03 | Capacity base for the 58% and 72% utilization figures | if the new facility enlarged the denominator only in the last month, 72% is not like-for-like |
| B.U04 | Sustainable margin at normalized utilization | any valuation |
| B.U05 | Maintenance capex of the new facility | free cash flow; B.F16 |
| B.U06 | Net debt level, interest cost, covenant terms and headroom magnitude | B.F10 is qualitative |
| B.U07 | Share of revenue from the expiring customer; renewal terms | B.D08 |
| B.U08 | Whether the receivable-days improvement is customer-mix driven (two customers = 46%) or broad | B.D06 |
| B.U09 | Full-cycle earnings through a downturn | cyclical pack requirement |
| B.U10 | Current price, ADTV, free float, controlling group, auditor, RPT | BUY domain |
| B.U11 | Whether the reporting period is Q2 standalone or H1 cumulative | period_kind for every yoy figure; V2 EV-01 |

**CONTRADICTIONS**

| id | records | nature |
|---|---|---|
| B.X01 | B.I01 "demand remains strong" vs B.F13, B.F14, B.F15 | Demand is concentrated in two customers, one contract expires within nine months with no firm renewal disclosed; the narrative omits the largest identifiable risk |
| B.X02 | B.I03 "multi-year runway" vs B.F16, B.F10 | A runway claim with undisclosed maintenance capex and rising net debt is not evaluable; it is a claim about the future with no metric |
| B.X03 | B.F06 (+80%) vs B.F05 (+24%) and B.D01 (+17%) | Headline profit growth is more than three times underlying growth; the difference is the one-off |
| B.X04 | B.I02 "earlier than expected" vs B.M02 "by year-end" and B.D07 | The target was a year-end level; a single reading two quarters early at 72% on a possibly changed capacity base (B.U03) supports MET, not a step change |
| B.X05 | B.F17 stale price vs any current valuation statement | A valuation snapshot on a 45-day-old price cannot support a current BUY |

### Stage 2: Evidence bundle

| evidence_id | source_type | tier | period | freshness | epistemic | verification | doc/page/hash | contradicts |
|---|---|---|---|---|---|---|---|---|
| B.F01..B.F11, B.F13..B.F16 | FIXTURE_PRIMARY | T1/T2-equivalent | current period (calendar MISSING) | CURRENT_PERIOD | DIRECT | FIXTURE_ASSERTED | MISSING | see B.X01..B.X04 |
| B.F12 | FIXTURE_PRIMARY (industry series) | T3 whitelisted class | current period | CURRENT_PERIOD | DIRECT (series) | FIXTURE_ASSERTED | MISSING | none |
| B.F17 | FIXTURE_RULE (snapshot metadata) | n/a | 45 days pre-report | STALE(45d) | DIRECT | FIXTURE_ASSERTED | MISSING | B.X05 |
| B.M01..B.M04 | FIXTURE_PRIMARY (management statements) | T2-equivalent | six months before report | PRIOR_PERIOD | DIRECT (claim text) | FIXTURE_ASSERTED | MISSING | n/a |
| B.I01..B.I03 | FIXTURE_PRIMARY (management narrative) | T2-equivalent | current | CURRENT_PERIOD | INFERRED (author's) | FIXTURE_ASSERTED | MISSING | B.X01, B.X02, B.X04 |
| B.D01..B.D09 | script | n/a | current | CURRENT_PERIOD | DERIVED | recomputable | script sim-1 | B.X03 |

Bundle flags: `completeness: PARTIAL`; `coverage_map` as Stage 0; `one_off_items: [{id: B.F07, kind: GAIN, share_of_reported_profit: 0.35, recurrence_check: UNEVALUABLE (no cell store)}]`; `price_status: STALE`; `guidance_records: 4 (B.M01..B.M04)`; `injection_detector: no hits`.

### Stage 3: Deterministic checks

| check | validator | result |
|---|---|---|
| Period alignment | V-07 | `PERIOD_KIND_UNKNOWN` (B.U11): every yoy figure is accepted as like-for-like because the fixture presents them so, but a production run would refuse standalone derivation until `period_kind` is set. Facility start in the final month of Q2 means the period contains at most one month of facility contribution (B.D07) |
| Arithmetic | CALC | B.D01..B.D09 recomputed; B.D01 rendered as a band (16% to 18%) because both operands are rounded |
| One-off adjustment | recurrence + script | recurring profit = reported × (1 − 0.35); recurrence check against prior N periods `UNEVALUABLE` (empty cell store); flag `ONE_OFF_ASSERTED_BY_ISSUER`; symmetric rule applied: no one-off losses disclosed to add back |
| Cash conversion | CALC | OCF ex asset sale ÷ core operating profit = 1.05x. Note: this is conversion against operating profit, not net profit; the two are not interchangeable and the memo must label the denominator |
| Stale data | V-07, D-31 | price 45 days old → `PRICE_UNKNOWN`; valuation snapshot built on it → `NO_VALID_VALUATION` for comparison purposes |
| Duplicate detection | V-09 | B.I02 is management's restatement of the outcome of B.M02; it is linked as `SELF_ASSESSMENT` and MUST NOT be the `outcome_evidence_id` (V2 TD-08). The outcome evidence is B.F02 |
| Position / sector cap | limit checker | `RULES_INCOMPLETE: cap[preliminary] undefined`; `SNAPSHOT_MISSING`; any BUY sizing refused |
| Liquidity | gate | `LIQUIDITY_UNKNOWN`; large-cap status unknown → treated as non-large-cap → BUY removed |
| Mandatory extraction targets for BUY | pack targets | RPT note, auditor and opinion, shareholder structure, contingent liabilities, FX debt: all `MISSING` → `INVESTIGATE` cap on BUY |
| Claim evaluability | MG-01 | B.M01 YES, B.M02 YES, B.M03 NO, B.M04 YES |
| Claim outcome (numeric) | CALC | B.M02: 72% ≥ 70% → threshold met before deadline (evidence B.F02) |
| Claim due-date scan | TD-07 | B.M01 due (end Q2): CLOSABLE. B.M02 due year-end: not yet due but threshold observed. B.M04 due year-end: OPEN. No `UNRESOLVED_PAST_DUE` |
| Schema completeness | validator | `MISSING: period_kind, publication_date, calendar dates, absolute cells, net debt, share count, capacity base, price (fresh), ADTV, RPT, auditor, shareholder structure, maintenance capex, expiring-customer share` |
| Breaker evaluation | V-16 | no established thesis → no breakers to evaluate; `NOT_APPLICABLE` |

### Stage 4: Thesis comparison

```text
prior_thesis_state:     NONE. thesis_lifecycle: NOT_ESTABLISHED
thesis_status:          NOT_ESTABLISHED

The system MUST record NOT_ESTABLISHED before anything else. Only then may it propose
a candidate thesis, and the proposal lives in memory_proposal.json, never in canonical
state, until Otta approves it.

candidate_thesis_draft (PROPOSED, not canonical; thresholds are proposals for Otta):
  claim:      INDU-B's new facility raises sustainable utilization and operating margin
              above pre-facility levels, with recurring (ex one-off) profit growth funded
              without a dilutive rights issue, and with the expiring major-customer
              contract renewed or replaced.
  assumptions:
    B-A1 (TREND)     utilization holds ≥ 65% for two consecutive quarters after the
                     facility's first full quarter          status: INSUFFICIENT_EVIDENCE
                     (one reading at 72%, capacity base unknown B.U03)
    B-A2 (TREND)     gross margin holds ≥ 24% at that utilization  status: INSUFFICIENT_EVIDENCE
    B-A3 (POSITIVE)  recurring profit growth ≥ sector volume growth  status: HOLDING on one
                     period (B.D01 +17% vs B.F12 +9%), conditional on B.U01
    B-A4 (POSITIVE)  cash conversion (OCF ÷ core operating profit) ≥ 0.9x  status: HOLDING
                     on one period (B.F08)
    B-A5 (ABSENCE)   no dilutive rights issue in the current year  status: INSUFFICIENT_EVIDENCE
                     (B.F11 covers "as of reporting date" only; NegativeSearchRecord
                     required each run)
    B-A6 (POSITIVE)  expiring major-customer contract renewed or replaced before expiry
                     status: INSUFFICIENT_EVIDENCE (B.F15)
    B-A7 (POSITIVE)  maintenance capex disclosed and ≤ a share of operating cash flow
                     (threshold to be set from disclosure)   status: INSUFFICIENT_EVIDENCE
  breakers (breaker_spec):
    numeric:      utilization < 60% for two consecutive quarters; receivable days > 90;
                  OCF ÷ core operating profit < 0.7x for two consecutive periods
    qualitative:  rights issue announced (CorporateActionRecord); major-customer contract
                  lost without replacement (DIRECT disclosure); covenant breach
  deadline:     first full-year result after facility start (period id to be set)
  origin_flag:  GUIDANCE_DERIVED for B-A1, B-A5 (they restate management claims B.M02,
                B.M04); these MUST NOT sit in a base valuation scenario while the claims
                table is below the D-18 threshold

new_evidence:           B.F01..B.F17, B.D01..B.D09
unchanged_assumptions:  n/a (no prior)
changed_assumptions:    n/a
missing_evidence:       B.U01..B.U11
deadline_status:        n/a for thesis; claim deadlines in Stage 5
```

Why `NOT_ESTABLISHED` and not `STRENGTHENED`: there is no thesis to strengthen. Recording "improving fundamentals" as a thesis status would let a management narrative become canonical memory in one step. The genuine operating improvement (B.F03, B.F04, B.F05, B.F08, B.F09) is captured as `HOLDING on one period` inside the proposed assumptions, which is the correct place for it.

### Stage 5: Management track record

```text
MANAGEMENT CLAIM                              → DEADLINE   → OBSERVED RESULT                    → STATUS
B.M01 facility operational by end of Q2       → end Q2     → commercial operation in final      → MET
                                                             month of Q2 (B.F01)                  (evidence: B.F01, DIRECT; margin: days)
B.M02 utilization > 70% by year-end           → year-end   → 72% at the reporting date (B.F02)  → MET (early)
                                                                                                    not EXCEEDED: 2pp over target on one
                                                                                                    reading with capacity base unknown
                                                                                                    (B.U03); persistence to year-end
                                                                                                    unobserved; re-evaluate at year-end
B.M03 working-capital discipline improves     → none       → receivable days 92 → 76 (B.F09);   → UNEVALUABLE
                                                             inventory and payables unknown        (no numeric target; proxy improved;
                                                                                                    excluded from hit rate; rendered as
                                                                                                    evidence for B-A4, not as a claim score)
B.M04 no dilutive rights issue this year      → year-end   → none announced as of report date   → OPEN (PARTIAL evidence; not yet due;
                                                             (B.F11); net debt rose (B.F10)        the pressure that would motivate one
                                                                                                    exists; NegativeSearchRecord required
                                                                                                    at each run until year-end)

closed_evaluable_claims:  1 (B.M01). B.M02 is observed but not due; closing it early would
                          let a favourable early reading count before the deadline
hit_rate:                 NOT RENDERED (below D-18 threshold of six closed evaluable claims)
unevaluable_count:        1 (rendered as its own signal per V2 MG-01)
credibility_language:     none. "Earlier than expected" (B.I02) is management's phrasing and
                          carries no weight. Confident language is not evidence.
guidance_in_base_case:    FORBIDDEN (D-18 not met). B.I03 "multi-year runway" has no metric
                          and no date: it is not a claim and cannot enter the claims table.
```

### Stage 6: Financial impact

| line | direction | magnitude class | basis | confidence |
|---|---|---|---|---|
| Revenue | UP | +15%, ≈5.5% above sector volume | B.F03, B.D03 | HIGH on level; decomposition UNKNOWN |
| Gross margin | UP | +3pp | B.F04 | HIGH; sustainability at normalized utilization UNKNOWN (B.U04) |
| Core operating profit | UP | +24% | B.F05 | HIGH |
| Recurring attributable profit | UP | ≈ +16% to +18% | B.D01 | MEDIUM (conditional on B.U01, B.U02) |
| Reported attributable profit | UP | +80%, of which 35% one-off | B.F06, B.F07 | HIGH on fact; NOT a basis for valuation |
| Operating cash flow (ex asset sale) | UP, converting at 1.05x core operating profit | B.F08 | HIGH; denominator is operating profit |
| Working capital | RELEASED | receivable days −16; balance ≈ −5% | B.F09, B.D06 | MEDIUM (customer-mix effect unknown B.U08) |
| Balance sheet | Net debt UP; covenant headroom reported | B.F10 | MEDIUM (management-reported; magnitudes UNKNOWN) |
| Free cash flow | UNKNOWN | maintenance capex undisclosed | B.F16 | NONE |
| Dilution risk | OPEN | none announced; debt rising; capex unknown | B.F10, B.F11, B.F16 | cannot be closed this period |
| Revenue concentration risk | HIGH and UNCHANGED by the results | 46% from two customers; one contract expiring | B.F13, B.F14, B.F15 | HIGH (fact) |

### Stage 7: Valuation

```text
method_category:        cyclical industrial services: through-cycle normalized earnings
                        (mid-cycle utilization × mid-cycle margin), enterprise-value basis
                        with net debt deducted, and a maintenance-capex-adjusted cash
                        earnings cross-check. Peak-on-peak forbidden (V2 industrial pack).
                        Any multiple requires the implied-growth/ROIC cross-check (VA-05).

valid_inputs:           none sufficient. Available: one period of margins and growth at a
                        utilization that may be a cyclical high (B.F12 sector +9%) with one
                        month of new capacity.
invalid_or_stale:       B.F17 price (45 days) -> any "current" upside figure is invalid;
                        B.F06 headline profit (contains one-off) -> invalid as earnings base;
                        B.I03 runway -> not an input;
                        72% utilization as "normal" -> peak-on-peak risk, invalid as base
assumptions_required:   normalized utilization (pack axis, bounds to be set from history;
                        no history in fixture -> OUTSIDE_HISTORY), normalized gross margin,
                        maintenance capex (B.U05), net debt (B.U06), share count, cost of
                        equity (floor D-19 unset), contract-loss scenario (B.D08 bound)
defensible_range:       NO. CALC_MISSING on every pack-mandatory piece. A BUY valuation is
                        REFUSED. This is exactly the control the case pack asks for: the
                        stale price and the missing capex make any comparison unreliable.
calculation_artifact_required:
                        calc_output.json with sensitivity axes {utilization, gross margin,
                        maintenance capex, revenue-at-risk from contract in [0, 46%]} at
                        pack-owned bounds; pro-forma share count if any capital action is
                        announced; implied-growth cross-check for any multiple used.
target_price:           NOT PRODUCED
```

### Stage 8: Independent adversarial review

**Phase A (blind)**

Own reading of the bundle before seeing the Analyst: the operating facts are strong for one period (B.F03, B.F04, B.F05, B.F08, B.F09). Own top risks:

1. **Cycle, not step change.** Sector volume is +9% (B.F12). A cyclical services company at rising utilization shows exactly this margin pattern (B.D05) on the way up and the mirror image on the way down. One month of new capacity (B.D07) cannot be the cause of a full period's improvement. The improvement is real; its persistence is unproven and its attribution to the facility is unsupported.
2. **The denominator problem.** If the capacity base changed in the last month, 72% is not comparable to 58% (B.U03). The claim scored `MET` in Stage 5 rests on a figure whose definition is unknown.
3. **Concentration is the thesis-killer and management did not mention it.** Up to 46% of revenue depends on two customers and one contract expires within nine months with no firm renewal (B.F13..B.F15). Any base case must carry a contract-loss branch. B.X01 stands.
4. **Working-capital improvement may be the customers' doing, not the company's.** Two customers paying faster would move receivable days by this much (B.U08). B.M03 cannot be credited.
5. **Financing shape.** Facility construction funded by rising net debt and an asset sale (B.F07, B.F10), maintenance capex undisclosed (B.F16), and the no-rights-issue claim untested until year-end (B.M04). The "no dilution" comfort is calendar-dependent.

Divergence statement after seeing the Analyst: `LOW` on assumption statuses (both sides land on INSUFFICIENT_EVIDENCE for most); `MEDIUM` on emphasis: the Analyst framed the case as "genuine improvement with risks", the blind phase framed it as "cyclical upswing with one unmodelled binary risk". Same facts, different centre of gravity. Rendered in the memo as `red_team_phase_divergence`.

**Phase B**

Strongest credible case the base analysis is wrong:

*The base analysis is too generous.* It calls B.D01 (+17% recurring) "genuine improvement". That number assumes the prior year had no one-offs (B.U01) and that the 35% is of attributable profit (B.U02). If the prior year contained a one-off loss, recurring growth is lower; if "35% of reported profit" is of pre-tax profit, the attributable share differs. The base analysis carries these caveats in a footnote and the headline in the text. Finding `MEDIUM`: the memo MUST render B.D01 as conditional in the same sentence, not below it. Also: the candidate thesis draft (Stage 4) is built from management's own four claims. The system then "verifies" a thesis whose frame management wrote. The `GUIDANCE_DERIVED` flag is applied, which is the V2 control, but the frame itself was never independently generated. Finding `MEDIUM`: the candidate thesis MUST include at least one assumption management did not propose (B-A6 contract renewal and B-A7 maintenance capex qualify; the memo should say that explicitly).

*The base analysis is too cautious.* A company that outgrew its sector by 5.5 points, expanded gross margin 3pp, converted at 1.05x, cut receivable days by 16, and delivered a facility on time is doing something right, and `WATCH` risks missing the entry while the committee waits for a maintenance-capex footnote. Response: the domain already excludes BUY on price staleness alone (B.D09); the caution is a consequence of the evidence calendar, not of temperament. The correct response to "we might miss it" is to name the fastest unblock (a fresh PriceRecord and a FULL run), which Stage 10 does. Finding: `LOW`, no change.

Audit items:

- *Circular assumptions:* the thesis frame is management's (above). Partially mitigated by B-A6, B-A7.
- *Source quality:* B.F10 headroom and B.F11 are as-of statements; B.F12 is a T3 whitelisted series and correctly never enters a cell.
- *Omitted downside:* contract loss branch not yet modelled; downturn earnings (B.U09); maintenance capex (B.U05).
- *Management narrative:* B.I01..B.I03 excluded from every derived value and from the claims table. `MET` on B.M01 and B.M02 came from B.F01 and B.F02, not from B.I02. Correct.
- *False precision:* "+17%" is a band; "72%" has an unknown denominator. Both flagged.
- *Governance:* uncovered. `UNRESOLVABLE` (checklist item 5) → verdict `MORE_RESEARCH` minimum regardless of the rest.
- *Opportunity cost:* no alternatives, no price, no cash proxy. Not assessable.

Verdict: `MORE_RESEARCH`. `RED_TEAM_SILENT: false` (two MEDIUM findings). V-12: all findings supported by cited ids.

### Stage 9: Portfolio comparison

```text
alternatives_in_bundle:     none (fixture: "current portfolio alternatives" unknown)
cash_comparison:            UNEVALUABLE (no fresh price, no range, no cash proxy)
portfolio_constraints:      cap for "preliminary" undefined (RULES_INCOMPLETE); sector
                            exposure UNKNOWN; position count UNKNOWN; liquidity UNKNOWN
concentration:              n/a (not held)
uncertainty_and_downside:   binary contract risk with revenue at risk in [0, 46%];
                            cyclical downturn unmodelled; dilution open
research_depth_limits:      preliminary. Even if every gate passed, the largest cap that
                            could apply is the SCREEN cap (8%) after a research upgrade,
                            or the unresearched cap (4%) as is. Which applies is DECISION
                            REQUIRED (G-03).
fresh_look_frame:           not applicable: for a candidate the candidate frame IS the
                            frame. The second CIO call adds nothing (S3-08).
comparison_table:           NOT RENDERED
```

### Stage 10: CIO draft recommendation

```text
position_frame:             NOT HELD
domain_after_all_gates:     {WATCH, PASS, INVESTIGATE, NO_DECISION}
  BUY removed by:           PRICE_UNKNOWN (45-day price); COVERAGE_GAP governance;
                            mandatory extraction targets missing (INVESTIGATE cap on BUY);
                            LIQUIDITY_UNKNOWN; RULES_INCOMPLETE (cap for preliminary);
                            CALC_MISSING on valuation
  (V2 as written applies CALC_MISSING as a global refusal, which would also remove WATCH
   and PASS and leave {INVESTIGATE, NO_DECISION}. This simulation records that outcome as
   a V2 defect (S3-09) and shows the recommendation the evidence supports.)

recommendation:             WATCH
thesis_status:              NOT_ESTABLISHED (candidate thesis proposed for approval)

rationale (evidence-cited):
  1. Operating improvement is real for one period: revenue +15% vs sector +9% (B.F03,
     B.F12, B.D03); gross margin +3pp (B.F04); core operating profit +24% (B.F05);
     cash conversion 1.05x (B.F08); receivable days −16 (B.F09).
  2. Headline profit growth of +80% is not the earnings base: 35% is a one-off asset
     sale (B.F07); recurring attributable growth is ≈ +16% to +18%, conditional on the
     prior year containing no one-offs (B.D01, B.U01).
  3. Two of four management claims are MET on primary evidence (B.M01, B.M02); one is
     UNEVALUABLE (B.M03); one is OPEN until year-end (B.M04). The track record is too
     short to admit guidance into a base case (D-18). "Multi-year runway" (B.I03) is
     narrative and enters nothing.
  4. The largest risk is unaddressed by the results: two customers = 46% of revenue,
     one contract expiring within nine months, no firm renewal (B.F13..B.F15).
  5. No BUY valuation can be produced: the price is 45 days stale (B.F17), maintenance
     capex is undisclosed (B.F16), and the pack-mandatory normalized-earnings inputs
     are absent (Stage 7).
  6. Not PASS: nothing in the bundle shows the business to be un-investable; the
     operating evidence justifies the cost of a FULL run once the unblocks exist.
  7. Not INVESTIGATE: the missing items are dated external events (price, filing,
     contract) more than open research questions; WATCH with named triggers is the
     accurate state.

data_quality:               single period; period_kind unknown; ratios only; one-off
                            asserted by issuer with no recurrence history; price stale;
                            governance uncovered; capacity base unknown.
confidence:                 HIGH that operations improved this period; LOW that the
                            improvement is the facility's rather than the cycle's; NONE
                            on value.

missing_evidence (cheapest first):
  E1  fresh PriceRecord (≤ 5 trading days) and ADTV               [adapter or manual, minutes]
  E2  period_kind and calendar for the reporting period            [extraction, minutes]
  E3  research-level mapping for "preliminary" (cap)               [Otta, minutes; G-03]
  E4  mandatory BUY targets: RPT note, auditor and opinion, shareholder structure,
      free float, contingent liabilities, FX debt                  [extraction, hours]
  E5  maintenance capex disclosure or an anchored estimate         [filing or IR]
  E6  expiring customer's revenue share and renewal status         [disclosure]
  E7  prior-year one-off history (for B.D01) and 3+ years of cells [extraction]
  E8  next quarter: utilization on a stated capacity base, margin at that utilization

what_would_change_the_recommendation:
  -> BUY: E1..E5 obtained; FULL run with calc_output.json on pack axes including a
     contract-loss branch; base-range low end clears the hurdle (D-21 values set);
     bear drawdown within limit; Red Team not BLOCK; liquidity gate passed; snapshot
     RECONCILED; size within the applicable cap.
  -> PASS: rights issue announced (B-A5 broken; B.M04 MISSED); contract lost without
     replacement (B-A6 broken); utilization < 60% for two consecutive quarters; or the
     one-off proves recurring (recurrence check fails on the next filing).
  -> INVESTIGATE: a restatement, an auditor event, or an RPT disclosure once governance
     is covered.

next_monitoring_trigger:    contract expiry window (date to be set from E6); next quarterly
                            filing (utilization, margin, receivable days, net debt);
                            any CorporateActionRecord.

human_decision:             UNSET
```

### Stage 11: Proposed memory changes

```text
1. immutable run artifact: runs/RUN-20260902-INDU-B-01/ (as Case A structure). Includes
   B.I01..B.I03 with contradiction links; includes B.F17 staleness record.

2. proposed current-thesis change (NOT applied):
   create ThesisState INDU-B with thesis_lifecycle: NOT_ESTABLISHED and an attached
   candidate_thesis (Stage 4 draft) awaiting approval. On approval the Writer sets
   ESTABLISHED and freezes the original with hash; until then no canonical thesis exists.
   research_level: preliminary (mapping DECISION REQUIRED)
   pack: industrial_services; pack_flags: [CUSTOMER_CONCENTRATED, CYCLICAL]
   controlling_group, free_float, fiscal_year_end: MISSING (M-08)

3. proposed append-only thesis event:
   {kind: THESIS_PROPOSED, run_id: RUN-20260902-INDU-B-01, evidence: [B.F01..B.F16,
    B.D01, B.D03], origin_flags: {B-A1: GUIDANCE_DERIVED, B-A5: GUIDANCE_DERIVED},
    independent_assumptions: [B-A6, B-A7]}

4. proposed valuation snapshot:
   NONE. Record valuation_status: ABSENT, reason: CALC_MISSING and PRICE_UNKNOWN;
   the existing 45-day snapshot is marked stale: TRUE, usable_for_comparison: FALSE.

5. proposed management-claim update:
   B.M01: status MET, outcome_evidence_id: B.F01, closed_at: this run
   B.M02: status OBSERVED_AHEAD (target level met on one reading), due: year-end,
          outcome_evidence_id: B.F02, note: capacity base unknown; NOT closed
   B.M03: evaluable: FALSE, status UNEVALUABLE, proxy_evidence: B.F09 (receivable days)
   B.M04: status OPEN, due: year-end, latest_negative_evidence: B.F11 (as of report date),
          requires NegativeSearchRecord each run
   (V2 has no OBSERVED_AHEAD state; the alternative is leaving B.M02 OPEN with a note.
    Adopting the state is proposed in V3, G-10.)

6. committee_recommendation: WATCH (thesis NOT_ESTABLISHED; candidate thesis proposed)
7. human_decision: UNSET
8. approval_required_before_canonical_update: YES
   L1: claim records B.M01..B.M04; ThesisState creation with NOT_ESTABLISHED
   L2: candidate thesis approval (sets ESTABLISHED); research-level mapping
```

### Stage 12: Future monitoring

```text
deterministic scheduled checks (T0):
  B-MON-01  contract-expiry countdown from E6 date; at T−90 days with no renewal disclosure
            -> escalation item
  B-MON-02  CorporateActionRecord scan each run (rights issue, placement) -> B.M04, B-A5
  B-MON-03  on each filing: utilization (with capacity base cell), gross margin, receivable
            days, net debt, OCF ÷ core operating profit; breaker_eval once thesis approved
  B-MON-04  one-off recurrence check on the next two filings (was the asset sale isolated?)
  B-MON-05  claim due-date scan: B.M02 and B.M04 close at year-end from T1 cells only
  B-MON-06  price freshness for any future FULL run

cheap materiality classification (T1, after a document change):
  customer announcements; capacity or facility disclosures; management commentary on
  contract negotiations; capex guidance

events that trigger expensive research / IC review:
  contract renewal or loss disclosure; maintenance capex disclosure; first full quarter
  of facility operation; any change in the top-customer share; fresh price plus E4
  targets available (unblocks a FULL run toward BUY)

events that require human escalation:
  rights issue or placement announced (ALWAYS_MATERIAL; B.M04 -> MISSED); contract loss;
  covenant breach; auditor event; restatement of the period that produced B.F03..B.F09

pack gap recorded: V2's ALWAYS_MATERIAL list has no category for a major-customer
contract event. For packs flagged CUSTOMER_CONCENTRATED it must (G-08).
```

---

## 4. Case C Full Simulation

**Fixture:** Rp20 million cash against four uses: add to `BANK-A`, add to `CONSUMER-B`, add to `PROPERTY-C`, buy `VALUE-D`, split, or keep cash. One fixed synthetic portfolio snapshot. Binding rules: position count, sector limit, research-depth caps, cash allowed.

This case exposed the first structural gap in V2 before Stage 1: V2 has no run type for a question that spans several tickers. Every V2 run is keyed to one ticker with a per-ticker lock. The simulation therefore ran the case as an `ALLOCATION` run that V2 does not define, and records that as finding S3-03 and change V3-03.

### Stage 0: Run initialization

```text
run_id:                 RUN-20260902-PORTFOLIO-01      (format extension: no ticker key;
                        V2 has no such run type)
intake.question_category: ALLOCATION                  (not in V2's enum)
intake.trigger_type:    HUMAN_QUESTION
intake.depth:           FULL
question_text_audit:    "I have Rp20 million in cash. Should I add to an existing
                        holding, buy VALUE-D, split the money, or keep cash?"
                        (stored; only the structured fields below propagate)
intake.alternatives:    [ADD BANK-A, ADD CONSUMER-B, ADD PROPERTY-C, BUY VALUE-D,
                         SPLIT, HOLD_CASH]
intake.cash_available:  Rp20,000,000

as_of_boundary:         one fixed snapshot, date MISSING; all figures "synthetic and one
                        fixed snapshot"

portfolio_state (fixture):
  total_value:          Rp320m (incl. cash)      invested: Rp300m     cash: Rp20m (6.25%)
  position_count:       6 (max 8; target count UNKNOWN)
  sector_limit:         25%
  caps_by_depth:        DEEP 15% / SCREEN 8% / unresearched or external signal 4%
  sector_map:           PARTIAL. Known: financial sector 40% (Rp128m), of which BANK-A
                        Rp75m; the other Rp53m of financials sits in one or more of the
                        three positions the fixture does not describe. Sectors of
                        CONSUMER-B, PROPERTY-C, VALUE-D are implied by name only; the
                        sectors and values of the three undescribed positions (Rp136m
                        after removing the Rp53m of financials) are UNKNOWN.
  ledger_check:         UNAVAILABLE -> UNRECONCILED (fixture-asserted snapshot; no ledger)
  cost_basis:           NOT AN INPUT
  cash_proxy_yield:     UNSET (rules block; needed for V-15 hurdle)   -> RULES_INCOMPLETE
  bear_drawdown_limit:  UNSET (D-21)                                   -> RULES_INCOMPLETE
  large_cap_list:       UNSET (D-20)                                   -> liquidity gate
                                                                          UNEVALUABLE
price_records:          none dated. CONSUMER-B's valuation range implies a price; the
                        fixture says its evidence is "current"; VALUE-D's P/E and P/B
                        imply a price of unknown date; PROPERTY-C's discount to NAV
                        implies a price of unknown date.
                        status: FIXTURE_ASSERTED_CURRENT for CONSUMER-B; UNDATED otherwise
liquidity_records:      none
coverage_map:           GOVERNANCE: PARTIAL (RPT facts disclosed for PROPERTY-C, VALUE-D
                        but unassessable); CORPORATE_ACTIONS: UNCOVERED; PRICE: PARTIAL

allowed_evidence:       Case C section only
known_missing_inputs:   snapshot date; sector map for all positions; cash proxy; drawdown
                        limit; large-cap list; price dates; ADTV; valuation horizon for
                        CONSUMER-B's range; NAV methodology and land anchor for PROPERTY-C;
                        VALUE-D normalized-earnings model; governance-discount method;
                        details and dates of VALUE-D's two missed deadlines; sectors of
                        VALUE-D and the three undescribed positions

decision_ready_at_init: gate evaluation: READY for count, depth caps, financial-sector
                        gate; UNEVALUABLE for hurdle, liquidity, non-financial sector
                        checks. Comparative judgment: READY on the evidence given.
                        Capital deployment: NOT READY under strict V2 (RULES_INCOMPLETE,
                        UNRECONCILED). Cash: always ready.
```

### Stage 1: Incoming information

**FACTS**

| id | statement |
|---|---|
| C.F01 | Total portfolio Rp320m; invested Rp300m; cash Rp20m |
| C.F02 | Position count 6; maximum 8 |
| C.F03 | Maximum sector exposure 25% |
| C.F04 | Caps: DEEP 15%, SCREEN 8%, unresearched/external signal 4% |
| C.F05 | Cash is an allowed outcome |
| C.F06 | BANK-A Rp75m; financial-sector exposure 40%; grandfathered; research quality high; outlook stable; no new financial-sector purchase while above limit |
| C.F07 | CONSUMER-B Rp24m; DEEP; evidence current and primary-source grounded; balance sheet conservative; thesis quality high; upside not spectacular |
| C.F08 | CONSUMER-B valuation range: bear ≈ −15%, base ≈ +18%, bull ≈ +28% (horizon not stated) |
| C.F09 | PROPERTY-C Rp12m; SCREEN; trades at ≈ 60% discount to a stated NAV estimate; NAV estimate 11 months old; related-party transaction disclosed, fairness unresolved; cash conversion weak |
| C.F10 | VALUE-D not held; SCREEN; trailing P/E 5x; P/B 0.6x; revenue flat three years; reported earnings +8% last year |
| C.F11 | VALUE-D operating cash flow < 40% of reported profit in two consecutive years |
| C.F12 | VALUE-D capex high with no disclosed ROIC target |
| C.F13 | VALUE-D controlling shareholder 78%; two related-party transactions lack information to assess fairness |
| C.F14 | VALUE-D management missed two previously announced expansion deadlines |
| C.F15 | No validated normalized-earnings model and no governance-discount methodology exist (system state, not company fact) |

**DERIVED VALUES** (all arithmetic on fixture values; the percentage weights the fixture states were recomputed and agree)

| id | value | formula |
|---|---|---|
| C.D01 | Cash 6.25%; BANK-A 23.44%; CONSUMER-B 7.50%; PROPERTY-C 3.75% | ÷ 320 |
| C.D02 | Non-BANK-A financial exposure Rp53m (16.56%) | 0.40 × 320 − 75 |
| C.D03 | Undescribed positions: Rp189m, of which ≥ Rp53m financial and Rp136m of UNKNOWN sector | 300 − (75 + 24 + 12); minus C.D02 |
| C.D04 | CONSUMER-B after +Rp20m: Rp44m = 13.75% ≤ 15% cap. Headroom to cap: Rp24m | (24 + 20) ÷ 320; 0.15 × 320 − 24 |
| C.D05 | PROPERTY-C after +Rp20m: Rp32m = 10.00% > 8% cap. Maximum permitted add: Rp13.6m | (12 + 20) ÷ 320; 0.08 × 320 − 12 |
| C.D06 | VALUE-D at Rp20m: 6.25% ≤ 8% SCREEN cap; position count would be 7 ≤ 8 | 20 ÷ 320 |
| C.D07 | BANK-A after any add: financial exposure > 40% > 25% | gate fails regardless of size |
| C.D08 | VALUE-D cash-adjusted P/E > 12.5x | 5 ÷ 0.40 (OCF < 40% of profit, so P/OCF exceeds 12.5x) |
| C.D09 | VALUE-D implied trailing ROE ≈ 12%; implied cash ROE < 4.8% | P/B ÷ P/E = 0.6 ÷ 5; × 0.40 |
| C.D10 | VALUE-D "45% upside" implies a target P/E ≈ 7.25x or target P/B ≈ 0.87x; on cash earnings the same target is > 18x P/OCF | 5 × 1.45; 0.6 × 1.45; 12.5 × 1.45 |
| C.D11 | CONSUMER-B bear loss on the Rp20m tranche ≈ Rp3.0m (0.94% of portfolio); on the full Rp44m position ≈ Rp6.6m (2.06%) | 0.15 × 20; 0.15 × 44 |
| C.D12 | CONSUMER-B base gain on the tranche ≈ Rp3.6m; bull ≈ Rp5.6m | 0.18 × 20; 0.28 × 20 |
| C.D13 | CONSUMER-B base-to-bear ratio ≈ 1.2x; bull-to-bear ≈ 1.9x | 18 ÷ 15; 28 ÷ 15 |
| C.D14 | Split Rp10m/Rp10m: CONSUMER-B 10.63% (within cap); VALUE-D 3.13% (within any cap) | (24 + 10) ÷ 320; 10 ÷ 320 |
| C.D15 | PROPERTY-C NAV age 11 months ≈ 335 days > D-23 comparator staleness (120 days) | fixture age vs V2 recommended threshold |

All C.D values inherit the fixture's "approximately" on C.F08 and C.F09; C.D11..C.D13 are rendered as approximate.

**INTERPRETATIONS**

| id | statement | author |
|---|---|---|
| C.I01 | "A simple multiple comparison implies 45% upside" for VALUE-D | unstated source; a multiple-based view with no cross-check |
| C.I02 | PROPERTY-C "appears to trade at roughly 60% discount to NAV" | derived from an 11-month-old estimate; the discount is a fact about a stale number |
| C.I03 | CONSUMER-B "thesis quality is high, upside not spectacular" | prior committee/analyst judgment carried as input |
| C.I04 | BANK-A "fundamental outlook stable" | prior judgment carried as input |
| C.I05 | Low P/E and P/B mean VALUE-D is cheap | the reading the case pack forbids; recorded so it can be rebutted |

**MANAGEMENT CLAIMS**

| id | claim | status |
|---|---|---|
| C.M01, C.M02 | VALUE-D: two previously announced expansion deadlines | MISSED × 2 (fixture fact; deadline dates, metrics, and magnitudes MISSING) |

**UNKNOWN**

| id | unknown | why it matters |
|---|---|---|
| C.U01 | Sectors of VALUE-D and of the three undescribed positions | any non-financial sector check; whether VALUE-D would breach the financial gate |
| C.U02 | Cash proxy yield and bear-drawdown limit (D-21) | hurdle gate |
| C.U03 | Horizon of CONSUMER-B's range | conversion of +18% into an annual return; without it the hurdle is unevaluable even with a cash proxy |
| C.U04 | Price dates; ADTV; large-cap status | freshness and liquidity gates |
| C.U05 | Snapshot date and ledger | reconciliation |
| C.U06 | PROPERTY-C NAV method (land anchor, appraiser) | whether the 60% discount means anything |
| C.U07 | PROPERTY-C RPT terms | fairness; governance |
| C.U08 | VALUE-D: source of +8% earnings on flat revenue; capex purpose; RPT terms; nature of missed deadlines | earnings quality and governance |
| C.U09 | Whether "SCREEN" for PROPERTY-C and VALUE-D includes the mandatory BUY/ADD extraction targets | domain |
| C.U10 | Target position count and any per-position minimum | whether a 7th position is desired |

**CONTRADICTIONS**

| id | records | nature |
|---|---|---|
| C.X01 | C.I05 (cheap) vs C.F11, C.D08, C.D09 | On cash earnings VALUE-D trades above 12.5x with a cash ROE below 4.8%; "cheap" depends on accepting earnings that have not converted to cash for two years |
| C.X02 | C.I01 (45% upside) vs C.F15 | The upside figure rests on a comparison the system has no validated model for; V2 VA-05 requires an implied-growth/ROIC cross-check that does not exist |
| C.X03 | C.I02 (60% discount) vs C.F09 NAV age, C.D15 | The discount is measured against a number older than the staleness threshold; it is `NO_VALID_VALUATION` |
| C.X04 | C.F06 (high research quality, stable outlook) vs C.F06 (sector gate) | The best-researched holding is the one the rules forbid adding to; recorded so the memo states the block is a rules outcome, not a view on BANK-A |
| C.X05 | C.F13 (78% controller; RPTs) and C.F14 (missed deadlines) vs C.I01 | The upside view carries no governance or execution discount; C.F15 says no method exists to apply one |

### Stage 2: Evidence bundle

| evidence_id | source_type | tier | freshness | epistemic | verification | contradicts |
|---|---|---|---|---|---|---|
| C.F01..C.F05 | FIXTURE_RULE (snapshot and rules) | n/a | UNDATED snapshot | DIRECT | FIXTURE_ASSERTED; ledger UNAVAILABLE | none |
| C.F06, C.F07, C.F09 (position values, levels) | FIXTURE_RULE | n/a | UNDATED | DIRECT | FIXTURE_ASSERTED | none |
| C.F08 | FIXTURE_THESIS (prior valuation snapshot) | n/a | "current" (asserted); horizon MISSING | SCENARIO (range) | FIXTURE_ASSERTED | none |
| C.F09 NAV | FIXTURE_THESIS (prior valuation) | n/a | STALE(11 months) | ASSUMED (NAV estimate) | FIXTURE_ASSERTED | C.X03 |
| C.F10..C.F14 | FIXTURE_PRIMARY (company facts) | T1/T2-equivalent | UNDATED | DIRECT | FIXTURE_ASSERTED | C.X01, C.X05 |
| C.I01 | FIXTURE_SECONDARY | T3 | UNDATED | INFERRED | FIXTURE_ASSERTED | C.X02 |
| C.I03, C.I04 | FIXTURE_THESIS (prior memos) | n/a | age MISSING | INFERRED (prior committee) | carried, not re-verified | none |
| C.M01, C.M02 | FIXTURE_PRIMARY | T2-equivalent | UNDATED | DIRECT (outcome MISSED) | FIXTURE_ASSERTED; dates MISSING | none |
| C.D01..C.D15 | script | n/a | snapshot | DERIVED | recomputable | C.X01, C.X02 |

Bundle flags: `snapshot_status: UNRECONCILED`; `rules_status: INCOMPLETE (cash_proxy, drawdown_limit, large_cap_list, sector map)`; `comparator_ages: CONSUMER-B asserted current (date MISSING), PROPERTY-C 11 months, VALUE-D undated, BANK-A n/a`; `legacy_or_unverified_valuations: PROPERTY-C NAV (excluded from comparison per V2 MC-08)`.

### Stage 3: Deterministic checks

The gate matrix is the core artifact of an allocation run and is entirely T0.

| check | BANK-A ADD | CONSUMER-B ADD | PROPERTY-C ADD | VALUE-D BUY | validator |
|---|---|---|---|---|---|
| Position count ≤ 8 | n/a (existing) | n/a | n/a | 7 ≤ 8 PASS | limit checker |
| Depth cap at full Rp20m | n/a (grandfathered excess; cap for BANK-A's level not needed for this question) | 13.75% ≤ 15% PASS | 10.00% > 8% **FAIL**; max add Rp13.6m | 6.25% ≤ 8% PASS | limit checker (C.D04..C.D06) |
| Sector ≤ 25% | 40% > 25% **FAIL** (`FAIL_GRANDFATHERED_CAUSE`; no financial buys) | UNEVALUABLE (consumer exposure of undescribed positions unknown, C.U01) | UNEVALUABLE (same) | UNEVALUABLE (VALUE-D sector unknown; if financial, FAIL) | limit checker |
| Snapshot reconciled | UNRECONCILED | UNRECONCILED | UNRECONCILED | UNRECONCILED | V-14; removes ADD/BUY under strict V2 |
| Price freshness | n/a | asserted current, date MISSING | UNDATED | UNDATED | D-31 |
| Liquidity gate | UNEVALUABLE (large-cap list unset) | UNEVALUABLE | UNEVALUABLE | UNEVALUABLE | D-20 |
| Valuation validity | not required (gate already fails) | range exists; provenance prior memo; horizon MISSING | NAV 11 months: `NO_VALID_VALUATION` (C.D15); land anchor unknown (VA-03) | multiple with no implied-growth cross-check: INVALID (VA-05); no normalized model (C.F15) | comparator age; VA-03; VA-05 |
| Cash conversion | n/a | n/a (fixture silent; assumed covered by "evidence current") | "weak" (qualitative; value MISSING) | < 40% two years: **FAIL** on any earnings-quality screen; cash P/E > 12.5x (C.D08) | CALC |
| One-off adjustment | n/a | n/a | n/a | earnings +8% on flat revenue: source UNKNOWN; cannot test recurrence | recurrence check UNEVALUABLE |
| Governance / mandatory targets | research high (asserted) | DEEP (asserted covered) | RPT fairness unresolved: **COVERAGE_GAP** → ADD removed | 78% controller; two RPTs unassessable: **COVERAGE_GAP** → BUY removed | V-11; mandatory targets |
| Management credibility input | n/a | n/a | n/a | 2 MISSED, 0 MET known: guidance forbidden in base (D-18) | claims table |
| Hurdle (V-15) | n/a | UNEVALUABLE: cash proxy unset (C.U02); horizon missing (C.U03); base-range low end not stated | n/a (blocked) | n/a (blocked) | V-15 |
| Bear drawdown ≤ limit | n/a | limit unset; bear −15% on tranche = 0.94% of portfolio (C.D11) | n/a | n/a | V-15 |
| Duplicate detection | n/a | n/a | n/a | n/a | no duplicate records |
| Schema completeness | `MISSING: snapshot_date, sector per position, cash_proxy, drawdown_limit, large_cap_list, price dates, ADTV, range horizon, NAV method, VALUE-D sector, claim dates` | | | | validator |

Gate summary before any judgment:

```text
BANK-A ADD:      BLOCKED   (sector gate; FAIL_GRANDFATHERED_CAUSE)
PROPERTY-C ADD:  BLOCKED   (full size breaches cap; any size blocked by governance gap and
                            NO_VALID_VALUATION)
VALUE-D BUY:     BLOCKED   (governance gap; earnings-quality fail; invalid valuation;
                            credibility; sector unknown)
CONSUMER-B ADD:  ELIGIBLE ON CAP; UNEVALUABLE on hurdle, sector, liquidity, reconciliation
SPLIT:           any split containing a BLOCKED leg is BLOCKED for that leg; the only
                 admissible split is CONSUMER-B (partial) + cash
HOLD_CASH:       ALWAYS AVAILABLE (C.F05)
```

Three of four alternatives are eliminated by deterministic checks before any model reads the case. That is the single most important result of Case C for the architecture (S3-04).

### Stage 4: Thesis comparison

Per alternative, as carried from the latest state the fixture supplies. An allocation run does not re-assess each thesis; it consumes the latest memo state and its age.

```text
BANK-A       thesis_status: UNCHANGED (asserted "stable"; memo age MISSING); irrelevant to
             the question because the sector gate blocks the action regardless
CONSUMER-B   thesis_status: UNCHANGED (asserted "evidence current", "thesis quality high";
             memo age MISSING). No new evidence in this run. The range C.F08 is a prior
             interpretation consumed as input (CR-13 acknowledged).
PROPERTY-C   thesis_status: INSUFFICIENT_EVIDENCE (NAV stale; RPT unresolved; cash
             conversion weak with no value). A SCREEN holding whose valuation anchor is
             11 months old has no current thesis test.
VALUE-D      thesis_status: NOT_ESTABLISHED (candidate; no thesis). No candidate thesis is
             proposed in this run: the evidence gives no falsifiable positive claim to
             test, only screens that fail (C.F11, C.F13, C.F14).

deadline_status:  VALUE-D: two deadlines MISSED (dates MISSING). Others: none in fixture.
missing_evidence: per alternative, as Stage 3 schema row.
```

### Stage 5: Management track record

```text
VALUE-D
MANAGEMENT CLAIM                              → DEADLINE   → OBSERVED RESULT     → STATUS
C.M01 expansion deadline 1 (details MISSING)  → MISSING    → not met             → MISSED
C.M02 expansion deadline 2 (details MISSING)  → MISSING    → not met             → MISSED
closed_evaluable: 2; met: 0; hit_rate NOT RENDERED (below D-18 six-claim threshold), but
the pattern is rendered as a fact: two of two announced deadlines missed.
guidance_in_base_case: FORBIDDEN.
capex without ROIC target (C.F12) is not a claim; it is the absence of one, and is rendered
under UNKNOWN, not under credibility.

PROPERTY-C:  no claims in fixture. RPT fairness is a governance item, not a claim.
CONSUMER-B:  no claims in fixture.
BANK-A:      no claims in fixture.
```

### Stage 6: Financial impact

For an allocation run this stage is a portfolio-effect table, not a company P&L table.

| alternative | portfolio effect if executed at Rp20m | downside class | basis |
|---|---|---|---|
| BANK-A ADD | financial exposure rises above 40%; single-name 29.7% | rule breach compounding | C.D07 |
| CONSUMER-B ADD (full) | position 13.75%; bear loss ≈ 2.06% of portfolio on the whole position, ≈ 0.94% on the tranche; cash → 0 | bounded by a range whose horizon is unknown | C.D04, C.D11 |
| CONSUMER-B ADD (partial Rp10m) | position 10.63%; bear loss on tranche ≈ 0.47%; cash Rp10m retained | same | C.D14 |
| PROPERTY-C ADD (max Rp13.6m) | position 8.00%; valuation anchor stale; governance unresolved | unbounded (no valid valuation) | C.D05, C.X03 |
| VALUE-D BUY | position 6.25%; count 7; earnings quality fail; governance unresolved; controller 78% | unbounded (no valid valuation; value-transfer risk unassessable) | C.D06, C.X01, C.X05 |
| HOLD_CASH | cash stays 6.25%; opportunity cost = cash proxy minus the best eligible alternative's return, both UNKNOWN | none on capital; unquantified opportunity cost | C.F05, C.U02 |

Dilution or liquidity risk at portfolio level: no alternative changes the portfolio's liquidity profile in a way the fixture can measure (ADTV unknown for all).

### Stage 7: Valuation

```text
CONSUMER-B
  method_category:      consumer earnings-based range (prior memo; method not restated)
  valid_inputs:         the range C.F08 as a carried valuation snapshot, IF its price date
                        is within freshness and IF its assumptions were not GUIDANCE_BASED
                        (both unverifiable in fixture; asserted "current, primary-source")
  invalid_or_stale:     horizon MISSING -> implied annual return cannot be computed ->
                        hurdle comparison against cash impossible even with a cash proxy
  defensible_range:     CARRIED, not re-derived. Direction: modest asymmetry (C.D13 ≈ 1.2x
                        base-to-bear). No midpoint rendered.
  artifact_required:    the prior calc_output.json id, its price_record id and date, and a
                        horizon field. None in fixture.

PROPERTY-C
  method_category:      NAV with land anchored to book or a named appraisal (V2 property pack)
  valid_inputs:         none current. NAV 11 months old (C.D15) -> NO_VALID_VALUATION
  invalid_or_stale:     the 60% discount (C.I02) is a discount to a stale, unanchored number
  defensible_range:     NO
  artifact_required:    fresh NAV with land at book (floor) and appraisal (if any), RPT
                        terms, cash-conversion cells

VALUE-D
  method_category:      normalized cash earnings with a governance/controller discount
                        methodology; multiple only with the implied-growth/ROIC cross-check
  valid_inputs:         P/E 5x, P/B 0.6x as price facts (undated); OCF < 40% of profit;
                        flat revenue; +8% earnings
  invalid_or_stale:     C.I01 "45% upside": a multiple comparison with no normalized base,
                        no cross-check (VA-05), no governance method (C.F15). On cash
                        earnings the same price is > 12.5x (C.D08) and the implied cash
                        ROE < 4.8% (C.D09). The multiple does not say the stock is cheap;
                        it says the reported earnings are not converting.
  defensible_range:     NO. And no calculation would make it defensible until the
                        cash-conversion gap is explained from primary statements.
  artifact_required:    three-year cash-flow reconciliation (profit to OCF), capex by
                        purpose, RPT terms, controller transaction history

BANK-A
  not evaluated: the action is blocked by a rule that no valuation can override.

target_prices:          NONE PRODUCED for any alternative.
```

### Stage 8: Independent adversarial review

**Phase A (blind: gate matrix, bundle, carried thesis states; no Analyst report)**

Own reading: three alternatives fail on rules or evidence before valuation; the live question is CONSUMER-B versus cash and the size of any tranche. Own top risks, in order:

1. **The one eligible alternative is being compared to cash with a number that has no time dimension.** C.F08 says +18% base with no horizon. Over one year that may clear any plausible cash proxy; over three years it may not. The hurdle gate cannot run, and a committee that "feels" +18% is enough is doing the arithmetic V2 forbids the model from doing. (C.U03)
2. **Concentration creep.** Adding the full tranche makes CONSUMER-B the second position above 13% in a portfolio already 40% in one sector. The fixture's own caps permit it; the caps do not measure the portfolio's shape. Group and driver fields (V2 PF-06, IX-12) are absent, so shared drivers between CONSUMER-B and the undescribed positions are unknown.
3. **The VALUE-D rejection could be a pattern match.** "Controller + RPT + missed deadlines" is a template, and templates are a form of prior. The blind phase checked whether any fixture fact cuts the other way: none does. The cash-conversion fact (C.F11) is independent of governance and is sufficient on its own to remove BUY under an earnings-quality screen. The rejection survives without the template.
4. **PROPERTY-C's discount might be real.** A 60% discount to NAV can persist for years and still be a genuine discount; staleness of the estimate does not make the assets worthless. But the system has no anchor (VA-03), an unresolved RPT, and weak cash conversion: the correct state is `INVESTIGATE` for the holding, not `ADD`, and the run already says so.
5. **Cash is not free.** Keeping Rp20m idle has a cost equal to the cash proxy foregone against the best eligible alternative. The fixture has no cash proxy; the memo must not treat cash as costless.

Divergence statement after seeing the Analyst: `LOW` on gates (deterministic, identical); `MEDIUM` on the CONSUMER-B question: the Analyst's report treated the range as adequate for a conditional ADD; the blind phase treats the missing horizon as disqualifying for any hurdle statement. Rendered.

**Phase B**

Strongest credible case that the base analysis is wrong:

*Against the base analysis's lean toward CONSUMER-B.* The range C.F08 is a prior committee's interpretation carried as an input (CR-13). Its provenance (`HISTORY_RANGE`, `GUIDANCE_BASED`, `OUTSIDE_HISTORY`) is not in the fixture. If the base case leaned on management guidance, the +18% is a promise. The base analysis accepts "evidence is current and primary-source grounded" as a label. Finding `MEDIUM`: the allocation memo MUST cite the CONSUMER-B memo id, its date, its price-record date, and its `assumption_provenance` before any ADD is admissible; if any is missing the action is `INVESTIGATE`, not conditional `ADD`. Also, the bear case of −15% for a consumer company is shallow relative to what a downturn can do; without the assumption provenance nobody can tell whether −15% is a stress or a mild scenario. Finding `LOW`: render the bear case with its provenance.

*Against the base analysis's PASS on VALUE-D.* The fixture states a controller at 78% and unassessable RPTs. It does not state that value was extracted. A reviewer could say the committee is discounting a company for information it lacks rather than information it has. Response: V2's rule is that absence of governance evidence removes BUY (coverage gap), and the burden sits with the idea. The reviewer's point changes the label, not the outcome: `PASS` with re-screen conditions rather than `PASS` as a verdict on the business. Finding `LOW`: memo wording.

*Against HOLD_CASH as the interim state.* If the rules block gaps (cash proxy, drawdown limit, sector map) can be filled in minutes, then "keep cash" is a delay disguised as a decision. Response: correct, and the memo names those unblocks as the first three items. The interim state is cash because the null action is the only one the rules permit today, not because cash was judged superior. Finding `MEDIUM`: the memo MUST label the cash outcome `INTERIM_BY_GATES`, not `PREFERRED`, until the hurdle can run (becomes V3-03 vocabulary).

Audit items:

- *Circular assumptions:* CONSUMER-B's range is prior interpretation; the fixture's "thesis quality high" is a prior judgment. Both were consumed as inputs. Acknowledged and rendered.
- *Source quality:* rules and snapshot are fixture-asserted with no ledger; company facts for VALUE-D and PROPERTY-C are the strongest records in the bundle and they are negative.
- *Omitted downside:* horizon; shared drivers; liquidity; snapshot date; VALUE-D's sector (could be financial, which would add a second gate failure).
- *Management narrative:* C.I01 is the only promotional artifact; rebutted deterministically (C.D08..C.D10).
- *False precision:* "13.75%" and "0.94%" are exact arithmetic on approximate valuation inputs and an undated snapshot. Rendered as approximate.
- *Governance:* two of four alternatives fail on it; handled by gates, not by judgment.
- *Opportunity cost:* the comparison collapses to one eligible alternative against cash, and the hurdle cannot run. Honest state: `COMPARISON_INCOMPLETE`.

Verdict: `MORE_RESEARCH` on CONSUMER-B ADD; gates are deterministic and not subject to verdict on the other three. `RED_TEAM_SILENT: false`. V-12: findings supported.

### Stage 9: Portfolio comparison

Full allocation, partial allocation, and cash, evaluated explicitly.

```text
comparison_table (rows = uses of the Rp20m; columns as V2 S9 plus allocation fields)

use                    gate_result   valuation      implied_return  downside          concentration_after  eligible
BANK-A ADD 20m         FAIL sector   n/a            n/a             n/a               fin > 40%            NO
PROPERTY-C ADD 20m     FAIL cap      NO_VALID       n/a             unbounded         8%+ (over cap)       NO
PROPERTY-C ADD ≤13.6m  PASS cap      NO_VALID       n/a             unbounded         8.0%                 NO (governance gap)
VALUE-D BUY 20m        PASS cap/cnt  INVALID        n/a             unbounded         6.25%, 7 positions   NO (governance gap,
                                                                                                             earnings quality)
CONSUMER-B ADD 20m     PASS cap      CARRIED range  UNKNOWN         bear ≈ −15%       13.75%               CONDITIONAL
                       sector UNEVAL                (no horizon)    (≈2.06% of pf)
CONSUMER-B ADD 10m     PASS cap      CARRIED range  UNKNOWN         bear ≈ −15%       10.63%               CONDITIONAL
                       sector UNEVAL                                (≈0.47% tranche)
SPLIT CONSUMER-B +     one leg       n/a            n/a             n/a               n/a                  NO (VALUE-D leg
  VALUE-D              BLOCKED                                                                               blocked)
HOLD_CASH 20m          PASS          n/a            cash proxy      none on capital   6.25% cash           YES (always)
                                                    UNSET

ranking_rule:           lexicographic (V1/V2): gates first, then valuation validity, then
                        hurdle, then downside. Result: HOLD_CASH and CONSUMER-B (any size
                        ≤ Rp24m headroom) are the only survivors; their order is
                        UNDETERMINED because the hurdle cannot run.

full vs partial vs cash, in words:
  full (Rp20m to CONSUMER-B):   admissible on cap; converts all optionality to one name;
                                bear loss on tranche ≈ 0.94% of portfolio; requires hurdle
                                PASS, sector confirmation, liquidity, reconciliation, and
                                the CONSUMER-B memo provenance items.
  partial (e.g. Rp10m):         same gates; halves the tranche risk; keeps Rp10m for an
                                alternative that does not exist today. The fixture gives no
                                sizing rule by conviction or by expected return, so the
                                choice between full and partial is Otta's; the committee
                                can only state that both sit within cap and that the
                                partial preserves the cash option.
  cash:                         the only action every gate permits today. Cost: the cash
                                proxy foregone versus CONSUMER-B's base case, both
                                unquantified. Not free, not preferred; INTERIM_BY_GATES.

research_depth_limits:  CONSUMER-B (DEEP) is the only alternative whose depth permits a
                        position of this size. VALUE-D at SCREEN could hold 8% by cap, but
                        the mandatory BUY targets are unmet, so the cap is moot.
```

### Stage 10: CIO draft recommendation

```text
run_type:                   ALLOCATION (V2 extension)
domain (strict V2):         {INVESTIGATE, NO_DECISION}  (RULES_INCOMPLETE: cash proxy and
                            drawdown limit unset; UNRECONCILED snapshot)
domain (allocation vocabulary proposed in V3-03):
                            {HOLD_CASH, INVESTIGATE, NO_DECISION}; DEPLOY and PARTIAL
                            removed by the same conditions

recommendation (strict V2): INVESTIGATE, with the following CONDITIONAL block
recommendation (V3 label):  HOLD_CASH (INTERIM_BY_GATES) with the same CONDITIONAL block

per-alternative position-aware states:
  BANK-A       held      HOLD (no change to thesis); ADD BLOCKED by sector gate
                         (FAIL_GRANDFATHERED_CAUSE). This is a rules outcome, not a view
                         on the bank.
  CONSUMER-B   held      HOLD today; ADD CONDITIONAL (see below). Size band if conditions
                         pass: Rp0 to Rp20m, all within the 15% cap; the committee does
                         not choose between full and partial: no sizing rule exists.
  PROPERTY-C   held      INVESTIGATE (stale NAV, unresolved RPT, weak cash conversion);
                         ADD BLOCKED at any size by governance gap and NO_VALID_VALUATION;
                         BLOCKED at full size by cap.
  VALUE-D      not held  PASS. Re-screen only if: (a) OCF ≥ 80% of profit for two
                         consecutive years from primary statements, (b) both RPTs disclosed
                         with terms sufficient to assess fairness, (c) a ROIC target or
                         capex return disclosure. Low P/E and P/B are not reasons; on cash
                         earnings the stock is not cheap (C.D08, C.D09).
  SPLIT        n/a       any split including VALUE-D or PROPERTY-C is BLOCKED; a
                         CONSUMER-B-plus-cash split is the "partial" case above.

CONDITIONAL (what permits an ADD to CONSUMER-B, every item required):
  G1  rules block: cash_proxy and bear_drawdown_limit set (D-21)             [Otta, minutes]
  G2  portfolio snapshot: sector for every position; consumer exposure after
      add ≤ 25%                                                              [Otta, minutes]
  G3  snapshot RECONCILED against the transaction log (V-14)                  [Otta, minutes
                                                                              once M-06 exists]
  G4  CONSUMER-B memo: id, date, price_record date ≤ 5 trading days,
      assumption_provenance per slot, range horizon                          [lookup; may
                                                                              require a QUICK
                                                                              re-run]
  G5  hurdle: base-range low end (annualized over the stated horizon) ≥ cash
      proxy; bear drawdown ≤ limit (V-15)                                     [T0 once G1, G4]
  G6  liquidity: large-cap status or ADTV record (D-20/D-31)                  [lookup]
  G7  Red Team verdict not BLOCK on the CONSUMER-B memo                       [exists if G4]
  If all pass: DEPLOY or PARTIAL to CONSUMER-B, size band Rp0 to Rp20m within cap.
  If G5 fails: HOLD_CASH becomes PREFERRED, not interim.

rationale:
  1. Three of four uses of the cash fail deterministic gates before any judgment:
     BANK-A on sector (C.D07), PROPERTY-C on cap at full size and on governance and
     valuation validity at any size (C.D05, C.X03), VALUE-D on governance, earnings
     quality, and valuation validity (C.F11, C.F13, C.D08, C.X02).
  2. VALUE-D's apparent cheapness does not survive its own cash flow: P/OCF > 12.5x,
     cash ROE < 4.8% (C.D08, C.D09). Two missed deadlines and a 78% controller with
     unassessable RPTs are downside, not footnotes (C.F13, C.F14).
  3. CONSUMER-B is the only alternative that clears its cap and carries a current,
     primary-grounded range (C.F07, C.F08, C.D04). Its case against cash cannot be
     computed because the rules block has no cash proxy and the range has no horizon
     (C.U02, C.U03).
  4. Cash is a valid outcome (C.F05) and today the only one the rules permit. It is
     interim, not preferred: the unblocks are cheap and named.
  5. Full deployment is not forced. If the conditions pass, the size is Otta's within
     the band; the committee has no sizing rule to prefer full over partial.

data_quality:               snapshot undated and unreconciled; sector map partial; rules
                            block incomplete on two fields; one valuation carried with
                            unknown provenance and horizon; one valuation stale; one
                            invalid; price dates missing.
confidence:                 HIGH on the three blocks (deterministic); HIGH on VALUE-D PASS
                            (fact-driven); LOW on CONSUMER-B vs cash (unevaluable);
                            bands only.

what_would_change_the_recommendation:
  -> DEPLOY/PARTIAL CONSUMER-B: G1..G7 pass.
  -> HOLD_CASH (PREFERRED): G5 fails, or CONSUMER-B's memo has GUIDANCE_BASED base
     assumptions with a claims table below D-18.
  -> revisit VALUE-D: the three re-screen conditions above.
  -> revisit PROPERTY-C: fresh NAV anchored to book/appraisal; RPT terms disclosed;
     cash-conversion cells.
  -> BANK-A: only if financial exposure falls below 25% by other means; never by this run.

next_monitoring_trigger:    completion of G1..G3 (human inputs) -> re-run allocation;
                            any ALWAYS_MATERIAL event on CONSUMER-B; PROPERTY-C NAV or
                            RPT disclosure; VALUE-D annual report (cash conversion, RPTs).

human_decision:             UNSET
```

### Stage 11: Proposed memory changes

```text
1. immutable run artifact: runs/RUN-20260902-PORTFOLIO-01/ with gate_matrix.json,
   comparison_table.json, allocation_memo_draft.json, per-alternative state carry table,
   Red Team phases, memory_proposal.json. Contains C.I01 with contradiction links.

2. proposed current-thesis changes (NOT applied):
   BANK-A:      none
   CONSUMER-B:  none (no new evidence); annotate memo_referenced_by: RUN-20260902-PORTFOLIO-01
   PROPERTY-C:  thesis_status -> INSUFFICIENT_EVIDENCE; valuation flagged stale (11 months);
                governance_flag: RPT_UNRESOLVED
   VALUE-D:     create ThesisState with thesis_lifecycle: NOT_ESTABLISHED; screen_result:
                PASS with re-screen conditions (a)(b)(c); NO candidate thesis proposed

3. proposed append-only thesis events:
   PROPERTY-C: {kind: STATUS_CHANGE, to: INSUFFICIENT_EVIDENCE, evidence: [C.F09, C.D15],
                reason: "NAV anchor 11 months old exceeds staleness threshold; RPT fairness
                unresolved; cash conversion weak (value not recorded)"}
   VALUE-D:    {kind: SCREEN_RESULT, result: PASS, evidence: [C.F11, C.F13, C.F14, C.D08,
                C.D09], rescreen_conditions: [(a), (b), (c)]}
   (V2 has no SCREEN_RESULT event kind; adopted in V3, G-11.)

4. proposed valuation snapshots:
   NONE new. PROPERTY-C's existing NAV row marked stale: TRUE, usable_for_comparison: FALSE.
   VALUE-D: no snapshot; the "45% upside" figure MUST NOT be written to valuation history
   (it fails VA-05 and has no method).

5. proposed management-claim updates:
   VALUE-D: C.M01, C.M02 recorded as MISSED with deadline: MISSING, metric: MISSING;
            flagged for completion from source disclosures before any re-screen.

6. committee_recommendation: INVESTIGATE (strict V2) / HOLD_CASH INTERIM_BY_GATES (V3),
   with CONDITIONAL ADD CONSUMER-B and PASS VALUE-D
7. human_decision: UNSET
8. approval_required_before_canonical_update: YES
   L1: PROPERTY-C status event; VALUE-D ThesisState creation and screen event; claim rows
   L2: none this run (no assumption relaxations, no breaker changes)

Rules-block completion items surfaced by this run (not memory writes; rules changes):
   cash_proxy, bear_drawdown_limit, large_cap_list, target_position_count,
   research_depth mapping for SCREEN+ / preliminary, sector for every position.
   These are M-items for the migration plan, each requiring Otta's typed value.
```

### Stage 12: Future monitoring

```text
deterministic scheduled checks (T0):
  C-MON-01  rules-block completeness scan at every run start (RULES_INCOMPLETE names fields)
  C-MON-02  sector map completeness and sector exposure after any proposed action
  C-MON-03  comparator age for every held position's latest valuation (D-23); PROPERTY-C
            already past threshold
  C-MON-04  cash weight and position count vs limits after any ledger change
  C-MON-05  VALUE-D annual cash-conversion cell (OCF ÷ profit) for re-screen condition (a)

cheap materiality classification (T1, after a document change):
  PROPERTY-C RPT or NAV disclosures; VALUE-D RPT disclosures, capex guidance, expansion
  announcements (each becomes a ManagementClaim with a deadline)

events that trigger expensive research / IC review:
  G1..G3 completed by Otta -> re-run allocation (cheap: gates are T0; only CONSUMER-B vs
  cash needs judgment); fresh CONSUMER-B memo; PROPERTY-C fresh NAV with anchor

events that require human escalation:
  any ALWAYS_MATERIAL event on a held position; financial-sector exposure change that
  moves BANK-A's gate; VALUE-D or PROPERTY-C related-party transaction with a controller
  (IX-10) if either becomes a candidate again

NOT a trigger: price movement in VALUE-D making it "cheaper". Price alone never re-opens
a PASS (V2 AU-08). Re-screen conditions are disclosure events, not price events.
```

---

## 5. Cross-Case System Audit

The fourteen questions, answered with evidence from the three runs. Each answer names the case and stage that supports it. Findings are numbered `S3-##` and carried into §11.

### Q1. Which capabilities added genuine information value?

Information value means the stage produced something a reader of the fixture would not already have, or changed a decision-relevant status.

| capability | evidence | value |
|---|---|---|
| Fact / derived / interpretation / claim / unknown / contradiction separation (Stage 1) | A.X03 (thesis baseline misalignment), B.X01 (narrative omits the concentration risk), C.X01 (cheapness fails on cash flow) were all found by forcing the six buckets, not by reading | HIGH. This was the single most productive step in every case |
| Deterministic derivations (Stage 3 CALC) | A.D06 (FX at most one fifth of the margin decline), B.D01 (recurring growth ≈ +17% as a band), C.D08/C.D09 (cash P/E > 12.5x, cash ROE < 4.8%), C.D04/C.D05 (cap headroom) | HIGH. Each rebutted an interpretation in the fixture with arithmetic |
| Breaker evaluator (V-16) | Case A: prevented both `BROKEN` (count = 1, minimums for liquidity met) and `UNCHANGED` (UNEVALUABLE present) by rule; surfaced two spec gaps (deadline, threshold) | HIGH |
| Gate matrix (limit checker, coverage, freshness) | Case C: eliminated three of four alternatives before any model; Case B: removed BUY three ways at S0; Case A: removed ADD four ways | HIGH. Largest cost saver and largest error preventer |
| Management claims table with evaluability (Stage 5) | Case B: two MET, one UNEVALUABLE, one OPEN; refused to close B.M02 early; forbade guidance in base; Case C: two MISSED rendered as a fact pattern | MEDIUM to HIGH |
| Red Team phase A (blind) | Added: A.X03 escalation, B.U03 denominator problem, C.U03 missing horizon, C phase-A risk 5 (cash is not free). Did not add anything outside the bundle (nothing outside exists) | MEDIUM. Framing independence real; evidence independence untested |
| CIO-Synthesis held-frame call | Produced the position-aware recommendation and the ranked unblock list; the unblock list with cost estimates was new information in every case | MEDIUM |
| Recommendation domain matrix | Made the recommendation a residual of gates rather than a judgment in every case | HIGH |

### Q2. Which capabilities merely rewrote existing analysis?

| capability | evidence | verdict |
|---|---|---|
| Stage 6 financial impact table | In all three cases it restated Stage 1 facts with direction words. Its only non-trivial rows (A: inventory reading of the current ratio; B: FCF unknown) were Red Team observations relocated | REWRITE. Fold into a CALC-rendered table plus one Analyst paragraph (V3-06) |
| Fresh-look CIO call for candidates | Case B: the candidate frame is the frame; the second call had nothing to mask | REWRITE for candidates. Keep for held securities only (V3-07) |
| Fresh-look CIO call under refusal | Case A: with the domain already {INVESTIGATE, NO_DECISION}, both calls returned INVESTIGATE; the fresh look could not change anything | REWRITE under short-circuit conditions (V3-02) |
| Red Team phase B checklist items on citation existence, schema, domain | Already validators; the reviewer re-checked what scripts had checked | REWRITE. Remove from the checklist (V3-08) |
| Stage 4 "unchanged assumptions" section | Empty in all three cases: V2 forbids `UNCHANGED` without this-run evidence, so the section can only ever be empty or list evidenced re-confirmations | Keep but rename to `reconfirmed_this_run` so an empty section is informative |
| Stage 7 for blocked alternatives | Case C: BANK-A valuation correctly skipped; PROPERTY-C and VALUE-D valuation sections restated Stage 3 invalidity findings | Partially REWRITE. Stage 7 should run only on gate-eligible alternatives (V3-02) |
| Stage 9 comparison table in single-ticker runs without alternatives | Cases A and B rendered empty tables | REWRITE. Skip when no alternatives are loaded; render `COMPARISON_UNAVAILABLE` (V3-02) |

### Q3. Where did circular context occur?

1. **Case A, thesis levers → assumption statuses → Red Team statuses.** All three readers scored the same four levers from the same fifteen facts and agreed. Agreement is same-bundle agreement (V2 CR-01, CR-02). The blind phase's genuinely new item (A.X03) came from comparing the thesis text against the comparative period, which is inside the bundle but outside the thesis frame. That is the only place the loop opened.
2. **Case B, management claims → candidate thesis → claims table "verifies" thesis.** The candidate thesis was drafted from B.M01..B.M04. The `GUIDANCE_DERIVED` flag was applied and two independent assumptions (B-A6, B-A7) were added, but the frame is management's. V2's control (label, forbid in base) works on the valuation; it does not generate an independent frame. Mitigation adopted: at least one non-management assumption is mandatory in any candidate thesis (V3-13).
3. **Case C, prior CONSUMER-B range → allocation input.** The range C.F08 is a prior interpretation (CR-13). The allocation run has no way to re-verify it and consumed it with its "current" label. The Red Team's demand for memo id, date, price-record date, and assumption provenance (Stage 8B) is the correct control and is now a gate (V3-03 G4).
4. **Simulation-level.** One author simulated all workers. Lineage independence was not exercised. Stated, not hidden.

### Q4. Where was expensive reasoning unnecessary?

| case | where | why | cost avoided under V3 |
|---|---|---|---|
| A | S9 comparison, CIO call 1 (fresh look), most of S8 phase B | Domain was {INVESTIGATE, NO_DECISION} after S5 (CALC_MISSING, PRICE_UNKNOWN, UNRECONCILED). Only thesis status and the research list could change | One T4 call, part of one T3 call |
| B | CIO call 1 | Candidate: nothing to mask | One T4 call |
| C | S6, S7, S8 on BANK-A, PROPERTY-C, VALUE-D | Eliminated by T0 gates; VALUE-D's PASS was fully fact-driven (C.F11, C.F13, C.F14, C.D08) and needed no valuation worker | Three quarters of the run's model cost |
| all | Stage 6 as a model stage | Table is regenerable from cells | One T2 segment per run |

Total: in Case C, roughly three quarters of model spend would have been on alternatives that deterministic checks had already removed. In Case A, the two most expensive calls could not affect the outcome. This is the basis of V3-02 (domain pre-computation and short-circuit).

### Q5. Which decisions were correctly blocked by deterministic rules?

| case | blocked | by | correct? |
|---|---|---|---|
| A | ADD | depth cap (A.F14), PRICE_UNKNOWN, COVERAGE_GAP, UNRECONCILED | YES, four independent ways |
| A | TRIM, EXIT | PRICE_UNKNOWN (TRIM), UNRECONCILED (both) | YES; nothing supported them anyway |
| A | UNCHANGED, STRENGTHENED | UNEVALUABLE breaker (V-16) | YES |
| A | BROKEN | composite count 1; liquidity minimums met | YES; the case pack's "not from one period" control held by rule |
| A | any fair value | CALC_MISSING | YES |
| B | BUY | PRICE_UNKNOWN (45 days), COVERAGE_GAP, mandatory targets, LIQUIDITY_UNKNOWN, RULES_INCOMPLETE, CALC_MISSING | YES, six ways |
| B | B.M02 early close; B.M03 MET | due-date scan; evaluability rule | YES |
| B | guidance in base | D-18 threshold | YES |
| C | BANK-A ADD | sector gate | YES |
| C | PROPERTY-C ADD full | cap 10% > 8% | YES |
| C | PROPERTY-C ADD any | governance gap; NO_VALID_VALUATION (335 days > 120) | YES |
| C | VALUE-D BUY | governance gap; earnings-quality screen; VA-05 | YES |
| C | CONSUMER-B ADD (today) | RULES_INCOMPLETE (hurdle values), UNRECONCILED, sector UNEVALUABLE | YES as a block; see Q6 and S3-05 for the labelling problem |

No block was wrong. One block (Case B, `CALC_MISSING` as a global refusal removing WATCH and PASS) was correct in effect but wrong in scope: it would have hidden the accurate `WATCH` state behind `INVESTIGATE` (S3-09).

### Q6. Where did the system still generate false precision?

1. **Two-decimal ratios propagated as exact.** 8.73%, 6.63%, 0.91x (Case A) and 13.75%, 0.94% (Case C) are arithmetic on figures the fixture calls approximate or on an undated snapshot. Breaker margins were wide enough this time; at 0.81x against a 0.8x minimum, "approximately 0.91" would have been decisive and the evaluator has no tolerance concept. (S3-06)
2. **B.D01 "+17%" from two rounded inputs.** Correctly rendered as a band (16% to 18%) only because the simulation applied a precision rule V2 does not have.
3. **Percent-of-portfolio downside figures (C.D11).** Exact-looking outputs of an approximate range with no horizon.
4. **"Approximately 60% discount" (C.I02).** A precise-sounding discount to a stale, unanchored number. Correctly labelled NO_VALID_VALUATION, but the number still appears in the bundle and would appear in a memo unless a render rule suppresses invalid comparators' figures.
5. **Confidence bands.** Rendered as HIGH/MEDIUM/LOW/NONE per V2 VA-13; no numeric probabilities leaked. This control held.
6. **No target price, midpoint, or expected return was produced in any case.** This control held.

### Q7. Which schema fields were missing?

Collected as gaps `G-01` to `G-14` in §8. Summary: reporting-period calendar and `period_kind`; `thesis_date`, `deadline_period`, `baseline_period`; a unified research-depth enum (the fixtures use `SCREEN+`, `preliminary`, `DEEP`, `SCREEN`, `unresearched`); rules-block fields `cash_proxy`, `bear_drawdown_limit`, `large_cap_list`, `target_position_count`; `sector` for every position in the snapshot; `horizon` and `as_of_price_record_id` on every valuation range; `precision` or tolerance on inputs; `question_category: ALLOCATION` and an allocation vocabulary; `capacity_base` for utilization; `one_off_of_which_line`; `structural_vs_temporary` qualifier; `interim_posture`, `unblock_items[]` with cost and due date on INVESTIGATE; `OBSERVED_AHEAD` claim state; `SCREEN_RESULT` thesis event; `MAJOR_CUSTOMER_CONTRACT` materiality category.

### Q8. Did any worker require information unavailable in the evidence bundle?

| worker | case | needed | absent | consequence |
|---|---|---|---|---|
| CALC | A | absolute cells; cap for SCREEN+; deadline period; profit threshold | all | identities NOT_RUN; cap outcome fixture-asserted; two breakers UNEVALUABLE |
| CALC | B | period_kind; capacity base; prior-year one-offs; cap for preliminary | all | B.D01 conditional; utilization comparison unverified; sizing refused |
| CALC | C | cash proxy; drawdown limit; sector map; horizon; price dates; ADTV | all | hurdle UNEVALUABLE; three sector checks UNEVALUABLE |
| Analyst | A | decomposition of gross margin between raw material and overhead | shares unknown | direction only |
| Analyst | B | maintenance capex, net debt, contract share | absent | no valuation; contract branch unbounded [0, 46%] |
| Red Team | all | governance channel (RPT, auditor, shareholder structure) | uncovered | `UNRESOLVABLE` items; `MORE_RESEARCH` minimum in every case |
| CIO-Synthesis | A | prior decision table; weakened counter history | absent | counter proposed with basis FIRST_OBSERVATION |
| CIO-Synthesis | C | CONSUMER-B memo id, date, provenance | absent | ADD reduced to CONDITIONAL |

In every case the workers behaved correctly when starved: they emitted `UNEVALUABLE`, `UNKNOWN`, `CONDITIONAL`, or a refusal, and named the missing item. No worker filled a gap from memory. This is the fail-closed property working, and it is also the refusal-fatigue risk V2 §22 warns about: with the fixture as given, nothing could be bought or added in any case.

### Q9. Was adversarial review genuinely independent?

Partially, and the fixture pack could only test half of it.

- *Framing independence:* achieved by the blind phase. In each case phase A produced at least one item the Analyst frame did not (A: A.X03 escalation to `THESIS_SPEC_INCOMPLETE`; B: cycle-not-step-change centre of gravity, denominator problem; C: missing horizon, cash-is-not-free). Divergence was LOW on statuses and MEDIUM on emphasis in B and C. That divergence is information and was rendered.
- *Evidence independence:* not achieved and not testable here. Every finding cites bundle records because nothing outside the bundle exists in a fixture. V2 D-16 (second independently scoped collection) remains deferred; the Session 4 fixture pack must plant at least one disconfirming record reachable only outside the Analyst's channels (V2 F-20) to measure it (T-09).
- *Lineage independence:* not exercised (one author). Recorded.
- *Did the Red Team change anything?* Yes: Case C's demand for CONSUMER-B memo provenance became a gate (V3-03 G4); Case A's `THESIS_SPEC_INCOMPLETE` became an L2 item; Case B's "conditional in the same sentence" became a render rule (V3-11). Three findings with consequences across three runs is a real, if modest, yield.

### Q10. Did portfolio comparison change any conclusion?

- Case C: yes, decisively, but through the gate matrix rather than the comparison table. Three alternatives were removed by gates; the comparison itself could not rank the two survivors because the hurdle could not run. The IX-03 problem (hollow comparison column) survived V2 in a new form: V2 added price, but a range without a horizon still yields no implied return (S3-07).
- Case A: no comparison possible; the cap rule changed the domain before comparison.
- Case B: no alternatives loaded; no effect.

Conclusion: the portfolio layer's value in this pack was almost entirely in T0 gates. The judgment-level comparison was starved by missing rules-block values. Fix the inputs (D-21, sector map, horizon) before expecting the table to earn its cost.

### Q11. Was cash treated as a valid outcome?

Yes, in substance: Case C ends with cash as the interim state and as the outcome against three of four alternatives. No, in vocabulary: V2 has no `HOLD_CASH` recommendation state, so the supported null action had to be labelled `INVESTIGATE`, which misdescribes it (Stage 10 C). Cash was also never treated as free: the Red Team's "cash is not free" item is rendered and the memo labels cash `INTERIM_BY_GATES` rather than `PREFERRED` until the hurdle can run. V3 adds `HOLD_CASH` as a never-removed domain member (V3-03).

### Q12. Were memory updates safe and auditable?

Safe: every proposal in Stage 11 is a proposal; `human_decision: UNSET` in all three; no valuation snapshot was written where no valuation existed; the T3 interpretations and every contradiction link were kept in the run artifact (MC-03); the original recovery deadline in Case A was preserved verbatim; VALUE-D's "45% upside" was explicitly barred from valuation history.

Two unsafe edges found:

1. **Counter initialization without history (Case A).** `quarters_since_fully_holding` cannot be set to 1 when the prior status is unknown; the proposal carries `basis: FIRST_OBSERVATION` as an L2 item. V2 has no rule for this. (S3-12)
2. **Claim closure state (Case B).** V2 forces `OPEN` or a closed state; B.M02 is observed-met-before-due. Leaving it `OPEN` loses the observation; closing it lets a favourable early reading count. `OBSERVED_AHEAD` is proposed (G-10).

Auditable: every status cites evidence ids; every derived value shows its formula; every refusal names its code and unblock. One gap: the run artifacts for an allocation run reference four tickers and V2's per-ticker `ic-data` layout has no place for a portfolio-level memo (G-12).

### Q13. What should be removed before V1?

1. The fresh-look CIO call for candidates and under short-circuit conditions (keep for held securities on the full path).
2. Stage 6 as a model stage.
3. Red Team checklist items that duplicate validators.
4. `CALC_MISSING` as a global refusal code (make it an action-level domain restriction plus a header flag).
5. `SCREEN+` and `preliminary` as research levels (replace with one enum).
6. The empty comparison table in single-ticker runs without alternatives.
7. The Stage 4 `unchanged_assumptions` label (rename; it is structurally empty).

Nothing else earned removal. V2's controls were not the problem; their inputs were.

### Q14. What must be added before V1?

Summarised as the `MUST FIX BEFORE BUILD` list in §11: S0 preflight on rules and snapshot completeness; domain pre-computation and short-circuit at S5; `ALLOCATION` run type with allocation vocabulary and `HOLD_CASH` never removed; resolution of `UNEVALUABLE` semantics; deadline-alignment fields; precision and tolerance handling; valuation `horizon` and provenance as gate inputs; `INVESTIGATE` discipline (unblock items with cost and due date, consecutive counter); `depth: SCREEN` for candidate runs; Stage 1 taxonomy as a rendered, validated artifact; mandatory non-management assumption in candidate theses; pack extraction targets for customer concentration.

---

## 6. Worker/Capability Value Audit

Each V2 execution unit, judged on the three runs.

| unit | tier | ran in | value observed | disposition |
|---|---|---|---|---|
| Evidence pipeline (Stage 1 taxonomy, Stage 2 bundle) | T0 + T1 | A, B, C | HIGH. Found A.X03, B.X01, C.X01. The six-bucket separation did most of the analytical work | KEEP; make the six buckets a schema with a validator (V3-10) |
| CALC | T0 | A, B, C | HIGH. Every rebuttal of a fixture interpretation was arithmetic | KEEP; add precision bands, tolerance, sizing, allocation gate matrix (V3-05, V3-03) |
| Breaker evaluator (V-16) | T0 | A | HIGH. Prevented both false `BROKEN` and false `UNCHANGED` | KEEP; fix UNEVALUABLE semantics (V3-04) |
| Limit checker / gate matrix | T0 | A, B, C | HIGH. Removed 3 of 4 in C; ADD in A; BUY in B | KEEP; run at S0 as preflight and at S5 as domain pre-computation (V3-01, V3-02) |
| Claims table | T0 + T1 extraction | B, C | MEDIUM to HIGH. Refused early close, refused vague MET, forbade guidance in base | KEEP; add OBSERVED_AHEAD, proxy_metric (G-10) |
| Analyst | T2 | A, B, C | MEDIUM. Produced correct statuses with citations; its decompositions were CALC's; its narrative added the "temporary vs structural: unresolved" framing in A and the candidate thesis in B | KEEP; narrow its output to statuses, causal reading, scenario design, candidate thesis, unknowns |
| Red Team phase A | T3 | A, B, C | MEDIUM. One to two genuinely new items per case, all from re-reading the bundle against the frame | KEEP |
| Red Team phase B | T3 | A, B, C | MEDIUM. Produced the three findings that became controls. Wasted effort on validator duplicates | KEEP; trim checklist (V3-08) |
| CIO-Synthesis call 1 (fresh look) | T4 | A, B | LOW in A (domain already collapsed), NONE in B (candidate) | KEEP only for held securities on the full path (V3-07) |
| CIO-Synthesis call 2 (held frame) | T4 | A, B, C | MEDIUM. The ranked unblock list with cost classes was the most decision-useful prose in each memo | KEEP; make unblock items a schema (V3-09) |
| Stage 6 financial impact | T2 | A, B, C | LOW. Restatement | FOLD into CALC render + one Analyst paragraph (V3-06) |
| Stage 9 comparison | T0 + T4 interpretation | C | HIGH for gates; LOW for ranking (hurdle starved) | KEEP; require horizon and rules values as gate inputs (V3-03, V3-05) |
| Validators (domain matrix, V-12, V-18, V-22) | T0 / T1 | A, B, C | HIGH for domain matrix; V-12 trivially passed (all citations were bundle ids); V-18 had nothing to reconcile; V-22 correctly false | KEEP |
| Canonical Writer | T0 | none (proposals only) | n/a; proposals were well-formed | KEEP; add counter-initialization refusal (V3-12) |
| CIO-Interface | T4 (session) | not simulated | n/a | KEEP as V2; F-100 still required |

Roles killed: none as roles. Steps killed: Stage 6 as a model stage; fresh-look call for candidates; validator-duplicate Red Team items; empty comparison rendering. Steps added: S0 preflight; S5 domain pre-computation with short-circuit; allocation gate matrix.

---

## 7. Deterministic-Control Audit

Every control that ran as a script, with its result and what the run would have done without it.

| control | case | result | without it |
|---|---|---|---|
| Period alignment (V-07) | A, B | `PERIOD_KIND_UNKNOWN` / calendar missing flagged; yoy pairs accepted as fixture-labelled | a production run would have derived standalone quarters from unlabelled cells (EV-01) |
| Arithmetic (CALC) | A, B, C | 36 derived values recomputed; all consistent | interpretations A.I01, C.I01, C.I05 would have stood unrebutted |
| Accounting identities (V-03) | A, B | `NO_ABSOLUTE_CELLS`; NOT_RUN recorded as not run, not as passed | a run could have reported "validated" on ratios |
| Position cap | A, B, C | A: fixture-asserted block, cap undefined flagged; B: cap undefined; C: 13.75% PASS, 10% FAIL, 6.25% PASS | Case C PROPERTY-C full add would have looked permissible on valuation grounds |
| Sector cap | C | BANK-A FAIL; three UNEVALUABLE (sector map partial) | BANK-A add would have been arguable on "high research quality" |
| Position count | C | 7 ≤ 8 PASS | n/a |
| Stale data (D-31, D-23) | B, C | B price 45 days → PRICE_UNKNOWN; C NAV 335 days → NO_VALID_VALUATION | B could have produced a "current" upside; C could have used a 60% discount as evidence |
| Duplicate / origin (V-09) | A, B | A: summary line collapsed into A.D01; B: management self-assessment linked, barred as outcome evidence | corroboration counts inflated; B.M02 closed on management's word (TD-08) |
| Cash-conversion calculation | A, B, C | A: 0.60x / 0.91x with basis; B: 1.05x with denominator labelled; C: < 0.40 → cash P/E > 12.5x | A's TREND_WARNING lost; C's "cheap" stands |
| One-off adjustment | B | recurring = 0.65 × reported; recurrence UNEVALUABLE flagged | +80% headline as earnings base |
| Breaker evaluation (V-16) | A | 2 MET, 2 NOT_MET (minimums), 2 UNEVALUABLE, composite NOT_TRIGGERED | model judgment on "broken" (TD-04) |
| Claim due-date scan (TD-07) | B | no past-due; B.M02 not closable early | early favourable close |
| Evaluability (MG-01) | B | B.M03 UNEVALUABLE | vague claim counted MET |
| Coverage map (V-11) | A, B, C | governance UNCOVERED in all → BUY/ADD removed | governance answered from absence |
| Freshness / PRICE_UNKNOWN | A, B | BUY/ADD/TRIM removed | capital actions on no price |
| Reconciliation (V-14) | A, C | UNRECONCILED (no ledger) → capital actions removed | typed "RECONCILED" |
| Hurdle (V-15) | C | UNEVALUABLE (D-21 unset; horizon missing) | a relative ranking would have become an ADD (PF-02) |
| Liquidity gate | all | UNEVALUABLE (D-20 unset) | n/a |
| Rules-block blank scan (V-21) | A, B, C | RULES_INCOMPLETE on cap[SCREEN+], cap[preliminary], cash_proxy, drawdown_limit | default-open gates (PF-09) |
| Domain matrix | A, B, C | A → {INVESTIGATE, NO_DECISION}; B → {WATCH, PASS, INVESTIGATE, NO_DECISION} (after S3-09 fix); C → {INVESTIGATE, NO_DECISION} strict | recommendations by judgment |
| Schema completeness | A, B, C | 9 to 12 missing fields named per run | silent gaps |
| Render rules (no midpoint, no numeric probability) | A, B, C | held | false precision |

Controls that could not be exercised: V-01/V-02 (no documents), V-04/V-05/V-06/V-10 (no documents), V-08 restatement (no cell store), V-13 share count (no share data), V-19 original hash (no canonical note), injection detector (no adversarial content in fixture beyond one quoted imperative), Writer idempotency (no writes). These are T-items for Session 4.

---

## 8. Evidence and Schema Gaps

| id | gap | found in | required change |
|---|---|---|---|
| G-01 | No calendar dates for reporting periods; `period_kind` (cumulative vs standalone) unknown | A, B | `reporting_period` MUST be a fiscal period id with calendar bounds; `period_kind` mandatory per cell; freshness UNEVALUABLE without them |
| G-02 | Thesis has no `thesis_date`, `deadline_period`, `baseline_period`; breaker text "repeatedly" not numeric | A | `ThesisState` adds the three fields; composite breakers carry `consecutive: N`; a thesis missing them cannot yield `UNCHANGED`/`STRENGTHENED` and is an L2 spec-gap item (`THESIS_SPEC_INCOMPLETE`) |
| G-03 | Research-depth taxonomy inconsistent: `SCREEN+`, `preliminary`, `DEEP`, `SCREEN`, `unresearched/external signal` | A, B, C | One enum in the rules block: `{UNRESEARCHED, SCREEN, DEEP}` with caps; migration maps legacy labels; `DECISION REQUIRED` for SCREEN+ → SCREEN or DEEP and preliminary → UNRESEARCHED |
| G-04 | Rules block lacks `cash_proxy`, `bear_drawdown_limit`, `large_cap_list`, `target_position_count` | C | S0 preflight refuses with `RULES_INCOMPLETE` naming the field; migration item M-10 for Otta's typed values |
| G-05 | Portfolio snapshot lacks `sector` (and `controlling_group`, `primary_drivers`, `liquidity_class`) for every position | C | Snapshot schema requires them; `SNAPSHOT_INCOMPLETE` at preflight |
| G-06 | Valuation ranges carry no `horizon`, no `as_of_price_record_id`, no `assumption_provenance` when consumed by another run | C | `ValuationSnapshot` fields mandatory; comparison column renders UNKNOWN and hurdle UNEVALUABLE without them |
| G-07 | No qualifier for `structural_vs_temporary` on a WEAKENED status; no `interim_posture` on INVESTIGATE | A | `ThesisState.qualifiers[]`; `DecisionMemo.interim_posture` |
| G-08 | `ALWAYS_MATERIAL` has no `MAJOR_CUSTOMER_CONTRACT` category; industrial-services pack has no customer-concentration extraction targets | B | Category added for `CUSTOMER_CONCENTRATED` packs; targets: top-customer shares, contract expiries |
| G-09 | Input precision not carried; derived values render at spurious precision | A, B, C | `precision` field on every numeric record; CALC renders bands; breaker evaluation has `tolerance` and `NEAR_THRESHOLD` state |
| G-10 | Claim states lack `OBSERVED_AHEAD` (threshold met before due) and `proxy_metric` (evidence for an unevaluable claim) | B | `ManagementClaim` gains both; hit rate still counts only closed evaluable claims |
| G-11 | No `SCREEN_RESULT` thesis event and no `screen_result` field for candidates that are `PASS`ed with re-screen conditions | C | Event kind added; re-screen conditions are typed items, disclosure-based, never price-based |
| G-12 | No `ALLOCATION` run type; no portfolio-level memo location; per-ticker lock cannot key a multi-ticker run | C | `question_category: ALLOCATION`; `runs/RUN-<date>-PORTFOLIO-<nn>/`; memo stored under `Business/Investing/Memos/` with references to each alternative's latest memo id; lock acquired on every alternative |
| G-13 | `INVESTIGATE` carries no `unblock_items[]` with cost class and due date, and no consecutive counter | A, B | Schema and L2 rule (V3-09) |
| G-14 | One-off records lack `of_which_line` (attributable, pre-tax, operating) and `counterparty` | B, C | `one_off_items[]` schema; B.D01-type derivations refuse without `of_which_line` |
| G-15 | Utilization and similar operating metrics lack a `denominator_basis` cell | B | Pack metric definitions require a basis cell; comparison across periods refuses on mismatch |

Evidence gaps that are properties of any fixture rather than of the schema: no documents (so no hashes, pages, identities), no external channels (so no evidence independence test), no adversarial content (so no injection test). Session 4 fixtures must supply them (T-01 to T-04, T-09).

---

## 9. Cost and Context-Duplication Audit

Model calls per run under V2 as written versus what the outcome required.

| case | V2 calls (approx.) | calls that could change the outcome | duplication |
|---|---|---|---|
| A | T1 extraction (none: no documents), T2 Analyst, T3 phase A, T3 phase B, T4 call 1, T4 call 2, T1/T2 V-12 | T2 Analyst (thesis status), T3 phase A (one new finding), T4 call 2 (unblock list) | T4 call 1 redundant (domain collapsed); T3 phase B mostly re-checked validators; Stage 6 restated |
| B | same set | T2 Analyst (candidate thesis), T3 phases (denominator, cycle framing), T4 call 2 | T4 call 1 meaningless for a candidate; Stage 6 restated |
| C | V2 would run S6..S8 per alternative: 4 × (T2 + T3 + T3) + 2 × T4 | one T2 + one T3 pair on CONSUMER-B vs cash; T4 once | roughly three quarters of spend on gate-eliminated alternatives |

Context duplication observed:

- The same fifteen facts (A) appeared in the bundle, the Analyst report, phase A, phase B, and the memo. Under V2 each worker receives the bundle and re-reads it; the cost is tokens, and the risk is that each rewrite drifts a label (e.g., "approximately 0.91x" becoming "0.91x" by the third rewrite, which happened in the simulation before the precision rule was applied).
- The Stage 6 table duplicated Stage 1 and Stage 3.
- The Stage 7 valuation sections for blocked alternatives in C duplicated Stage 3 invalidity findings.

Mitigations adopted in V3: workers receive the structured `evidence_report.json` (six buckets) and `calc_output.json`, not free text; derived values are referenced by id and never restated numerically in worker prose (render rule); Stage 6 removed as a stage; blocked alternatives never reach S6+; short-circuit path removes S9 and the fresh-look call when the domain has collapsed.

Estimated effect: Case C from about fourteen model calls to about four; Case A from six to three; Case B from six to four. Numbers are counts of calls, not tokens, and are from the simulation's stage plan, not a benchmark.

---

## 10. Memory-Safety Audit

| property | A | B | C | note |
|---|---|---|---|---|
| Canonical state untouched | YES | YES | YES | all changes are proposals |
| `human_decision: UNSET` on every proposal | YES | YES | YES | |
| Immutable run artifact written before any proposal | YES | YES | YES | |
| Frozen original preserved | YES (deadline text verbatim) | n/a (no original yet) | n/a | A.U07 recorded as a spec gap, not fixed by editing |
| Evidence ids on every status | YES | YES | YES | |
| Contradicting and T3 records retained (MC-03) | YES (A.I01, A.I02) | YES (B.I01..B.I03) | YES (C.I01) | |
| No valuation snapshot written without a method and range | YES | YES | YES | VALUE-D "45%" barred explicitly |
| One source, one projection | not exercised | not exercised | not exercised | T-11 |
| Writer idempotency | not exercised | not exercised | not exercised | T-11 |
| Counter initialization safety | GAP (S3-12) | n/a | n/a | proposal carries basis FIRST_OBSERVATION as L2 |
| Claim closure integrity | n/a | GAP (OBSERVED_AHEAD, G-10) | claim dates MISSING flagged | |
| L2 typed reasons | required for counter (A), candidate thesis (B) | | none (C) | no bulk approval offered |
| Allocation memo storage | n/a | n/a | GAP (G-12) | V2 has no location for it |

Verdict: memory handling was safe in every case. Two schema-level gaps (counter initialization, observed-ahead claims) and one storage gap (allocation memo) must be closed before build. Nothing in the three runs would have corrupted canonical state even if the proposals had been approved as written, because every proposed value carries its evidence and its basis.

---

## 11. Architecture Changes After Simulation

### 11.1 Findings register

| id | finding | cases | consequence |
|---|---|---|---|
| S3-01 | In a held-security run lacking price, valuation, or ledger, the recommendation domain collapses to {INVESTIGATE, NO_DECISION} at S5, before any model call; later stages can only change thesis status and the research list | A | V3-02 |
| S3-02 | V2 is internally inconsistent on `UNEVALUABLE`: §20.8 says it forces `INSUFFICIENT_EVIDENCE` at thesis level; TD-04 says it blocks `UNCHANGED`/`STRENGTHENED` only | A | V3-04 |
| S3-03 | V2 has no run type for a question spanning several tickers; the per-ticker lock cannot key it; no memo location exists | C | V3-03, G-12 |
| S3-04 | Three of four allocation alternatives were eliminated by T0 gates before judgment; V2 would still have run S6..S8 on all four | C | V3-02, V3-03 |
| S3-05 | The supported null action (keep cash) had to be labelled `INVESTIGATE`; V2 has no `HOLD_CASH` state and refusal codes remove everything but INVESTIGATE/NO_DECISION | C | V3-03 |
| S3-06 | Approximate inputs ("approximately 0.91x", rounded percentages) propagate as exact; breaker evaluation has no tolerance | A, B, C | V3-05 |
| S3-07 | The comparison table's return column is still hollow: V2 added price, but a range without a horizon yields no implied return | C | V3-03, G-06 |
| S3-08 | The fresh-look CIO call adds nothing for candidates (no held frame to mask) or when the domain has collapsed | A, B | V3-07 |
| S3-09 | `CALC_MISSING` as a global refusal removes `WATCH` and `PASS`, hiding the accurate candidate state behind `INVESTIGATE` | B | V3-14 |
| S3-10 | A candidate thesis drafted from management claims is management's frame; V2's `GUIDANCE_BASED` control protects the valuation, not the frame | B | V3-13 |
| S3-11 | Red Team framing independence is real (one to two new items per case); evidence independence is untestable without planted external records | all | T-09 |
| S3-12 | Initializing `quarters_since_fully_holding` without prior status history is unsafe; V2 has no rule | A | V3-12 |
| S3-13 | Rules-block and snapshot incompleteness were discovered at S5 after the bundle was built; V2 has no preflight | C | V3-01 |
| S3-14 | Research-depth labels are inconsistent across fixtures (`SCREEN+`, `preliminary`); caps cannot be looked up | A, B, C | V3-01, G-03 |
| S3-15 | A thesis can lack `thesis_date`, `deadline_period`, and a numeric threshold and still be run; the gap surfaces only as `UNEVALUABLE` at breaker time | A | V3-04, G-02 |
| S3-16 | Stage 6 restates Stage 1 and Stage 3 | all | V3-06 |
| S3-17 | No materiality category or extraction target for major-customer contracts | B | V3-15, G-08 |
| S3-18 | Red Team phase B re-checks what validators already checked | all | V3-08 |
| S3-19 | `INVESTIGATE` has no due date, no unblock schema, and no counter; it can become the new indefinite `HOLD` | A, B | V3-09 |
| S3-20 | Stage 1's six-bucket separation did most of the analytical work but is not a schema or a rendered artifact in V2 | all | V3-10 |

### 11.2 `MUST FIX BEFORE BUILD`

| id | change | replaces or extends | proven by |
|---|---|---|---|
| V3-01 | **S0 preflight (T0).** Before any collection or model call: rules-block completeness (every field the run's gates need, including `cash_proxy`, `bear_drawdown_limit`, `large_cap_list`, caps for every research level in the enum, `sector_limit`, `max_positions`), snapshot completeness (date, `ledger_check`, `sector` for every position), research-depth enum validity, per-ticker locks for every ticker the run touches. Refuse with `RULES_INCOMPLETE`, `SNAPSHOT_INCOMPLETE`, or `RUN_IN_PROGRESS`, naming the field and the cheapest unblock. Zero model calls on refusal. | V2 V-21 at S5; V2 PF-09 | C Stage 0/3; S3-13, S3-14 |
| V3-02 | **Domain pre-computation and short-circuit at S5 (T0).** Compute the domain matrix from S0..S5 facts before S6. If the domain is a subset of {INVESTIGATE, NO_DECISION, HOLD_CASH, WATCH, PASS} with no capital action possible, run the **short path**: S6 Analyst (thesis assessment and unknowns only), S8a Red Team blind phase, one CIO-Synthesis call, validators, memo. Skip S7 valuation on alternatives with no valid inputs, S8b, S9 comparison, and the fresh-look call. Render `COMPARISON_UNAVAILABLE` rather than an empty table. In allocation runs, alternatives eliminated by the gate matrix never reach S6. | V2 §20.3 linear pipeline | A Stage 0/10; C Stage 3/9; S3-01, S3-04 |
| V3-03 | **`ALLOCATION` run type and allocation vocabulary.** `question_category: ALLOCATION`; run id `RUN-<date>-PORTFOLIO-<nn>`; locks on every alternative. Artifacts: `gate_matrix.json` (T0), per-alternative state carried from each latest memo with age, `comparison_table.json`. Vocabulary: per alternative `ELIGIBLE | CONDITIONAL(gates[]) | BLOCKED(gate)`; allocation recommendation `DEPLOY(ticker, size_band) | PARTIAL(ticker, size_band) | HOLD_CASH | INVESTIGATE | NO_DECISION`. `HOLD_CASH` is never removed from any domain and is the default under every refusal; it carries `basis: INTERIM_BY_GATES | PREFERRED_BY_HURDLE | PREFERRED_BY_JUDGMENT`. Gate `G4`: an alternative's carried valuation is admissible only with memo id, memo date ≤ D-23, `price_record` date ≤ 5 trading days, `assumption_provenance` per slot, and `horizon`. Size bands only; no single size unless a sizing rule exists in the rules block. | V2 §20.7 (single-ticker domains); V2 S9 | C all stages; S3-03, S3-05, S3-07 |
| V3-04 | **`UNEVALUABLE` semantics and thesis-spec completeness.** An `UNEVALUABLE` breaker removes `UNCHANGED` and `STRENGTHENED`; it also removes `BROKEN` on that breaker's path. Thesis status is then `WEAKENED` or `INSUFFICIENT_EVIDENCE` according to the evaluable evidence. `INSUFFICIENT_EVIDENCE` is forced only when no minimum or breaker is evaluable. A thesis missing `thesis_date`, `deadline_period`, `baseline_period`, or any numeric threshold value is `THESIS_SPEC_INCOMPLETE`: an L2 item is raised, and the memo header shows it. Composite breakers carry `consecutive: N`. | V2 §20.8 and TD-04 (contradictory) | A Stage 3/4; S3-02, S3-15 |
| V3-05 | **Precision and tolerance.** Every numeric record carries `precision` (decimal places or `APPROX`). CALC renders derived values at the precision of the least precise operand and as a band when any operand is `APPROX` or rounded. Breaker evaluation carries a `tolerance` from the rules block and emits `NEAR_THRESHOLD` (treated as `UNEVALUABLE` for `UNCHANGED`/`STRENGTHENED`, and as an L2 item) when the input is within tolerance of the threshold. Render validator rejects any derived figure shown at higher precision than its inputs. | new | A, B, C; S3-06 |
| V3-09 | **`INVESTIGATE` discipline.** Every `INVESTIGATE` carries `unblock_items[]` each with `what`, `who` (Otta, extraction run, external event), `cost_class` (minutes, hours, one period), `due`; an `interim_posture` (no action / keep / n/a); and a `consecutive_investigate_count` per ticker computed by CALC from decision history. Two consecutive `INVESTIGATE`s on overlapping unblock items make the third an L2 item with a typed reason, mirroring the weakened-duration rule. | V2 refusal-behaviour rule ("one named cheapest unblock") | A, B; S3-19 |
| V3-10 | **Stage 1 taxonomy as schema.** `evidence_report.json` has exactly six arrays: `FACTS`, `DERIVED`, `INTERPRETATIONS`, `MANAGEMENT_CLAIMS`, `UNKNOWN`, `CONTRADICTIONS`. Validator: every numeric figure in any worker output or memo must reference an id in `FACTS` or `DERIVED`; every `INTERPRETATION` must carry an author and tier; every `CONTRADICTION` must reference two or more ids; every `UNKNOWN` must state why it matters. Workers receive this file, not free text. | V2 evidence bundle (records only) | all; S3-20 |
| V3-14 | **Candidate `depth: SCREEN` and action-level `CALC_MISSING`.** A `CANDIDATE_SCREEN` run at `depth: SCREEN` has domain {WATCH, PASS, INVESTIGATE, NO_DECISION}; `BUY` requires `depth: FULL` with `calc_output.json` present. `CALC_MISSING` becomes a domain restriction removing `BUY`, `ADD`, `TRIM` and a header flag `VALUATION_ABSENT`, not a global refusal; `HOLD` with `VALUATION_ABSENT` requires `hold_not_buy_reasons` and counts toward the weakened-duration L2 rule. | V2 V-20 as refusal | B Stage 10; S3-09 |
| V3-13 | **Independent assumption rule for candidate theses.** A proposed candidate thesis must contain at least one assumption or breaker not derived from a management claim (`origin: INDEPENDENT`), and the memo must name it. Guidance-derived assumptions carry `GUIDANCE_DERIVED` and remain barred from base valuation scenarios below D-18. | V2 `GUIDANCE_BASED` label | B Stage 4/8; S3-10 |

### 11.3 `SHOULD FIX`

| id | change | proven by |
|---|---|---|
| V3-06 | Remove Stage 6 as a model stage. CALC renders a directional impact table from cells and derived ids; the Analyst adds at most one paragraph of causal reading citing ids. | S3-16 |
| V3-07 | Fresh-look CIO call runs only for held securities on the full path. Candidates: one call. Short path: one call. | S3-08 |
| V3-08 | Red Team phase B checklist drops items that duplicate validators (citation existence, schema, domain, arithmetic). Phase B is: findings against the Analyst's causal reading and scenario design, strongest surviving objection, divergence statement, verdict. | S3-18 |
| V3-11 | Render rules: conditional derived values are rendered with their condition in the same sentence; figures from comparators marked `NO_VALID_VALUATION` or `INVALID` are suppressed from memo prose (id only); management self-assessments are never rendered as outcomes. | B Stage 8; C Stage 7 |
| V3-12 | Memory schema additions: Writer refuses to initialize any counter without a `basis` field; `basis: FIRST_OBSERVATION` is an L2 item. `ManagementClaim` gains `OBSERVED_AHEAD` and `proxy_metric`. `ThesisEvent` gains `SCREEN_RESULT` with typed, disclosure-based re-screen conditions. | S3-12, G-10, G-11 |
| V3-15 | Pack extensions: industrial-services pack adds extraction targets for top-customer shares and contract expiries; `ALWAYS_MATERIAL` gains `MAJOR_CUSTOMER_CONTRACT` for `CUSTOMER_CONCENTRATED` packs; all packs gain `one_off_items[].of_which_line` and operating metrics gain `denominator_basis`. | B; G-08, G-14, G-15 |
| V3-16 | Per-ticker memo state carried into other runs is a typed `MemoReference` {memo_id, date, recommendation, thesis_status, valuation_snapshot_id, price_record_id, age_days}; runs consume references, never memo prose. | C Stage 4/9 |

### 11.4 `OPTIONAL`

| id | change |
|---|---|
| V3-17 | Research-hour cost on `unblock_items[]` aggregated per memo, so Otta sees the time price of moving a candidate from WATCH to a FULL run. |
| V3-18 | Drift score (V2 §20.8) retained as specified; no evidence for or against in this pack (no multi-run history). |
| V3-19 | Memo language toggle (Indonesian / English) at render time; content unaffected. |

### 11.5 `REMOVE`

| item | reason |
|---|---|
| Fresh-look call for candidates and on the short path | S3-08; no information |
| Stage 6 as a model stage | S3-16 |
| Red Team phase B validator-duplicate items | S3-18 |
| `CALC_MISSING` as a global refusal code | S3-09; replaced by action-level restriction |
| `SCREEN+`, `preliminary` and any research label outside the enum | S3-14 |
| Empty comparison tables | S3-01 |
| Stage 4 `unchanged_assumptions` label | structurally empty; renamed `reconfirmed_this_run` |

No V2 role is removed. V2's execution units all earned their place; two of its steps and one of its refusal codes did not.

---

## 12. Mitigation and Test Results

### 12.1 Case-pack controls

Every control the case pack required, with the stage that demonstrated it.

| case | control required | result | where |
|---|---|---|---|
| A | Separate facts from the secondary analyst's interpretation | PASS | Stage 1 (A.I01, A.I02 never entered a derived value) |
| A | Do not conclude "temporary" because costs may normalize | PASS | Stage 4, A.D06 bound; status `UNRESOLVED` |
| A | Do not declare BROKEN from one period without a hard breaker | PASS by rule | Stage 3 breaker_eval (count 1; liquidity minimums met) |
| A | Recognize the thesis has weakened | PASS | Stage 4 `WEAKENED` |
| A | Recognize ADD is blocked by the research/position rule regardless of cheapness | PASS, four ways | Stage 0/3/10 |
| A | Avoid one precise fair value | PASS | Stage 7 (none produced) |
| A | Identify evidence to distinguish temporary from structural | PASS | Stage 10 E1..E7 |
| A | Propose monitoring triggers without rewriting the deadline | PASS | Stage 11 (deadline verbatim), Stage 12 |
| B | Mark thesis NOT_ESTABLISHED before proposing a candidate | PASS | Stage 4 |
| B | Separate core profit from the one-off | PASS | B.D01 band, conditional |
| B | Score each claim | PASS | Stage 5: MET, MET (early), UNEVALUABLE, OPEN |
| B | Recognize genuine improvement without copying the long-run narrative | PASS | Stage 10 rationale 1 vs B.I03 excluded |
| B | Refuse a current BUY valuation on stale price or missing capex | PASS | Stage 7 `CALC_MISSING`; Stage 0 `PRICE_UNKNOWN` |
| B | Specify what moves WATCH to BUY | PASS | Stage 10 |
| B | Preserve concentration and renewal as major risks | PASS | B.X01, B-A6, B-MON-01 |
| C | Do not add to BANK-A | PASS by rule | gate matrix |
| C | Do not add the full Rp20m to PROPERTY-C | PASS by rule | C.D05 |
| C | Do not treat low P/E and P/B as proof of cheapness | PASS | C.D08, C.D09, C.X01 |
| C | Compare CONSUMER-B, VALUE-D, partial, cash | PASS | Stage 9 |
| C | Governance, cash conversion, execution as downside | PASS | Stage 3 gates; Stage 10 rationale 2 |
| C | Do not force full deployment | PASS | Stage 9/10 size band; cash interim |
| C | Distinguish deterministic from judgment | PASS | gate matrix (T0) vs CONSUMER-B-vs-cash (judgment, starved) |
| C | State evidence and gates permitting any allocation | PASS | CONDITIONAL G1..G7 |
| C | Preserve uncertainty rather than manufacture expected return | PASS | hurdle UNEVALUABLE; no expected return stated |

System-level expectation (case pack final section): all eight items met, with one labelling defect (cash as `INVESTIGATE`, S3-05) and one scope defect (`CALC_MISSING` hiding `WATCH`, S3-09), both fixed in V3.

### 12.2 V2 fixtures touched by this pack

The case pack was not V2's §16 fixture set. It exercised the following V2 fixtures incidentally:

| V2 fixture | exercised | result |
|---|---|---|
| F-25 fresh look vs held frame | A | fresh look INVESTIGATE; no ADD; V-18 trivially satisfied |
| F-33 absence assumption without search | A (A5, A6), B (B-A5) | forced `INSUFFICIENT_EVIDENCE` or `MANAGEMENT_REPORTED` basis |
| F-34 numeric breaker | A | script decided; model could not override |
| F-38 management "we achieved" as outcome | B (B.I02) | rejected as outcome evidence |
| F-39 generic "what would change" | A, B, C | every item references an id or a named missing item |
| F-44 multiple without cross-check | C (VALUE-D) | INVALID |
| F-47 one-off | B | recurrence UNEVALUABLE flagged; not silently excluded or included |
| F-52 numeric probability in prose | all | none produced |
| F-62 no price record | A, B | BUY/ADD/TRIM excluded; thesis assessment produced |
| F-66 vague guidance | B (B.M03) | UNEVALUABLE |
| F-71 best of a bad set | C | hurdle UNEVALUABLE, so `BUY`/`ADD` excluded; would have been a relative-ranking ADD without V-15 |
| F-72 stale comparator | C (PROPERTY-C) | NO_VALID_VALUATION |
| F-73 grandfathered cause | C (BANK-A) | FAIL_GRANDFATHERED_CAUSE rendered |
| F-78 blank rule value | A, B, C | RULES_INCOMPLETE |
| F-102 refusal names cheapest unblock | all | yes |

Not exercised (no documents, no history, no adversarial content, no writes): F-01 to F-18, F-20 to F-24, F-26 to F-32, F-35 to F-37, F-40 to F-43, F-45, F-46, F-48 to F-51, F-53, F-54, F-60, F-61, F-63 to F-65, F-67, F-70, F-74 to F-77, F-80 to F-96, F-100, F-101, F-103, F-104. These remain Session 4 obligations; V2's statement that Session 3 would resolve them was not met by this pack and is carried forward honestly in §17.

### 12.3 Controls that failed or could not run

| control | status | reason | fix |
|---|---|---|---|
| Hurdle gate V-15 | COULD NOT RUN | D-21 values unset; ranges lack horizon | V3-01, G-04, G-06 |
| Liquidity gate | COULD NOT RUN | D-20 unset | V3-01 |
| Sector cap on non-financials | COULD NOT RUN | snapshot sector map partial | V3-01, G-05 |
| `CALC_MISSING` refusal scope | FAILED (over-broad) | removed WATCH/PASS | V3-14 |
| Domain vocabulary for cash | FAILED (missing state) | no HOLD_CASH | V3-03 |
| Fresh-look reconciliation V-18 | VACUOUS | nothing to reconcile in any case | V3-07 |
| Precision | FAILED (no rule) | exact rendering of approximate inputs | V3-05 |
| Red Team evidence independence | UNTESTABLE | fixture has no external records | T-09 |
| `UNEVALUABLE` semantics | AMBIGUOUS | V2 contradiction | V3-04 |
| Counter initialization | FAILED (no rule) | | V3-12 |
| Truth validators V-01..V-10, V-13, V-19 | NOT RUN | no documents or canonical notes | T-01..T-06 |

---

## 13. Revised Architecture Diagram

```text
  Otta ──────────► CIO-INTERFACE (interactive session; structured intake only;
  conversation     explains and quotes memos by id; NO_MEMO_NO_VIEW; sees no bundle,
                   no worker report, no cost basis)
                        │ intake.json {ticker(s), question_category incl. ALLOCATION,
                        │              depth ∈ {QUICK, SCREEN, FULL}, event pointers}
                        ▼
  ┌─ S0 PREFLIGHT (T0, zero model calls) ───────────────────────────────────────────┐
  │ rules block complete? snapshot dated, reconciled, sector per position?          │
  │ research-depth enum valid? thesis spec complete? locks on every ticker?         │
  │ REFUSE: RULES_INCOMPLETE | SNAPSHOT_INCOMPLETE | THESIS_SPEC_INCOMPLETE(L2) |    │
  │         RUN_IN_PROGRESS  → memo stub naming field + cheapest unblock            │
  └────────────────────────────────────────┬────────────────────────────────────────┘
                                           ▼
  ┌─ S1..S3 EVIDENCE (T0 + T1 double extraction + validators V-01..V-11) ───────────┐
  │ adapters declare coverage; tier by channel; detector on every retrieval        │
  │ output: evidence_report.json = {FACTS, DERIVED, INTERPRETATIONS,                │
  │         MANAGEMENT_CLAIMS, UNKNOWN, CONTRADICTIONS}  (schema-validated)         │
  │         + cells with precision, period_kind, scope, denominator_basis           │
  └────────────────────────────────────────┬────────────────────────────────────────┘
                                           ▼
  ┌─ S4 CALC (T0) ─────────────────────────────────────────────────────────────────┐
  │ breaker_eval (tolerance, NEAR_THRESHOLD, consecutive) · claims_eval (due scan,  │
  │ evaluability, OBSERVED_AHEAD) · cash conversion · one-off recurrence · sizing  │
  │ · gate matrix per alternative (count, depth cap, sector, freshness, liquidity, │
  │ coverage, reconciliation, hurdle with horizon) · precision bands               │
  └────────────────────────────────────────┬────────────────────────────────────────┘
                                           ▼
  ┌─ S5 DOMAIN PRE-COMPUTATION (T0) ───────────────────────────────────────────────┐
  │ domain matrix from S0..S4 · per-alternative ELIGIBLE/CONDITIONAL/BLOCKED       │
  │ HOLD_CASH, INVESTIGATE, NO_DECISION never removed                              │
  └──────────────┬─────────────────────────────────────────────┬────────────────────┘
        no capital action possible                  capital action possible
                 ▼                                              ▼
  ┌─ SHORT PATH ───────────────────┐        ┌─ FULL PATH ─────────────────────────────┐
  │ S6 Analyst (T2): statuses,     │        │ S6 Analyst (T2), blind to prior         │
  │   causal reading, unknowns,    │        │   valuation numbers                      │
  │   candidate thesis (with       │        │ S7 recompute + CALC_MISSING → action-    │
  │   ≥1 INDEPENDENT assumption)   │        │   level restriction, not refusal         │
  │ S8a Red Team blind (T3)        │        │ S8a Red Team blind (T3)                  │
  │ S10 CIO-Synthesis (T4) ×1      │        │ S8b Red Team compare (T3), trimmed list  │
  │   (no fresh-look; no S9)       │        │ S9 portfolio: eligible alternatives only;│
  │ render COMPARISON_UNAVAILABLE  │        │   MemoReference with age; hurdle needs   │
  │                                │        │   horizon                                │
  │                                │        │ S10 CIO-Synthesis (T4): fresh-look call  │
  │                                │        │   only if held; then held/allocation call│
  └──────────────┬─────────────────┘        └──────────────┬──────────────────────────┘
                 └───────────────────────┬──────────────────┘
                                         ▼
  ┌─ S10v VALIDATORS (T0; V-12 T1/T2) ─────────────────────────────────────────────┐
  │ domain · six-bucket trace (every figure → FACTS/DERIVED id) · precision render │
  │ · conditional-inline · invalid-comparator suppression · V-12 support ·         │
  │ fresh-look reconciliation · red-team-silent · unblock_items schema             │
  └────────────────────────────────────────┬────────────────────────────────────────┘
                                           ▼
  memo (position-aware or allocation vocabulary) · memory_proposal.json ·
  trigger_proposal.json · human_decision: UNSET
                                           ▼
  Otta: human_decision block (freeze rule) · item-level approval · typed L2 reasons
  (THESIS_SPEC_INCOMPLETE, counter FIRST_OBSERVATION, candidate thesis, NEAR_THRESHOLD,
   third consecutive INVESTIGATE, weakened-duration HOLD, OUTSIDE_HISTORY, ...)
                                           ▼
  ┌─ CANONICAL WRITER (T0; idempotent; one source, one projection) ────────────────┐
  │ refuses: ORIGINAL_THESIS_TAMPERED · counter without basis · snapshot without   │
  │ method · figure without FACTS/DERIVED id                                       │
  └────────────────────────────────────────┬────────────────────────────────────────┘
                                           ▼
  ObsidianVault: Business/Investing/<TICKER>.md · Business/Investing/Memos/<run_id>.md
  (incl. PORTFOLIO allocation memos) · Finance/Investment-Portfolio.md
  ic-data (outside vault): thesis-events, financials, prices, corporate-actions,
  decision-history (for consecutive counters), write receipts

  Stores: FinancialCellStore · PriceRecord · CorporateActionRecord · NegativeSearchRecord
  · BreakerEval · MemoReference (new) · DecisionHistory (new, for counters)

  Data-flow rules: raw content stops at Evidence; every figure downstream is an id;
  Analyst never sees prior valuation numbers, portfolio, or cost basis; Red Team phase A
  never sees the Analyst; CIO-Synthesis never sees the conversation or cost basis;
  CIO-Interface never sees a bundle or worker report; eliminated alternatives never reach
  a model; cost basis exists nowhere.

  V3 monitoring: unchanged from V2 §20.12 (contract only; built after fixtures pass), with
  MAJOR_CUSTOMER_CONTRACT added to ALWAYS_MATERIAL for CUSTOMER_CONCENTRATED packs.
```

---

## 14. Recommended Architecture V3

V3 inherits every part of V2 not named below. Where V3 changes a V2 rule, the V3 rule wins.

### 14.1 Execution units

| unit | primitive | V3 change |
|---|---|---|
| CIO-Interface | direct reasoning, interactive session | intake enum adds `ALLOCATION`; depth adds `SCREEN` |
| S0 Preflight | deterministic script | new; V3-01 |
| Evidence pipeline | scripts + T1 double extraction + validators | output is `evidence_report.json` in six buckets (V3-10); cells carry `precision`, `period_kind`, `denominator_basis` |
| CALC | deterministic script as tool | adds gate matrix, sizing bands, tolerance, precision bands, consecutive counters, claims `OBSERVED_AHEAD`, hurdle with horizon |
| S5 Domain pre-computation | deterministic script | new; V3-02 |
| Analyst | ephemeral worker T2 | output narrowed: assumption statuses with ids, causal reading, unknowns, scenario axes, candidate thesis with ≥ 1 `INDEPENDENT` assumption; no financial impact table; no restated figures |
| Red Team | ephemeral worker T3, phase A always, phase B on full path | checklist trimmed (V3-08) |
| CIO-Synthesis | isolated T4 call(s) | one call on short path and for candidates; two on full path for held securities; allocation frame for `ALLOCATION` runs |
| Validators | T0 + V-12 | add six-bucket trace, precision render, conditional-inline, invalid-comparator suppression, unblock schema |
| Canonical Writer | script | add counter-basis refusal, `SCREEN_RESULT`, `MemoReference`, `DecisionHistory` |

Zero permanent agents. Zero new profiles. Model calls per FULL held run: T1 extraction ×2 per document, one T2, two T3, two T4, V-12 checks. Per short-path run: one T2, one T3, one T4. Per allocation run: T0 gate matrix, then per surviving alternative the short or full set, then one T4 allocation call.

### 14.2 Records

V2's fourteen records plus:

| record | purpose | storage |
|---|---|---|
| `MemoReference` | typed pointer to a memo consumed by another run: memo_id, date, recommendation, thesis_status, valuation_snapshot_id, price_record_id, assumption_provenance summary, horizon, age_days | derived from `DecisionMemo` at read time; not stored separately |
| `DecisionHistory` | per-ticker table of (run_id, date, recommendation, human_decision, execution_status, unblock_item_ids) for consecutive counters | `ic-data/decisions/<TICKER>.jsonl`, append-only; rebuildable from runs |
| `GateMatrix` | per-alternative gate results for allocation runs | run artifact `gate_matrix.json` |

Field changes: `ThesisState` adds `thesis_date`, `deadline_period`, `baseline_period`, `qualifiers[]` (e.g. `structural_vs_temporary`), `research_level` from the unified enum; breakers add `consecutive`, `tolerance`; `ManagementClaim` adds `OBSERVED_AHEAD`, `proxy_metric`; `ValuationSnapshot` adds `horizon`, `as_of_price_record_id` (mandatory for consumption); `PortfolioSnapshot` requires `sector`, `controlling_group`, `primary_drivers`, `liquidity_class` per position and `snapshot_date`; rules block adds `cash_proxy`, `bear_drawdown_limit`, `large_cap_list`, `target_position_count`, `breaker_tolerance`, `research_levels{}` with caps; `DecisionMemo` adds `interim_posture`, `unblock_items[]`, `consecutive_investigate_count`, `valuation_absent`, `thesis_spec_incomplete`, `near_threshold[]`, and for allocation memos `gate_matrix`, `size_band`, `cash_basis`; every numeric record has `precision`; `ThesisEvent` adds `SCREEN_RESULT`, `SPEC_GAP_NOTED`; `evidence_report.json` is a new run artifact with the six buckets.

### 14.3 Workflow

| stage | V3 |
|---|---|
| S0 | Preflight (V3-01). Structured intake as V2. Locks on all tickers named. |
| S1..S3 | As V2, producing `evidence_report.json` (V3-10) and precision-tagged cells |
| S4 | CALC: breaker_eval with tolerance; claims_eval; cash conversion; one-off; gate matrix; sizing bands |
| S5 | Domain pre-computation; short/full path selection (V3-02); eliminated alternatives stop here |
| S6 | Analyst, narrowed output; candidate thesis rule (V3-13) |
| S7 | Recompute; `CALC_MISSING` action-level (V3-14). Full path only |
| S8a | Red Team blind. Always |
| S8b | Red Team compare, trimmed. Full path only |
| S9 | Portfolio comparison on eligible alternatives only; `MemoReference`s; hurdle with horizon; `COMPARISON_UNAVAILABLE` otherwise |
| S10 | CIO-Synthesis: one call (short path, candidates) or two (full path, held); allocation frame for `ALLOCATION` |
| S10v | Validators, extended |
| S11..S14 | As V2 with the Writer additions |

### 14.4 Recommendation domains

Single-ticker runs: V2 §20.7 matrix with these changes: `CALC_MISSING` removes `BUY`, `ADD`, `TRIM` (not everything); `depth: SCREEN` domain is {WATCH, PASS, INVESTIGATE, NO_DECISION}; `THESIS_SPEC_INCOMPLETE` removes `UNCHANGED`, `STRENGTHENED`; `NEAR_THRESHOLD` on a breaker removes `UNCHANGED`, `STRENGTHENED` and raises L2; third consecutive `INVESTIGATE` on overlapping unblocks is an L2 item.

Allocation runs: per alternative `ELIGIBLE | CONDITIONAL(gates[]) | BLOCKED(gate)`; recommendation `DEPLOY | PARTIAL | HOLD_CASH | INVESTIGATE | NO_DECISION`; `HOLD_CASH` never removed; `DEPLOY`/`PARTIAL` require every gate `PASS` including G4 provenance and V-15 hurdle with horizon; size as a band unless a sizing rule exists.

### 14.5 Thesis lifecycle

As V2 §20.8 plus: `THESIS_SPEC_INCOMPLETE` L2 item; `UNEVALUABLE` semantics per V3-04; candidate thesis independent-assumption rule; `SCREEN_RESULT` for `PASS`ed candidates with disclosure-based re-screen conditions.

### 14.6 Memory and Writer

As V2 §20.10 plus: counter-basis refusal; `DecisionHistory`; allocation memos stored under `Business/Investing/Memos/` with `MemoReference`s to each alternative; every figure in a memo must trace to a `FACTS` or `DERIVED` id or the Writer refuses.

### 14.7 Model tiers

As V2 §20.11. The short path reduces T3 and T4 usage by roughly half; the allocation gate matrix removes model calls on blocked alternatives entirely.

### 14.8 Migration additions

V2's M-06 to M-09 plus: M-10 rules-block completion (`cash_proxy`, `bear_drawdown_limit`, `large_cap_list`, `target_position_count`, `breaker_tolerance`, research-level enum with caps); M-11 snapshot sector map and `snapshot_date` for every position; M-12 `thesis_date`, `deadline_period`, `baseline_period` for every migrated thesis (`THESIS_SPEC_INCOMPLETE` until done); M-13 legacy research labels mapped to the enum with Otta's typed decision per company; M-14 `horizon` and `as_of_price_record_id` on every legacy valuation row or the row is marked `NO_VALID_VALUATION`.

---

## 15. Changes from V2 to V3

| area | V2 | V3 |
|---|---|---|
| Run start | S1 collection begins immediately; rules and snapshot checked at S5 | S0 preflight refuses on incomplete rules, snapshot, thesis spec, or enum before any model call |
| Pipeline shape | linear S1..S14 | domain pre-computation at S5; short path (thesis assessment only) vs full path |
| Run types | single ticker | plus `ALLOCATION` (multi-ticker, gate matrix, allocation vocabulary) |
| Cash | allowed outcome, no state | `HOLD_CASH` state, never removed, with basis label |
| `CALC_MISSING` | global refusal | action-level restriction plus header flag |
| Candidate depth | FULL only | `SCREEN` depth with {WATCH, PASS, INVESTIGATE, NO_DECISION} |
| `UNEVALUABLE` | contradictory | removes UNCHANGED/STRENGTHENED and BROKEN on that path; forces INSUFFICIENT_EVIDENCE only when nothing is evaluable |
| Thesis spec | date/deadline implicit | `thesis_date`, `deadline_period`, `baseline_period`, `consecutive`; `THESIS_SPEC_INCOMPLETE` L2 |
| Precision | none | `precision` per record; bands; `tolerance`; `NEAR_THRESHOLD` |
| Valuation consumption | `ValuationSnapshot` by id | `MemoReference` with horizon, price date, provenance; hurdle needs horizon |
| Evidence report | records with labels | six-bucket `evidence_report.json` with trace validator |
| Stage 6 | model stage | CALC-rendered table plus one Analyst paragraph |
| Fresh-look call | every FULL run | held securities on full path only |
| Red Team phase B | eight-item checklist incl. validator duplicates | trimmed to judgment items |
| `INVESTIGATE` | refusal-adjacent state | typed unblock items, interim posture, consecutive counter, L2 at third |
| Candidate thesis | may be built from claims with labels | must contain ≥ 1 `INDEPENDENT` assumption |
| Claims | OPEN or closed | plus `OBSERVED_AHEAD`, `proxy_metric` |
| Research levels | free labels | one enum with caps in rules block |
| Materiality | `ALWAYS_MATERIAL` list | plus `MAJOR_CUSTOMER_CONTRACT` for flagged packs |
| Writer | idempotent, hash-checked | plus counter-basis refusal, figure-trace refusal, `DecisionHistory` |
| Removed | | Stage 6 model stage; candidate fresh-look; validator-duplicate Red Team items; `SCREEN+`/`preliminary`; empty comparison tables; global `CALC_MISSING` |

Invariants: V2's thirty-five stand. New:

36. No model call `MUST` occur before S0 preflight passes.
37. `HOLD_CASH`, `INVESTIGATE`, and `NO_DECISION` `MUST NOT` be removed from any domain by any condition.
38. An alternative `BLOCKED` by the gate matrix `MUST NOT` be processed by any model worker in that run.
39. Every numeric figure in a memo or worker output `MUST` reference a `FACTS` or `DERIVED` id, and `MUST NOT` be rendered at higher precision than its least precise operand.
40. A `DEPLOY`, `PARTIAL`, `BUY`, or `ADD` `MUST NOT` rest on a valuation range without a `horizon` and an in-freshness `price_record_id`.
41. An `UNEVALUABLE` or `NEAR_THRESHOLD` breaker `MUST` remove `UNCHANGED` and `STRENGTHENED`; a thesis with an incomplete spec `MUST` raise an L2 item.
42. A candidate thesis `MUST` contain at least one assumption not derived from a management claim.
43. A third consecutive `INVESTIGATE` on overlapping unblock items `MUST` be an L2 item.
44. No counter `MUST` be initialized without a recorded basis.

---

## 16. Remaining `DECISION REQUIRED` Items

Carried from V2 (unchanged): D-16, D-17, D-18, D-19, D-20, D-21, D-22, D-24, D-25, D-26, D-27, D-28, D-29, D-31, D-32, D-33, D-34. D-23 (120 days) and D-30 (two periods) were used as recommended and behaved sensibly; they remain Otta's to confirm.

New:

| id | question | recommendation |
|---|---|---|
| D-35 | Research-level enum mapping: is `SCREEN+` → `SCREEN` or `DEEP`? Is `preliminary` → `UNRESEARCHED` (4%)? | `SCREEN+` → `SCREEN` unless the note meets the DEEP checklist; `preliminary` → `UNRESEARCHED`. Otta decides per company (M-13). |
| D-36 | Cash proxy definition for the hurdle: which instrument, which rate source, how often refreshed? | A dated T3 whitelisted series; refreshed quarterly; recorded in the rules block with date. |
| D-37 | Bear-drawdown limit per tranche and per position (D-21 values) | Otta sets two numbers; both versioned. |
| D-38 | Default valuation horizon when a legacy range lacks one | None. Legacy rows without horizon are `NO_VALID_VALUATION` for comparison; Otta may add a horizon as a `MANUAL_EDIT` event. |
| D-39 | Sizing rule within a cap: does the committee ever recommend a single size, or always a band? | Band only, until Otta writes a sizing rule into the rules block. |
| D-40 | Consecutive-`INVESTIGATE` threshold | Third consecutive on overlapping unblocks is L2. Otta confirms. |
| D-41 | Breaker tolerance values (per metric class: margin pp, ratio x, growth %) | Otta sets; default `APPROX` inputs within 0.5 units of the least precise digit are `NEAR_THRESHOLD`. |
| D-42 | Is `HOLD` with `VALUATION_ABSENT` permitted for a position above its research-level cap, or does that combination force `INVESTIGATE`? | Force `INVESTIGATE` with unblock items: the position is by definition awaiting a research upgrade. Otta decides. |
| D-43 | Which allocation questions require a fresh per-ticker memo for each eligible alternative versus consuming `MemoReference`s within D-23? | Consume within D-23; a `QUICK` re-run for any alternative whose price record is stale. |
| D-44 | Fixture authorship for Session 4: who writes the planted disconfirming documents (T-09) so they are not authored by the model family under test? | Otta writes or curates from real historical IDX events per V2 CR-12. |

---

## 17. NEXT SESSION HANDOFF

### 17.1 Final V3 architecture decisions

1. S0 preflight (T0) gates every run on rules, snapshot, thesis-spec, enum, and lock completeness. Zero model calls before it passes.
2. S5 domain pre-computation selects a short path (thesis assessment only) or a full path; blocked alternatives never reach a model.
3. `ALLOCATION` run type with a T0 gate matrix, per-alternative `ELIGIBLE | CONDITIONAL | BLOCKED`, and recommendation `DEPLOY | PARTIAL | HOLD_CASH | INVESTIGATE | NO_DECISION`. `HOLD_CASH` never removed.
4. `CALC_MISSING` is an action-level restriction; `depth: SCREEN` exists for candidates; `BUY` only from `FULL`.
5. `UNEVALUABLE` removes `UNCHANGED`, `STRENGTHENED`, and `BROKEN` on its path; `THESIS_SPEC_INCOMPLETE` is an L2 item.
6. Precision is a field; derived values are bands; breakers have tolerance and `NEAR_THRESHOLD`.
7. Valuation ranges are consumed only via `MemoReference` with horizon and fresh price record.
8. `evidence_report.json` in six buckets is the worker input and the trace target for every figure.
9. `INVESTIGATE` carries typed unblock items, interim posture, and a consecutive counter with L2 at the third.
10. Candidate theses carry at least one `INDEPENDENT` assumption.
11. Removed: Stage 6 model stage; candidate fresh-look; validator-duplicate Red Team items; free research labels; empty comparison tables; global `CALC_MISSING`.
12. Everything else is V2 as accepted in V2 §24.

### 17.2 Non-negotiable invariants

V2 invariants 1 to 35 and V3 invariants 36 to 44 (§15). Of these, the ones this simulation leaned on hardest and that Session 4 must implement first: 21 (no cost basis), 25 (coverage gap removes BUY/ADD), 28 (numeric breakers by script), 32 (fresh price for capital actions), 34 (absolute hurdle), 36 (preflight before models), 37 (cash/investigate/no-decision never removed), 38 (blocked alternatives never reach a model), 39 (figure trace and precision), 40 (horizon and price for capital actions).

### 17.3 Controls proven by simulation

- Six-bucket separation of facts, derived values, interpretations, claims, unknowns, contradictions (found A.X03, B.X01, C.X01).
- Deterministic derivations rebutting interpretations (A.D06, B.D01, C.D08, C.D09).
- Breaker evaluator preventing both false `BROKEN` and false `UNCHANGED` (A).
- Gate matrix eliminating rule-blocked alternatives before judgment (C: three of four).
- Freshness and staleness rules (B price 45 days; C NAV 335 days).
- Claims table: evaluability, due-date scan, self-assessment barred as outcome (B).
- Guidance barred from base below D-18 (B, C).
- Coverage gap removing BUY/ADD (all).
- Domain matrix making the recommendation a residual of gates (all).
- No target price, midpoint, or numeric probability produced (all).
- Memory proposals with `human_decision: UNSET`, evidence ids, contradicting records retained, no snapshot without a method (all).
- Red Team framing independence (blind phase produced new items in every case).
- Cheapest-unblock naming on every refusal (all).

### 17.4 Controls that failed or could not be exercised

Failed or defective: `CALC_MISSING` scope (S3-09); missing `HOLD_CASH` state (S3-05); precision (S3-06); `UNEVALUABLE` ambiguity (S3-02); counter initialization (S3-12); fresh-look for candidates (S3-08); Stage 6 (S3-16); no `ALLOCATION` type (S3-03); no preflight (S3-13).

Could not run: hurdle V-15 (D-21 unset, no horizon); liquidity gate (D-20 unset); sector caps on non-financials (sector map partial); truth validators V-01..V-10, V-13, V-19 (no documents); Writer idempotency and one-source-one-projection (no writes); injection detector (no adversarial content); Red Team evidence independence (no external records); lineage independence (one author).

### 17.5 Unresolved decisions

D-16 to D-34 as listed in V2 §22 (D-23 and D-30 used as recommended); D-35 to D-44 (§16). The four that block a first real run: D-21/D-36/D-37 (hurdle values), D-20 (large-cap list), D-35 (research-level mapping), and D-29 (structured IDX data retrievability, which decides whether V-02 is the only truth path).

### 17.6 Required implementation tests

Each is a fixture with inputs, expected artifact, and the validator or stage that must catch it. All of V2 §16 remains required; the following are added or made specific by this simulation.

| id | fixture | expected |
|---|---|---|
| T-01 | Two consecutive statements, one "dalam jutaan", one full rupiah (V2 F-03), through V-05 | `SCALE_JUMP`; cells `FAILED` |
| T-02 | Consolidated and parent-only tables in one PDF (V2 F-02) through V-04 and V-02 | boundary cells `FAILED` |
| T-03 | Cumulative H1 labelled standalone (V2 F-01) through V-03 | derivation refuses |
| T-04 | Injection in a filing footnote, in a claim text, in a retrieved page (V2 F-14) | no output field changes; quarantine logged |
| T-05 | Restated comparative against a seeded cell store (V2 F-06) | `RESTATEMENT_DETECTED` |
| T-06 | Hand-edited frozen original (V2 F-90) | `ORIGINAL_THESIS_TAMPERED` |
| T-07 | Rules block with `cash_proxy` blank; snapshot with one position lacking `sector` | S0 refuses `RULES_INCOMPLETE` / `SNAPSHOT_INCOMPLETE`; zero model calls logged |
| T-08 | Case A fixture re-run under V3 | short path selected; one T2, one T3, one T4 call; thesis `WEAKENED`; `INVESTIGATE` with seven typed unblock items; `THESIS_SPEC_INCOMPLETE` L2 raised |
| T-09 | Case B fixture plus a planted regulator notice reachable only through a channel the Analyst does not query | with adapter: Red Team finds it, `ALWAYS_MATERIAL`; without: `UNRESOLVABLE`, `MORE_RESEARCH` |
| T-10 | Case B fixture under V3 `depth: SCREEN` | domain {WATCH, PASS, INVESTIGATE, NO_DECISION}; `WATCH`; no fresh-look call; candidate thesis contains ≥ 1 `INDEPENDENT` assumption or validator fails |
| T-11 | Writer re-applied on the same proposal; jsonl and note table diverged | no-op receipt; S5 refuses on divergence |
| T-12 | Case C fixture under V3 with rules complete and sector map complete, CONSUMER-B memo with horizon 12 months and fresh price | gate matrix blocks three; hurdle runs; `DEPLOY`/`PARTIAL` band or `HOLD_CASH PREFERRED_BY_HURDLE` according to the numbers; BANK-A, PROPERTY-C, VALUE-D never reach S6 |
| T-13 | Case C fixture under V3 with rules incomplete | S0 refuses before any model call; memo stub names `cash_proxy`, `bear_drawdown_limit` |
| T-14 | Breaker input "approximately 0.81x" against 0.8x minimum | `NEAR_THRESHOLD`; `UNCHANGED` removed; L2 |
| T-15 | Derived value from two rounded percentages | rendered as a band; render validator rejects a point rendering |
| T-16 | Claim met two quarters before due date | `OBSERVED_AHEAD`; not counted in hit rate; closes at due date from T1 cell |
| T-17 | Three consecutive `INVESTIGATE`s on overlapping unblocks | third is L2 with typed reason |
| T-18 | Counter proposal with no prior history | Writer refuses without `basis`; with `basis: FIRST_OBSERVATION` → L2 |
| T-19 | Memo prose containing a figure with no `FACTS`/`DERIVED` id | render validator fails |
| T-20 | Allocation run where one alternative's memo is older than D-23 | that alternative `CONDITIONAL(G4)`; not `ELIGIBLE` |
| T-21 | Chat request for a directional view with no memo (V2 F-100) | `NO_MEMO_NO_VIEW` |
| T-22 | Lineage benchmark: Analyst and CIO-Synthesis same family on a fixture where the Red Team is right (V2 F-28) | binding refused or sympathy recorded |

Acceptance is as V2 §16: all pass on the bound tiers; a fixture that cannot be built because a `VERIFY BEFORE BUILD` item fails is a blocker.

### 17.7 What this session did not do

V2 §24 asked Session 3 to produce benchmark results per V2 §11.5, resolution of the `VERIFY BEFORE BUILD` items gating the CIO split and the truth layer, and a per-fixture pass/fail record for V2 §16. None of these were possible from a fixture pack with no documents, no live Hermes access, and no model benchmark harness. They are carried to Session 4 unchanged. No real ticker was run.

### 17.8 Exact files required by Session 4

Inputs Session 4 must have:

- `00-PHASE-0-CONTEXT-PACK.md`
- `02-RED-TEAM-AND-ARCHITECTURE-V2.md`
- `03-CONTROLLED-CASE-PACK.md`
- `04-CONTROLLED-SIMULATION-AND-ARCHITECTURE-V3.md` (this document)
- Otta's typed values for D-20, D-21/D-36/D-37, D-35, and D-41, in a rules-block draft (`Finance/Investment-Rules.md` section or a standalone `05-RULES-BLOCK-VALUES.md`); Session 4 cannot build the hurdle, liquidity, or preflight validators without them.
- The result of the `VERIFY BEFORE BUILD` checks on Hermes v0.21.0 that gate the CIO split (script-initiated T4 call with structured output; isolated delegated worker) and the truth layer (D-29 structured IDX data; second extraction lineage). If neither CIO-split form is available, the verdict reverts to `NOT READY` per V2 §23.

Outputs Session 4 must produce:

- `05-SCHEMAS-AND-VALIDATORS.md`: JSON schemas for every record in V3 §14.2, every validator's inputs and refusal codes, the domain matrices, and the six-bucket `evidence_report.json` schema.
- `06-FIXTURE-PACK.md`: T-01 to T-22 plus V2 §16 fixtures as executable cases with inputs, expected artifacts, and expected refusal or domain; provenance recorded per V2 CR-12.
- `07-COMPONENT-MAP.md`: every logical component mapped to one of the ten Hermes primitives in `00-PHASE-0-CONTEXT-PACK.md` §10, with `VERIFY BEFORE BUILD` status per item.
- A per-fixture pass/fail record on the tiers to be bound, and the §11.5 benchmark table, before any real ticker is run.

Session 4 begins with T-07 and T-13 (preflight), because they cost nothing to run and they decide whether anything else runs.
