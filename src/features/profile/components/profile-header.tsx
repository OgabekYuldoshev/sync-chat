import { EditProfileDialog } from "@/features/profile/components/edit-profile-dialog";
import { AvatarWithStatus } from "@/shared/components/avatar-with-status";
import { StatusIndicator } from "@/shared/components/status-indicator";
import type { CurrentUser } from "@/shared/lib/get-current-user";

type ProfileHeaderProps = {
	user: CurrentUser;
};

export function ProfileHeader({ user }: ProfileHeaderProps) {
	const shortDeviceId = user.deviceId.slice(0, 8);

	return (
		<div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center">
			<AvatarWithStatus user={user} size="lg" className="size-20" />

			<div className="space-y-1.5">
				<h1 className="font-heading font-semibold text-xl">{user.name}</h1>
				<div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
					<StatusIndicator status={user.status} size="sm" />
					<span>{user.status === "online" ? "Online" : "Offline"}</span>
					<span className="text-muted-foreground/40">·</span>
					<span className="font-mono">{shortDeviceId}</span>
				</div>
			</div>

			<EditProfileDialog currentName={user.name} />
		</div>
	);
}
