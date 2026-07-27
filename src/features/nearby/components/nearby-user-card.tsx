import { MessageCircle, UserPlus } from "lucide-react";
import type { NearbyUser } from "@/features/nearby/types/nearby-user";
import { AvatarWithStatus } from "@/shared/components/avatar-with-status";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

type NearbyUserCardProps = {
	user: NearbyUser;
	onConnect?: (userId: string) => void;
	onChat?: (userId: string) => void;
};

export function NearbyUserCard({
	user,
	onConnect,
	onChat,
}: NearbyUserCardProps) {
	return (
		<Card className="flex flex-col items-center gap-3 p-5 text-center">
			<AvatarWithStatus user={user} size="lg" />

			<div>
				<p className="font-medium text-sm">{user.name}</p>
				<p className="mt-0.5 text-muted-foreground text-xs">
					{user.isConnecting ? "Connecting..." : "Available on this network"}
				</p>
			</div>

			{user.isConnected ? (
				<Button size="sm" className="w-full" onClick={() => onChat?.(user.id)}>
					<MessageCircle className="size-4" />
					Chat
				</Button>
			) : (
				<Button
					size="sm"
					className="w-full"
					disabled={user.isConnecting}
					onClick={() => onConnect?.(user.id)}
				>
					<UserPlus className="size-4" />
					{user.isConnecting ? "Connecting..." : "Connect"}
				</Button>
			)}
		</Card>
	);
}
