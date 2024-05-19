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

    const moduleName = process.argv[2];

    const models = builder
      .findAllByType("model", {})
      .filter((v) => v) as Model[];

    await renderMain(models, moduleName);
    await renderGeneral(moduleName);
    await renderAuth(moduleName);
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      await renderModel(model, moduleName);
      await renderController(model, moduleName);
    }
  }
}

async function renderMain(
  models: Model[],
  moduleName: string,
): Promise<string> {
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  mkdir(`${projectName}`, { recursive: true });
  let template = await readFile("templates/main.go.txt", { encoding: "utf8" });
  const filePath = `${projectName}/main.go`;
  template = template.replaceAll("__moduleName__", moduleName);
  template = template.replaceAll(
    "__modelsImport__",
    models
      .map((v) => `"${moduleName}/model/${camelToSnake(v.name)}"`)
      .join("\n\t"),
  );
  await writeFile(filePath, template, { encoding: "utf8" });
  return template;
}

async function renderController(m: Model, moduleName: string): Promise<string> {
  const s = camelToSnake(m.name);
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  mkdir(`${projectName}/model/${s}`, { recursive: true });
  let template = await readFile("templates/controller.txt", {
    encoding: "utf8",
  });
  const filePath = `${projectName}/model/${s}/${s}.controller.go`;
  template = template.replaceAll("__moduleName__", moduleName);
  template = template.replaceAll("__lowerModelName__", s);
  template = template.replaceAll("__upperModelName__", m.name);
  await writeFile(filePath, template, { encoding: "utf8" });
  return template;
}

async function renderModel(m: Model, moduleName: string): Promise<string> {
  const s = camelToSnake(m.name);
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  mkdir(`${projectName}/model/${s}`, { recursive: true });
  let template = await readFile("templates/model.txt", { encoding: "utf8" });
  const filePath = `${projectName}/model/${s}/${s}.model.go`;

  template = template.replaceAll("__moduleName__", moduleName);
  template = template.replaceAll("__lowerModelName__", s);
  template = template.replaceAll("__upperModelName__", m.name);
  template = template.replaceAll(
    "__fields__",
    m.properties
      .filter((p) => p.type === "field")
      .map((f) => renderField(f as Field))
      .join("\n"),
  );

  await writeFile(filePath, template, { encoding: "utf8" });

  return template;
}

async function renderGeneral(moduleName: string): Promise<void> {
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  await mkdir(`${projectName}`, { recursive: true });
  const databaseTemplate = await readFile("templates/database.txt", {
    encoding: "utf8",
  });
  const genericTemplate = await readFile("templates/generic.model.txt", {
    encoding: "utf8",
  });
  const modTemplate = (
    await readFile("templates/go.mod.txt", {
      encoding: "utf8",
    })
  ).replace(/__moduleName__/, moduleName);

  await mkdir(`${projectName}/database/`, { recursive: true });
  await writeFile(`${projectName}/database/database.go`, databaseTemplate, {
    encoding: "utf8",
  });
  await writeFile(`${projectName}/go.mod`, modTemplate, {
    encoding: "utf8",
  });
  await mkdir(`${projectName}/model/generic/`, { recursive: true });
  await writeFile(
    `${projectName}/model/generic/generic.model.go`,
    genericTemplate,
    {
      encoding: "utf8",
    },
  );
  await mkdir(`${projectName}/auth/`, { recursive: true });
  await writeFile(
    `${projectName}/model/generic/generic.model.go`,
    genericTemplate,
    {
      encoding: "utf8",
    },
  );
}

async function renderAuth(moduleName: string) {
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  await mkdir(`${projectName}/auth`, { recursive: true });
  const authService = (
    await readFile("templates/auth.service.txt", {
      encoding: "utf8",
    })
  ).replace(/__moduleName__/g, moduleName);
  const authController = (
    await readFile("templates/auth.controller.txt", {
      encoding: "utf8",
    })
  ).replace(/__moduleName__/g, moduleName);
  await writeFile(`${projectName}/auth/auth.service.go`, authService, {
    encoding: "utf8",
  });
  await writeFile(`${projectName}/auth/auth.controller.go`, authController, {
    encoding: "utf8",
  });
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
  return s
    .replace(/[A-Z]/g, (match) => "_" + match.toLowerCase())
    .replace(/^_/, "");
}

generate();
