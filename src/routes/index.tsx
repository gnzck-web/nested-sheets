import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import logo from "../logo.svg";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const [isMainOpen, setIsMainOpen] = useState(false);
	const [isSubOpen, setIsSubOpen] = useState(false);

	return (
		<div className="text-center h-dvh">
			<div className="flex items-center justify-center gap-2 w-fit mx-auto">
				<button type="button" onClick={() => setIsMainOpen((v) => !v)}>
					Main
				</button>
				<button type="button" onClick={() => setIsSubOpen((v) => !v)}>
					Sub
				</button>
			</div>
			<div className="h-full flex items-center justify-center relative">
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
			</div>
		</div>
	);
}
