
export const ACTIVITY_2PANELS_1ACTION = `{
    "activities": [
        {
            "id": "activity-1",
            "title": "Activity 1",
            "icon": "icon",
            "tools": ["test://t.url"],
            "layout": {
                "area": [
                    ["panel-1"]
                ]
            },
            "panels": [
                {
                    "id": "panel-1",
                    "name": "Panel 1",
                    "ref": "x"
                },
                {
                    "id": "panel-2",
                    "name": "Panel 2",
                    "ref": "x"
                }
            ],
            "actions": [
                {
                    "source": "panel-1",
                    "sourceButton": "button-1",
                    "parameters": {
                        "parameter1": "panel-1"
                    },
                    "output": "panel-2"                   
                }
            ]
        }
    ]
}`