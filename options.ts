export const questions: Question[] = [
  {
    type: "list",
    question: "Which language?",
    key: "language",
    default: "go",
    options: [
      {
        text: "go",
        question: [
          {
            type: "list",
            question: "Which framework?",
            default: "gin",
            key: "framework",
            options: [
              {
                text: "gin",
                question: [
                  {
                    type: "list",
                    question: "Which ORM?",
                    default: "goqu",
                    key: "orm",
                    options: [
                      {
                        text: "goqu",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "input",
            question: "Module name",
            default: "github.com/user/example_project",
            key: "moduleName",
          },
          {
            type: "confirm",
            question: "Move files to $GOPATH",
            default: true,
            key: "moveFiles",
          },
        ],
      },
    ],
  },
];

export interface Question {
  key: string;
  question: string;
  default?: string | number | boolean;
  options?: Option[];
  type?: "list" | "input" | "confirm";
}

export interface Option {
  text: string | number | boolean;
  question?: Question[];
}
