"use client";

import { Radar, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { NearbyUserCard } from "@/features/nearby/components/nearby-user-card";
import type { NearbyUser } from "@/features/nearby/types/nearby-user";
import { EmptyState } from "@/shared/components/empty-state";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

type NearbyFilter = "all" | "online" | "connected";

type NearbyListProps = {
	users: NearbyUser[];
};

export function NearbyList({ users }: NearbyListProps) {
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<NearbyFilter>("all");

	const filteredUsers = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		return users.filter((user) => {
			const matchesQuery = user.name.toLowerCase().includes(normalizedQuery);
			const matchesFilter =
				filter === "all" ||
				(filter === "online" && user.status === "online") ||
				(filter === "connected" && user.isConnected);

			return matchesQuery && matchesFilter;
		});
	}, [users, query, filter]);

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
						<TabsTrigger value="online">Online</TabsTrigger>
						<TabsTrigger value="connected">Connected</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{filteredUsers.length === 0 ? (
				<EmptyState
					icon={Radar}
					title="No one nearby"
					description="Move around or invite others to connect via QR code."
				/>
			) : (
				<div className="grid grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
					{filteredUsers.map((user) => (
						<NearbyUserCard key={user.id} user={user} />
					))}
				</div>
			)}
		</div>
	);
}
