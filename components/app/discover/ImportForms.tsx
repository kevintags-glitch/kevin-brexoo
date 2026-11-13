"use client";
import { useActionState } from "react";
import { Download, Upload } from "lucide-react";
import { createSource, importRecords, type DiscoveryState } from "@/features/discovery/actions";
import { Button, Checkbox, Field, Input, Notice, Select, Textarea } from "@/components/ui";

export function SourceForm() {
  const [state, action, pending] = useActionState<DiscoveryState, FormData>(createSource, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source name" htmlFor="src_name" error={fe.name}>
          <Input id="src_name" name="name" placeholder="e.g. Our client referral list" />
        </Field>
        <Field label="Source type" htmlFor="src_type">
          <Select id="src_type" name="source_type" defaultValue="customer_provided">
            <option value="customer_provided">Customer-provided (your own list)</option>
            <option value="partner">Partner feed</option>
            <option value="public">Public register</option>
            <option value="licensed">Licensed dataset</option>
          </Select>
        </Field>
        <Field label="Provider" htmlFor="src_provider" optional>
          <Input id="src_provider" name="provider" />
        </Field>
        <Field label="Source link" htmlFor="src_url" error={fe.attribution_url} optional>
          <Input id="src_url" name="attribution_url" placeholder="https://" />
        </Field>
      </div>
      <Field label="Permitted use" htmlFor="src_use" error={fe.permitted_use} hint="What the terms allow: viewing, contacting, exporting. This is shown with every record.">
        <Textarea id="src_use" name="permitted_use" rows={2} />
      </Field>
      <Field label="Known limitations" htmlFor="src_lim" optional>
        <Textarea id="src_lim" name="limitations" rows={2} placeholder="e.g. Updated monthly; contact details not verified" />
      </Field>
      <label className="flex gap-3 text-[14px] text-ink-2">
        <Checkbox name="confirm" aria-invalid={fe.confirm ? true : undefined} />
        <span>I confirm we have the legal right to use this data for the purpose described.</span>
      </label>
      {fe.confirm ? <p className="-mt-2 text-[13px] text-red-ink">{fe.confirm}</p> : null}
      {state.error ? <Notice tone="red">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="green">Source saved. You can import records into it now.</Notice> : null}
      <Button type="submit" pending={pending} className="justify-self-start">
        Add source
      </Button>
    </form>
  );
}

export function UploadForm({ sources }: { sources: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<DiscoveryState, FormData>(importRecords, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Import into source" htmlFor="up_src">
          <Select id="up_src" name="source_id" defaultValue={sources[0]?.id ?? ""} disabled={!sources.length}>
            {sources.length ? sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="">Add a source first</option>}
          </Select>
        </Field>
        <Field label="CSV file" htmlFor="up_file" hint="Up to 2,000 rows. Re-importing the same external_id updates that record.">
          <input id="up_file" name="file" type="file" accept=".csv,text/csv" className="block w-full text-[14px] file:mr-3 file:h-10 file:rounded-[10px] file:border file:border-line-strong file:bg-surface file:px-4 file:text-[14px] file:font-medium hover:file:bg-surface-2" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" pending={pending} disabled={!sources.length}>
          <Upload className="size-4" aria-hidden /> Import
        </Button>
        <a href="/templates/brexoo-project-records.csv" download className="inline-flex items-center gap-1.5 text-[14px] font-medium text-blue hover:underline">
          <Download className="size-4" aria-hidden /> Download the CSV template
        </a>
      </div>
      {state.error ? <Notice tone="red" title={state.error}>{state.errors?.length ? <ul className="mt-1 list-disc pl-5">{state.errors.slice(0, 8).map((e) => <li key={e}>{e}</li>)}</ul> : null}</Notice> : null}
      {state.ok ? (
        <Notice tone="green" title={`Imported ${state.imported} record${state.imported === 1 ? "" : "s"}.`}>
          {state.skipped ? (
            <>
              {state.skipped} row(s) skipped:
              <ul className="mt-1 list-disc pl-5">{state.errors?.slice(0, 8).map((e) => <li key={e}>{e}</li>)}</ul>
            </>
          ) : (
            "Open Discover to review matches."
          )}
        </Notice>
      ) : null}
    </form>
  );
}
