import { ArrowDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type FloatingScrollButtonProps = {
	visible: boolean;
	unreadCount?: number;
	onClick?: () => void;
};

export function FloatingScrollButton({
	visible,
	unreadCount = 0,
	onClick,
}: FloatingScrollButtonProps) {
	if (!visible) {
		return null;
	}

	return (
		<button
			type="button"
			aria-label="Scroll to latest message"
			onClick={onClick}
			className={cn(
				"absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-sm shadow-lg transition-transform hover:-translate-y-0.5",
			)}
		>
			<ArrowDown className="size-4" />
			{unreadCount > 0 && <span>{unreadCount} new</span>}
		</button>
	);
}
