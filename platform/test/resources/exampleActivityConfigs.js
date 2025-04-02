export const JSON_ACTIVITY_CONFIG = `
{
    "activities": [
        {
            "id": "activity-eol",
            "title": "Query Project Plan",
            "icon": "evl",
            "tools": [
                "http://127.0.0.1:8070/epsilon_tool.json",
                "http://127.0.0.1:8071/emfatic_tool.json"
            ],
            "layout": {
                "area": [
                    ["panel-eol", "panel-model"],
                    ["panel-console", "panel-mm"]
                ]
            },
            "actions": [
                {
                    "source": "panel-eol",
                    "sourceButton": "action-button",
                    "parameters": {
                        "program": "panel-eol",
                        "flexmi": "panel-model",
                        "emfatic": "panel-mm"
                    },
                    "output": "panel-console"
                }
            ],
            "panels": [
                {
                    "id": "panel-eol",
                    "name": "Program (EOL)",
                    "ref": "eol",
                    "file": "psl.eol"
                },
                {
                    "id": "panel-model",
                    "name": "Model",
                    "ref": "flexmi",
                    "file": "psl.flexmi"
                },
                {
                    "id": "panel-mm",
                    "name": "Metamodel",
                    "ref": "emfatic",
                    "file": "psl.emf"
                },
                {
                    "id": "panel-console",
                    "name": "Console",
                    "ref": "console"
                }
            ]
        },
        {
            "id": "evl",
            "title": "Validate Project Plan",
            "icon": "evl",
            "tools": ["http://127.0.0.1:8070/epsilon_tool.json"],
            "layout": {
                "area": [
                    ["panel-evl", "panel-model", "panel-problems"],
                    ["panel-console", "panel-mm", ""]
                ]
            },
            "actions": [
                {
                    "source": "panel-evl",
                    "sourceButton": "action-button",
                    "parameters": {
                        "program": "panel-evl",
                        "flexmi": "panel-model",
                        "emfatic": "panel-mm"
                    },
                    "output": "panel-problems"
                }
            ],
            "panels": [
                {
                    "id": "panel-evl",
                    "name": "Constraints(EVL)",
                    "ref": "evl",
                    "file": "psl.evl"
                },
                {
                    "id": "panel-model",
                    "name": "Model",
                    "ref": "flexmi",
                    "file": "psl-evl.flexmi"
                },
                {
                    "id": "panel-mm",
                    "name": "Metamodel",
                    "ref": "emfatic",
                    "file": "psl.emf"
                },
                {
                    "id": "panel-console",
                    "name": "Console",
                    "ref": "console"
                },
                {
                    "id": "panel-problems",
                    "name": "Problems",
                    "ref": "problem"
                }
            ]
        },
        {
            "id": "etl",
            "title": "Transform to Deliverables",
            "icon": "etl",
            "tools": ["http://127.0.0.1:8070/epsilon_tool.json"],
            "layout": {
                "area": [
                    ["panel-etl", "panel-smodel", "panel-tmodel"],
                    ["panel-console", "panel-smm", "panel-tmm"]
                ]
            },
            "actions": [
                {
                    "source": "panel-etl",
                    "sourceButton": "action-button",
                    "parameters": {
                        "program": "panel-etl",
                        "flexmi": "panel-smodel",
                        "emfatic": "panel-smm",
                        "secondEmfatic": "panel-tmm"
                    },
                    "output": "panel-tmodel"
                }
            ],
            "panels": [
                {
                    "id": "panel-etl",
                    "name": "Transformation(ETL)",
                    "ref": "etl",
                    "file": "psl2pdl.etl"
                },
                {
                    "id": "panel-smodel",
                    "name": "Source Model",
                    "ref": "flexmi",
                    "file": "psl2pdl.flexmi"
                },
                {
                    "id": "panel-smm",
                    "name": "Source Metamodel",
                    "ref": "emfatic",
                    "file": "psl.emf"
                },
                {
                    "id": "panel-tmm",
                    "name": "Target Metamodel",
                    "ref": "emfatic",
                    "file": "pdl.emf"
                },
                {
                    "id": "panel-tmodel",
                    "name": "Target Model",
                    "ref": "emfgraph"
                },
                {
                    "id": "panel-console",
                    "name": "Console",
                    "ref": "console"
                }
            ]
        }
    ]
}`;

export const YML_ACTIVITY_CONFIG = `
activities:
    - actions:
        - output: panel-console
          parameters:
              emfatic: panel-mm
              flexmi: panel-model
              program: panel-eol
          source: panel-eol
          sourceButton: action-button
      icon: evl
      id: activity-eol
      layout:
          area:
              - - panel-eol
                - panel-model
              - - panel-console
                - panel-mm
      panels:
          - file: psl.eol
            id: panel-eol
            name: Program (EOL)
            ref: eol
          - file: psl.flexmi
            id: panel-model
            name: Model
            ref: flexmi
          - file: psl.emf
            id: panel-mm
            name: Metamodel
            ref: emfatic
          - id: panel-console
            name: Console
            ref: console
      title: Query Project Plan
      tools:
          - http://127.0.0.1:8070/epsilon_tool.json
          - http://127.0.0.1:8071/emfatic_tool.json

    - actions:
        - output: panel-problems
          parameters:
              emfatic: panel-mm
              flexmi: panel-model
              program: panel-evl
          source: panel-evl
          sourceButton: action-button
      icon: evl
      id: evl
      layout:
          area:
              - - panel-evl
                - panel-model
                - panel-problems
              - - panel-console
                - panel-mm
                - ''
      panels:
          - file: psl.evl
            id: panel-evl
            name: Constraints(EVL)
            ref: evl
          - file: psl-evl.flexmi
            id: panel-model
            name: Model
            ref: flexmi
          - file: psl.emf
            id: panel-mm
            name: Metamodel
            ref: emfatic
          - id: panel-console
            name: Console
            ref: console
          - id: panel-problems
            name: Problems
            ref: problem
      title: Validate Project Plan
      tools:
          - http://127.0.0.1:8070/epsilon_tool.json

    - actions:
        - output: panel-tmodel
          parameters:
              emfatic: panel-smm
              flexmi: panel-smodel
              program: panel-etl
              secondEmfatic: panel-tmm
          source: panel-etl
          sourceButton: action-button
      icon: etl
      id: etl
      layout:
          area:
              - - panel-etl
                - panel-smodel
                - panel-tmodel
              - - panel-console
                - panel-smm
                - panel-tmm
      panels:
          - file: psl2pdl.etl
            id: panel-etl
            name: Transformation(ETL)
            ref: etl
          - file: psl2pdl.flexmi
            id: panel-smodel
            name: Source Model
            ref: flexmi
          - file: psl.emf
            id: panel-smm
            name: Source Metamodel
            ref: emfatic
          - file: pdl.emf
            id: panel-tmm
            name: Target Metamodel
            ref: emfatic
          - id: panel-tmodel
            name: Target Model
            ref: emfgraph
          - id: panel-console
            name: Console
            ref: console
      title: Transform to Deliverables
      tools:
          - http://127.0.0.1:8070/epsilon_tool.json
`;

export const INVALID_FILE = `{
-----------------
]`;
