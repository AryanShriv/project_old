const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const defaultSlots = () =>
  WEEKDAYS.map((day) => ({
    day,
    enabled: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day),
    startTime: "09:00",
    endTime: "17:00",
  }));

module.exports = { WEEKDAYS, defaultSlots };
