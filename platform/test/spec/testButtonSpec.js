
import {Button} from "../../src/Button.js"


describe("Button", () => {

        const btnConfigAf = {
                id: "1",
                icon: "ico",
                actionfunction: "af",
                hint: "hn"
        } 

        it("can be created", () => {
                let btn = new Button(btnConfigAf, "pid");    
                expect(btn instanceof Button).toBe(true); 
        })

        it("has an id set by a config object", () => {
                let btn = new Button(btnConfigAf, "pid");    
                expect(btn.id).toBe("1"); 
        })

        it("has an icon set by a config object", () => {
                let btn = new Button(btnConfigAf, "pid");    
                expect(btn.icon).toBe("ico"); 
        })
    
        it("has an hint set by a config object", () => {
                let btn = new Button(btnConfigAf, "pid");    
                expect(btn.hint).toBe("hn"); 
        })

        it("getView - outputs a DOM representation for customButtons properties", () => {
                const expectedDomObject = {
                        "html": "<span class='mif-ico' data-role='hint' data-hint-text='hn' data-hint-position='bottom'></span>",
                        "cls": "sys-button",
                        "onclick": "runAction( 'pid', '1' )"
                    }

                let btn = new Button(btnConfigAf, "pid");    
                expect(btn.getView()).toEqual(expectedDomObject); 
        })
        
        it("createButtons - creates multiple buttons from  an array of button objects", () => {
                let btns = Button.createButtons([btnConfigAf, btnConfigAf, btnConfigAf, btnConfigAf], "pid");  

                expect(btns.length).toBe(4);
                expect(btns[0]).toEqual(new Button(btnConfigAf, "pid"));
        })
})
