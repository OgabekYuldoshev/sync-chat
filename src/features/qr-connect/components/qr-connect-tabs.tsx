"use client";

import { useRouter } from "next/navigation";
import { QrCodeCard } from "@/features/qr-connect/components/qr-code-card";
import { QrScannerView } from "@/features/qr-connect/components/qr-scanner-view";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";

type QrConnectTabsProps = {
	inviteLink: string;
};

export function QrConnectTabs({ inviteLink }: QrConnectTabsProps) {
	const router = useRouter();

	function handleScanned(deviceId: string) {
		router.push(`/qr-connect/${deviceId}`);
	}

	return (
		<Tabs defaultValue="my-code" className="w-full max-w-sm">
			<TabsList className="w-full">
				<TabsTrigger value="my-code" className="flex-1">
					My Code
				</TabsTrigger>
				<TabsTrigger value="scan" className="flex-1">
					Scan
				</TabsTrigger>
			</TabsList>

			<TabsContent value="my-code" className="flex justify-center pt-4">
				<QrCodeCard inviteLink={inviteLink} />
			</TabsContent>

			<TabsContent value="scan" className="pt-4">
				<QrScannerView onScanned={handleScanned} />
			</TabsContent>
		</Tabs>
	);
}
