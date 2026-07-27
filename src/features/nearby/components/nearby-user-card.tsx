import { MapPin, MessageCircle, Share2, UserPlus } from "lucide-react";
import type { NearbyUser } from "@/features/nearby/types/nearby-user";
import { AvatarWithStatus } from "@/shared/components/avatar-with-status";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

type NearbyUserCardProps = {
	user: NearbyUser;
	onConnect?: (userId: string) => void;
	onChat?: (userId: string) => void;
	onShare?: (userId: string) => void;
};

export function NearbyUserCard({
	user,
	onConnect,
	onChat,
	onShare,
}: NearbyUserCardProps) {
	return (
		<Card className="flex flex-col items-center gap-3 p-5 text-center">
			<AvatarWithStatus user={user} size="lg" />

			<div>
				<p className="font-medium text-sm">{user.name}</p>
				<p className="mt-0.5 flex items-center justify-center gap-1 text-muted-foreground text-xs">
					<MapPin className="size-3" />
					{user.distanceLabel}
				</p>
			</div>

			<div className="flex w-full items-center gap-2">
				{user.isConnected ? (
					<Button
						size="sm"
						className="flex-1"
						onClick={() => onChat?.(user.id)}
					>
						<MessageCircle className="size-4" />
						Chat
					</Button>
				) : (
					<Button
						size="sm"
						className="flex-1"
						onClick={() => onConnect?.(user.id)}
					>
						<UserPlus className="size-4" />
						Connect
					</Button>
				)}
				<Button
					variant="outline"
					size="icon"
					aria-label={`Share with ${user.name}`}
					onClick={() => onShare?.(user.id)}
				>
					<Share2 className="size-4" />
				</Button>
			</div>
		</Card>
	);
}
