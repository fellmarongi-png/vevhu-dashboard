const CACHE_NAME = "vevhu-dashboard-v2";

// Static asset extensions that use cache-first strategy
const STATIC_ASSET_RE = /\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2)(\?.*)?$/i;

// API/data URL patterns that must always use network-first
const API_PATH_RE = /\/(rest|auth|functions|supabase)\//;

function isStaticAsset(url) {
	return STATIC_ASSET_RE.test(url.pathname);
}

function isApiRequest(url) {
	return API_PATH_RE.test(url.pathname);
}

self.addEventListener("install", (_event) => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	const url = new URL(event.request.url);

	// API/data requests: network-first, fall back to cache
	if (isApiRequest(url) || !isStaticAsset(url)) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					// Cache a copy of successful responses
					if (response.ok) {
						const clone = response.clone();
						caches
							.open(CACHE_NAME)
							.then((cache) => cache.put(event.request, clone));
					}
					return response;
				})
				.catch(() => caches.match(event.request)),
		);
		return;
	}

	// Static assets: cache-first, fall back to network
	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;
			return fetch(event.request).then((response) => {
				if (response.ok) {
					const clone = response.clone();
					caches
						.open(CACHE_NAME)
						.then((cache) => cache.put(event.request, clone));
				}
				return response;
			});
		}),
	);
});
