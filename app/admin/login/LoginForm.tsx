"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormValues } from "./schema";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (!result || result.error) {
      // Server rejected the credentials — surface as a form-level error.
      setError("root", {
        type: "server",
        message: "Invalid email or password.",
      });
      return;
    }

    router.replace(callbackUrl);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-4"
      noValidate
    >
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
