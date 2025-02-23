//% color=#cf64ed
//% icon="\uf0a7"
//% block="Button clicks"
//% groups="['Advanced']"
namespace buttonClicks {

// Button.A = 1, B = 2, AB = 3
const SINGLECLICK = 0
const DOUBLECLICK = 1
const LONGCLICK = 2
const BUTTONDOWN = 3
const BUTTONUP = 4

const singleClickCheckTime = 100 // ms
const longClickTime = 800 
const shortClickTime =  500 
const doubleClickTime = 300      

// Times for buttons
let lastClickEnd =     [0, 0, 0]
let lastPressedStart = [0, 0, 0]
let inLongClick =      [false, false, false]

export enum AorB { // Thanks Martin Williams / https://support.microbit.org/support/tickets/55867
    A = 0,
    B = 1,
    //% block="A+B"
    AB = 2
}

// Array of handlers
let actions : [[Action]] = [ 
    [null, null, null, null, null],  // A Handlers
    [null, null, null, null, null],  // B Handlers
    [null, null, null, null, null]   // AB Handlers
];

// Button is AorB (0-based)
function doActions(button: AorB, kind: number) {
    // Optional/Null chaining would be nice...
    let handlers = actions.get(button)
    if(handlers) {
        let action = handlers.get(kind)
        if(action) action()
    }
}

function button(i: number) { // i is the Button Index (1,2,3)
    let currentTime = control.millis()
    let pressed = input.buttonIsPressed(i)
    i--;  // Adjust to 0-based AorB and array index.

    if(pressed) {
        doActions(i, BUTTONDOWN)
        lastPressedStart[i] = currentTime
        // Haven't started a long click yet
        inLongClick[i] = false
    } else {
        // Release
        doActions(i, BUTTONUP)
        const holdTime = currentTime - lastPressedStart[i]
        if (holdTime < shortClickTime) {
            if ((lastClickEnd[i] > 0) && (currentTime - lastClickEnd[i] < doubleClickTime)) {
                lastClickEnd[i] = 0 // Click ended
                doActions(i, DOUBLECLICK)
            } else {
                // If we're in a long click, end it
                if(inLongClick[i] == true) {
                    inLongClick[i] = false
                    lastClickEnd[i] = 0
                } else {
                    // Otherwise, note the time for short click checks
                    lastClickEnd[i] = currentTime
                }
            }
        } else {
            // Intermediate clicks are ignored
            lastClickEnd[i] = 0
        }
    }
}

loops.everyInterval(singleClickCheckTime, function() {
    let currentTime = control.millis()
    // i is index and AorB  (0-based)
    for(let i=Button.A-1;i<=Button.AB-1;i++) {
        if ((lastClickEnd[i] > 0) && (currentTime - lastClickEnd[i] > doubleClickTime)) {
            lastClickEnd[i] = 0
            doActions(i, SINGLECLICK)
        }
        // Check if we're in a long press
        // Button indices are 1-based (i+1).
        let pressed = input.buttonIsPressed(i+1)
        const holdTime = currentTime - lastPressedStart[i]
        if(pressed && (holdTime > longClickTime) ) {
            lastClickEnd[i] = 0 // Click ended / not a short click
            inLongClick[i] = true
            lastPressedStart[i] = currentTime // Prepare for 2nd long click
            doActions(i, LONGCLICK)
        }
    }
})
// Register Handlers
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_A,
    EventBusValue.MICROBIT_BUTTON_EVT_DOWN, () => button(Button.A))
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_A,
    EventBusValue.MICROBIT_BUTTON_EVT_UP, () => button(Button.A))
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_B,
    EventBusValue.MICROBIT_BUTTON_EVT_DOWN, () => button(Button.B))
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_B,
    EventBusValue.MICROBIT_BUTTON_EVT_UP, () => button(Button.B))
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_AB,
    EventBusValue.MICROBIT_BUTTON_EVT_DOWN, () => button(Button.AB))
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_AB,
    EventBusValue.MICROBIT_BUTTON_EVT_UP, () => button(Button.AB))

//% blockId=onButtonSingleClicked block="on button |%NAME single clicked"
//% weight=100 
export function onButtonSingleClicked(button: AorB, body: Action) {
    let buttonHandlers = actions.get(button)
    buttonHandlers.set(SINGLECLICK, body)
}

//% blockId=onButtonDoubleClicked block="on button |%NAME double clicked "
//% weight=75
export function onButtonDoubleClicked(button: AorB, body: Action) {
    let buttonHandlers = actions.get(button)
    buttonHandlers.set(DOUBLECLICK, body)
}

//% blockId=onButtonHeld block="on button |%NAME held"
//% weight=50
export function onButtonHeld(button: AorB, body: Action) {
    let buttonHandlers = actions.get(button)
    buttonHandlers.set(LONGCLICK, body)
}


//% blockId=onButtonDown block="on button |%NAME down "
//% weight=25 
//% group="Advanced"
export function onButtonDown(button: AorB, body: Action) {
    let buttonHandlers = actions.get(button)
    buttonHandlers.set(BUTTONDOWN, body)
}

//% blockId=onButtonUp block="on button |%NAME up "
//% weight=10 
//% group="Advanced"
export function onButtonUp(button: AorB, body: Action) {
    let buttonHandlers = actions.get(button)
    buttonHandlers.set(BUTTONUP, body)
}
}
