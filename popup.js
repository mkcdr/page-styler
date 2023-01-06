import styles from "./styles.js"

window.addEventListener("DOMContentLoaded", async () => {
    // get current active tab
    const tabs = await chrome.tabs.query({ currentWindow: true, active: true })

    // get the current URL without hash or query parameters
    const url = tabs[0].url.split('#')[0].split('?')[0]

    // get the list of styled URLs
    const styledURLsResults = await chrome.storage.local.get(["urls"])

    const styledURLs = styledURLsResults.urls ?? []

    // check if the current URL exists in the list of styled URLs
    const foundURL = styledURLs.find(u => u.url == url)

    // append styles options to the style select menu
    const stylesList = document.getElementById("styleSelect")

    // adding the "no style" as the first option
    const noStyleOption = document.createElement("option")
    noStyleOption.innerText = "-- No Style --"
    noStyleOption.value = ""

    stylesList.appendChild(noStyleOption)

    styles.forEach(style => {
        const opt = document.createElement("option")
        opt.innerText = style.name
        opt.value = style.path

        if (foundURL && foundURL.style === style.path) {
            opt.selected = true
        }

        stylesList.appendChild(opt);
    })

    // listen to frm submit and apply changes
    document.styleForm.addEventListener("submit", async (e) => {

        e.preventDefault()
        
        const style = e.target.style.value

        // get the list of styled URLs
        const styledURLsResults = await chrome.storage.local.get(["urls"])

        let styledURLs = styledURLsResults.urls ?? []

        // check if the current URL exists in the list of styled URLs
        const foundURL = styledURLs.find(u => u.url == url)
        
        // if a style was applied before, then remove it before continuing
        if (foundURL) {
            const prevStyle = foundURL.style

            // remove style from tab
            try {
                await chrome.scripting.removeCSS({
                    target: {
                        tabId: tabs[0].id
                    }, 
                    files: [`styles/${prevStyle}`]
                })

                // remove url from the styled URLs
                styledURLs = styledURLs.filter(u => u.url !== url)

                console.log("old style was removed")

            } catch (error) {
                console.log(`Remove CSS failed: ${error}`);
            }
        }

        // if a style was selected then inject it and store
        // URL with the selected style
        if (style) {
            try {
                await chrome.scripting.insertCSS({
                    target: {
                        tabId: tabs[0].id
                    }, 
                    files: [`styles/${style}`]
                })

                // add current url with a style to the styled URLS
                styledURLs.push({ url: url, style: style })

                console.log("new style was applied")

            } catch (error) {
                console.log(`Insert CSS failed: ${error}`);
            }
        }

        const state = style ? "ON" : "OFF"
        
        // update the list of styled urls in the storage
        await chrome.storage.local.set({ "urls" : styledURLs })

        // Set the action badge to the next state
        await chrome.action.setBadgeText({ tabId: tabs[0].id, text: state })
    })
})