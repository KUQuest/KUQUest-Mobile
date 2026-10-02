const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  STAGING_SPEC_URL,
  loadSpec,
  loadStagingSpec,
  extractOperations,
  searchOperations,
  findOperation,
  resolveRef,
  formatSchemaCompact,
  renderOperationDetail,
} = require("../query-api");

describe("query-api CLI helper", () => {
  const mockDoc = {
    openapi: "3.0.3",
    info: { title: "Test API", version: "1.0.0" },
    components: {
      schemas: {
        User: {
          type: "object",
          required: ["id", "email"],
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            score: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    paths: {
      "/api/v1/wallet": {
        get: {
          operationId: "getOwnWallet",
          summary: "Get own Wallet",
          description: "Returns compartments",
          tags: ["Wallet"],
          security: [{ betterAuthSession: [] }],
          parameters: [
            {
              name: "includeHistory",
              in: "query",
              required: false,
              schema: { type: "boolean" },
            },
          ],
          responses: {
            200: {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["success", "data"],
                    properties: {
                      success: { const: true },
                      data: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: "topUpWallet",
          summary: "Top up wallet",
          tags: ["Wallet"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amountSatang"],
                  properties: {
                    amountSatang: { type: "integer", minimum: 100 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Top-up initialized" },
          },
        },
      },
      "/api/v1/quests/{id}": {
        get: {
          operationId: "getQuestById",
          summary: "Get Quest by ID",
          tags: ["Quests"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Quest detail" },
          },
        },
      },
    },
  };

  test("extractOperations flattens OpenAPI paths and methods", () => {
    const ops = extractOperations(mockDoc);
    expect(ops).toHaveLength(3);

    const getWallet = ops.find((o) => o.operationId === "getOwnWallet");
    expect(getWallet).toBeDefined();
    expect(getWallet.method).toBe("GET");
    expect(getWallet.path).toBe("/api/v1/wallet");
    expect(getWallet.tags).toEqual(["Wallet"]);
    expect(getWallet.parameters).toHaveLength(1);
  });

  test("searchOperations filters by keyword, tag, and method", () => {
    const ops = extractOperations(mockDoc);

    const keywordMatches = searchOperations(ops, "wallet");
    expect(keywordMatches).toHaveLength(2);

    const tagMatches = searchOperations(ops, "", { tag: "quests" });
    expect(tagMatches).toHaveLength(1);
    expect(tagMatches[0].operationId).toBe("getQuestById");

    const methodMatches = searchOperations(ops, "", { method: "POST" });
    expect(methodMatches).toHaveLength(1);
    expect(methodMatches[0].operationId).toBe("topUpWallet");
  });

  test("findOperation locates operations by operationId, method+path, or path", () => {
    const ops = extractOperations(mockDoc);

    expect(findOperation(ops, "getOwnWallet")?.path).toBe("/api/v1/wallet");
    expect(findOperation(ops, "GET /api/v1/wallet")?.operationId).toBe(
      "getOwnWallet"
    );
    expect(findOperation(ops, "POST /api/v1/wallet")?.operationId).toBe(
      "topUpWallet"
    );
    expect(findOperation(ops, "/api/v1/quests/{id}")?.operationId).toBe(
      "getQuestById"
    );

    // Multiple matches when method is omitted
    const multiple = findOperation(ops, "/api/v1/wallet");
    expect(Array.isArray(multiple)).toBe(true);
    expect(multiple).toHaveLength(2);
  });

  test("resolveRef resolves internal schema pointers", () => {
    const resolved = resolveRef(mockDoc, "#/components/schemas/User");
    expect(resolved).toBeDefined();
    expect(resolved.type).toBe("object");
    expect(resolved.properties.email.format).toBe("email");
  });

  test("formatSchemaCompact formats primitives, objects, and refs", () => {
    const formatted = formatSchemaCompact(
      mockDoc.components.schemas.User,
      mockDoc
    );
    expect(formatted).toContain("id*:");
    expect(formatted).toContain("email*:");
    expect(formatted).toContain("score?:");
    expect(formatted).toContain("min=0");
  });

  test("renderOperationDetail renders clean structured documentation", () => {
    const ops = extractOperations(mockDoc);
    const getWallet = ops.find((o) => o.operationId === "getOwnWallet");
    const output = renderOperationDetail(getWallet, mockDoc);

    expect(output).toMatch(/GET\s+\/api\/v1\/wallet/);
    expect(output).toContain("operationId: getOwnWallet");
    expect(output).toContain("betterAuthSession");
    expect(output).toContain("includeHistory");
    expect(output).toContain("[200]");
  });

  test("loads the live staging OpenAPI source through the query helper", async () => {
    const cacheDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "kuquest-query-api-")
    );
    const cachePath = path.join(cacheDir, "staging.json");
    const doc = {
      openapi: "3.0.3",
      paths: {
        "/api/v2/quests": {
          get: { operationId: "listQuestBoardV2" },
        },
      },
    };
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => doc,
    });

    try {
      const result = await loadStagingSpec({
        cachePath,
        fetchImpl,
        noCache: true,
      });
      expect(fetchImpl).toHaveBeenCalledWith(STAGING_SPEC_URL);
      expect(result.doc).toEqual(doc);
      expect(result.operations[0].operationId).toBe("listQuestBoardV2");
      expect(fs.existsSync(cachePath)).toBe(true);
    } finally {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  });
  test("loadSpec loads real repository OpenAPI document", () => {
    const specPath = path.resolve(__dirname, "../../docs/api/api.yaml");
    const { doc, operations } = loadSpec({ specPath, refresh: false });
    expect(doc).toBeDefined();
    expect(operations.length).toBeGreaterThan(150);

    const getWallet = findOperation(operations, "getOwnWallet");
    expect(getWallet).toBeDefined();
    expect(getWallet.path).toBe("/api/v1/wallet");
  });
});
