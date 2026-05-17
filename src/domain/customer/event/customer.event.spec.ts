import Address from "../value-object/address";
import Customer from "../entity/customer";
import EventDispatcher from "../../@shared/event/event-dispatcher";
import CustomerCreatedEvent from "./customer-created.event";
import CustomerActivatedEvent from "./customer-activated.event";
import EnviaConsoleLog1WhenCustomerIsCreatedHandler from "./handler/envia-console-log-1-when-customer-is-created.handler";
import EnviaConsoleLog2WhenCustomerIsCreatedHandler from "./handler/envia-console-log-2-when-customer-is-created.handler";
import EnviaConsoleLogWhenCustomerIsActivatedHandler from "./handler/envia-console-log-when-customer-is-activated.handler";

describe("Customer domain events", () => {
  it("should notify both handlers when CustomerCreatedEvent is dispatched", () => {
    const eventDispatcher = new EventDispatcher();
    const handler1 = new EnviaConsoleLog1WhenCustomerIsCreatedHandler();
    const handler2 = new EnviaConsoleLog2WhenCustomerIsCreatedHandler();
    const spy1 = jest.spyOn(handler1, "handle");
    const spy2 = jest.spyOn(handler2, "handle");

    eventDispatcher.register("CustomerCreatedEvent", handler1);
    eventDispatcher.register("CustomerCreatedEvent", handler2);

    const customer = new Customer("1", "John");
    const event = new CustomerCreatedEvent({ id: customer.id, name: customer.name });
    eventDispatcher.notify(event);

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  it("should notify handler when CustomerActivatedEvent is dispatched", () => {
    const eventDispatcher = new EventDispatcher();
    const handler = new EnviaConsoleLogWhenCustomerIsActivatedHandler();
    const spy = jest.spyOn(handler, "handle");

    eventDispatcher.register("CustomerActivatedEvent", handler);

    const customer = new Customer("1", "John");
    customer.changeAddress(new Address("Street 1", 1, "12345-000", "São Paulo"));
    customer.activate();

    const event = new CustomerActivatedEvent({ id: customer.id });
    eventDispatcher.notify(event);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should not notify CustomerCreatedEvent handlers when CustomerActivatedEvent is dispatched", () => {
    const eventDispatcher = new EventDispatcher();
    const createdHandler = new EnviaConsoleLog1WhenCustomerIsCreatedHandler();
    const activatedHandler = new EnviaConsoleLogWhenCustomerIsActivatedHandler();
    const spyCreated = jest.spyOn(createdHandler, "handle");
    const spyActivated = jest.spyOn(activatedHandler, "handle");

    eventDispatcher.register("CustomerCreatedEvent", createdHandler);
    eventDispatcher.register("CustomerActivatedEvent", activatedHandler);

    const event = new CustomerActivatedEvent({ id: "1" });
    eventDispatcher.notify(event);

    expect(spyCreated).not.toHaveBeenCalled();
    expect(spyActivated).toHaveBeenCalledTimes(1);
  });
});
