"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = "peerchat-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
	children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>("dark");

	useEffect(() => {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === "light" || stored === "dark") {
			setThemeState(stored);
		}
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	}, [theme]);

	return (
		<ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}

	return context;
}
