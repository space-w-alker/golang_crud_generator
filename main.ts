import { existsSync, readFileSync, writeFileSync } from "fs-extra";
import { questions, type Option, type Question } from "./options";
import inquirer from "inquirer";
import { generate as go_gin_goqu } from "./go/gin/goqu";

async function processQuestions(
  q: Question[],
  resObject: Record<string, string | null>,
  save = false
) {
  for (let i = 0; i < q.length; i++) {
    const question = q[i];
    let ans = await inquirer.prompt([
      {
        name: question.key,
        message: question.question,
        type: question.type,
        default: question.default,
        choices:
          question.type === "list"
            ? question.options?.map((q) => q.text)
            : undefined,
      },
    ]);
    let answer = ans[question.key];
    if (question.type === "list") {
      const opt: Option | undefined = question.options?.find(
        (opt) => answer === opt.text
      );
      if (opt) {
        resObject[question.key] = answer ?? null;
        opt.question?.length &&
          (await processQuestions(opt.question ?? [], resObject));
      } else {
        throw new Error(`${answer} is not valid`);
      }
    } else {
      resObject[question.key] = answer ?? null;
    }
    return resObject;
  }
  if (save) {
    writeFileSync(".config.json", JSON.stringify(resObject, null, 2), {
      encoding: "utf-8",
    });
  }
}

async function main() {
  let config;
  if (!existsSync(".config.json")) {
    config = await processQuestions(questions, {}, true);
  } else {
    config = JSON.parse(readFileSync(".config.json", { encoding: "utf-8" }));
  }
  if (config.language === "go") {
    if (config.framework === "gin") {
      if (config.orm === "goqu") {
        go_gin_goqu(config.moduleName, config.moveFiles);
      }
    }
  }
}

main();
