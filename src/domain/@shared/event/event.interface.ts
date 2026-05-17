export default interface EventInterface<T = unknown> {
  dataTimeOccurred: Date;
  eventData: T;
}
