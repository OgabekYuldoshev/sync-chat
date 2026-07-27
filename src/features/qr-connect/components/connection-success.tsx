import { CheckCircle2 } from "lucide-react";
import { AvatarWithStatus } from "@/shared/components/avatar-with-status";
import { Button } from "@/shared/components/ui/button";
import type { User } from "@/shared/types/user";

type ConnectionSuccessProps = {
	user: User;
	onStartChat?: () => void;
};

export function ConnectionSuccess({
	user,
	onStartChat,
}: ConnectionSuccessProps) {
	return (
		<div className="flex flex-col items-center gap-5 p-8 text-center">
			<span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
				<CheckCircle2 className="size-9" />
			</span>

			<div className="space-y-1">
				<p className="font-semibold text-lg">Connected!</p>
				<p className="text-muted-foreground text-sm">
					You're now connected with {user.name}
				</p>
			</div>

			<AvatarWithStatus user={user} size="lg" />

			<Button onClick={onStartChat} className="w-full">
				Start chatting
			</Button>
		</div>
	);
}
