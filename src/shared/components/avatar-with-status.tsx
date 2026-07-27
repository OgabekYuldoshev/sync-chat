import { StatusIndicator } from "@/shared/components/status-indicator";
import {
	Avatar,
	AvatarBadge,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/cn";
import type { User } from "@/shared/types/user";

function getInitials(name: string) {
	return name
		.split(" ")
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

type AvatarWithStatusProps = {
	user: Pick<User, "name" | "avatarUrl" | "status">;
	size?: "sm" | "default" | "lg";
	showStatus?: boolean;
	className?: string;
};

export function AvatarWithStatus({
	user,
	size = "default",
	showStatus = true,
	className,
}: AvatarWithStatusProps) {
	return (
		<Avatar size={size} className={cn(className)}>
			{user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
			<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
			{showStatus && (
				<AvatarBadge className="bg-transparent p-0 ring-0">
					<StatusIndicator status={user.status} size="sm" />
				</AvatarBadge>
			)}
		</Avatar>
	);
}
