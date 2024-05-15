import {
  createPrismaSchemaBuilder,
  type Field,
  type Model,
} from "@mrleebo/prisma-ast";
import { exists, writeFile, readFile, mkdir } from "fs/promises";

export async function generate() {
  const path = "schema.prisma";
  if (await exists(path)) {
    const builder = createPrismaSchemaBuilder(
      await readFile(path, { encoding: "utf8" }),
    );
    const models = builder.findAllByType("model", {});
    console.log(process.argv);
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      for (let j = 0; j < model!.properties.length; j++) {
        const k = model?.properties[j];
        if (k?.type === "field") {
          const b = k;
        }
      }
    }
  }
}

async function renderModel(m: Model, moduleName: string): Promise<string> {
  const s = camelToSnake(m.name);
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  mkdir(`${projectName}/model/${s}`, { recursive: true });
  const template = await readFile("templates/model.txt", { encoding: "utf8" });
  const filePath = `${projectName}/model/${s}/${s}.model.go`;

  template.replaceAll(
    "__fields__",
    m.properties
      .filter((p) => p.type === "field")
      .map((f) => renderField(f as Field))
      .join("\n"),
  );
  template.replaceAll("__moduleName__", moduleName);
  template.replaceAll("__lowerModelName__", s);
  template.replaceAll("__upperModelName__", m.name);

  writeFile(filePath, template, { encoding: "utf8" });

  return template;
}

function renderField(f: Field): string {
  const s = camelToSnake(f.name);
  return `${f.name} ${tMap[f.fieldType as string] ?? f.fieldType} ${"`"}json:"${s}" form:"${s}" db:"${s}"${"`"}`;
}

const tMap: Record<string, string> = {
  Int: "*int",
  String: "*string",
  DateTime: "*time.Time",
  Boolean: "*bool",
};

function camelToSnake(s: string) {
  return s.replace(/[A-Z]/g, (match) => "_" + match.toLowerCase());
}

generate();
