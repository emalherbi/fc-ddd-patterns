import EventInterface from "../../@shared/event/event.interface";

type ProductCreatedEventData = { name: string; description: string; price: number };

export default class ProductCreatedEvent
  implements EventInterface<ProductCreatedEventData>
{
  dataTimeOccurred: Date;
  eventData: ProductCreatedEventData;

  constructor(eventData: ProductCreatedEventData) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
