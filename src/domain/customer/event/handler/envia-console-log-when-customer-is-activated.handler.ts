import EventHandlerInterface from "../../../@shared/event/event-handler.interface";
import CustomerActivatedEvent from "../customer-activated.event";

export default class EnviaConsoleLogWhenCustomerIsActivatedHandler
  implements EventHandlerInterface<CustomerActivatedEvent>
{
  handle(event: CustomerActivatedEvent): void {
    console.log(`Esse é o console.log do evento: CustomerActivated, customer: ${event.eventData.id}`);
  }
}
