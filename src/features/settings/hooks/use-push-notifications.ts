"use client";

import { useCallback, useEffect, useState } from "react";
import {
	disablePushNotifications,
	enablePushNotifications,
	getExistingSubscription,
	getNotificationPermission,
	isPushSupported,
} from "@/shared/lib/push/push-client";

export type PushNotificationsState = {
	supported: boolean;
	enabled: boolean;
	permission: NotificationPermission | null;
	loading: boolean;
	toggle: (checked: boolean) => Promise<void>;
};

export function usePushNotifications(): PushNotificationsState {
	const [supported, setSupported] = useState(false);
	const [enabled, setEnabled] = useState(false);
	const [permission, setPermission] = useState<NotificationPermission | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			if (!isPushSupported()) {
				if (!cancelled) {
					setLoading(false);
				}
				return;
			}

			const subscription = await getExistingSubscription();
			if (cancelled) {
				return;
			}

			setSupported(true);
			setPermission(getNotificationPermission());
			setEnabled(Boolean(subscription));
			setLoading(false);
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	const toggle = useCallback(async (checked: boolean) => {
		setLoading(true);
		try {
			if (checked) {
				const success = await enablePushNotifications();
				setEnabled(success);
				setPermission(getNotificationPermission());
			} else {
				await disablePushNotifications();
				setEnabled(false);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	return { supported, enabled, permission, loading, toggle };
}
