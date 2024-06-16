export const questions: Question[] = [
  {
    question: "Which language?",
    key: "language",
    default: "go",
    options: [
      {
        value: /^go$/gi,
        question: [
          {
            question: "Which framework?",
            default: "gin",
            key: "framework",
            options: [
              {
                value: /^gin$/gi,
                question: [
                  {
                    question: "Which ORM?",
                    default: "goqu",
                    key: "orm",
                    options: [{ value: /^goqu$/gi }],
                  },
                ],
              },
            ],
          },
          {
            question: "Module name",
            key: "moduleName",
            options: [{ value: /.*/gi }],
          },
        ],
      },
    ],
  },
];

export interface Question {
  key: string;
  question: string;
  default?: string;
  options: Option[];
}

export interface Option {
  value: RegExp;
  question?: Question[];
}
