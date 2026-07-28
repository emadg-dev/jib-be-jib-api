import type { Context } from "hono";
import type { Env } from "./types";

export function db(c: Context<{ Bindings: Env }>) {
    return c.env.jib_be_jib_db;
}