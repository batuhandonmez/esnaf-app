import { cn } from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("cn", () => {
  it("sınıfları birleştirir", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("çakışan tailwind sınıflarında sonuncuyu kazanır", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("falsy değerleri atlar", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });
});
