import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const [isMainOpen, setIsMainOpen] = useState(false);
	const [isSubOpen, setIsSubOpen] = useState(false);
	const [isSub2Open, setIsSub2Open] = useState(false);

	return (
		<div className="h-dvh">
			<div className="flex items-center justify-center gap-2 w-fit mx-auto">
				<Button type="button" onClick={() => setIsMainOpen((v) => !v)}>
					Main
				</Button>
			</div>
			{/* <div className="h-full flex items-center justify-center relative">
				{isMainOpen && (
					<div
						className="size-100 bg-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg"
						style={{
							transform: `scale(${1 - +isSubOpen * 0.1})`,
							transition: `transform 0.3s ease-in-out`,
						}}
					></div>
				)}
				{isSubOpen && (
					<div
						className="size-100 bg-blue-500 absolute top-[calc(50%+2rem)]  left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-lg"
						style={{
							transition: `transform 0.3s ease-in-out`,
						}}
					></div>
				)}
			</div> */}

			<Sheet open={isMainOpen} onOpenChange={setIsMainOpen}>
				<SheetContent className={cn(isSubOpen && "scale-95")}>
					<SheetHeader>
						<SheetTitle>Are you absolutely sure?</SheetTitle>
						<SheetDescription>
							This action cannot be undone. This will permanently delete your
							account and remove your data from our servers.
						</SheetDescription>
					</SheetHeader>
					<Button type="button" onClick={() => setIsSubOpen((v) => !v)}>
						Sub
					</Button>
				</SheetContent>
				<Sheet open={isSubOpen} onOpenChange={setIsSubOpen}>
					<SheetContent
						className={cn(
							"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
							!isSub2Open && "translate-y-10 bottom-14",
							isSub2Open && "scale-95",
						)}
					>
						<SheetHeader>
							<SheetTitle>Are you absolutely sure?</SheetTitle>
							<SheetDescription>
								This action cannot be undone. This will permanently delete your
								account and remove your data from our servers.
							</SheetDescription>
						</SheetHeader>
						<Button type="button" onClick={() => setIsSub2Open((v) => !v)}>
							Sub 2
						</Button>
					</SheetContent>
				</Sheet>
				<Sheet open={isSub2Open} onOpenChange={setIsSub2Open}>
					<SheetContent
						className={cn(
							"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
							"translate-y-10 bottom-14",
						)}
					>
						<SheetHeader>
							<SheetTitle>Are you absolutely sure?</SheetTitle>
						</SheetHeader>
					</SheetContent>
				</Sheet>
			</Sheet>
		</div>
	);
}
