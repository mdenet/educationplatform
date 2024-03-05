export const TOOL_1PANELDEF_1FUNCTION = `{
    "tool": 
        {
            "id": "tool-1",
            "name": "Tool 1",
            "version": "0.0.0",
            "author": "Test",
            "homepage": "test://t.url",
            "functions": [
                {
                    "id": "function-1",
                    "name": "Function 1",
                    "parameters": [ {"name":"parameter1", "type":"type1"}, 
                                    {"name":"paremeter2", "type":"type2"}, 
                                    {"name":"language", "type":"string"} ],
    
                    "returnType": "text",
                    "path": "test://tool1.url"
                }
            ],
            "panelDefs": [
                {
                    "id": "paneldef-t1",
                    "name": "Panel Definition Tool 1",
                    "panelclass": "ProgramPanel",
                    "icon": "icon",
                    "language": "test",
                    "buttons" : [
                        {
                          "id": "action-button",
                          "icon": "run",
                          "actionfunction": "function-1",
                          "hint": "Run the program"
                        },
                        {
                          "id": "help-button",
                          "icon": "info",
                          "url": "test://t1.url/help",
                          "hint": "Tool 1 Help"
                        }
                    ]
                }
            ]
        }
} 
`