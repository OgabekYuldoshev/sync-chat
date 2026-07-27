import { cn } from "@/shared/lib/cn";
import type { UserStatus } from "@/shared/types/user";

type StatusIndicatorProps = {
	status: UserStatus;
	size?: "sm" | "md";
	className?: string;
};

const STATUS_STYLES: Record<UserStatus, string> = {
	online: "bg-online",
	away: "bg-warning",
	offline: "bg-muted-foreground/50",
};

const SIZE_STYLES = {
	sm: "size-2",
	md: "size-2.5",
} as const;

export function StatusIndicator({
	status,
	size = "md",
	className,
}: StatusIndicatorProps) {
	return (
		<span
			aria-label={status}
			role="status"
			className={cn(
				"rounded-full",
				STATUS_STYLES[status],
				SIZE_STYLES[size],
				className,
			)}
		/>
	);
}
