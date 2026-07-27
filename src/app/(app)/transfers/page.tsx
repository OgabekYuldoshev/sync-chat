import { Repeat2 } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";

export default function TransfersPage() {
	return (
		<div className="flex h-full items-center justify-center p-6">
			<EmptyState
				icon={Repeat2}
				title="No transfers yet"
				description="Files you send or receive will show up here."
			/>
		</div>
	);
}
