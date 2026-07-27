import { cn } from "@/shared/lib/cn";

type TypingIndicatorProps = {
	className?: string;
};

export function TypingIndicator({ className }: TypingIndicatorProps) {
	return (
		<div
			aria-label="Typing"
			role="status"
			className={cn("flex items-center gap-1", className)}
		>
			<span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
			<span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
			<span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
		</div>
	);
}
