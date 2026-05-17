import EventInterface from "../../@shared/event/event.interface";

type CustomerCreatedEventData = { id: string; name: string };

export default class CustomerCreatedEvent
  implements EventInterface<CustomerCreatedEventData>
{
  dataTimeOccurred: Date;
  eventData: CustomerCreatedEventData;

  constructor(eventData: CustomerCreatedEventData) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
