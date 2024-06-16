import { questions, type Option, type Question } from "./options";
import * as readline from "readline";

function askQuestion(query: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function processQuestions(
  q: Question[],
  resObject: Record<string, string>,
  save = false,
) {
  for (let i = 0; i < q.length; i++) {
    const question = q[i];
    let answer = await askQuestion(question.question);
    answer = !!answer && answer !== "" ? answer : question.default;
    const opt: Option | undefined = question.options.find((opt) =>
      answer.match(opt.value),
    );
    if (opt) {
      resObject[question.key] = answer;
      opt.question?.length &&
        (await processQuestions(opt.question ?? [], resObject));
    } else {
      throw new Error(`${answer} is not valid`);
    }
  }
  if (save) {
    console.log(resObject);
  }
}

processQuestions(questions, {}, true);
