"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionMutation } from "actium/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { updateDisplayName, updateDisplayNameSchema } from "@/features/profile";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type FormValues = z.infer<typeof updateDisplayNameSchema>;

export function WelcomeNameForm() {
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(updateDisplayNameSchema),
		defaultValues: { name: "" },
	});

	const { run, isPending } = useActionMutation(updateDisplayName, {
		onSuccess: () => {
			router.refresh();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	function onSubmit(values: FormValues) {
		run(values);
	}

	return (
		<div className="flex h-dvh w-full items-center justify-center p-4">
			<div className="w-full max-w-sm space-y-4">
				<div className="space-y-1 text-center">
					<h1 className="font-semibold text-xl">Welcome to PeerChat</h1>
					<p className="text-muted-foreground text-sm">
						Choose a display name to continue.
					</p>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
					<Label htmlFor="name">Display name</Label>
					<Input
						id="name"
						autoFocus
						placeholder="e.g. Alex"
						{...register("name")}
						disabled={isPending}
					/>
					{errors.name && (
						<p className="text-destructive text-xs">{errors.name.message}</p>
					)}

					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Saving..." : "Continue"}
					</Button>
				</form>
			</div>
		</div>
	);
}
