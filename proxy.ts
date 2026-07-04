import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const response = NextResponse.next({ request });

	const supabaseKey =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		supabaseKey!,
		{
			cookies: {
				getAll: () => request.cookies.getAll(),
				setAll: (cookiesToSet) =>
					cookiesToSet.forEach(({ name, value, options }) => {
						request.cookies.set(name, value);
						response.cookies.set(name, value, options);
					}),
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isTestMode =
		process.env.PLAYWRIGHT_TEST === "true" || process.env.NODE_ENV === "test";
	const isTestAuthenticated =
		isTestMode && request.cookies.get("test-session")?.value === "true";

	if (
		!user &&
		!isTestAuthenticated &&
		!request.nextUrl.pathname.startsWith("/login")
	) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (
		(user || isTestAuthenticated) &&
		request.nextUrl.pathname.startsWith("/login")
	) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return response;
}

export const config = { matcher: ["/dashboard/:path*", "/login"] };
