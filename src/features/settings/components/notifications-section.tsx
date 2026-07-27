"use client";

import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { usePushNotifications } from "../hooks/use-push-notifications";

export function NotificationsSection() {
	const { supported, enabled, permission, loading, toggle } =
		usePushNotifications();

	if (!supported) {
		return null;
	}

	const blocked = permission === "denied";

	return (
		<div className="space-y-3 rounded-xl bg-surface p-4">
			<h2 className="font-medium text-muted-foreground text-sm">
				Notifications
			</h2>
			<div className="flex items-center justify-between">
				<Label htmlFor="push-notifications">Notify me about new messages</Label>
				<Switch
					id="push-notifications"
					checked={enabled}
					disabled={loading || blocked}
					onCheckedChange={toggle}
				/>
			</div>
			{blocked && (
				<p className="text-muted-foreground text-xs">
					Notifications are blocked in your browser settings. Enable them for
					this site to turn this back on.
				</p>
			)}
		</div>
	);
}
