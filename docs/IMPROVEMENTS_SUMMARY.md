# Nested Sheet Improvements Summary

## 🎯 Key Improvements Made

### 1. ⚡ Performance Optimizations

#### Before:

```tsx
// Recreated every render
const buildTransform = () => {
  const transforms: string[] = [];
  // ...
  return transforms.length > 0 ? transforms.join(" ") : undefined;
};
const transform = buildTransform();

// Style object recreated every render
const positioningStyle: React.CSSProperties | undefined = {
  ...style,
  ...(transform && { transform }),
  // ...
};
```

#### After:

```tsx
// Moved outside component, pure function
function buildTransform(nestingLevel, maxLevel, offset) {
  // ...
}

// Memoized calculations
const transform = React.useMemo(
  () => buildTransform(nestingLevel, maxLevel, appliedOffset),
  [nestingLevel, maxLevel, appliedOffset]
);

const positioningStyle = React.useMemo<React.CSSProperties>(
  () => ({
    ...style,
    ...(transform && { transform }),
    transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  }),
  [style, transform, nestingLevel, appliedOffset]
);
```

**Impact:** Prevents unnecessary recalculations and re-renders.

---

### 2. 🐛 Bug Fixes

#### Double Unregister Fix

**Before:**

```tsx
React.useEffect(() => {
  if (open) {
    registerSheet(id, level);
  } else {
    unregisterSheet(id); // ❌ Called in else
  }
  return () => {
    unregisterSheet(id); // ❌ Also called in cleanup
  };
}, [open, id, level, registerSheet, unregisterSheet]);
```

**After:**

```tsx
React.useEffect(() => {
  if (open) {
    registerSheet(id, level);
    return () => {
      unregisterSheet(id); // ✅ Only called once
    };
  }
}, [open, id, level, registerSheet, unregisterSheet]);
```

**Impact:** Prevents race conditions and double cleanup.

---

#### Scale Bounds Checking

**Before:**

```tsx
const scaleAmount = 1 - (__maxLevel - __nestingLevel) * 0.05;
// ❌ Can become negative with 20+ levels
if (scaleAmount < 1) {
  transforms.push(`scaleX(${scaleAmount})`);
}
```

**After:**

```tsx
const scaleAmount = Math.max(
  MIN_SCALE, // 0.5
  1 - (maxLevel - nestingLevel) * SCALE_STEP
);
// ✅ Always >= 0.5
```

**Impact:** Prevents visual bugs with deep nesting.

---

### 3. 🎨 UX Improvements

#### Smooth Transitions

**Before:**

```tsx
// No transition - abrupt scaling
style = { positioningStyle };
```

**After:**

```tsx
{
  ...style,
  transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
}
```

**Impact:** Smooth animations when sheets open/close.

---

### 4. 📦 Better Component API

#### Constants Extraction

**Before:**

```tsx
const defaultOffset = __nestingLevel * 16; // ❌ Magic number
const scaleAmount = 1 - (__maxLevel - __nestingLevel) * 0.05; // ❌ Magic
bottom: `${appliedOffset + 8}px`, // ❌ Magic
```

**After:**

```tsx
const SCALE_STEP = 0.05;
const MIN_SCALE = 0.5;
const OFFSET_MULTIPLIER = 16;
const BOTTOM_OFFSET_BASE = 8;
const MAX_SAFE_NESTING_LEVEL = 10;

// And configurable via props:
<NestedSheetsProvider
  scaleStep={0.05}
  offsetMultiplier={16}
>
```

**Impact:** More maintainable, configurable, and self-documenting.

---

### 5. 🔧 Better Type Safety

#### Proper Types

**Before:**

```tsx
const positioningStyle: React.CSSProperties | undefined = {
  // ❌ Can't be undefined since style defaults to {}
```

**After:**

```tsx
const positioningStyle = React.useMemo<React.CSSProperties>(() => ({
  // ✅ Correct type
```

---

#### Internal vs External Props

**Before:**

```tsx
// Mixed public and private props in same interface
interface NestedSheetContentProps {
  offset?: number;
  __nestingLevel?: number; // ❌ Exposed in public API
  __maxLevel?: number;
  __hasNestedOpen?: boolean;
  __side?: "right" | "left";
}
```

**After:**

```tsx
// Separate interfaces
interface NestedSheetContentProps {
  offset?: number;
  // Public props only
}

interface NestedSheetContentInternalProps {
  nestingLevel: number;
  maxLevel: number;
  hasNestedOpen: boolean;
  side: "right" | "left";
  // Internal props
}
```

**Impact:** Cleaner API, no leaking internals.

---

### 6. 🎭 Better HOC Support

**Before:**

```tsx
if (child.type === NestedSheetContent) {
  // ❌ Won't work with React.memo, forwardRef, etc.
```

**After:**

```tsx
if ((child.type as any)?.displayName === "NestedSheetContent") {
  // ✅ Works with HOCs
}

// And added:
NestedSheetContent.displayName = "NestedSheetContent";
```

**Impact:** Works with memoization and other HOCs.

---

### 7. 🛡️ Dev Mode Warnings

**Added:**

```tsx
if (process.env.NODE_ENV !== "production") {
  React.useEffect(() => {
    if (maxLevel > MAX_SAFE_NESTING_LEVEL) {
      console.warn(
        `[NestedSheets] Deep nesting detected (${maxLevel} levels). ` +
          `Consider limiting nesting depth for better UX.`
      );
    }
  }, [maxLevel]);
}
```

**Impact:** Helps developers catch potential UX issues early.

---

### 8. ♿ Better Ref Support

**Before:**

```tsx
export function NestedSheetContent({ ... }: NestedSheetContentProps) {
  // ❌ No ref forwarding
  return <SheetContent ... />;
}
```

**After:**

```tsx
function NestedSheetContentComponent(
  { ... }: Props,
  ref: React.Ref<HTMLDivElement>,
) {
  return <SheetContent ref={ref} ... />;
}

export const NestedSheetContent = React.forwardRef(NestedSheetContentComponent);
```

**Impact:** Allows parent components to access DOM node.

---

### 9. 🧹 Code Cleanup

#### Removed Unnecessary Code

**Before:**

```tsx
const side = __side; // ❌ Unnecessary variable
className={cn(className)} // ❌ cn() with single arg
```

**After:**

```tsx
// Just use directly
<SheetContent side={side} className={className} />
```

---

### 10. 🚀 Memoized Children Processing

**Before:**

```tsx
return (
  <Sheet open={open} onOpenChange={onOpenChange}>
    {React.Children.map(children, (child) => {
      // ❌ Runs every render
```

**After:**

```tsx
const enhancedChildren = React.useMemo(() => {
  return React.Children.map(children, (child) => {
    // ✅ Only when deps change
  });
}, [children, level, maxLevel, hasNestedOpen, side]);
```

**Impact:** Reduces expensive cloneElement operations.

---

## 📊 Performance Comparison

### Before:

- ❌ 5+ object/function creations per render
- ❌ Expensive Children.map on every render
- ❌ No memoization
- ❌ Double cleanup calls
- ❌ No bounds checking

### After:

- ✅ Memoized calculations
- ✅ Memoized children processing
- ✅ Stable references
- ✅ Single cleanup
- ✅ Safe bounds
- ✅ Smooth transitions

---

## 🎓 Best Practices Applied

1. ✅ Extracted constants
2. ✅ Pure functions outside components
3. ✅ Proper memoization
4. ✅ Display names for debugging
5. ✅ Dev-mode warnings
6. ✅ Ref forwarding
7. ✅ Separated public/internal APIs
8. ✅ Transition animations
9. ✅ Bounds checking
10. ✅ Better error messages

---

## 🔄 Migration Guide

The improved version is **backward compatible** with the same public API:

```tsx
// No changes needed to existing code!
<NestedSheetsProvider side="right">
  <NestedSheet open={open} onOpenChange={setOpen}>
    <NestedSheetContent>{/* Your content */}</NestedSheetContent>
  </NestedSheet>
</NestedSheetsProvider>
```

**New optional features:**

```tsx
<NestedSheetsProvider
  side="right"
  scaleStep={0.03}        // ✨ New: customize scale step
  offsetMultiplier={20}   // ✨ New: customize offset
>
```
