import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";

describe("LaagGo API", () => {
  it("should return the API information", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      name: "LaagGo API",
      version: "1.0.0",
    });
  });

  it("should return the API health status", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "LaagGo API is running",
    });
  });
});