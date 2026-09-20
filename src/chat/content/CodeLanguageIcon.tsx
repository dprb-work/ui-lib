import SiDocker from "@icons-pack/react-simple-icons/icons/SiDocker";
import SiJavascript from "@icons-pack/react-simple-icons/icons/SiJavascript";
import SiJson from "@icons-pack/react-simple-icons/icons/SiJson";
import SiPython from "@icons-pack/react-simple-icons/icons/SiPython";
import SiTypescript from "@icons-pack/react-simple-icons/icons/SiTypescript";
import SiYaml from "@icons-pack/react-simple-icons/icons/SiYaml";
import { Atom, CodeXml, Terminal } from "lucide-react";

const icons: Record<
  "json" | "yaml" | "docker" | "typescript" | "javascript" | "python",
  { label: string; Icon: typeof SiJson }
> = {
  json: { label: "JSON", Icon: SiJson },
  yaml: { label: "YAML", Icon: SiYaml },
  docker: { label: "Docker", Icon: SiDocker },
  typescript: { label: "TypeScript", Icon: SiTypescript },
  javascript: { label: "JavaScript", Icon: SiJavascript },
  python: { label: "Python", Icon: SiPython },
};
export type CodeLanguage =
  | keyof typeof icons
  | "ts"
  | "tsx"
  | "js"
  | "bash"
  | "yml"
  | "dockerfile";
export function languageForPath(path: string): CodeLanguage | undefined {
  const basename = path.split("/").pop()?.toLowerCase();
  if (basename === "dockerfile" || basename?.startsWith("dockerfile."))
    return "docker";
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "tsx") return "tsx";
  if (extension === "ts") return "typescript";
  if (extension === "js" || extension === "jsx" || extension === "mjs")
    return "javascript";
  if (extension === "py") return "python";
  if (extension === "sh" || extension === "bash") return "bash";
  if (extension === "json") return "json";
  if (extension === "yaml" || extension === "yml") return "yaml";
  return undefined;
}
export function CodeLanguageIcon({ language }: { language: string }) {
  if (language === "bash")
    return (
      <Terminal
        role="img"
        aria-label="Bash"
        className="size-4 shrink-0 text-ui-muted-foreground"
      />
    );
  if (language === "tsx")
    return (
      <Atom
        role="img"
        aria-label="TSX"
        className="size-4 shrink-0 text-ui-muted-foreground"
      />
    );
  const key =
    language === "js"
      ? "javascript"
      : language === "ts"
        ? "typescript"
        : language === "yml"
          ? "yaml"
          : language === "dockerfile"
            ? "docker"
            : language;
  const icon = Object.hasOwn(icons, key)
    ? icons[key as keyof typeof icons]
    : undefined;
  if (!icon)
    return (
      <CodeXml
        role="img"
        aria-label={language}
        className="size-4 shrink-0 text-ui-muted-foreground"
      />
    );
  const Icon = icon.Icon;
  return (
    <Icon
      role="img"
      aria-label={icon.label}
      className="size-4 shrink-0 text-ui-muted-foreground"
    />
  );
}
