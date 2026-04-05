"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const event_bus_1 = require("../../shared/events/event-bus");
function sendNotification(payload) {
    console.log(`[NOTIFICATION] type=${payload.type} to=${payload.to}`, payload.data);
}
// Listen to events and stub-send notifications
event_bus_1.eventBus.on(event_bus_1.EVENTS.GIFT_CREATED, ({ giftId }) => {
    sendNotification({ type: 'gift_created', to: 'sender@example.com', data: { giftId } });
});
event_bus_1.eventBus.on(event_bus_1.EVENTS.ETF_PURCHASED, ({ giftId }) => {
    sendNotification({ type: 'invested', to: 'recipient@example.com', data: { giftId } });
});
//# sourceMappingURL=notifications.service.js.map