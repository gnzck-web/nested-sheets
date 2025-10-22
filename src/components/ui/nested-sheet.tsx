/**
 * Nested Sheets - A declarative API for managing nested modal/drawer components
 *
 * ## Features
 * - Automatic nesting level detection
 * - Auto-scaling of parent sheets when child sheets open
 * - Automatic positioning with configurable offsets
 * - Clean declarative API without manual state management
 * - TypeScript support with full type safety
 * - Supports left and right side orientations
 *
 * ## Basic Usage
 * ```tsx
 * import {
 *   NestedSheetsProvider,
 *   NestedSheet,
 *   NestedSheetContent,
 *   SheetHeader,
 *   SheetTitle,
 *   useNestedSheet,
 * } from "@/components/ui/nested-sheet";
 *
 * function MyComponent() {
 *   const [mainOpen, setMainOpen] = useNestedSheet(false);
 *   const [subOpen, setSubOpen] = useNestedSheet(false);
 *
 *   return (
 *     <NestedSheetsProvider side="right">
 *       <button onClick={() => setMainOpen(true)}>Open</button>
 *
 *       <NestedSheet open={mainOpen} onOpenChange={setMainOpen}>
 *         <NestedSheetContent>
 *           <SheetHeader>
 *             <SheetTitle>Main Sheet</SheetTitle>
 *           </SheetHeader>
 *           <button onClick={() => setSubOpen(true)}>Open Nested</button>
 *         </NestedSheetContent>
 *
 *         <NestedSheet open={subOpen} onOpenChange={setSubOpen}>
 *           <NestedSheetContent>
 *             <SheetHeader>
 *               <SheetTitle>Nested Sheet</SheetTitle>
 *             </SheetHeader>
 *           </NestedSheetContent>
 *         </NestedSheet>
 *       </NestedSheet>
 *     </NestedSheetsProvider>
 *   );
 * }
 * ```
 *
 * ## Key Components
 * - `NestedSheetsProvider`: Context provider that must wrap your component tree. Configure the side prop here (single source of truth).
 * - `NestedSheet`: Wrapper for individual sheets that handles nesting
 * - `NestedSheetContent`: Content component with automatic styling - side is inherited from provider
 * - `useNestedSheet`: Hook for creating controlled sheet state (optional, can use useState)
 *
 * ## Comparison with Manual Approach
 *
 * ### Before (Manual):
 * - Multiple boolean states to track
 * - Manual className management for scaling effects
 * - Manual positioning calculations
 * - Complex nested conditionals for styling
 *
 * ### After (Declarative):
 * - Simple nested structure mirrors the UI
 * - Automatic state tracking via context
 * - Zero manual styling for nesting effects
 * - Easy to add more nesting levels
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "./sheet";

interface NestedSheetContextValue {
	level: number;
	maxLevel: number;
	side: "right" | "left";
	registerSheet: (id: string, level: number) => void;
	unregisterSheet: (id: string) => void;
	hasNestedSheetOpen: (id: string) => boolean;
}

const NestedSheetContext = React.createContext<NestedSheetContextValue | null>(
	null,
);

interface NestedSheetsProviderProps {
	children: React.ReactNode;
	/**
	 * The side from which all nested sheets should appear.
	 * @default "right"
	 */
	side?: "right" | "left";
}

/**
 * Provider that enables nested sheet functionality.
 * Wrap your app or the relevant part of your component tree with this provider.
 */
export function NestedSheetsProvider({
	children,
	side = "right",
}: NestedSheetsProviderProps) {
	// Map of sheet ID to its level
	const [openSheets, setOpenSheets] = React.useState<Map<string, number>>(
		new Map(),
	);

	// Calculate max level from open sheets
	const maxLevel = React.useMemo(() => {
		if (openSheets.size === 0) return 0;
		return Math.max(...Array.from(openSheets.values()));
	}, [openSheets]);

	const registerSheet = React.useCallback((id: string, level: number) => {
		setOpenSheets((prev) => {
			const next = new Map(prev);
			next.set(id, level);
			return next;
		});
	}, []);

	const unregisterSheet = React.useCallback((id: string) => {
		setOpenSheets((prev) => {
			const next = new Map(prev);
			next.delete(id);
			return next;
		});
	}, []);

	const hasNestedSheetOpen = React.useCallback(
		(id: string) => {
			const currentLevel = openSheets.get(id);
			if (currentLevel === undefined) return false;
			// Check if there's any sheet with a higher level
			return Array.from(openSheets.values()).some(
				(level) => level > currentLevel,
			);
		},
		[openSheets],
	);

	const value = React.useMemo(
		() => ({
			level: 0,
			maxLevel,
			side,
			registerSheet,
			unregisterSheet,
			hasNestedSheetOpen,
		}),
		[maxLevel, side, registerSheet, unregisterSheet, hasNestedSheetOpen],
	);

	return (
		<NestedSheetContext.Provider value={value}>
			{children}
		</NestedSheetContext.Provider>
	);
}

function useNestedSheetContext() {
	const context = React.useContext(NestedSheetContext);
	if (!context) {
		throw new Error(
			"NestedSheet components must be used within a NestedSheetsProvider",
		);
	}
	return context;
}

interface NestedSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

/**
 * A Sheet component that automatically handles nesting behavior.
 * Use this instead of the regular Sheet when you need nested sheets.
 */
export function NestedSheet({
	open,
	onOpenChange,
	children,
}: NestedSheetProps) {
	const id = React.useId();
	const context = useNestedSheetContext();
	const level = context.level;

	// Destructure to get stable references
	const { registerSheet, unregisterSheet, hasNestedSheetOpen, maxLevel, side } =
		context;

	React.useEffect(() => {
		if (open) {
			registerSheet(id, level);
		} else {
			unregisterSheet(id);
		}
		return () => {
			unregisterSheet(id);
		};
	}, [open, id, level, registerSheet, unregisterSheet]);

	const hasNestedOpen = hasNestedSheetOpen(id);

	const nextContext = React.useMemo(
		() => ({
			level: level + 1,
			maxLevel,
			side,
			registerSheet,
			unregisterSheet,
			hasNestedSheetOpen,
		}),
		[level, maxLevel, side, registerSheet, unregisterSheet, hasNestedSheetOpen],
	);

	return (
		<NestedSheetContext.Provider value={nextContext}>
			<Sheet open={open} onOpenChange={onOpenChange}>
				{React.Children.map(children, (child) => {
					if (React.isValidElement<NestedSheetContentProps>(child)) {
						// Inject nesting props into NestedSheetContent
						if (child.type === NestedSheetContent) {
							return React.cloneElement<NestedSheetContentProps>(child, {
								__nestingLevel: level,
								__maxLevel: maxLevel,
								__hasNestedOpen: hasNestedOpen,
								__side: side,
							});
						}
					}
					return child;
				})}
			</Sheet>
		</NestedSheetContext.Provider>
	);
}

interface NestedSheetContentProps
	extends Omit<React.ComponentProps<typeof SheetContent>, "side"> {
	/**
	 * Custom offset for nested sheets. Defaults are applied based on nesting level.
	 */
	offset?: number;
	__nestingLevel?: number;
	__maxLevel?: number;
	__hasNestedOpen?: boolean;
	__side?: "right" | "left";
}

/**
 * Content component for NestedSheet that automatically applies scaling and positioning
 * based on nesting level and state.
 */
export function NestedSheetContent({
	className,
	offset,
	style = {},
	__nestingLevel = 0,
	__maxLevel = 0,
	__hasNestedOpen = false,
	__side = "right",
	...props
}: NestedSheetContentProps) {
	// Use side from context (provider)
	const side = __side;
	// Default offset increases with nesting level
	const defaultOffset = __nestingLevel * 16;
	const appliedOffset = offset ?? defaultOffset;

	// Build transform that combines scale and translate
	const buildTransform = () => {
		const transforms: string[] = [];

		// Calculate scale based on position relative to max level
		// Last sheet (maxLevel) should be scaleX(1)
		// Each previous level scales down by 0.05
		// Formula: scaleX(1 - (maxLevel - currentLevel) * 0.05)
		const scaleAmount = 1 - (__maxLevel - __nestingLevel) * 0.05;
		if (scaleAmount < 1) {
			transforms.push(`scaleX(${scaleAmount})`);
		}

		// Add translate for nested positioning
		if (__nestingLevel > 0) {
			transforms.push(`translateY(${appliedOffset}px)`);
		}

		return transforms.length > 0 ? transforms.join(" ") : undefined;
	};

	const transform = buildTransform();

	// Apply inline styles for positioning and z-index
	const positioningStyle: React.CSSProperties | undefined = {
		...style,
		...(transform && { transform }),
		...(__nestingLevel > 0 && {
			bottom: `${appliedOffset + 8}px`,
		}),
	};

	return (
		<SheetContent
			side={side}
			className={cn(className)}
			style={positioningStyle}
			{...props}
		/>
	);
}

// Re-export the other sheet components for convenience
export { SheetDescription, SheetHeader, SheetTitle } from "./sheet";

/**
 * Hook to create a controlled nested sheet state.
 * Returns [open, setOpen] similar to useState.
 */
export function useNestedSheet(defaultOpen = false) {
	return React.useState(defaultOpen);
}
