"use client";
import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createOpportunity, type ActionResult } from "@/features/crm/actions";
import { Button, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { Dialog } from "./widgets";

export function NewOpportunity({ services }: { services: { code: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult, FormData>(createOpportunity, {});
  const fe = state.fieldErrors ?? {};
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> Add opportunity
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add an opportunity">
        <p className="-mt-2 mb-4 text-[13px] text-ink-3">For phone calls, referrals and walk-ins. It's recorded as added manually.</p>
        <form action={action} className="grid gap-4" noValidate>
          <Field label="Name" htmlFor="op_name" error={fe.full_name}>
            <Input id="op_name" name="full_name" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" htmlFor="op_email" error={fe.email}>
              <Input id="op_email" name="email" type="email" />
            </Field>
            <Field label="Phone" htmlFor="op_phone">
              <Input id="op_phone" name="phone" type="tel" />
            </Field>
          </div>
          <Field label="Project" htmlFor="op_title" error={fe.title}>
            <Input id="op_title" name="title" placeholder="e.g. Bathroom renovation" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Service" htmlFor="op_cat">
              <Select id="op_cat" name="category_code" defaultValue={services[0]?.code ?? ""}>
                <option value="">Not set</option>
                {services.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location" htmlFor="op_loc">
              <Input id="op_loc" name="location" />
            </Field>
          </div>
          <Field label="Details" htmlFor="op_desc" optional>
            <Textarea id="op_desc" name="description" rows={2} />
          </Field>
          {state.error ? <Notice tone="red">{state.error}</Notice> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" pending={pending}>
              Add
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
