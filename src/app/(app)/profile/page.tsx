import { ProfileHeader } from "@/features/profile";
import { getCurrentUser } from "@/shared/lib/get-current-user";

export default async function ProfilePage() {
	const currentUser = await getCurrentUser();

	return (
		<div className="mx-auto h-full w-full max-w-md overflow-y-auto">
			<ProfileHeader user={currentUser} />
		</div>
	);
}
