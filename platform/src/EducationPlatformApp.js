/*global $ -- jquery is externally imported*/
/*global FEEDBACK_SURVEY_URL -- is set by environment variable*/
/*global Metro -- Metro is externally imported*/

import * as ace from 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-min-noconflict/theme-eclipse';
import 'ace-builds/src-min-noconflict/mode-xml';
import 'ace-builds/src-min-noconflict/mode-yaml';
import 'ace-builds/src-min-noconflict/mode-java';
import 'ace-builds/src-min-noconflict/mode-html';
import 'ace-builds/src-min-noconflict/ext-modelist';
import 'ace-builds/src-min-noconflict/ext-language_tools';

import 'metro4/build/metro';

import { GeneralEducationPlatformApp } from '../interfaces/GeneralEducationPlatformApp.js';
import { FileHandler } from './FileHandler.js';
import { ActivityManager } from './ActivityManager.js';
import { ToolManager as ToolsManager } from './ToolsManager.js';
import { EducationPlatformError } from './EducationPlatformError.js'
import { ConfigValidationError } from './ConfigValidationError.js';

import { ConsolePanel } from "./ConsolePanel.js";
import { ProgramPanel } from "./ProgramPanel.js";
import { OutputPanel } from "./OutputPanel.js";
import { TestPanel } from './TestPanel.js';
import { BlankPanel } from './BlankPanel .js';
import { XtextEditorPanel } from './XtextEditorPanel.js';
import { CompositePanel } from './CompositePanel.js';
import { Button } from './Button.js';

import { Preloader } from './Preloader.js';
import { Layout, PANEL_HOLDER_ID } from './Layout.js';
import { PlaygroundUtility } from './PlaygroundUtility.js';
import { jsonRequest, urlParamPrivateRepo, utility } from './Utility.js';
import { ErrorHandler } from './ErrorHandler.js';


// const COMMON_UTILITY_URL = utility.getWindowLocationHref().replace( utility.getWindowLocationSearch(), "" ) + "common/utility.json";
// const ACTION_FUNCTION_LANGUAGE_TYPE = "text";

class EducationPlatformApp extends GeneralEducationPlatformApp {
    preloader;

    constructor() {
        const errorHandler = new ErrorHandler();
        super(errorHandler);
        this.preloader = new Preloader();
    }

    async initialize( urlParameters, tokenHandlerUrl , wsUri){
        this.fileHandler = new FileHandler(tokenHandlerUrl);
        this.wsUri = wsUri;

        /* 
        *  Setup the browser environment 
        */
        if (FEEDBACK_SURVEY_URL){
            PlaygroundUtility.setFeedbackButtonUrl(FEEDBACK_SURVEY_URL);
            PlaygroundUtility.showFeedbackButton();
        }

        document.getElementById("btnnologin").onclick= () => {

            PlaygroundUtility.hideLogin();
        }


        if (!urlParamPrivateRepo()){
            // Public repo so no need to authenticate
            await this.initializeActivity(urlParameters);
            
        } else {
            PlaygroundUtility.showLogin();
        }

        document.getElementById("btnlogin").onclick= async () => {

            // Get github url
            const urlRequest = { url: utility.getWindowLocationHref() };
            let authServerDetails= await jsonRequest(tokenHandlerUrl + "/mdenet-auth/login/url",
                                                    JSON.stringify(urlRequest) );

            

            authServerDetails = JSON.parse(authServerDetails);

            // Authenticate redirect 
            utility.setWindowLocationHref(authServerDetails.url);
        }

        if (urlParameters.has("code") && urlParameters.has("state")  ){
            // Returning from authentication redirect
            PlaygroundUtility.hideLogin();

            //Complete authentication
            const tokenRequest = {};
            tokenRequest.state = urlParameters.get("state");
            tokenRequest.code = urlParameters.get("code");

            //TODO loading box
            let authDetails = jsonRequest(tokenHandlerUrl + "/mdenet-auth/login/token",
                                        JSON.stringify(tokenRequest), true );
            authDetails.then( async () => {
                document.getElementById('save')?.classList.remove('hidden');
                window.sessionStorage.setItem("isAuthenticated", true);
                await this.initializeActivity(urlParameters);
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
    }



    async initializeActivity(urlParameters){

        let errors = [];

        if (!urlParameters.has("activities")) {
            // No activity configuration has been given
            errors.push(new EducationPlatformError("No activity configuration has been specified."));
        }

        if (errors.length==0){
            // An activity configuration has been provided
            const toolsManager = new ToolsManager(this.errorHandler.notify.bind(this.errorHandler));
            const activityManager = new ActivityManager( (toolsManager.getPanelDefinition).bind(toolsManager), this.fileHandler );
            await super.initializeActivity(toolsManager, activityManager, errors);
        } 
    }

    handleToolImports(toolImports){
        for(let ipt of toolImports) {
            ace.config.setModuleUrl(ipt.module, ipt.url);
        }
    }

    addToolIconStyles(toolUrl){
        let toolBaseUrl = toolUrl.url.substring(0, toolUrl.url.lastIndexOf("/"));
        var link = document.createElement("link");
        link.setAttribute("rel", 'stylesheet');
        link.setAttribute("href", toolBaseUrl + "/icons.css");
        document.head.appendChild(link);
    }

    displayErrors(errors){

            const contentPanelName = "content-panel";
        
            this.panels.push(new BlankPanel(contentPanelName));
            this.panels[0].setVisible(true);
        
            new Layout().createFromPanels("navview-content", this.panels);
        
            PlaygroundUtility.showMenu();
        
            Metro.init();
            this.fit();
        
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

            const otherErrors = errors.filter((e) => !(configErrors.includes(e) || platformErrors.includes(e)))
            if (otherErrors.length > 0) {
                let contentTitle = document.createElement("h2");
                contentTitle.innerText = "Errors:";
                contentPanelDiv.append(contentTitle);

                otherErrors.forEach( (err) => {
                    let content = document.createElement("p");
                    let contentText= `${err.constructor.name}: ${err.message}` ;
                    content.append(document.createTextNode(contentText));

                    contentPanelDiv.append(content);
                });
            }
    }

    async initializePanels() {
        
        await super.initializePanels();  


        new Layout().createFrom2dArray("navview-content", this.panels, this.activity.layout.area);


        PlaygroundUtility.showMenu();
        
        document.addEventListener('click', function(evt) {
            if (evt.target == document.getElementById("toggleNavViewPane")) {
                setTimeout(function(){ this.fit(); }, 1000);
            }
        });

        Metro.init();

        this.activityManager.openActiveActivitiesSubMenu();
        
        this.fit();
    }

    createButtons(buttonConfigs, id){
        return Button.createButtons(buttonConfigs, id);
    }

    async createPanel(panel, panelDefinition, newPanelId){
        let newPanel = null;
        switch(panelDefinition.panelclass) {
            case "ProgramPanel": {
                newPanel =  new ProgramPanel(newPanelId);
                newPanel.initialize();
                
                // Set from the tool panel definition  
                newPanel.setEditorMode(panelDefinition.language);

                newPanel.setType(panelDefinition.language);

                // Set from the activity 
                newPanel.setValue(panel.file);
                newPanel.setValueSha(panel.sha); 
                newPanel.setFileUrl(panel.url);
                break;
            }
            case "ConsolePanel": {
                newPanel =  new ConsolePanel(newPanelId);
                newPanel.initialize();
                break;
            }
            case "OutputPanel": {
                newPanel =  new OutputPanel(newPanelId, panelDefinition.language, this.outputType, this.outputLanguage);
                newPanel.initialize();
                break;
            }
            case "XtextEditorPanel": {
                let editorUrl = sessionStorage.getItem(newPanelId);
                
                newPanel = new XtextEditorPanel(newPanelId);
                newPanel.initialize(editorUrl, panel.extension);
                newPanel.setType(panelDefinition.language);

                // Set from the activity 
                newPanel.setValue(panel.file);
                newPanel.setValueSha(panel.sha); 
                newPanel.setFileUrl(panel.url)

                break;
            }
            case "CompositePanel": {

                newPanel = new CompositePanel(newPanelId);
                if (panel.childPanels) {
                    for (let childPanelConfig of panel.childPanels) {     
                        var childPanel = this.createPanelForDefinitionId(childPanelConfig);
                        newPanel.addPanel(childPanel);
                    }
                }
                newPanel.initialize();
                
                break;
            }
            // TODO create other panel types e.g. models and metamodels so the text is formatted correctly
            default: {
                newPanel = new TestPanel(newPanelId);    
            }            
        }
        return newPanel;
    }


    getPanelTitle(panelId) {
        return $("#" + panelId)[0].dataset.titleCaption;
    }

    fit() {
        var splitter = document.getElementById(PANEL_HOLDER_ID);
        if (splitter){
            splitter.style.minHeight = window.innerHeight + "px";
            splitter.style.maxHeight = window.innerHeight + "px";
        }
        this.panels.forEach(panel => panel.fit());
        this.preloader.hide();
    }

    displayLongMessage(message){
        PlaygroundUtility.longNotification(message);
    }

    displaySuccessMessage(message){
        PlaygroundUtility.successNotification(message);
    }

    removeNotification(){
        Metro.notify.killAll();
    }


    togglePanelById(elementId) {
        const panelElement = document.getElementById(elementId);
        if (panelElement) {
            const parentElement = panelElement.parentElement;
            this.toggle(parentElement.id);
        }
    }
    

    toggle(elementId, onEmpty) {
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
        this.updateGutterVisibility();
    }


    updateGutterVisibility() {
        for (const gutter of Array.prototype.slice.call(document.getElementsByClassName("gutter"))) {

            var visibleSiblings = Array.prototype.slice.call(gutter.parentNode.children).filter(
                child => child != gutter && getComputedStyle(child).display != "none");
            
            if (visibleSiblings.length > 1) {
                var nextVisibleSibling = this.getNextVisibleSibling(gutter);
                var previousVisibleSibling = this.getPreviousVisibleSibling(gutter);
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

    getNextVisibleSibling(element) {
        var sibling = element.nextElementSibling;
        while (sibling != null) {
            if (getComputedStyle(sibling).display != "none") return sibling;
            sibling = sibling.nextElementSibling;
        }
    }

    getPreviousVisibleSibling(element) {
        var sibling = element.previousElementSibling;
        while (sibling != null) {
            if (getComputedStyle(sibling).display != "none") return sibling;
            sibling = sibling.previousElementSibling;
        }
    }

    savePanelContents(){
        
        let panelsToSave = this.panels.filter (p => p.canSave());

        let fileStorePromises = [];

        // FIXME: This currently creates separate commits for each panel. We really would want one commit for all of them together...
        for(const panel of panelsToSave){
            
            let storePromise = panel.save(this.fileHandler);
            
            if (storePromise!=null) {
                
                storePromise.then( () => {
                    console.log("The contents of panel '" + panel.getId() + "' were saved successfully.");
                });

                fileStorePromises.push(storePromise);
            }
        }
        
        Promise.all(fileStorePromises).then( () => {
            PlaygroundUtility.successNotification("The activity panel contents have been saved.");
        
        }).catch( (err) => {
            this.errorHandler.notify("An error occurred while trying to save the panel contents.", err);
        });
    }

    updateSessionInfo(editorPanelId, editorInstanceUrl){
        sessionStorage.setItem(editorPanelId,editorInstanceUrl);
    }
}

export {EducationPlatformApp}