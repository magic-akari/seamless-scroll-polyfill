export function scrollEndEvent(bubbles: boolean): Event {
    if (typeof Event === "function") {
        return new Event("scrollend", {
            bubbles,
            cancelable: false,
        });
    }

    const event = document.createEvent("Event");
    event.initEvent("scrollend", bubbles, false);

    return event;
}
