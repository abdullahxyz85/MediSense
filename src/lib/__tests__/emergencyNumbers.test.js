import { describe, expect, it } from "vitest";
import { getEmergencyNumber } from "../emergencyNumbers";

describe("getEmergencyNumber", () => {
  it("maps common countries to the right emergency number", () => {
    expect(getEmergencyNumber("United States")).toBe("911");
    expect(getEmergencyNumber("India")).toBe("112");
    expect(getEmergencyNumber("United Kingdom")).toBe("999");
    expect(getEmergencyNumber("Australia")).toBe("000");
    expect(getEmergencyNumber("New Zealand")).toBe("111");
    expect(getEmergencyNumber("Singapore")).toBe("995");
  });

  it("falls back to 112 for unknown or empty values", () => {
    expect(getEmergencyNumber("")).toBe("112");
    expect(getEmergencyNumber(null)).toBe("112");
    expect(getEmergencyNumber("Unknown region")).toBe("112");
  });
});
