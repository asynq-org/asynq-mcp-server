export class VersionManager {
  static increment(
    version: string,
    type: "major" | "minor" | "patch" = "patch",
  ): string {
    const [major, minor, patch] = version.split(".").map(Number);

    switch (type) {
      case "major":
        return `${major + 1}.0.0`;
      case "minor":
        return `${major}.${minor + 1}.0`;
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }
}
