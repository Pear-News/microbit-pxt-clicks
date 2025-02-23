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
let lastButtonPressed = -1

export enum AorB { // Thanks Martin Williams / https://support.microbit.org/support/tickets/55867
    A = 0,
    B = 1,
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
    let pressedA = input.buttonIsPressed(Button.A)
    let pressedB = input.buttonIsPressed(Button.B)
    let pressedAB = pressedA && pressedB
    i--;  // Adjust to 0-based AorB and array index.

    if(pressedAB) {
        if(lastButtonPressed != AorB.AB) {
            doActions(AorB.AB, BUTTONDOWN)
            lastPressedStart[AorB.AB] = currentTime
            lastButtonPressed = AorB.AB
            inLongClick[AorB.AB] = false
        }
    } else {
        if (pressedA) {
            if(lastButtonPressed != AorB.A) {
                doActions(AorB.A, BUTTONDOWN)
                lastPressedStart[AorB.A] = currentTime
                lastButtonPressed = AorB.A
                inLongClick[AorB.A] = false
            }
        }
        if (pressedB) {
            if(lastButtonPressed != AorB.B) {
                doActions(AorB.B, BUTTONDOWN)
                lastPressedStart[AorB.B] = currentTime
                lastButtonPressed = AorB.B
                inLongClick[AorB.B] = false
            }
        }
    }

    if (!pressedA && !pressedB) {
        if(lastButtonPressed != -1) {
            doActions(lastButtonPressed, BUTTONUP)
            const holdTime = currentTime - lastPressedStart[lastButtonPressed]
            if (holdTime < shortClickTime) {
                if ((lastClickEnd[lastButtonPressed] > 0) && (currentTime - lastClickEnd[lastButtonPressed] < doubleClickTime)) {
                    lastClickEnd[lastButtonPressed] = 0 // Click ended
                    doActions(lastButtonPressed, DOUBLECLICK)
                } else {
                    // If we're in a long click, end it
                    if(inLongClick[lastButtonPressed] == true) {
                        inLongClick[lastButtonPressed] = false
                        lastClickEnd[lastButtonPressed] = 0
                    } else {
                        // Otherwise, note the time for short click checks
                        lastClickEnd[lastButtonPressed] = currentTime
                    }
                }
            } else {
                // Intermediate clicks are ignored
                lastClickEnd[lastButtonPressed] = 0
            }
            lastButtonPressed = -1
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
        let pressedA = input.buttonIsPressed(Button.A)
        let pressedB = input.buttonIsPressed(Button.B)
        let pressedAB = pressedA && pressedB
        const holdTime = currentTime - lastPressedStart[i]
        if (pressedAB && (holdTime > longClickTime)) {
            lastClickEnd[AorB.AB] = 0 // Click ended / not a short click
            inLongClick[AorB.AB] = true
            lastPressedStart[AorB.AB] = currentTime // Prepare for 2nd long click
            doActions(AorB.AB, LONGCLICK)
        } else {
            if (pressedA && (holdTime > longClickTime)) {
                lastClickEnd[AorB.A] = 0 // Click ended / not a short click
                inLongClick[AorB.A] = true
                lastPressedStart[AorB.A] = currentTime // Prepare for 2nd long click
                doActions(AorB.A, LONGCLICK)
            }
            if (pressedB && (holdTime > longClickTime)) {
                lastClickEnd[AorB.B] = 0 // Click ended / not a short click
                inLongClick[AorB.B] = true
                lastPressedStart[AorB.B] = currentTime // Prepare for 2nd long click
                doActions(AorB.B, LONGCLICK)
            }
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
