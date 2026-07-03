"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Error({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<div className="flex items-center justify-center min-h-[50vh]">
			<div className="w-full max-w-md space-y-4">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Something went wrong</AlertTitle>
					<AlertDescription>
						{error.message ||
							"An unexpected error occurred while loading the dashboard."}
					</AlertDescription>
				</Alert>
				<Button onClick={reset} className="w-full">
					Try again
				</Button>
			</div>
		</div>
	);
}
