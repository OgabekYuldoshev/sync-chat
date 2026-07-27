"use client";

import { useTheme } from "next-themes";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";

export default function SettingsPage() {
	const { theme, setTheme } = useTheme();

	return (
		<div className="mx-auto w-full max-w-md space-y-6 p-6">
			<h1 className="font-semibold text-lg">Settings</h1>

			<div className="space-y-3 rounded-xl bg-surface p-4">
				<h2 className="font-medium text-muted-foreground text-sm">
					Appearance
				</h2>
				<div className="flex items-center justify-between">
					<Label htmlFor="dark-mode">Dark mode</Label>
					<Switch
						id="dark-mode"
						checked={theme === "dark"}
						onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
					/>
				</div>
			</div>
		</div>
	);
}
