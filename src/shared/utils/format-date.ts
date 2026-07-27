const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit",
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
	weekday: "short",
});

export function formatMessageTime(isoDate: string): string {
	return TIME_FORMATTER.format(new Date(isoDate));
}

export function formatChatListTimestamp(isoDate: string): string {
	const date = new Date(isoDate);
	const now = new Date();
	const isSameDay = date.toDateString() === now.toDateString();

	if (isSameDay) {
		return TIME_FORMATTER.format(date);
	}

	const diffInDays = Math.round(
		(now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) /
			86_400_000,
	);

	if (diffInDays === 1) {
		return "Yesterday";
	}

	if (diffInDays < 7) {
		return WEEKDAY_FORMATTER.format(date);
	}

	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
