/*global Metro -- Metro is externally imported*/

class PlaygroundUtility {


    static showMenu(){
        document.getElementById("navview").style.display = "block";
    }

    static hideLogin(){
        document.getElementById("login").style.display = "none";
    }

    static showLogin(){
        document.getElementById("login").style.display = "block";
    }

    static showFeedbackButton(){
        document.getElementById("feedback-button").style.display = "block";
    }

    static setFeedbackButtonUrl(url){
        document.getElementById("feedback-url").href = url;
    }

    static notification(title, message, cls="light"){
        const crossIcon = "<div class=\"default-icon-cross\" style=\"float:right\"></div>"
        Metro.notify.create(crossIcon + "<b>"  + title + "</b>" + "<br>" + message + "<br>", null, {keepOpen: true, cls: cls, width: 300});
    }

    static longNotification(title, cls="light") {
        this.notification(title + "...", "This may take a few seconds to complete if the back end is not warmed up.", cls);
    }

    static successNotification(message, cls="light") {
        this.notification("Success:", message, cls);
    }

    static errorNotification(message) {
        console.error("ERROR: " + message);
        this.notification("Error:", message, "bg-red fg-white");
    }

}

export { PlaygroundUtility };