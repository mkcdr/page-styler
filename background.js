chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    // get the current URL without hash or query parameters
    const url = tab.url.split('#')[0].split('?')[0]

    // check if the page loading is complete:
    // this is a very important check to make sure this extension work probably
    // because the onUpdated event can fire multiple times and it will create a bug
    // if the extension inserted the same CSS file multiple times.
    if (changeInfo && changeInfo.status && changeInfo.status === 'complete')
    {
        // check if current URL exists in the list and apply changes
        chrome.storage.local.get(["urls"], async result => {

            // get the list of styled URLs
            const styledURLs = result.urls ?? []

            // check if current url is in the styled URLs
            const foundURL = styledURLs.find(u => u.url == url)

            let state = "OFF" // store the current style state for the current tab

            // if the url exists in the styled URLs list 
            // then apply styles and change the state to 'ON'
            if (foundURL) {
                
                // add style to tab
                try {
                    await chrome.scripting.insertCSS({
                        target: {
                            tabId: tab.id
                        }, 
                        files: [`styles/${foundURL.style}`]
                    })
                    
                    state = "ON"

                    console.log('Style inserted on update')
                    
                } catch (error) {
                    console.log(`Insert CSS failed: ${error}`);
                }
            }

            // Set the action badge to the next state
            await chrome.action.setBadgeText({ tabId: tab.id, text: state })
        })
    }    
})

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "OFF"
    })
})

// handle incoming messages
chrome.runtime.onMessage.addListener((obj, sender, response) => {
    console.log("message: ", obj)
})