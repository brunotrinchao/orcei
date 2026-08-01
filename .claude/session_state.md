## Current Objective
Wire useFormValidation (same composable/UX as SetupWizardModal) into the
budget/proposal wizard (ProposalForm.vue + steps), replacing generic
notify()-based validateStep() alerts with inline per-field errors (red
border + text below field, only after first "Próximo" click).

## Files Read
- app/composables/useFormValidation.ts — provide/inject registry pattern.
  `useFormValidation()` (parent, once per form/step) exposes
  `validate()/reset()/submitAttempted`. `useFieldValidation()` (used inside
  BaseInput/BaseTextarea/BaseSelect/BaseCheckbox) auto-registers any field
  with `required` prop into nearest ancestor registry.
- app/components/onboarding/SetupWizardModal.vue — reference pattern: single
  useFormValidation() call, steps rendered via v-if/else-if (only current
  step mounted), so registry naturally scopes to the active step.
- app/components/ProposalForm.vue (NOT app/components/proposal/, real path)
  — wizard container. IMPORTANT: steps rendered via `v-show`, not `v-if` —
  all 4 step components (ProposalStepClient/Scope/Payment/Summary) stay
  mounted simultaneously. This means a single top-level useFormValidation()
  in ProposalForm.vue would wrongly merge all steps' required fields into
  one registry. Solved by giving EACH step its OWN useFormValidation() call
  (provide/inject scopes to that component's own subtree) + defineExpose
  validate()/reset() + parent holds template refs and delegates.
- app/components/ui/BaseInput.vue — isEmpty()/submitAttempted/displayError
  pattern confirmed (props.error takes priority over required-empty message).
- app/components/proposal/ProposalStepScope.vue — item rows use raw
  `<input>` (not BaseInput), so auto-registration doesn't apply there;
  validation implemented manually reusing the same `submitAttempted` ref.
- app/components/proposal/ProposalStepPayment.vue, ProposalStepSummary.vue —
  no required fields (installments/cashDiscount have safe defaults; Summary
  is read-only review). No changes needed/made there — matches original
  code which also had no step-3/4 validation branch.
- app/pages/orcamentos/index.vue — confirmed "Próximo Passo" button calls
  `proposalFormRef.nextStep()` (line ~712), which calls `validateStep()`.

## Decisions Taken
- Per-step useFormValidation() (not one shared at ProposalForm level) —
  required because of v-show keeping all steps mounted (see above).
- ProposalStepClient.vue: added `const { validate, reset, submitAttempted } =
  useFormValidation()`; the existing disabled/readonly proxy BaseInput
  fields for client name/email (already `required`) auto-register. Added
  `emailFormatError` computed (gated on submitAttempted) bound via `:error`
  on the email field for format validation (composable only covers
  emptiness, not format). `defineExpose({ validate, reset })`.
  KNOWN EDGE CASE (accepted, not fixed): the inline "Cadastro Rápido" modal
  (BaseDialog, isManualOpen) has its own BaseInput with `required` for
  manualClient.name. Since it's in the same component tree, if the modal is
  open when the wizard's validate() runs, it'll also require that field.
  Radix DialogContent unmounts when closed, so this only matters if the
  modal is left open while clicking wizard "Próximo" — rare, deemed
  acceptable (documented in code comment).
- ProposalStepScope.vue: added `useFormValidation()`, but items are raw
  inputs so wrote manual `validateStep()`: calls the composable's
  `validate()` (for the shared submitAttempted flag + any future BaseInput
  fields), plus checks `items.length > 0` and every item (incl. upsell)
  has non-empty name, price >= 0, quantity > 0. Added inline red-border
  classes (`submitAttempted && <condition>`) to the empty-state box and to
  each item/upsell row's name/quantity/price raw `<input>` — no BaseInput
  conversion (would've changed the compact row visual design).
  `defineExpose({ validate: validateStep, reset })`.
- ProposalForm.vue: added `stepClientRef`/`stepScopeRef` template refs;
  rewrote `validateStep(step)` to delegate:
  `if (step===1) return stepClientRef.value?.validate() ?? true` /
  `if (step===2) return stepScopeRef.value?.validate() ?? true` / else true.
  Removed the old manual notify()-based checks entirely (name required,
  email required+format, items required, item name/price/qty checks) —
  replaced by the per-step validate() calls. `submit()` still calls
  `validateStep(1) && validateStep(2)` before backend submission (unchanged
  call signature). Installments (1-12) / cashDiscount (0-100) range checks
  in `submit()` untouched (no `required` semantics, always had defaults,
  were never part of per-step Next-button validation either).
- Did NOT touch ProposalStepPayment.vue/ProposalStepSummary.vue (no
  required fields there, no regression risk).

## Verification Done
`@vue/compiler-sfc` parse() on all 3 changed files → 0 syntax errors:
ProposalStepClient.vue, ProposalStepScope.vue, ProposalForm.vue.
NOT run: actual browser/dev-server smoke test (no `npm run dev` executed
this session). Recommend manually testing: (1) click "Próximo Passo" on
step 1 with no client selected → should show red border + "Campo
obrigatório" under the Nome/E-mail proxy fields, no toast; (2) step 2 with
zero items → red-bordered empty-state box + "Pelo menos 1 item obrigatório
é necessário"; add an item, leave name blank → red border on that row's
name input.

## Next Steps
Task considered DONE per user's ask ("usar formValidate, validação igual ao
setup wizard"). If continuing later UX-audit backlog (from prior summary):
B5 (dashboard onboarding CTAs), C1 (ad-hoc catalog item in proposal — note:
already effectively possible today, ProposalStepScope lets users type a
free-text item name directly in the row without prior catalog save — verify
this satisfies C1 or if something more is wanted), C3 (broader aria-label
sweep), D1/D2 (AI transparency + jargon glossary) — none started.
