import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-min-noconflict/theme-eclipse';
import 'ace-builds/src-min-noconflict/mode-xml';
import 'ace-builds/src-min-noconflict/mode-yaml';
import 'ace-builds/src-min-noconflict/mode-java';
import 'ace-builds/src-min-noconflict/mode-html';
import 'ace-builds/src-min-noconflict/ext-modelist';

import svgPanZoom from 'svg-pan-zoom';

import { ModelPanel } from './ModelPanel.js';
import { ConsolePanel } from "./ConsolePanel.js";
import { ProgramPanel } from "./ProgramPanel.js";
import { OutputPanel } from "./OutputPanel.js";


import { ActivityManager } from './ActivityManager.js';

import { DownloadDialog } from './DownloadDialog.js';
import { MetamodelPanel } from './MetamodelPanel.js';
import { SettingsDialog } from './SettingsDialog.js';
import { Preloader } from './Preloader.js';
import { Backend } from './Backend.js';
import { Layout } from './Layout.js';
import 'metro4';
import './highlighting/highlighting.js';
import { TestPanel } from './TestPanel .js';
import { ToolManager as ToolsManager } from './ToolsManager.js';
import { BlankPanel } from './BlankPanel .js';
import { PlaygroundUtility } from './PlaygroundUtility.js';


var outputType = "text";
var outputLanguage = "text";
var activity;
var url = window.location + "";
var questionMark = url.indexOf("?");

export var consolePanel;
var downloadDialog = new DownloadDialog();
var settingsDialog = new SettingsDialog();
var preloader = new Preloader();
export var backend = new Backend();

var panels = [];
var buttonActionFunctions = [];

export var activityManager;
export var toolsManager;

var urlParameters = new URLSearchParams(window.location.search);    

if (urlParameters.has("activities")) {

    // An activity configuration has been provided
    toolsManager = new ToolsManager();
    activityManager = new ActivityManager( (toolsManager.getPanelDefinition).bind(toolsManager) );
    toolsManager.setToolsUrls(activityManager.getToolUrls())

    activity = activityManager.getSelectedActivity(); 

    setup();

} else {

    // No activity configuration has been given
    const contentPanelName = "content-panel";
 
    panels.push(new BlankPanel(contentPanelName));
    panels[0].setVisible(true);

    new Layout().createFromPanels("navview-content", panels);
   
    document.getElementById("copyShortened").remove();
    document.getElementById("showDownloadOptions").remove();
    document.getElementById("showSettings").remove();

    PlaygroundUtility.showMenu();

    Metro.init();
    fit();

    var contentPanelDiv = document.getElementById(contentPanelName);
    var content = document.createTextNode("No activity configuration has been specified.");
    contentPanelDiv.append(content);
}

function setup() {
    
    if (activity.outputLanguage != null) {
        outputLanguage = activity.outputLanguage;
    }
    
    // Create panels for the given activites
    for ( let apanel of activity.panels ){

        var newPanel = createPanelForDefinitionId(apanel);
        panels.push(newPanel);
    }    

    new Layout().createFromPanels("navview-content", panels);






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
                newPanel.setEditorMode(panelDefinition.language)

                

                // Set from the activity 
                newPanel.setValue(panel.file); 
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


function copyShortenedLink(event) {
    event.preventDefault();
    var content = btoa(editorsToJson());
    var xhr = new XMLHttpRequest();
    
    xhr.open("POST", backend.getShortURLService(), true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var json = JSON.parse(xhr.responseText);

                if (questionMark > 0) {
                    var baseUrl = (window.location+"").substring(0, questionMark);
                }
                else {
                    baseUrl = window.location;
                }
                Metro.notify.killAll();
                Metro.dialog.create({
                    title: "Share link",
                    content: "<p>The link below contains a snapshot of the contents of all the editors in the playground. Anyone who visits this link should be able to view and run your example.</p><br/> <input style='width:100%' value='" + baseUrl + "?" + json.shortened + "'>",
                    closeButton: true,
                    actions: [
                    {
                        caption: "Copy to clipboard",
                        cls: "js-dialog-close success",
                        onclick: function(){
                            copyToClipboard(baseUrl + "?" + json.shortened);
                        }
                    }]
                });
            }
            Metro.notify.killAll();
        }
    };
    var data = JSON.stringify({"content": content});
    xhr.send(data);
    longNotification("Generating short link");
    return false;
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
 * Creates a request to the backend functions
 * @param {*} actionClicked  the action of the clicked button
 * @param {*} toolActionFunction the corresponding to action details
 * @returns {object} request
 */
function editorsToJsonObject(actionClicked, toolActionFunction) {
    var actionRequestData = {};
       
    const sourcePanelLanguage = actionClicked.source.ref.language;
    

    //Populate the parameters for processing the action request
    for ( const param  of toolActionFunction.parameters ){

        // Get editor values from their panels
        const panelConfig = actionClicked.parameters[param]; 

        if (panelConfig == undefined){
            // Set unused parameters in the request to undefined as the backend function expect them all. 
            actionRequestData[param] = "undefined";

        } else {
            
            const panel = panels.find( pn => pn.id ==  panelConfig.id );
    
            // There is a panel so add its contents to request
            actionRequestData[param] = panel.getValue();
        }
    }

    actionRequestData.language = sourcePanelLanguage;
    
    // TODO support output and language 
    actionRequestData.outputType = outputType;
    actionRequestData.outputLanguage = outputLanguage;

    return  actionRequestData; 
}



function editorsToJson(actionClicked, toolActionFunction) {

    return JSON.stringify(editorsToJsonObject(actionClicked, toolActionFunction));
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

    // Call backend service function
    const buttonConfig =   action.source.ref.buttons.find( btn => btn.id == sourceButton );

    const toolActionFunction = toolsManager.getActionFunction( buttonConfig.actionfunction ); // TODO tidy up by resolving tool references


    var xhr = new XMLHttpRequest();
    //var url = backend.getRunEpsilonService();
    var url = toolActionFunction.path;

    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {

        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                var outputPanel = panels.find( pn => pn.id ==  action.output.id);

                if (response.hasOwnProperty("error")) {
                    consolePanel.setError(response.error);
                } else {

                    var responseDiagram = Object.keys(response).find( key => key.toLowerCase().includes("diagram") );

                    if (response.output != "") {
                        // Text
                        outputPanel.setOutput(response.output)
  
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

            }
            Metro.notify.killAll();
        }
    };

    var data = editorsToJson(action, toolActionFunction);
    xhr.send(data);
    longNotification("Executing program");
}



function longNotification(title, cls="light") {
    Metro.notify.create("<b>" + title + "...</b><br>This may take a few seconds to complete if the back end is not warmed up.", null, {keepOpen: true, cls: cls, width: 300});
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

function showDownloadOptions(event) {
    downloadDialog.show(event);
}

function showSettings(event) {
    settingsDialog.show(event);
}

    // Some functions and variables are accessed  
    // by onclick - or similer - events
    // We need to use window.x = x for this to work
    window.fit = fit;
    window.updateGutterVisibility = updateGutterVisibility;
    window.runAction = runAction;
    window.consolePanel = consolePanel;
    window.panels = panels;

    window.backend = backend;
    window.toggle = toggle;
    //window.renderDiagram = renderDiagram;
    window.longNotification = longNotification;
    window.showDownloadOptions = showDownloadOptions;
    window.showSettings = showSettings;
    window.copyShortenedLink = copyShortenedLink;
    window.downloadDialog = downloadDialog;
    window.getPanelTitle = getPanelTitle;