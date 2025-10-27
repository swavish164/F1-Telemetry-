let addMessage = null


export function SetConsoleMessages(messageArray) {
    addMessage = messageArray;
}

export function addMessageConsole(message) {
    if(message && addMessage){
        const currentTime = new Date().toLocaleTimeString();
        addMessage(`${currentTime}: ${message}`);
}
}