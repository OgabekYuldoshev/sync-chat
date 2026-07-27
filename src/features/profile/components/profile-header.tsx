import { EditProfileDialog } from "@/features/profile/components/edit-profile-dialog";
import { AvatarWithStatus } from "@/shared/components/avatar-with-status";
import type { CurrentUser } from "@/shared/lib/get-current-user";

type ProfileHeaderProps = {
	user: CurrentUser;
};

export function ProfileHeader({ user }: ProfileHeaderProps) {
	const shortDeviceId = user.deviceId.slice(0, 8);

	return (
		<div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
			<AvatarWithStatus user={user} size="lg" />

			<div className="space-y-1">
				<h1 className="font-semibold text-xl">{user.name}</h1>
				<p className="text-muted-foreground text-sm">
					{user.status === "online" ? "Online" : "Offline"} · Device{" "}
					{shortDeviceId}
				</p>
			</div>

			<EditProfileDialog currentName={user.name} />
		</div>
	);
}
