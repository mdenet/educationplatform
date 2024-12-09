import {arrayEquals, parseConfigFile, getBaseURL} from "../../src/Utility"

describe("Utility", () => {

    it("arrayEquals - arrays with matching values are the same", () => {
    
        const A = ["A", "B", "C", "D"];
        const B = ["A", "B", "C", "D"];

        let result = arrayEquals( A, B, true );

        expect(result).toBeTrue();    
    })

    it("arrayEquals - arrays with the same values in differing order are not the same", () => {
    
        const A = ["A", "B", "C", "D"];
        const B = ["D", "C", "B", "A"];

        let result = arrayEquals( A, B, true );

        expect(result).toBeFalse();    
    })

    it("arrayEquals - arrays with an any wildcard always match the corresponding element", () => {
    
        const A = ["A", "B", "*", "D"];
        

        const testElements = ["B","C","D","E","F"];
        
        let result = true;

        for ( let element of testElements ) {
            
            const B = ["A", "B", element, "D"];
     
            result = result && arrayEquals( A, B, true );
        }

        expect(result).toBeTrue(); 
    })

    it("arrayEquals - when allow any is not enabled, arrays with any wildcard do not match the corresponding element", () => {
    
        const A = ["A", "B", "*", "D"];
        

        const testElements = ["B","C","D","E","F"];
        
        let result = true;

        for ( let element of testElements ) {
            
            const B = ["A", "B", element, "D"];
     
            result = result && arrayEquals( A, B );
        }

        expect(result).toBeFalse(); 
    })

    it("arrayEquals - arrays with a wildcard and non matchng other element are not the same", () => {
    
        const A = ["A", "*", "C", "D"];
        const B = ["A", "B", "X", "D"];

        let result = arrayEquals( A, B, true );

        expect(result).toBeFalse();    
    })


    it("parseConfigFile - a json file is parsed to an object", ()=> {
        const expectedObject =  JSON.parse(JSON_ACTIVITY_CONFIG);

        let result = parseConfigFile(JSON_ACTIVITY_CONFIG, "json");

        expect(result).toEqual(expectedObject);
    })

    it("parseConfigFile - a yaml file is parsed to an object", ()=> {
        const expectedObject =  JSON.parse(JSON_ACTIVITY_CONFIG);

        let result = parseConfigFile(YML_ACTIVITY_CONFIG, "yml");

        expect(result).toEqual(expectedObject);
    })

    it("parseConfigFile - an unknown file type returns null", ()=> {

        let result = parseConfigFile(JSON_ACTIVITY_CONFIG, "???");

        expect(result).toEqual(null);
    })

    // This is undocumented behaviour of the yaml library
    it("parseConfigFile - a json file parsed as yaml to an object", ()=> {
        const expectedObject =  JSON.parse(JSON_ACTIVITY_CONFIG);
        let result = parseConfigFile(JSON_ACTIVITY_CONFIG, "yml");

        expect(result).toEqual(expectedObject);
    })

    it("parseConfigFile - an invald yaml file returns an error", ()=> {

        let result = parseConfigFile(INVALID_FILE, "yml");

        expect(result).toBeInstanceOf(Error);
    })

    it("parseConfigFile - an invald json file returns an error", ()=> {

        let result = parseConfigFile(INVALID_FILE, "json");

        expect(result).toBeInstanceOf(Error);
    })
})

const JSON_ACTIVITY_CONFIG= "{\n"
+ "\n"
+ "    \"activities\": [\n"
+ "\n"
+ "        {\n"
+ "\n"
+ "            \"id\": \"activity-eol\",\n"
+ "\n"
+ "            \"title\": \"Query Project Plan\",\n"
+ "\n"
+ "            \"icon\": \"evl\",\n"
+ "\n"
+ "            \"tools\": [ \"http://127.0.0.1:8070/epsilon_tool.json\",\n"
+ "                       \"http://127.0.0.1:8071/emfatic_tool.json\"],\n"
+ "\n"
+ "            \"layout\": {\n"
+ "\n"
+ "                    \"area\": [\n"
+ "\n"
+ "                        [\"panel-eol\",     \"panel-model\"],\n"
+ "\n"
+ "                        [\"panel-console\", \"panel-mm\"]\n"
+ "\n"
+ "                    ]\n"
+ "\n"
+ "                },\n"
+ "\n"
+ "            \"actions\": [\n"
+ "\n"
+ "                {\n"
+ "                    \"source\": \"panel-eol\",\n"
+ "\n"
+ "                    \"sourceButton\": \"action-button\",\n"
+ "\n"
+ "                    \"parameters\": {\n"
+ "                        \"program\": \"panel-eol\",\n"
+ "                        \"flexmi\": \"panel-model\",\n"
+ "                         \"emfatic\":\"panel-mm\"\n"
+ "\n"
+ "                    },\n"
+ "\n"
+ "                    \"output\": \"panel-console\"\n"
+ "\n"
+ "                }\n"
+ "            ],\n"
+ "\n"
+ "\n"
+ "\n"
+ "            \"panels\": [\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-eol\",\n"
+ "\n"
+ "                    \"name\": \"Program (EOL)\",\n"
+ "\n"
+ "                    \"ref\": \"eol\",\n"
+ "\n"
+ "                    \"file\": \"psl.eol\"\n"
+ "\n"
+ "                },\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-model\",\n"
+ "\n"
+ "                    \"name\": \"Model\",\n"
+ "\n"
+ "                    \"ref\": \"flexmi\",\n"
+ "\n"
+ "                    \"file\": \"psl.flexmi\"\n"
+ "                             \n"
+ "                },\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-mm\",\n"
+ "\n"
+ "                    \"name\": \"Metamodel\",\n"
+ "\n"
+ "                    \"ref\": \"emfatic\",\n"
+ "\n"
+ "                    \"file\": \"psl.emf\"\n"
+ "\n"
+ "                },\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-console\",\n"
+ "\n"
+ "                    \"name\": \"Console\",\n"
+ "\n"
+ "                    \"ref\": \"console\"\n"
+ "\n"
+ "                }\n"
+ "\n"
+ "            ]\n"
+ "\n"
+ "        },\n"
+ "\n"
+ "\n"
+ "\n"
+ "        {\n"
+ "\n"
+ "            \"id\": \"evl\",\n"
+ "\n"
+ "            \"title\": \"Validate Project Plan\",\n"
+ "\n"
+ "            \"icon\": \"evl\",\n"
+ "\n"
+ "            \"tools\": [ \"http://127.0.0.1:8070/epsilon_tool.json\"],\n"
+ "\n"
+ "            \"layout\": {\n"
+ "\n"
+ "                    \"area\": [\n"
+ "                                [\"panel-evl\"    , \"panel-model\", \"panel-problems\"],\n"
+ "                                [\"panel-console\", \"panel-mm\",    \"\"]\n"
+ "                    ]\n"
+ "\n"
+ "                },\n"
+ "\n"
+ "            \"actions\": [\n"
+ "                {\n"
+ "                    \"source\": \"panel-evl\",\n"
+ "\n"
+ "                    \"sourceButton\": \"action-button\",\n"
+ "\n"
+ "                    \"parameters\": {\n"
+ "                        \"program\": \"panel-evl\",\n"
+ "                        \"flexmi\": \"panel-model\",\n"
+ "                        \"emfatic\": \"panel-mm\"\n"
+ "                    },\n"
+ "\n"
+ "                    \"output\": \"panel-problems\"\n"
+ "\n"
+ "                }\n"
+ "                ],\n"
+ "\n"
+ "            \"panels\": [\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-evl\",\n"
+ "\n"
+ "                    \"name\": \"Constraints(EVL)\",\n"
+ "\n"
+ "                    \"ref\": \"evl\",\n"
+ "\n"
+ "                    \"file\": \"psl.evl\"\n"
+ "\n"
+ "                },\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-model\",\n"
+ "\n"
+ "                    \"name\": \"Model\",\n"
+ "\n"
+ "                    \"ref\": \"flexmi\",\n"
+ "\n"
+ "                    \"file\": \"psl-evl.flexmi\"\n"
+ "\n"
+ "                },\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-mm\",\n"
+ "\n"
+ "                    \"name\": \"Metamodel\",\n"
+ "\n"
+ "                    \"ref\": \"emfatic\",\n"
+ "\n"
+ "                    \"file\": \"psl.emf\"\n"
+ "\n"
+ "                },\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-console\",\n"
+ "\n"
+ "                    \"name\": \"Console\",\n"
+ "\n"
+ "                    \"ref\": \"console\"\n"
+ "\n"
+ "                },\n"
+ "\n"
+ "                {\n"
+ "\n"
+ "                    \"id\": \"panel-problems\",\n"
+ "\n"
+ "                    \"name\": \"Problems\",\n"
+ "\n"
+ "                    \"ref\": \"problem\"\n"
+ "\n"
+ "                }\n"
+ "\n"
+ "            ]\n"
+ "\n"
+ "        },\n"
+ "\n"
+ "\n"
+ "\n"
+ "    {\n"
+ "\n"
+ "        \"id\": \"etl\",\n"
+ "\n"
+ "        \"title\": \"Transform to Deliverables\",\n"
+ "\n"
+ "        \"icon\": \"etl\",\n"
+ "\n"
+ "        \"tools\": [ \"http://127.0.0.1:8070/epsilon_tool.json\"],\n"
+ "\n"
+ "        \"layout\": {\n"
+ "\n"
+ "                \"area\": [\n"
+ "                            [\"panel-etl\",   \"panel-smodel\", \"panel-tmodel\"],\n"
+ "                            [\"panel-console\", \"panel-smm\",  \"panel-tmm\"]\n"
+ "                        ]\n"
+ "\n"
+ "            },\n"
+ "\n"
+ "        \"actions\": [\n"
+ "            {\n"
+ "                \"source\": \"panel-etl\",\n"
+ "\n"
+ "                \"sourceButton\": \"action-button\",\n"
+ "\n"
+ "                \"parameters\": {\n"
+ "                    \"program\": \"panel-etl\",\n"
+ "                    \"flexmi\": \"panel-smodel\",\n"
+ "                    \"emfatic\": \"panel-smm\",\n"
+ "                    \"secondEmfatic\": \"panel-tmm\"\n"
+ "                },\n"
+ "\n"
+ "                \"output\": \"panel-tmodel\"\n"
+ "\n"
+ "            }\n"
+ "            ],\n"
+ "\n"
+ "        \"panels\": [\n"
+ "\n"
+ "            {\n"
+ "\n"
+ "                \"id\": \"panel-etl\",\n"
+ "\n"
+ "                \"name\": \"Transformation(ETL)\",\n"
+ "\n"
+ "                \"ref\": \"etl\",\n"
+ "\n"
+ "                \"file\": \"psl2pdl.etl\"\n"
+ "\n"
+ "            },\n"
+ "\n"
+ "            {\n"
+ "\n"
+ "                \"id\": \"panel-smodel\",\n"
+ "\n"
+ "                \"name\": \"Source Model\",\n"
+ "\n"
+ "                \"ref\": \"flexmi\",\n"
+ "\n"
+ "                \"file\": \"psl2pdl.flexmi\"\n"
+ "\n"
+ "            },\n"
+ "\n"
+ "            {\n"
+ "\n"
+ "                \"id\": \"panel-smm\",\n"
+ "\n"
+ "                \"name\": \"Source Metamodel\",\n"
+ "\n"
+ "                \"ref\": \"emfatic\",\n"
+ "\n"
+ "                \"file\": \"psl.emf\"\n"
+ "\n"
+ "            },\n"
+ "\n"
+ "            {\n"
+ "\n"
+ "                \"id\": \"panel-tmm\",\n"
+ "\n"
+ "                \"name\": \"Target Metamodel\",\n"
+ "\n"
+ "                \"ref\": \"emfatic\",\n"
+ "\n"
+ "                \"file\": \"pdl.emf\"\n"
+ "\n"
+ "            },\n"
+ "\n"
+ "            {\n"
+ "\n"
+ "                \"id\": \"panel-tmodel\",\n"
+ "\n"
+ "                \"name\": \"Target Model\",\n"
+ "\n"
+ "                \"ref\": \"emfgraph\"\n"
+ "\n"
+ "            },\n"
+ "\n"
+ "            {\n"
+ "\n"
+ "                \"id\": \"panel-console\",\n"
+ "\n"
+ "                \"name\": \"Console\",\n"
+ "\n"
+ "                \"ref\": \"console\"\n"
+ "\n"
+ "            }\n"
+ "\n"
+ "        ]\n"
+ "\n"
+ "    }\n"
+ "] } ";


const YML_ACTIVITY_CONFIG= "activities:\n"
+ "- actions:\n"
+ "  - output: panel-console\n"
+ "    parameters:\n"
+ "      emfatic: panel-mm\n"
+ "      flexmi: panel-model\n"
+ "      program: panel-eol\n"
+ "    source: panel-eol\n"
+ "    sourceButton: action-button\n"
+ "  icon: evl\n"
+ "  id: activity-eol\n"
+ "  layout:\n"
+ "    area:\n"
+ "    - - panel-eol\n"
+ "      - panel-model\n"
+ "    - - panel-console\n"
+ "      - panel-mm\n"
+ "  panels:\n"
+ "  - file: psl.eol\n"
+ "    id: panel-eol\n"
+ "    name: Program (EOL)\n"
+ "    ref: eol\n"
+ "  - file: psl.flexmi\n"
+ "    id: panel-model\n"
+ "    name: Model\n"
+ "    ref: flexmi\n"
+ "  - file: psl.emf\n"
+ "    id: panel-mm\n"
+ "    name: Metamodel\n"
+ "    ref: emfatic\n"
+ "  - id: panel-console\n"
+ "    name: Console\n"
+ "    ref: console\n"
+ "  title: Query Project Plan\n"
+ "  tools:\n"
+ "  - http://127.0.0.1:8070/epsilon_tool.json\n"
+ "  - http://127.0.0.1:8071/emfatic_tool.json\n"
+ "- actions:\n"
+ "  - output: panel-problems\n"
+ "    parameters:\n"
+ "      emfatic: panel-mm\n"
+ "      flexmi: panel-model\n"
+ "      program: panel-evl\n"
+ "    source: panel-evl\n"
+ "    sourceButton: action-button\n"
+ "  icon: evl\n"
+ "  id: evl\n"
+ "  layout:\n"
+ "    area:\n"
+ "    - - panel-evl\n"
+ "      - panel-model\n"
+ "      - panel-problems\n"
+ "    - - panel-console\n"
+ "      - panel-mm\n"
+ "      - ''\n"
+ "  panels:\n"
+ "  - file: psl.evl\n"
+ "    id: panel-evl\n"
+ "    name: Constraints(EVL)\n"
+ "    ref: evl\n"
+ "  - file: psl-evl.flexmi\n"
+ "    id: panel-model\n"
+ "    name: Model\n"
+ "    ref: flexmi\n"
+ "  - file: psl.emf\n"
+ "    id: panel-mm\n"
+ "    name: Metamodel\n"
+ "    ref: emfatic\n"
+ "  - id: panel-console\n"
+ "    name: Console\n"
+ "    ref: console\n"
+ "  - id: panel-problems\n"
+ "    name: Problems\n"
+ "    ref: problem\n"
+ "  title: Validate Project Plan\n"
+ "  tools:\n"
+ "  - http://127.0.0.1:8070/epsilon_tool.json\n"
+ "- actions:\n"
+ "  - output: panel-tmodel\n"
+ "    parameters:\n"
+ "      emfatic: panel-smm\n"
+ "      flexmi: panel-smodel\n"
+ "      program: panel-etl\n"
+ "      secondEmfatic: panel-tmm\n"
+ "    source: panel-etl\n"
+ "    sourceButton: action-button\n"
+ "  icon: etl\n"
+ "  id: etl\n"
+ "  layout:\n"
+ "    area:\n"
+ "    - - panel-etl\n"
+ "      - panel-smodel\n"
+ "      - panel-tmodel\n"
+ "    - - panel-console\n"
+ "      - panel-smm\n"
+ "      - panel-tmm\n"
+ "  panels:\n"
+ "  - file: psl2pdl.etl\n"
+ "    id: panel-etl\n"
+ "    name: Transformation(ETL)\n"
+ "    ref: etl\n"
+ "  - file: psl2pdl.flexmi\n"
+ "    id: panel-smodel\n"
+ "    name: Source Model\n"
+ "    ref: flexmi\n"
+ "  - file: psl.emf\n"
+ "    id: panel-smm\n"
+ "    name: Source Metamodel\n"
+ "    ref: emfatic\n"
+ "  - file: pdl.emf\n"
+ "    id: panel-tmm\n"
+ "    name: Target Metamodel\n"
+ "    ref: emfatic\n"
+ "  - id: panel-tmodel\n"
+ "    name: Target Model\n"
+ "    ref: emfgraph\n"
+ "  - id: panel-console\n"
+ "    name: Console\n"
+ "    ref: console\n"
+ "  title: Transform to Deliverables\n"
+ "  tools:\n"
+ "  - http://127.0.0.1:8070/epsilon_tool.json\n"
+ "";

const INVALID_FILE = "{ \n"
+ "----------------- \n"
+ "]";
