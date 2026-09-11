"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ROUTES } from "@/constants/routes";
import { loginSchema, type LoginFormValues } from "@/schemas/LoginSchema";

export interface UseLoginResult {
  form: UseFormReturn<LoginFormValues>;
  /** Submit handler pre-bound to react-hook-form. */
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Encapsulates admin login: react-hook-form + Zod validation, the credentials
 * sign-in call, and post-login navigation. Keeps the LoginForm component purely
 * presentational.
 */
export function useLogin(): UseLoginResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? ROUTES.ADMIN;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = async (values: LoginFormValues) => {
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (!result || result.error) {
      // Server rejected the credentials — surface as a form-level error.
      form.setError("root", {
        type: "server",
        message: "Invalid email or password.",
      });
      return;
    }

    router.replace(callbackUrl);
    router.refresh();
  };

  return {
    form,
    onSubmit: form.handleSubmit(submit),
    isSubmitting: form.formState.isSubmitting,
  };
}
