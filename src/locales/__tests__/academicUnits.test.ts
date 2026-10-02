import { localizeDepartmentName, localizeFacultyName } from "../academicUnits";

describe("academic-unit locale labels", () => {
  it("localizes faculty and department names independently", () => {
    expect(localizeFacultyName("Engineering", "th")).toBe("คณะวิศวกรรมศาสตร์");
    expect(localizeFacultyName("Faculty of Engineering", "th")).toBe(
      "คณะวิศวกรรมศาสตร์"
    );
    expect(
      localizeDepartmentName("Software and Knowledge Engineering", "th")
    ).toBe("วิศวกรรมซอฟต์แวร์และความรู้");
    expect(localizeFacultyName("Architecture", "th")).toBe(
      "คณะสถาปัตยกรรมศาสตร์"
    );
    expect(localizeDepartmentName("Architecture", "th")).toBe(
      "ภาควิชาสถาปัตยกรรม"
    );
  });

  it("keeps English names and unknown server values unchanged", () => {
    expect(localizeFacultyName("Engineering", "en")).toBe("Engineering");
    expect(localizeDepartmentName("Unknown Department", "th")).toBe(
      "Unknown Department"
    );
    expect(localizeFacultyName("toString", "th")).toBe("toString");
    expect(localizeDepartmentName("__proto__", "th")).toBe("__proto__");
  });
});
