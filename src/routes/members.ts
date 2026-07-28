import { Hono } from "hono";
import { db } from "../db";
import type { Env } from "../types";

const members = new Hono<{ Bindings: Env }>();

members.get("/", async (c) => {

    const result = await db(c)
        .prepare("SELECT * FROM members")
        .all();

    return c.json(result.results);
});

members.post("/", async (c) => {

    const body = await c.req.json();

    await db(c)
        .prepare("INSERT INTO members(name) VALUES(?)")
        .bind(body.name)
        .run();

    return c.json({
        success: true
    });
});

export default members;