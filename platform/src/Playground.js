import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-min-noconflict/theme-eclipse';
import 'ace-builds/src-min-noconflict/mode-xml';
import 'ace-builds/src-min-noconflict/mode-yaml';
import 'ace-builds/src-min-noconflict/mode-java';
import 'ace-builds/src-min-noconflict/mode-html';
import 'ace-builds/src-min-noconflict/ext-modelist';
import {define} from "ace-builds";

import svgPanZoom from 'svg-pan-zoom';

import { FileHandler } from './FileHandler.js';
import { ActivityManager } from './ActivityManager.js';
import { ToolManager as ToolsManager } from './ToolsManager.js';

import { ModelPanel } from './ModelPanel.js';
import { ConsolePanel } from "./ConsolePanel.js";
import { ProgramPanel } from "./ProgramPanel.js";
import { OutputPanel } from "./OutputPanel.js";

import { StoreDialog } from "./StoreDialog.js"

import { MetamodelPanel } from './MetamodelPanel.js';
import { Preloader } from './Preloader.js';
import { Backend } from './Backend.js';
import { Layout } from './Layout.js';
import 'metro4';
import './highlighting/highlighting.js';
import { TestPanel } from './TestPanel .js';

import { BlankPanel } from './BlankPanel .js';
import { PlaygroundUtility } from './PlaygroundUtility.js';
import { getRequest, jsonRequest, jsonRequestConversion, ARRAY_ANY_ELEMENT, urlParamPrivateRepo } from './Utility.js';
import { ActionFunction } from './ActionFunction.js';

const TOKEN_HANDLER_URL = "http://127.0.0.1:10000";

var outputType = "text";
var outputLanguage = "text";
var activity;
var url = window.location + "";
var questionMark = url.indexOf("?");

export var consolePanel;
var preloader = new Preloader();
export var backend = new Backend();

var panels = [];
var storeDialog;
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
    PlaygroundUtility.hideLogin();
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





function initialiseActivity(){
    if (urlParameters.has("activities")) {

        // An activity configuration has been provided
        toolsManager = new ToolsManager();
        activityManager = new ActivityManager( (toolsManager.getPanelDefinition).bind(toolsManager), fileHandler );
        toolsManager.setToolsUrls(activityManager.getToolUrls());
    
        
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
    
        storeDialog = new StoreDialog();

        initialisePanels();
    
    } else {
    
        // No activity configuration has been given
        const contentPanelName = "content-panel";
     
        panels.push(new BlankPanel(contentPanelName));
        panels[0].setVisible(true);
    
        new Layout().createFromPanels("navview-content", panels);
    
        PlaygroundUtility.showMenu();
    
        Metro.init();
        fit();
    
        var contentPanelDiv = document.getElementById(contentPanelName);
        var content = document.createTextNode("No activity configuration has been specified.");
        contentPanelDiv.append(content);
    }
}

function initialisePanels() {
    
    if (activity.outputLanguage != null) {
        outputLanguage = activity.outputLanguage;
    }
    
    // Create panels for the given activites
    for ( let apanel of activity.panels ){

        var newPanel = createPanelForDefinitionId(apanel);
        panels.push(newPanel);
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
     * @param {string} panel 
     * @return {Panel}
     */
    function createPanelForDefinitionId(panel){
        const panelDefinition = panel.ref;
        var newPanel = null;
        var buttons;

        const newPanelId= panel.id;

        // TODO Populate the different panel types from the tool panel definition.
        switch(panelDefinition.panelclass) {
            case "ProgramPanel":
                newPanel =  new ProgramPanel(newPanelId);
                
                // Set from the tool panel definition  
                newPanel.setIcon(panelDefinition.icon);
                newPanel.setEditorMode(panelDefinition.language);

                newPanel.setType(panelDefinition.language);

                // Set from the activity 
                newPanel.setValue(panel.file);
                newPanel.setValueSha(panel.sha); 
                newPanel.setFileUrl(panel.url)
            break;
        
            case "ConsolePanel":
                newPanel =  new ConsolePanel(newPanelId);

                // TODO Support for multiple consoles
                consolePanel = newPanel; 
            break;

            case "OutputPanel":
            
                const panelDef =  toolsManager.getPanelDefinition(newPanelId);

                newPanel =  new OutputPanel(newPanelId, panelDefinition.language, outputType, outputLanguage);
            
                newPanel.setIcon(panelDefinition.icon);
                
                newPanel.hideEditor();
                newPanel.showDiagram();

            break;

            // TODO create other panel types e.g. models and metamodels so the text is formatted correctly
            default:
            newPanel = new TestPanel(newPanelId);                
        }
        
        // Add elements common to all panels
        newPanel.setTitle(panel.name);

        if (panelDefinition.buttons != null){
            
            var buttons = panel.ref.buttons.map( (btn) => {
                var buttonData = {};

                buttonData.icon =  btn.icon;
                buttonData.hint = btn.hint;
                buttonData.action = generateButtonOnclickHtml(btn, panel.id);

                return buttonData;
            });

            newPanel.addButtons(buttons);   
        }   

                
        return newPanel;
}


function generateButtonOnclickHtml(button, panelId){

    var onclickHtml; 

    if (button["url"] != undefined) {
        onclickHtml = "window.open('" + button.url + "');";
                       
    } else if (button["actionfunction"] != undefined)  {        
        onclickHtml = "runAction( '" + panelId + "', '" + button.id +"' )";

    } else {
        console.log( "Button '" + button.id + "' with uknown key.");
    }

    return onclickHtml;
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
 * Creates a request to the required backend converstion functions for type matching of the panels data with 
 * the action function's inputs. Once all of the inputs are available the action function is requested.
 * 
 * @param {object} actionClicked  the action of the clicked button
 * @param {ActionFunction} toolActionFunction the corresponding to action details
 */
function requestAction(actionClicked, toolActionFunction) {
    let actionRequestData = {};
    let parameterPromises = [];
    
    let actionFunctionPromise;
       
    const sourcePanelLanguage = actionClicked.source.ref.language;
    
    
    for ( const param  of toolActionFunction.getParameters() ){

        const panelConfig = actionClicked.parameters[param.name]; 

        // Check types and request conversions from available tool services
        if (panelConfig != undefined){
            parameterPromises.push( translateTypes( param.name, actionClicked, toolActionFunction ) );
        }
    }

    
    // Request the final action function
    Promise.all( parameterPromises ).then( (values) => { 
        

        //Populate the transformed parameters
        for ( const param  of toolActionFunction.getParameters() ){

            const panelConfig = actionClicked.parameters[param.name]; 

            if (panelConfig == undefined){
                // Set unused parameters in the request to undefined as the epsilon backend function expects them all. 
                actionRequestData[param.name] = "undefined";

            } else {
                let parameterData = values.find(val => (val.name === param.name) );

                actionRequestData[param.name] =  parameterData.data;
            }
        }

        actionRequestData.language = sourcePanelLanguage;

        // TODO support output and language 
        //actionRequestData.outputType = outputType;
        //actionRequestData.outputLanguage = outputLanguage;
        
        actionFunctionPromise = requestAndHandleActionFunction(actionClicked, actionRequestData, toolActionFunction );

     
    }).catch( (err) => {
        console.log("There was an error translating action function parameter types.");
    } );

    return; 
}



/**
 * Translates a parameter type as required using remote tool services for any conversions. 
 * If the given parameter matches the required action function, no translation is performed.
 * @param {String} parameter the parameter name to translate 
 * @param {ActionFunction} toolActionFunction 
 * @returns promise for the parameter's data
 */
async function translateTypes( parameter, action, toolActionFunction ) {

    let parameterPromise;
   
    // Get editor values from their panels
    const parameterPanelId = action.parameters[parameter].id; 
     
    const panel = panels.find( pn => pn.id ==  parameterPanelId );

    let targetType = toolActionFunction.getParameterType(parameter);
    let sourceType = panel.getType();

    if(sourceType != targetType){
        let dependencyType; // Assuming there may be one upto one dependency 

        //get dependency data required for conversion 
        const hasDependency =  toolActionFunction.getInstanceOfParamName(parameter) != null;


        let dependencyPanel; 

        if (hasDependency) {

            const dependencyParameterName = toolActionFunction.getInstanceOfParamName(parameter);
            const dependencyPanelId = action.parameters[dependencyParameterName].id;

            dependencyType= toolActionFunction.getParameterType(dependencyParameterName);

            dependencyPanel = panels.find( pn => pn.id ==  dependencyPanelId );
        }


        //Translate the source data        
        let typesPanelValuesMap = {}; // Types have to be distinct for mapping to the conversion function's paramters
        typesPanelValuesMap[sourceType]=  panel.getValue();

        let conversionFunctionId;

        if (hasDependency) {

            let potentialConversionFunctions = toolsManager.getPartiallyMatchingConversionFunctions( [sourceType, ARRAY_ANY_ELEMENT], targetType);

            //check for a conversion function with the dependency type
            
            let functionsToCheck = [...potentialConversionFunctions];

            while ( conversionFunctionId==null && functionsToCheck.length > 0){
                
                let functionId = functionsToCheck.pop();
                let conversionFunction = toolsManager.getActionFunction(functionId);
                
                if (conversionFunction.getParameters()[1].type == dependencyType) { // Order of conversion parameters assumed: [input, dependency]
                    
                    //Conversion function found so use the panel value
                    conversionFunctionId = functionId;
                    typesPanelValuesMap[dependencyType]=  dependencyPanel.getValue();
                }
            }

            //no conversion found so check for a conversion function but consider conversions of the dependency
            functionsToCheck = [...potentialConversionFunctions];
            
            while ( conversionFunctionId==null && functionsToCheck.length > 0){
                let functionId = functionsToCheck.pop();
                let conversionFunction = toolsManager.getActionFunction(functionId);

                const targetDependancyType = conversionFunction.getParameters()[1].type;  // Order of conversion parameters assumed: [input, dependency]

                let dependencyConversionFunctionId = toolsManager.getConversionFunction( [dependencyType], targetDependancyType );
                
                if (dependencyConversionFunctionId != null){

                    conversionFunctionId = functionId;
                    
                    const conversionId = parameter + "Dep"; 

                    //convert dependency
                    let conversionRequestData = {};
                    let conversionFunction = toolsManager.getActionFunction(dependencyConversionFunctionId);

                    // Populate parameters for the conversion request 
                    for( const param of conversionFunction.getParameters() ){
                        conversionRequestData[param.name] =   dependencyPanel.getValue(); // The found conversion function is expected to have one parameter
                    }

                    let convertedValue = await requestTranslation(conversionRequestData, conversionFunction, conversionId);

                    typesPanelValuesMap[targetDependancyType]= convertedValue.data;
                }
            }

        } else {

            conversionFunctionId = toolsManager.getConversionFunction( Object.keys(typesPanelValuesMap), targetType );
        };

        if (conversionFunctionId != null){
            //There is a matching conversion function
            let conversionRequestData = {};
            let conversionFunction = toolsManager.getActionFunction(conversionFunctionId);

            // Populate parameters for the conversion request 
            for( const param of conversionFunction.getParameters() ){
                conversionRequestData[param.name] =  typesPanelValuesMap[param.type];
            }

            parameterPromise= requestTranslation(conversionRequestData, conversionFunction, parameter);

            
        } else {
            console.log("No conversion function available for input types:" + Object.keys(typesPanelValuesMap).toString() )
        }

    } else {
        parameterPromise =  new Promise( function (resolve, reject) { 
            let parameterData = {};
            
            parameterData.name = parameter;
            parameterData.data = panel.getValue();

            resolve(parameterData); 
        });
    }

    return parameterPromise;
}

/**
 * Requests the conversion function from the remote tool service
 * @param {Object} parameters 
 * @param {ActionFunction} converstionFunction
 * @param {String} name of the parameter
 * @returns Promise for the translated data
 */
function requestTranslation(parameters, conversionFunction, parameterName){
    
    let parametersJson = JSON.stringify(parameters);

    return jsonRequestConversion(conversionFunction.getPath(), parametersJson, parameterName);
}


/**
 * Request the action function from the remote tool service and handle the response
 * @param {Object} action
 * @param {Object} parameters 
 * @param {ActionFunction} actionFunction 
 */
function requestAndHandleActionFunction(action, parameters, actionFunction){
    
    let parametersJson = JSON.stringify(parameters);

    let requestPromise = jsonRequest(actionFunction.getPath(), parametersJson).then( (responseText) => {

        var response = JSON.parse(responseText);
        var outputPanel = panels.find( pn => pn.id ==  action.output.id);

        if (response.hasOwnProperty("error")) {
            consolePanel.setError(response.error);
        } else {

            var responseDiagram = Object.keys(response).find( key => key.toLowerCase().includes("diagram") );

            if (response.output != "") {
                // Text
                outputPanel.setValue(response.output)

            } if (responseDiagram != undefined) {
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
                        if (outputType == "puml") krokiEndpoint = "plantuml";
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

    Metro.notify.killAll();
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
    
    const buttonConfig =   action.source.ref.buttons.find( btn => btn.id == sourceButton );
    const toolActionFunction = toolsManager.getActionFunction( buttonConfig.actionfunction ); // TODO tidy up by resolving tool references

    // Call backend conversion and service functions
    requestAction(action, toolActionFunction);
 
    longNotification("Executing program");
}


function longNotification(title, cls="light") {
    Metro.notify.create("<b>" + title + "...</b><br>This may take a few seconds to complete if the back end is not warmed up.", null, {keepOpen: true, cls: cls, width: 300});
}

function successNotification(message, cls="light") {
    Metro.notify.create("<b>Success:</b> "+ message +"<br>", null, {keepOpen: true, cls: cls, width: 300});
}

function errorNotification(message) {
    Metro.notify.create("<b>Error:</b> "+ message +"<br>", null, {keepOpen: true, cls: "bg-red fg-white", width: 300});
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

function showStoreDialog(event){
    //storeDialog.show(event);
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

    // Some functions and variables are accessed  
    // by onclick - or similer - events
    // We need to use window.x = x for this to work
    window.fit = fit;
    window.updateGutterVisibility = updateGutterVisibility;
    window.runAction = runAction;
    window.consolePanel = consolePanel;
    window.panels = panels;
    window.showStoreDialog = showStoreDialog;
    window.backend = backend;
    window.toggle = toggle;
    //window.renderDiagram = renderDiagram;
    window.longNotification = longNotification;
    window.getPanelTitle = getPanelTitle;