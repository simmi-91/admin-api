// tests/wishlist.test.js
import request from "supertest";

import app from "../server.js";
import dbPool from "../src/database.js";

describe("Wishlist API", () => {
  beforeEach(async () => {
    // Clear data before each test
    try {
      await dbPool.query("TRUNCATE TABLE wishlist");
    } catch (error) {
      console.error("Failed to truncate wishlist table:", error.message);
      throw error;
    }
  });

  afterAll(async () => {
    await dbPool.end();
  });

  describe("GET /api/wishlist", () => {
    it("should return empty array initially", async () => {
      const response = await request(app).get("/api/wishlist");

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });

    it("should return items added to the database", async () => {
      const title = "Setup Item";
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      const sql = `
        INSERT INTO wishlist 
        (title, description, category, active, createdAt, updated) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [title, "Test Desc", 0, 1, now, now];

      await dbPool.query(sql, values);

      const response = await request(app).get("/api/wishlist");

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].title).toBe(title);
      expect(typeof response.body.items[0].id).toBe("number");
    });
  });

  describe("POST /api/wishlist", () => {
    it("should create a new item and return the auto-increment ID (integer)", async () => {
      const newItem = {
        title: "Test Item",
        description: "Test description",
        category: 1,
        active: 1,
      };

      const response = await request(app).post("/api/wishlist").send(newItem);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("Test Item");

      expect(response.body).toHaveProperty("id");
      expect(typeof response.body.id).toBe("number");
      expect(response.body.id).toBeGreaterThan(0);

      const [rows] = await dbPool.query("SELECT * FROM wishlist WHERE id = ?", [
        response.body.id,
      ]);
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe("Test Item");
    });

    it("should return 400 if title is missing", async () => {
      const response = await request(app)
        .post("/api/wishlist")
        .send({ description: "No title" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Title is required");
    });

    it("should return 409 Conflict if title is a duplicate", async () => {
      const duplicateItem = {
        title: "Unique Test Title",
        description: "Initial post",
      };

      await request(app).post("/api/wishlist").send(duplicateItem);

      const response = await request(app)
        .post("/api/wishlist")
        .send(duplicateItem);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe(
        "A wishlist item with this title already exists."
      );
      expect(response.body).toHaveProperty("details");
      expect(response.body.details.field).toBe("title");
    });
  });
});
