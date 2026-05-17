import EventInterface from "../../@shared/event/event.interface";

type CustomerActivatedEventData = { id: string };

export default class CustomerActivatedEvent
  implements EventInterface<CustomerActivatedEventData>
{
  dataTimeOccurred: Date;
  eventData: CustomerActivatedEventData;

  constructor(eventData: CustomerActivatedEventData) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
