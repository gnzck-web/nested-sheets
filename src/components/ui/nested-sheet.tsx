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
import { Sheet, SheetContent } from "./sheet";

// ============================================================================
// CONSTANTS
// ============================================================================

const SCALE_STEP = 0.05;
const MIN_SCALE = 0.5; // Prevent negative/too small scales
const OFFSET_MULTIPLIER = 16;
const BOTTOM_OFFSET_BASE = 8;
const MAX_SAFE_NESTING_LEVEL = 10;

// ============================================================================
// TYPES
// ============================================================================

interface NestedSheetContextValue {
	level: number;
	maxLevel: number;
	side: "right" | "left";
	registerSheet: (id: string, level: number) => void;
	unregisterSheet: (id: string) => void;
	hasNestedSheetOpen: (id: string) => boolean;
}

interface NestedSheetsProviderProps {
	children: React.ReactNode;
	/**
	 * The side from which all nested sheets should appear.
	 * @default "right"
	 */
	side?: "right" | "left";
}

interface NestedSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

interface NestedSheetContentInternalProps {
	nestingLevel: number;
	maxLevel: number;
	hasNestedOpen: boolean;
	side: "right" | "left";
}

interface NestedSheetContentProps
	extends Omit<React.ComponentProps<typeof SheetContent>, "side"> {
	/**
	 * Custom offset for nested sheets. Defaults are applied based on nesting level.
	 */
	offset?: number;
}

// ============================================================================
// CONTEXT
// ============================================================================

const NestedSheetContext = React.createContext<NestedSheetContextValue | null>(
	null,
);

if (process.env.NODE_ENV !== "production") {
	NestedSheetContext.displayName = "NestedSheetContext";
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Access the nested sheet context. Throws if used outside provider.
 */
export function useNestedSheetContext() {
	const context = React.useContext(NestedSheetContext);
	if (!context) {
		throw new Error(
			"NestedSheet components must be used within a NestedSheetsProvider",
		);
	}
	return context;
}

/**
 * Hook to create a controlled nested sheet state.
 * Returns [open, setOpen] similar to useState.
 */
export function useNestedSheet(defaultOpen = false) {
	return React.useState(defaultOpen);
}

// ============================================================================
// PROVIDER
// ============================================================================

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

	// Warn in dev mode about deep nesting
	React.useEffect(() => {
		if (
			process.env.NODE_ENV !== "production" &&
			maxLevel > MAX_SAFE_NESTING_LEVEL
		) {
			console.warn(
				`[NestedSheets] Deep nesting detected (${maxLevel} levels). Consider limiting nesting depth for better UX.`,
			);
		}
	}, [maxLevel]);

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

// ============================================================================
// NESTED SHEET
// ============================================================================

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

	// Register/unregister sheet when open state changes
	React.useEffect(() => {
		if (open) {
			registerSheet(id, level);
			return () => {
				unregisterSheet(id);
			};
		}
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

	// Clone children and inject props
	const enhancedChildren = React.useMemo(() => {
		return React.Children.map(children, (child) => {
			if (
				React.isValidElement(child) &&
				// Check displayName for better HOC support
				typeof child.type === "function" &&
				(child.type as { displayName?: string }).displayName ===
					"NestedSheetContent"
			) {
				return React.cloneElement(child, {
					nestingLevel: level,
					maxLevel,
					hasNestedOpen,
					side,
				} as NestedSheetContentInternalProps);
			}
			return child;
		});
	}, [children, level, maxLevel, hasNestedOpen, side]);

	return (
		<NestedSheetContext.Provider value={nextContext}>
			<Sheet open={open} onOpenChange={onOpenChange}>
				{enhancedChildren}
			</Sheet>
		</NestedSheetContext.Provider>
	);
}

// ============================================================================
// NESTED SHEET CONTENT
// ============================================================================

/**
 * Calculate transform string for scaling and positioning
 */
function buildTransform(
	nestingLevel: number,
	maxLevel: number,
	offset: number,
): string | undefined {
	const transforms: string[] = [];

	// Calculate scale based on position relative to max level
	// Last sheet (maxLevel) should be scaleX(1)
	// Each previous level scales down by SCALE_STEP
	// Formula: scaleX(1 - (maxLevel - currentLevel) * SCALE_STEP)
	const scaleAmount = Math.max(
		MIN_SCALE,
		1 - (maxLevel - nestingLevel) * SCALE_STEP,
	);

	if (scaleAmount < 1) {
		transforms.push(`scaleX(${scaleAmount})`);
	}

	// Add translate for nested positioning
	if (nestingLevel > 0) {
		transforms.push(`translateY(${offset}px)`);
	}

	return transforms.length > 0 ? transforms.join(" ") : undefined;
}

/**
 * Content component for NestedSheet that automatically applies scaling and positioning
 * based on nesting level and state.
 */
export function NestedSheetContent({
	className,
	offset,
	style = {},
	nestingLevel = 0,
	maxLevel = 0,
	hasNestedOpen = false,
	side = "right",
	ref,
	...props
}: NestedSheetContentProps & Partial<NestedSheetContentInternalProps>) {
	// Calculate offset
	const defaultOffset = nestingLevel * OFFSET_MULTIPLIER;
	const appliedOffset = offset ?? defaultOffset;

	// Memoize transform calculation
	const transform = React.useMemo(
		() => buildTransform(nestingLevel, maxLevel, appliedOffset),
		[nestingLevel, maxLevel, appliedOffset],
	);

	// Memoize positioning style
	const positioningStyle = React.useMemo<React.CSSProperties>(() => {
		return {
			...style,
			...(transform && { transform }),
			...(nestingLevel > 0 && {
				bottom: `${appliedOffset + BOTTOM_OFFSET_BASE}px`,
			}),
			// Add smooth transition for scaling
			transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
		};
	}, [style, transform, nestingLevel, appliedOffset]);

	return (
		<SheetContent
			ref={ref}
			side={side}
			className={className}
			style={positioningStyle}
			{...props}
		/>
	);
}

// Add displayName for better debugging and HOC support
NestedSheetContent.displayName = "NestedSheetContent";

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export the other sheet components for convenience
export {
	SheetDescription as NestedSheetDescription,
	SheetHeader as NestedSheetHeader,
	SheetTitle as NestedSheetTitle,
} from "./sheet";
