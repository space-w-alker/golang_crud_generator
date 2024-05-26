import {
  createPrismaSchemaBuilder,
  type Field,
  type Model,
} from "@mrleebo/prisma-ast";
import { exists, writeFile, readFile, mkdir, rmdir } from "fs/promises";
import _path from "path";
import { move, readdir, ensureDirSync, stat, ensureDir } from "fs-extra";

export async function generate() {
  const path = "schema.prisma";
  if (await exists(path)) {
    const builder = createPrismaSchemaBuilder(
      await readFile(path, { encoding: "utf8" })
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
      await renderModule(model, moduleName);
      await renderController(model, moduleName);
    }
    await moveProject(moduleName);
  }
}

async function renderMain(
  models: Model[],
  moduleName: string
): Promise<string> {
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  await mkdir(`${projectName}`, { recursive: true });
  let template = await readFile("templates/main.go.txt", { encoding: "utf8" });
  const filePath = `${projectName}/main.go`;
  template = template.replaceAll("__moduleName__", moduleName);
  template = template.replaceAll(
    "__modulesImport__",
    models
      .map((v) => `"${moduleName}/modules/${camelToSnake(v.name)}"`)
      .join("\n\t")
  );
  template = template.replaceAll(
    "__register__",
    models
      .map((v) => `${camelToSnake(v.name)}.RegisterHandlers(api)`)
      .join("\n\t")
  );
  await writeFile(filePath, template, { encoding: "utf8" });
  return template;
}

async function renderController(m: Model, moduleName: string): Promise<string> {
  const s = camelToSnake(m.name);
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  await mkdir(`${projectName}/modules/${s}`, { recursive: true });
  let template = await readFile("templates/controller.txt", {
    encoding: "utf8",
  });
  const filePath = `${projectName}/modules/${s}/${s}.controller.go`;
  template = template.replaceAll("__moduleName__", moduleName);
  template = template.replaceAll("__lowerModelName__", s);
  template = template.replaceAll("__upperModelName__", m.name);
  await writeFile(filePath, template, { encoding: "utf8" });
  return template;
}

async function renderModule(m: Model, moduleName: string): Promise<string> {
  const s = camelToSnake(m.name);
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  await mkdir(`${projectName}/modules/${s}`, { recursive: true });
  let template = await readFile("templates/base_service.txt", {
    encoding: "utf8",
  });
  const filePath = `${projectName}/modules/${s}/${s}.base_service.go`;

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
  await mkdir(`${projectName}/model`, { recursive: true });
  let template = await readFile("templates/model.txt", {
    encoding: "utf8",
  });
  const filePath = `${projectName}/model/${s}.go`;

  template = template.replaceAll("__upperModelName__", m.name);
  template = template.replaceAll(
    "__fields__",
    m.properties
      .filter((p) => p.type === "field")
      .map((f) => renderField(f as Field))
      .join("\n\t")
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
  await mkdir(`${projectName}/model`, { recursive: true });
  await writeFile(`${projectName}/model/generic.go`, genericTemplate, {
    encoding: "utf8",
  });
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
  return `${f.name[0].toUpperCase() + f.name.slice(1)} ${f.array ? "[]" : ""}*${
    tMap[f.fieldType as string] ?? f.fieldType
  } ${"`"}json:"${s}" form:"${s}" db:"${s}"${"`"}`;
}

async function moveProject(moduleName: string) {
  const split = moduleName.split("/");
  const projectName = split[split.length - 1];
  console.log(process.env.GOPATH);
  if (process.env.GOPATH) {
    _move(
      _path.join(projectName),
      _path.join(process.env.GOPATH ?? "", "src", moduleName)
    );
  }
}

const tMap: Record<string, string> = {
  Int: "int",
  String: "string",
  DateTime: "time.Time",
  Boolean: "bool",
};

function camelToSnake(s: string) {
  return s
    .replace(/[A-Z]/g, (match) => "_" + match.toLowerCase())
    .replace(/^_/, "");
}

async function _move(source: string, dest: string) {
  if ((await stat(source)).isDirectory()) {
    const items = await readdir(source);
    await Promise.all(
      items.map((item) =>
        _move(_path.join(source, item), _path.join(dest, item))
      )
    );
  } else {
    await ensureDir(_path.dirname(dest));
    await move(source, dest, { overwrite: true });
  }
}

generate();
