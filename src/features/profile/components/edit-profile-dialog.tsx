"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionMutation } from "actium/react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { updateDisplayName } from "@/features/profile/actions/update-display-name";
import { updateDisplayNameSchema } from "@/features/profile/validation/update-display-name-schema";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type FormValues = z.infer<typeof updateDisplayNameSchema>;

type EditProfileDialogProps = {
	currentName: string;
};

export function EditProfileDialog({ currentName }: EditProfileDialogProps) {
	const [open, setOpen] = useState(false);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(updateDisplayNameSchema),
		defaultValues: { name: currentName },
	});

	const { run, isPending } = useActionMutation(updateDisplayName, {
		onSuccess: () => {
			toast.success("Profile updated");
			setOpen(false);
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
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				<Pencil className="size-3.5" />
				Edit profile
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit profile</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
					<Label htmlFor="name">Display name</Label>
					<Input id="name" {...register("name")} disabled={isPending} />
					{errors.name && (
						<p className="text-destructive text-xs">{errors.name.message}</p>
					)}

					<DialogFooter className="pt-2">
						<Button type="submit" disabled={isPending}>
							{isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
