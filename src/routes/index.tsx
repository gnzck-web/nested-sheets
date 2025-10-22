import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	NestedSheet,
	NestedSheetContent,
	NestedSheetDescription,
	NestedSheetHeader,
	NestedSheetsProvider,
	NestedSheetTitle,
	useNestedSheet,
} from "@/components/ui/nested-sheet";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const [isMainOpen, setIsMainOpen] = useNestedSheet(false);
	const [isSubOpen, setIsSubOpen] = useNestedSheet(false);
	const [isSub2Open, setIsSub2Open] = useNestedSheet(false);

	return (
		<NestedSheetsProvider side="right">
			<div className="h-dvh">
				<div className="flex items-center justify-center gap-2 w-fit mx-auto">
					<Button type="button" onClick={() => setIsMainOpen((v) => !v)}>
						Main Sheet
					</Button>
				</div>

				<NestedSheet open={isMainOpen} onOpenChange={setIsMainOpen}>
					<NestedSheetContent>
						<NestedSheetHeader>
							<NestedSheetTitle>Main Sheet</NestedSheetTitle>
							<NestedSheetDescription>
								This is the main sheet. Click the button below to open a nested
								sheet.
							</NestedSheetDescription>
						</NestedSheetHeader>
						<Button type="button" onClick={() => setIsSubOpen((v) => !v)}>
							Open Sub Sheet
						</Button>
					</NestedSheetContent>

					<NestedSheet open={isSubOpen} onOpenChange={setIsSubOpen}>
						<NestedSheetContent>
							<NestedSheetHeader>
								<NestedSheetTitle>Nested Sheet (Level 1)</NestedSheetTitle>
								<NestedSheetDescription>
									This sheet is nested inside the main sheet. Notice how the
									main sheet scales down automatically.
								</NestedSheetDescription>
							</NestedSheetHeader>
							<Button type="button" onClick={() => setIsSub2Open((v) => !v)}>
								Open Sub Sheet 2
							</Button>
						</NestedSheetContent>

						<NestedSheet open={isSub2Open} onOpenChange={setIsSub2Open}>
							<NestedSheetContent>
								<NestedSheetHeader>
									<NestedSheetTitle>Nested Sheet (Level 2)</NestedSheetTitle>
									<NestedSheetDescription>
										This is a third level nested sheet! All styling and
										positioning happens automatically.
									</NestedSheetDescription>
								</NestedSheetHeader>
							</NestedSheetContent>
						</NestedSheet>
					</NestedSheet>
				</NestedSheet>
			</div>
		</NestedSheetsProvider>
	);
}
