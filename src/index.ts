/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from "hono";
import type { Env } from "./types";
import members from "./routes/members";


const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
	return c.json({
		message: "Jib Be Jib API"
    });
});

app.route("/members", members);

export default app;