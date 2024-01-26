import 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@v3.0.0/dist/cookieconsent.umd.js';

CookieConsent.run({
   categories: {
        necessary: {
            enabled: true,  // this category is enabled by default
            readOnly: true  // this category cannot be disabled
        }
    },

    language: {
        default: 'en',
        translations: {
            en: {
                consentModal: {
                    title: 'Cookies on this site',
                    description: 'We use cookies to enhance and personalise your experience. Accept all cookies below, or select “Manage cookies” to view our Cookie Policy and see details of the cookies we use.',
                    acceptAllBtn: 'Accept all',
                    showPreferencesBtn: 'Manage cookies'
                },
                preferencesModal: {
                    title: 'Manage cookie preferences',
                    acceptNecessaryBtn: 'Accept necessary cookies',
                    savePreferencesBtn: 'Accept current selection',
                    closeIconLabel: 'Close modal',
                    sections: [
                        {
                            description: 'When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to. The information does not usually directly identify you, but it can give you a more personalised web experience. Click on the different category headings to find out more about the cookies our site uses.'
                        },
                        {
                            title: 'Strictly Necessary cookies',
                            description: 'These cookies are essential for the proper functioning of the website and cannot be disabled.',

                            cookieTable: {
                                headers: {
                                    name: 'Name',
                                    description: 'Description',
                                    host: 'host',
                                    duration: 'Duration'
                                },
                                body: [
                                  {
                                     name: 'mdenetep-auth',
                                     description: 'Used for user authentication purposes and enables the platform to save user progress to and read from private GitHub repositories that they choose.',
                                     host: window.location.hostname,
                                     duration: 'session'
                                  },
                                  {
                                     name: 'JSESSIONID',
                                     description: 'Random session ID used to access each generated Xtext editor.',
                                     host: window.location.hostname,
                                     duration: 'session'
                                  }
                                ]
                                },
                            //this field will generate a toggle linked to the 'necessary' category
                            linkedCategory: 'necessary'
                        },
                    ]
                }
            }
        }
    }
});
