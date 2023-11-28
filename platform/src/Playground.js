import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-min-noconflict/theme-eclipse';
import 'ace-builds/src-min-noconflict/mode-xml';
import 'ace-builds/src-min-noconflict/mode-yaml';
import 'ace-builds/src-min-noconflict/mode-java';
import 'ace-builds/src-min-noconflict/mode-html';
import 'ace-builds/src-min-noconflict/ext-modelist';
import 'ace-builds/src-min-noconflict/ext-language_tools';

import 'metro4';

import { FileHandler } from './FileHandler.js';
import { ActivityManager } from './ActivityManager.js';
import { ToolManager as ToolsManager } from './ToolsManager.js';
import { EducationPlatformError } from './EducationPlatformError.js'
import { ConfigValidationError } from './ConfigValidationError.js';
import { ActivityValidator } from './ActivityValidator.js';

import { ConsolePanel } from "./ConsolePanel.js";
import { ProgramPanel } from "./ProgramPanel.js";
import { OutputPanel } from "./OutputPanel.js";
import { TestPanel } from './TestPanel.js';
import { BlankPanel } from './BlankPanel .js';
import { XtextEditorPanel } from './XtextEditorPanel.js';
import { Button } from './Button.js';

import { Preloader } from './Preloader.js';
import { Backend } from './Backend.js';
import { Layout } from './Layout.js';
import { PlaygroundUtility } from './PlaygroundUtility.js';
import { jsonRequest, jsonRequestConversion, ARRAY_ANY_ELEMENT, urlParamPrivateRepo } from './Utility.js';
import { ActionFunction } from './ActionFunction.js';

const TOKEN_HANDLER_URL = TOKEN_SERVER_URL || "http://127.0.0.1:10000";
const COMMON_UTILITY_URL = window.location.href.replace(window.location.search,"") + "common/utility.json";

var outputType = "text";
var outputLanguage = "text";
var activity;
var url = window.location + "";
var questionMark = url.indexOf("?");

var preloader = new Preloader();
export var backend = new Backend();

var panels = [];
var buttonActionFunctions = [];

export var fileHandler = new FileHandler(TOKEN_HANDLER_URL);
export var activityManager;
export var toolsManager;

var urlParameters = new URLSearchParams(window.location.search);    



document.getElementById("btnnologin").onclick= () => {
    PlaygroundUtility.hideLogin();
}


if (!urlParamPrivateRepo()){
    // Public repo so no need to authenticate
    initialiseActivity();
    
} else {
    PlaygroundUtility.showLogin();
}

document.getElementById("btnlogin").onclick= async () => {

    // Get github url
    const urlRequest = { url: window.location.href };
    let authServerDetails= await jsonRequest(TOKEN_HANDLER_URL + "/mdenet-auth/login/url",
                                               JSON.stringify(urlRequest) );

    

    authServerDetails = JSON.parse(authServerDetails);

    // Authenticate redirect 
    window.location.href = authServerDetails.url;
}

if (urlParameters.has("code") && urlParameters.has("state")  ){
    // Returning from authentication redirect
    PlaygroundUtility.hideLogin();

    //Complete authentication
    const tokenRequest = {};
    tokenRequest.state = urlParameters.get("state");
    tokenRequest.code = urlParameters.get("code");

    //TODO loading box
    let authDetails=  jsonRequest(TOKEN_HANDLER_URL + "/mdenet-auth/login/token",
                                               JSON.stringify(tokenRequest), true );
    authDetails.then( (details) => {
        console.log("AUTHENTICATED: " + details.toString());
        
        window.sessionStorage.setItem("isAuthenticated", true);

        initialiseActivity();
    } );
}

// Clean authentication parameters from url
urlParameters.delete("code");
urlParameters.delete("state");


// Encode ':' and '/' with toString
// Skips the default encoding to so that the URL can be reused
let params = [];
for (const [key, value] of urlParameters) {
  // For a specific key ('activities' in this case), you add it to the array without encoding
  if (key === 'activities') {
    params.push(`${key}=${value}`);
  } else {
    // For all other parameters, you still want to encode them
    params.push(`${key}=${encodeURIComponent(value)}`);
  }
}
// Now join all the parameters with '&' to form the query string
let queryString = params.join('&');

// Use replaceState to update the URL without encoding the parameter
window.history.replaceState({}, document.title, "?" + queryString);


function initialiseActivity(){

    let errors = [];

    if (!urlParameters.has("activities")) {
        // No activity configuration has been given
        errors.push(new EducationPlatformError("No activity configuration has been specified."));
    }

    if (errors.length==0){
        // An activity configuration has been provided
        toolsManager = new ToolsManager();
        activityManager = new ActivityManager( (toolsManager.getPanelDefinition).bind(toolsManager), fileHandler );
        errors = errors.concat(activityManager.getConfigErrors());
    } 

    if (errors.length==0){
        // The activities have been validated
        toolsManager.setToolsUrls( activityManager.getToolUrls().add(COMMON_UTILITY_URL) );
        errors = errors.concat(toolsManager.getConfigErrors());
    }

    if (errors.length==0){
        // The tools have been validated 
        activityManager.showActivitiesNavEntries();

        // Import tool grammar highlighting 
        const  toolImports = toolsManager.getToolsGrammarImports(); 

        for(let ipt of toolImports) {
            ace.config.setModuleUrl(ipt.module, ipt.url);
        }

        // Add Tool styles for icons 
        for (let toolUrl of activityManager.getToolUrls()){
            let toolBaseUrl = toolUrl.substring(0, toolUrl.lastIndexOf("/"));
            var link = document.createElement("link");
            link.setAttribute("rel", 'stylesheet');
            link.setAttribute("href", toolBaseUrl + "/icons.css");
            document.head.appendChild(link);
        }
        
        activity = activityManager.getSelectedActivity(); 

        // Validate the resolved activity
        errors = errors.concat( ActivityValidator.validate(activity, toolsManager.tools) );   
    }

    if  (errors.length==0){
        // The resolved activity has been validated
        initialisePanels();
    }

    if (errors.length > 0) {
        displayErrors(errors);
    }
}

function displayErrors(errors){

        let errorText = "";


        const contentPanelName = "content-panel";
     
        panels.push(new BlankPanel(contentPanelName));
        panels[0].setVisible(true);
    
        new Layout().createFromPanels("navview-content", panels);
    
        PlaygroundUtility.showMenu();
    
        Metro.init();
        fit();
    
        var contentPanelDiv = document.getElementById(contentPanelName);

        // EP Errors
        const platformErrors= errors.filter((e)=> e.constructor.name === EducationPlatformError.name);

        if (platformErrors.length > 0){
            let contentTitle = document.createElement("h2");
            contentTitle.innerText = "Education Platform Errors:";
            contentPanelDiv.append(contentTitle);

            platformErrors.forEach( (err) => {
                let content = document.createElement("p");
                content.append(document.createTextNode(err.message));

                contentPanelDiv.append(content);
            });

            contentPanelDiv.append(document.createElement("p"));
        }

        // Config File Errors
        const configErrors= errors.filter((e)=> e.constructor.name === ConfigValidationError.name);

        if(configErrors.length > 0){
            let contentTitle = document.createElement("h2");
            contentTitle.innerText = "Config File Errors:";
            contentPanelDiv.append(contentTitle);

            let contentLabels = document.createElement("b");
            contentLabels.innerText = "File | Category | Details | Location";
            contentPanelDiv.append(contentLabels);

            configErrors.forEach( (err) => {
                let content = document.createElement("p");
                let contentText= `${err.fileType} | ${err.category} | ${err.message} | ${err.location}` ;
                content.append(document.createTextNode(contentText));

                contentPanelDiv.append(content);
            });
        }
}

function initialisePanels() {
    
    if (activity.outputLanguage != null) {
        outputLanguage = activity.outputLanguage;
    }
    
    // Create panels for the given activites
    for ( let apanel of activity.panels ){

        var newPanel = createPanelForDefinitionId(apanel);
        if (newPanel != null){
            panels.push(newPanel);
        }
    }    


    new Layout().createFrom2dArray("navview-content", panels, activity.layout.area);


    PlaygroundUtility.showMenu();
    
    document.addEventListener('click', function(evt) {
        if (evt.target == document.getElementById("toggleNavViewPane")) {
            setTimeout(function(){ fit(); }, 1000);
        }
    });

    $(window).keydown(function(event) {
      if ((event.metaKey && event.keyCode == 83) || (event.ctrlKey && event.keyCode == 83)) { 
        runProgram();
        event.preventDefault(); 
      }
    });

    Metro.init();

    activityManager.openActiveActivitiesSubMenu();
    
    fit();
}


/**
 * Create a panel for a given panel config entry
 * 
 * @param {Object} panel - The activity config panel definition.
 * @return {Panel} the platform Panel
 */
function createPanelForDefinitionId(panel){
    const panelDefinition = panel.ref;
    var newPanel = null;
    var buttons;

    const newPanelId= panel.id;

    if (panelDefinition != null){

        switch(panelDefinition.panelclass) {
            case "ProgramPanel":
                newPanel =  new ProgramPanel(newPanelId);
                
                // Set from the tool panel definition  
                newPanel.setEditorMode(panelDefinition.language);

                newPanel.setType(panelDefinition.language);

                // Set from the activity 
                newPanel.setValue(panel.file);
                newPanel.setValueSha(panel.sha); 
                newPanel.setFileUrl(panel.url)
            break;
        
            case "ConsolePanel":
                newPanel =  new ConsolePanel(newPanelId);
            break;

            case "OutputPanel":
                newPanel =  new OutputPanel(newPanelId, panelDefinition.language, outputType, outputLanguage);
                
                newPanel.hideEditor();
                newPanel.showDiagram();
            break;

            case "XtextEditorPanel":

                let editorUrl = sessionStorage.getItem(newPanelId);
                
                newPanel = new XtextEditorPanel(newPanelId, editorUrl, panel.extension);

                newPanel.setType(panelDefinition.language);

            break;

            // TODO create other panel types e.g. models and metamodels so the text is formatted correctly
            default:
            newPanel = new TestPanel(newPanelId);                
        }
    
        // Add elements common to all panels
        newPanel.setTitle(panel.name);

        if(panel.icon != null){
            newPanel.setIcon(panel.icon);
        } else {
            newPanel.setIcon(panelDefinition.icon);
        }
        
        if (panel.buttons == null && panelDefinition.buttons != null){
            // No activity defined buttons
            newPanel.addButtons( Button.createButtons( panelDefinition.buttons, panel.id));

        } else if (panel.buttons != null && panelDefinition.buttons != null) {
            // The activity has defined the buttons
            let resolvedButtonConfigs = panel.buttons.map(btn =>{    
                let resolvedButton;

                if (btn.ref){
                    // button reference so resolve
                    resolvedButton= panelDefinition.buttons.find((pdBtn)=> pdBtn.id===btn.ref);
                } else {
                    // activity defined button
                    resolvedButton= btn;
                }
                return resolvedButton;
            });
            panel.buttons = resolvedButtonConfigs;
            newPanel.addButtons( Button.createButtons( resolvedButtonConfigs, panel.id));
        }
    }
    return newPanel;
}


function copyToClipboard(str) {
    var el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function getPanelTitle(panelId) {
    return $("#" + panelId)[0].dataset.titleCaption;
}

/**
 * Invokes an action function by placing requests to all the required external tool functions  
 * 
 *  TODO: To be moved to the ToolManager issue #40
 * 
 * @param {string} functionId the id of tool function
 * @param {Map} parameterMap map from parameter name to its value and type
 * @returns {Promise}  promise to result of the action function 
 */
function invokeActionFunction(functionId, parameterMap){

    let actionFunction = toolsManager.functionRegistry_resolve(functionId);

    let parameterPromises = [];

    for ( const paramName  of parameterMap.keys() ){ /* TODO add defensive checks that every required value
                                                             is provided issue #57 */

        let actionFunctionParam = actionFunction.getParameters().find( p => p.name === paramName);                                                             
                                                                    
        /* Check the given parameter types against the those of the requested action function. 
           If required, request conversion from available tool functions */
           let givenParameter = parameterMap.get(paramName);

        if (givenParameter.type != actionFunctionParam.type){
            //Types don't match  so try  and convert 
            let convertedValue;

            const metamodelId = actionFunction.getInstanceOfParamName(paramName);
            
            if(metamodelId==null){
                // Convert with no metamodel to consider
                convertedValue = convert( givenParameter.val, givenParameter.type, 
                                          actionFunctionParam.type, paramName ); // TODO issue #58 remove paramName

            } else {
                // Convert considering metamodel
                const givenMetamodel = parameterMap.get(metamodelId);

                convertedValue = convertIncludingMetamodel( givenParameter.value , givenParameter.type, 
                                                            givenMetamodel.value, givenMetamodel.type, 
                                                            actionFunctionParam.type, paramName ); // TODO issue #58 remove paramName
            }

            parameterPromises.push(convertedValue);
        
        } else {
            // Matching types add values to promise for synchronisation 
            let value =  new Promise( function (resolve, reject) { 
                let parameterData = {};
                
                parameterData.name = paramName;
                parameterData.data = givenParameter.value;
    
                resolve(parameterData); 
            });

            parameterPromises.push(value);
        }
    }

    // Invoke the actionFunction on compeletion of any conversions
    let actionFunctionPromise = new Promise(function (resolve, reject) {

        Promise.all( parameterPromises ).then( (values) => { 
            let actionRequestData = {};

            //Populate the transformed parameters
            for ( const param  of actionFunction.getParameters() ){

                const panelConfig = parameterMap.get(param.name); 

                if (panelConfig == undefined){
                    // Set unused parameters in the request to undefined as the epsilon backend function expects them all. 
                    actionRequestData[param.name] = "undefined";

                } else {
                    let parameterData = values.find(val => (val.name === param.name) );

                    actionRequestData[param.name] =  parameterData.data;
                }
            }

            let resultPromise = functionRegistry_call(functionId, actionRequestData);

            resolve(resultPromise);
        
        }).catch( (err) => {

            reject(err);
        });

    });

    return actionFunctionPromise;
}



/**
 * Converts a source value to a target type using the available conversion functions
 * 
 *   TODO: To be moved to the ToolManager issue #40
 * 
 * @param {string} sourceValue 
 * @param {string} sourceType 
 * @param {string} targetType
 * @param {string} parameterName name of the parameter for request
 * @returns {Promise} promise for the converted paramter value
 */
function convert(sourceValue, sourceType, targetType, parameterName){
    
    let parameterPromise;
    let typesPanelValuesMap = {}; // Types have to be distinct for mapping to the conversion function's paramters
    typesPanelValuesMap[sourceType]=  sourceValue;

    let conversionFunctionId = functionRegistry_find( Object.keys(typesPanelValuesMap), targetType );

    if (conversionFunctionId != null){
        //There is a matching conversion function
        parameterPromise = functionRegistry_callConversion(conversionFunctionId, typesPanelValuesMap, parameterName);
        
    } else {
        parameterPromise = null;
        errorNotification("No conversion function available for input types:" + Object.keys(typesPanelValuesMap).toString() )
    }

    return parameterPromise;
}


/**
 * Converts a source value to a target type using the available conversion functions taking
 * into consideration the related metamodel.
 * 
 *   TODO: To be moved to the ToolManager issue #40
 * 
 * @param {string} sourceValue 
 * @param {string} sourceType
 * @param {string} metamodelValue 
 * @param {string} metamodelType
 * @param {string} targetType
 * @param {string} parameterName name of the parameter for request
 * @returns {Promise} promise for the converted paramter value
 */
async function convertIncludingMetamodel(sourceValue, sourceType, metamodelValue, metamodelType, targetType, parameterName){
    let parameterPromise;
    let typesPanelValuesMap = {}; // Types have to be distinct for mapping to the conversion function's paramters
    typesPanelValuesMap[sourceType]=  sourceValue;

    let conversionFunctionId;

    let potentialConversionFunctions = functionRegistry_findPartial( [sourceType, ARRAY_ANY_ELEMENT], targetType);

    //check for a conversion function with the metamodel type
    conversionFunctionId = await selectConversionFunctionConvertMetamodel( metamodelType, metamodelValue, potentialConversionFunctions, 
                                                                             false, parameterName, typesPanelValuesMap)

    if (conversionFunctionId==null){
        //no conversion found so check for a conversion function but consider conversions of the metamodel
        conversionFunctionId = await selectConversionFunctionConvertMetamodel(metamodelType, metamodelValue, potentialConversionFunctions, 
                                                                                true, parameterName, typesPanelValuesMap);
    }

    if (conversionFunctionId != null){
        //There is a matching conversion function
        parameterPromise = functionRegistry_callConversion(conversionFunctionId, typesPanelValuesMap, parameterName);
        
    } else {
        parameterPromise = null;
        errorNotification("No conversion function available for input types:" + Object.keys(typesPanelValuesMap).toString() )
    }

    return parameterPromise;
}


/**
 * For the given list of conversion function ids to check, finds the first conversion function with matching metamodel dependency.
 * Optionally conversions of the metamodel are considered from the conversion functions available to the tools manager and
 * the metamodel type. If available, the metamodel value is converted to the required type. 
 * 
 * @param {string} metamodelType the metamodel type
 * @param {string} metamodelValue the metamodel value
 * @param {string[]} conversionFunctions list of conversion function ids to check 
 * @param {boolean} convertMetamodel when true try to convert the metamodel using a remote tool service conversion function
 *                                    available to the ToolsManager.
 * @param {string} parameterName the name of the parameter to use when convering the metamodel. 
 * @param {string[]} typeValueMap the type values map the metamodel input value is added to if a conversion function is found
 * @returns {string} the id of a conversion function to use, null if none found.
 */
async function selectConversionFunctionConvertMetamodel(metamodelType, metamodelValue, conversionFunctions, convertMetamodel, parameterName, typeValueMap){
    let conversionFunctionId;
    let functionsToCheck = [...conversionFunctions]
    
    while ( conversionFunctionId==null && functionsToCheck.length > 0){
        let functionId = functionsToCheck.pop();
        let conversionFunction = toolsManager.getActionFunction(functionId);

        // Lookup the conversion function's metamodel type
        let metamodelName = conversionFunction.getInstanceOfParamName( conversionFunction.getParameters()[0].name );

        if(metamodelName==null){
            metamodelName = conversionFunction.getInstanceOfParamName( conversionFunction.getParameters()[1].name );
        }

        const targetMetamodelType = conversionFunction.getParameterType(metamodelName);

        if (!convertMetamodel){
            // Check for conversion functions with matching metamodels only
            
            if (targetMetamodelType==metamodelType) {
                    //Conversion function found so use the panel value
                    
                    conversionFunctionId = functionId;
                    typeValueMap[metamodelType]=  metamodelValue;
            }

        } else {
            // Check for conversion functions converting metamodel if possible 
            let metamodelConversionFunctionId = toolsManager.getConversionFunction( [metamodelType], targetMetamodelType );
            
            if (metamodelConversionFunctionId != null){

                conversionFunctionId = functionId;

                //convert metamodel
                let metamodelTypeValueMap =  {};  
                metamodelTypeValueMap[metamodelType]=metamodelValue; // The found conversion function is expected to have one parameter

                let convertedValue = await functionRegistry_callConversion(metamodelConversionFunctionId, metamodelTypeValueMap, parameterName);

                typeValueMap[targetMetamodelType]= convertedValue.data;
            }
        }
    }

    return conversionFunctionId;
}

/**
 * Prepares the input parameters and requests the type translation for the given function id  
 * 
 *   TODO: To be moved to the FunctionRegistry issue #40
 * 
 * @param {string} functionId the id of the action function
 * @param {Object} typeValuesMap an object mapping action functions paramter types as keys to input values
 * @param {string} parameterName name of the parameter
 * @returns Promise for the translated data
 * 
 */
function functionRegistry_callConversion( functionId, typeValuesMap, parameterName ){
    let conversionRequestData = {};
    let conversionFunction = toolsManager.getActionFunction(functionId);

    // Populate parameters for the conversion request 
    for( const param of conversionFunction.getParameters() ){
        conversionRequestData[param.name] =  typeValuesMap[param.type];
    }

    return requestTranslation(conversionRequestData, conversionFunction, parameterName);
}

/**
 * 
 * @param {string} functionId url of the function to call
 * @param {Object} parameters object containing the parameters request data
 * @returns 
 */
function functionRegistry_call(functionId, parameters ){

    let actionFunction = toolsManager.getActionFunction(functionId);
    let parametersJson = JSON.stringify(parameters);

    let requestPromise = jsonRequest(actionFunction.getPath(), parametersJson)

    return requestPromise;
}


/**
 * Requests the conversion function from the remote tool service
 * 
 * @param {Object} parameters 
 * @param {ActionFunction} converstionFunction
 * @param {String} parameterName name of the parameter
 * @returns Promise for the translated data
 */
function requestTranslation(parameters, conversionFunction, parameterName){
    
    let parametersJson = JSON.stringify(parameters);

    return jsonRequestConversion(conversionFunction.getPath(), parametersJson, parameterName);
}

/**
 *   TODO: Temporary wrapper called function to be renamed and to be moved to the FunctionRegistry issue #40 
 */
function functionRegistry_find(inputsParamTypes, outputParamType){
    return toolsManager.getConversionFunction( inputsParamTypes, outputParamType );
}

/**
 *   TODO: Temporary wrapper called function to be renamed and to be moved to the FunctionRegistry issue #40 
 */
function functionRegistry_findPartial(inputsParamTypes, outputParamType){
    return toolsManager.getPartiallyMatchingConversionFunctions( inputsParamTypes, outputParamType );
}



/**
 * Handle the response from the remote tool service
 * 
 * @param {Object} action 
 * @param {Promise} requestPromise
 */
function handleResponseActionFunction(action, requestPromise){
    
    requestPromise.then( (responseText) => {

        var response = JSON.parse(responseText);
        var outputPanel = panels.find( pn => pn.id ==  action.output.id);
        
        var outputConsole;
        if (action.outputConsole != null){
            outputConsole = panels.find(pn => pn.id == action.outputConsole.id);
        } else {
            outputConsole = outputPanel;
        }

        Metro.notify.killAll();

        if (response.hasOwnProperty("error")) {
            outputConsole.setError(response.error);
        } else {

            var responseDiagram = Object.keys(response).find( key => key.toLowerCase().includes("diagram") );

            if (response.output != "") {
                // Text
                outputConsole.setValue(response.output)  
            }
            
            if (response.editorUrl) {
                // Language workbench
                longNotification("Building editor");
                checkEditorReady( response.editorStatusUrl, response.editorUrl, action.source.editorPanel, action.source.editorActivity, outputConsole);
                

            } else if (responseDiagram != undefined) {
                // Diagrams 
                outputPanel.hideEditor(); // TODO Showing diagram before and after renderDiagrams makes outputs image show in panel otherwise nothing. 
                outputPanel.showDiagram();
                
                outputPanel.renderDiagram( response[responseDiagram] );
                
                outputPanel.showDiagram();
                
            } else if (response.generatedFiles) {
                // Multiple text files
                outputPanel.setGeneratedFiles(response.generatedFiles);

            } else if (response.generatedText) {
                // Generated file

                switch (action.outputType){
                    case "code":
                        // Text
                        outputPanel.getEditor().setValue(response.generatedText.trim(), 1);
                        break;

                    case "html":
                        // Html
                        outputPanel.setOutput(response.output);
                        var iframe = document.getElementById("htmlIframe");
                        if (iframe == null) {
                            iframe = document.createElement("iframe");
                            iframe.id = "htmlIframe"
                            iframe.style.height = "100%";
                            iframe.style.width = "100%";
                            document.getElementById(outputPanel.getId() + "Diagram").appendChild(iframe);
                        }
                        
                        iframe.srcdoc = response.generatedText;
                        break; 

                    case "puml": 
                    case "dot":
                        // UML or Graph
                        var krokiEndpoint = "";
                        if (action.outputType == "puml") krokiEndpoint = "plantuml";
                        else krokiEndpoint = "graphviz/svg"

                        var krokiXhr = new XMLHttpRequest();
                        krokiXhr.open("POST", "https://kroki.io/" + krokiEndpoint, true);
                        krokiXhr.setRequestHeader("Accept", "image/svg+xml");
                        krokiXhr.setRequestHeader("Content-Type", "text/plain");
                        krokiXhr.onreadystatechange = function () {
                            if (krokiXhr.readyState === 4) {
                                if (krokiXhr.status === 200) {
                                    outputPanel.hideEditor(); // TODO Showing diagram before and after renderDiagrams makes outputs image show in panel otherwise nothing. 
                                    outputPanel.showDiagram();

                                    outputPanel.renderDiagram(krokiXhr.responseText);

                                    outputPanel.showDiagram();
                                }
                            }
                        };
                        krokiXhr.send(response.generatedText);
                        break;

                        default:
                            console.log("Unknown output type: " + cation.outputType);
                }
            }

        }
    });

}


function fit() {
    
    var splitter = document.getElementById("splitter");
    splitter.style.minHeight = window.innerHeight + "px";
    splitter.style.maxHeight = window.innerHeight + "px";

    panels.forEach(panel => panel.fit());
    preloader.hide();
}


function runAction(source, sourceButton) {

    // Get the action
    var action = activityManager.getActionForCurrentActivity(source, sourceButton);
    
    let buttonConfig;
    if(action.source.buttons){
        //Buttons defined by activity
        buttonConfig=  action.source.buttons.find( btn => btn.id == sourceButton );
    } else {
        //Buttons defined by tool
        buttonConfig= action.source.ref.buttons.find( btn => btn.id == sourceButton );
    }  
    const toolActionFunction = toolsManager.getActionFunction( buttonConfig.actionfunction ); // TODO tidy up by resolving tool references

    // Create map containing panel values
    let parameterMap = new Map();

    for (let paramName of Object.keys(action.parameters)){

        let param = {};
        const panelId = action.parameters[paramName].id;
        
        if (panelId) { 
            const panel = panels.find( pn => pn.id ==  panelId );
            param.type = panel.getType();
            param.value = panel.getValue();

        } else {
            // No panel with ID so it use as the parameter value
            const parameterValue = action.parameters[paramName];
            console.log(`The panel ID starting with ${parameterValue.substring(0,10)}... not found. Using it as a the parameter value for ${paramName}.`);
            param.type = 'text';
            param.value = parameterValue;
        }

        parameterMap.set(paramName, param);
    }

    // Add the platform language parameter
    let languageParam = {};
    languageParam.type = toolActionFunction.getParameterType("language");
    languageParam.value = action.source.ref.language; // Source panel language
    parameterMap.set("language", languageParam);

        // TODO support output and language 
        //actionRequestData.outputType = outputType;
        //actionRequestData.outputLanguage = outputLanguage;

    // Call backend conversion and service functions
    let actionResultPromise = invokeActionFunction(buttonConfig.actionfunction, parameterMap)

    actionResultPromise.catch( (err) => {
         errorNotification("There was an error translating action function parameter types.");
    } );

    handleResponseActionFunction(action , actionResultPromise);
 
    longNotification("Executing program");
}

function notification(title, message, cls="light"){
    const crossIcon = "<div class=\"default-icon-cross\" style=\"float:right\"></div>"
    Metro.notify.create(crossIcon + "<b>"  + title + "</b>" + "<br>" + message + "<br>", null, {keepOpen: true, cls: cls, width: 300});
}

function longNotification(title, cls="light") {
    notification(title + "...", "This may take a few seconds to complete if the back end is not warmed up.", cls);
}

function successNotification(message, cls="light") {
    notification("Success:", message, cls);
}

function errorNotification(message) {
    console.log("ERROR: " + message);
    notification("Error:", message, "bg-red fg-white");
}


function toggle(elementId, onEmpty) {
    var element = document.getElementById(elementId);
    if (element == null) return;

    if (getComputedStyle(element).display == "none") {
        element.style.display = "flex";
        if (element.innerHTML.length == 0) {
            onEmpty();
        }
    }
    else {
        element.style.display = "none";
    }
    updateGutterVisibility();
}


function updateGutterVisibility() {
    for (const gutter of Array.prototype.slice.call(document.getElementsByClassName("gutter"))) {

        var visibleSiblings = Array.prototype.slice.call(gutter.parentNode.children).filter(
            child => child != gutter && getComputedStyle(child).display != "none");
        
        if (visibleSiblings.length > 1) {
            var nextVisibleSibling = getNextVisibleSibling(gutter);
            var previousVisibleSibling = getPreviousVisibleSibling(gutter);
            if (nextVisibleSibling != null && nextVisibleSibling.className != "gutter" && previousVisibleSibling != null) {
                gutter.style.display = "flex";
            }
            else {
                gutter.style.display = "none";
            }
        }
        else {
            gutter.style.display = "none";
        }
    }
}

function getNextVisibleSibling(element) {
    var sibling = element.nextElementSibling;
    while (sibling != null) {
        if (getComputedStyle(sibling).display != "none") return sibling;
        sibling = sibling.nextElementSibling;
    }
}

function getPreviousVisibleSibling(element) {
    var sibling = element.previousElementSibling;
    while (sibling != null) {
        if (getComputedStyle(sibling).display != "none") return sibling;
        sibling = sibling.previousElementSibling;
    }
}

function savePanelContents(event){
    
    let editablePanels = panels.filter (p => p instanceof ProgramPanel)

    let fileStorePromises = [];

    for(const panel of editablePanels){
        
        let storePromise = fileHandler.storeFile(panel.getFileUrl(), panel.getValueSha(), panel.getValue());
        
        if (storePromise!=null) {
            
            storePromise.then( response => {
                console.log("The contents of panel '" + panel.getId() + "' were saved successfully.");
            });

            fileStorePromises.push(storePromise);
        }
    }
    
    Promise.all(fileStorePromises).then( (response) => {
        successNotification("The activity panel contents have been saved.");
    
    }).catch((error) => {
        errorNotification("An error occurred while trying to save the panel contents.");
    });
}

/**
 * Poll for editor to become available. 
 * @param {String} statusUrl - the url for cheking the status of the editor panel.
 * @param {String} editorInstanceUrl - the editor instance's url. 
 * @param {String} editorPanelId - the id of the editor panel.
 * @param {String} editorActivityId - TODO remove as this can be found using editorPanelId to save having to specify in config.
 * @param {Panel} logPanel - the panel to log progress to.
 */
async function checkEditorReady(statusUrl, editorInstanceUrl, editorPanelId, editorActivityId, logPanel){

   let response  = await fetch(statusUrl);

   if (response.status == 200){ 
        const result = await response.json();

        if (result.output){
            logPanel.setValue(result.output);
        }
        
        if (result.error){
            // Unsuccessful
            console.log("Editor failed start.");

        } else if (!result.editorReady){
            await new Promise(resolve => setTimeout(resolve, 2000));
            await checkEditorReady(statusUrl, editorInstanceUrl, editorPanelId, editorActivityId, logPanel);

        } else {
            // Successful 
            console.log("Editor ready.");
            sessionStorage.setItem( editorPanelId , editorInstanceUrl );
            activityManager.setActivityVisibility(editorActivityId, true);
            Metro.notify.killAll();
            successNotification("Building complete.");
        }

   } else {
        console.log("ERROR: The editor response could not be checked: " + statusUrl);
        errorNotification("Failed to start the editor.");
   }
}

    // Some functions and variables are accessed  
    // by onclick - or similer - events
    // We need to use window.x = x for this to work
    window.fit = fit;
    window.updateGutterVisibility = updateGutterVisibility;
    window.runAction = runAction;
    window.panels = panels;
    window.savePanelContents = savePanelContents;
    window.backend = backend;
    window.toggle = toggle;
    //window.renderDiagram = renderDiagram;
    window.longNotification = longNotification;
    window.getPanelTitle = getPanelTitle;
