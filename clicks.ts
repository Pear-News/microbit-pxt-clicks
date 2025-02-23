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
let pressedState = [false, false, false] // Pressed states for A, B, and AB

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

function buttonHandler() {
    let currentTime = control.millis()
    let pressedA = input.buttonIsPressed(Button.A)
    let pressedB = input.buttonIsPressed(Button.B)
    let pressedAB = pressedA && pressedB

    if(pressedAB) {
        if (!pressedState[AorB.AB]) {
            doActions(AorB.AB, BUTTONDOWN)
            lastPressedStart[AorB.AB] = currentTime
            pressedState[AorB.AB] = true
            inLongClick[AorB.AB] = false
        }
    } else {
        if (pressedA && !pressedState[AorB.A]) {
            doActions(AorB.A, BUTTONDOWN)
            lastPressedStart[AorB.A] = currentTime
            pressedState[AorB.A] = true
            inLongClick[AorB.A] = false
        }
        if (pressedB && !pressedState[AorB.B]) {
            doActions(AorB.B, BUTTONDOWN)
            lastPressedStart[AorB.B] = currentTime
            pressedState[AorB.B] = true
            inLongClick[AorB.B] = false
        }
    }

    if (!pressedA && !pressedB) {
        if (pressedState[AorB.AB]) {
            doActions(AorB.AB, BUTTONUP)
            handleButtonClick(AorB.AB)
        }
        if (pressedState[AorB.A]) {
            doActions(AorB.A, BUTTONUP)
            handleButtonClick(AorB.A)
        }
        if (pressedState[AorB.B]) {
            doActions(AorB.B, BUTTONUP)
            handleButtonClick(AorB.B)
        }
        pressedState = [false, false, false]
    }
}

function handleButtonClick(button: AorB) {
    let currentTime = control.millis()
    const holdTime = currentTime - lastPressedStart[button]
    if (holdTime < shortClickTime) {
        if ((lastClickEnd[button] > 0) && (currentTime - lastClickEnd[button] < doubleClickTime)) {
            lastClickEnd[button] = 0 // Click ended
            doActions(button, DOUBLECLICK)
        } else {
            if (inLongClick[button]) {
                inLongClick[button] = false
                lastClickEnd[button] = 0
            } else {
                lastClickEnd[button] = currentTime
            }
        }
    } else {
        lastClickEnd[button] = 0
    }
}

loops.everyInterval(singleClickCheckTime, function() {
    let currentTime = control.millis()
    // i is index and AorB  (0-based)
    for(let i=AorB.A;i<=AorB.AB;i++) {
        if ((lastClickEnd[i] > 0) && (currentTime - lastClickEnd[i] > doubleClickTime)) {
            lastClickEnd[i] = 0
            doActions(i, SINGLECLICK)
        }
        // Check if we're in a long press
        // Button indices are 0-based
        let pressed = pressedState[i]
        const holdTime = currentTime - lastPressedStart[i]
        if (pressed && (holdTime > longClickTime)) {
            lastClickEnd[i] = 0 // Click ended / not a short click
            inLongClick[i] = true
            lastPressedStart[i] = currentTime // Prepare for 2nd long click
            doActions(i, LONGCLICK)
        }
    }
})

// Register Handlers
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_A,
    EventBusValue.MICROBIT_BUTTON_EVT_DOWN, buttonHandler)
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_A,
    EventBusValue.MICROBIT_BUTTON_EVT_UP, buttonHandler)
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_B,
    EventBusValue.MICROBIT_BUTTON_EVT_DOWN, buttonHandler)
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_B,
    EventBusValue.MICROBIT_BUTTON_EVT_UP, buttonHandler)

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
