"use client";

import { Radar, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NearbyUserCard } from "@/features/nearby/components/nearby-user-card";
import { useNearbyUsers } from "@/features/nearby/hooks/use-nearby-users";
import { EmptyState } from "@/shared/components/empty-state";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useChatUiStore } from "@/shared/store/chat-ui-store";
import { connectToPeer } from "@/shared/store/peer-store";

type NearbyFilter = "all" | "connected";

export function NearbyList() {
	const users = useNearbyUsers();
	const router = useRouter();
	const setActiveChatId = useChatUiStore((state) => state.setActiveChatId);
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<NearbyFilter>("all");

	const filteredUsers = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		return users.filter((user) => {
			const matchesQuery = user.name.toLowerCase().includes(normalizedQuery);
			const matchesFilter = filter === "all" || user.isConnected;
			return matchesQuery && matchesFilter;
		});
	}, [users, query, filter]);

	function handleConnect(userId: string) {
		connectToPeer(userId).catch(() => {
			toast.error("Couldn't start the connection. Try again.");
		});
	}

	function handleChat(userId: string) {
		setActiveChatId(userId);
		router.push("/");
	}

	return (
		<div className="flex h-full flex-col gap-4 p-6">
			<div className="space-y-3">
				<h1 className="font-semibold text-lg">Nearby</h1>
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search nearby people"
						className="pl-9"
					/>
				</div>

				<Tabs
					value={filter}
					onValueChange={(value) => setFilter(value as NearbyFilter)}
				>
					<TabsList>
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="connected">Connected</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{filteredUsers.length === 0 ? (
				<EmptyState
					icon={Radar}
					title="No one nearby"
					description="Others on this network will appear here automatically. Share a QR code or invite link to reach someone elsewhere."
				/>
			) : (
				<div className="grid grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
					{filteredUsers.map((user) => (
						<NearbyUserCard
							key={user.id}
							user={user}
							onConnect={handleConnect}
							onChat={handleChat}
						/>
					))}
				</div>
			)}
		</div>
	);
}
