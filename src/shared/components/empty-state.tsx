import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type EmptyStateProps = {
	icon: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
};

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
				className,
			)}
		>
			<div className="flex size-12 items-center justify-center rounded-2xl bg-surface text-muted-foreground">
				<Icon className="size-6" />
			</div>
			<div className="space-y-1">
				<p className="font-medium text-foreground text-sm">{title}</p>
				{description && (
					<p className="mx-auto max-w-xs text-muted-foreground text-sm">
						{description}
					</p>
				)}
			</div>
			{action}
		</div>
	);
}
