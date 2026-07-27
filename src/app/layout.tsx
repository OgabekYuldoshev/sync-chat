import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

import "@/styles/globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "PeerChat",
	description: "Secure messaging and file sharing, wherever you are.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: "#161f2b",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="flex min-h-full flex-col bg-background text-foreground">
				<ThemeProvider>
					<TooltipProvider>
						{children}
						<Toaster />
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
