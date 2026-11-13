"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import {
  requestPasswordReset,
  resendConfirmation,
  signIn,
  signUp,
  updatePassword,
  type AuthState,
} from "@/features/auth/actions";
import { Button, Checkbox, Field, Input, Notice } from "@/components/ui";

function errProps(fe: Record<string, string> | undefined, k: string) {
  return fe?.[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {};
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function Heading({ title, body }: { title: string; body?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="type-section">{title}</h1>
      {body ? <p className="type-body mt-2 text-ink-3">{body}</p> : null}
    </div>
  );
}

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  const [resendState, resend, resending] = useActionState<AuthState, FormData>(resendConfirmation, {});
  return (
    <>
      <Heading
        title="Welcome back"
        body={
          <>
            New to Brexoo?{" "}
            <Link href="/signup" className="font-medium text-blue hover:underline">
              Create an account
            </Link>
          </>
        }
      />
      {linkError ? (
        <Notice tone="amber" className="mb-5">
          That link has expired or was already used. Sign in, or request a new link.
        </Notice>
      ) : null}
      <form action={action} className="grid gap-5" noValidate>
        <input type="hidden" name="next" value={next ?? "/app"} />
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required autoFocus {...errProps(state.fieldErrors, "email")} />
        </Field>
        <div className="grid gap-1.5">
          <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
            <PasswordInput id="password" name="password" autoComplete="current-password" required {...errProps(state.fieldErrors, "password")} />
          </Field>
          <Link href="/forgot-password" className="justify-self-end text-[13px] text-blue hover:underline">
            Forgot password?
          </Link>
        </div>
        {state.error ? <Notice tone="red">{state.error}</Notice> : null}
        <Button type="submit" size="lg" pending={pending}>
          Log in
        </Button>
      </form>
      {state.email ? (
        <form action={resend} className="mt-4">
          <input type="hidden" name="email" value={state.email} />
          <Button type="submit" variant="ghost" size="sm" pending={resending}>
            {resendState.ok ? "Confirmation email sent" : "Resend confirmation email"}
          </Button>
        </form>
      ) : null}
    </>
  );
}

export function SignupForm({ plan, next }: { plan?: string; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  const fe = state.fieldErrors;
  return (
    <>
      <Heading
        title="Create your account"
        body={
          <>
            Already using Brexoo?{" "}
            <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-blue hover:underline">
              Log in
            </Link>
          </>
        }
      />
      <form action={action} className="grid gap-5" noValidate>
        <input type="hidden" name="plan" value={plan ?? ""} />
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="Your name" htmlFor="full_name" error={fe?.full_name}>
          <Input id="full_name" name="full_name" autoComplete="name" required autoFocus {...errProps(fe, "full_name")} />
        </Field>
        <Field label="Work email" htmlFor="email" error={fe?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required {...errProps(fe, "email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={fe?.password} hint="At least 10 characters.">
          <PasswordInput id="password" name="password" autoComplete="new-password" required {...errProps(fe, "password")} />
        </Field>
        <div>
          <label className="flex gap-3 text-[14px] leading-snug text-ink-2">
            <Checkbox name="terms" {...errProps(fe, "terms")} />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" className="text-blue underline underline-offset-2">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/acceptable-use" className="text-blue underline underline-offset-2">
                acceptable use policy
              </Link>
              , and I've read the{" "}
              <Link href="/legal/privacy" className="text-blue underline underline-offset-2">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {fe?.terms ? (
            <p id="terms-error" className="mt-1.5 text-[13px] text-red-ink" role="alert">
              {fe.terms}
            </p>
          ) : null}
        </div>
        {state.error ? <Notice tone="red">{state.error}</Notice> : null}
        <Button type="submit" size="lg" pending={pending}>
          Create account
        </Button>
      </form>
    </>
  );
}

export function VerifyNotice({ email }: { email?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(resendConfirmation, {});
  return (
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-blue-soft text-blue">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <Heading title="Check your email" body={<>We sent a confirmation link to {email ? <strong className="font-medium text-ink">{email}</strong> : "your inbox"}. Open it on this device to finish setting up.</>} />
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="email" value={email ?? ""} />
        <Button type="submit" variant="secondary" pending={pending} disabled={!email}>
          Resend email
        </Button>
        {state.ok ? (
          <p className="text-sm text-green-ink" role="status">
            Sent. It can take a minute to arrive.
          </p>
        ) : null}
      </form>
    </div>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  if (state.ok)
    return (
      <>
        <Heading title="Check your email" body="If an account exists for that address, we've sent a link to reset your password." />
        <Link href="/login" className="text-sm font-medium text-blue hover:underline">
          Back to log in
        </Link>
      </>
    );
  return (
    <>
      <Heading title="Reset your password" body="We'll email you a link to choose a new one." />
      <form action={action} className="grid gap-5" noValidate>
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required autoFocus {...errProps(state.fieldErrors, "email")} />
        </Field>
        <Button type="submit" size="lg" pending={pending}>
          Send reset link
        </Button>
        <Link href="/login" className="text-center text-sm text-ink-3 hover:text-ink">
          Back to log in
        </Link>
      </form>
    </>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  const fe = state.fieldErrors;
  return (
    <>
      <Heading title="Choose a new password" />
      <form action={action} className="grid gap-5" noValidate>
        <Field label="New password" htmlFor="password" error={fe?.password} hint="At least 10 characters.">
          <PasswordInput id="password" name="password" autoComplete="new-password" required autoFocus {...errProps(fe, "password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={fe?.confirm}>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required {...errProps(fe, "confirm")} />
        </Field>
        {state.error ? <Notice tone="red">{state.error}</Notice> : null}
        <Button type="submit" size="lg" pending={pending}>
          Save password
        </Button>
      </form>
    </>
  );
}
