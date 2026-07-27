import { MOCK_NEARBY_USERS, NearbyList } from "@/features/nearby";

export default function NearbyPage() {
	return <NearbyList users={MOCK_NEARBY_USERS} />;
}
