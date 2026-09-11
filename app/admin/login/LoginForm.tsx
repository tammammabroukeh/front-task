"use client";

import { useLogin } from "@/hooks/useLogin";

export function LoginForm() {
  const {
    form: {
      register,
      formState: { errors },
    },
    onSubmit,
    isSubmitting,
  } = useLogin();

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          className="h-11 rounded-lg border border-foreground/20 bg-background px-3 text-sm outline-none focus:border-foreground aria-[invalid=true]:border-red-500"
          placeholder="admin@fakestore.dev"
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          className="h-11 rounded-lg border border-foreground/20 bg-background px-3 text-sm outline-none focus:border-foreground aria-[invalid=true]:border-red-500"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p role="alert" className="text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
