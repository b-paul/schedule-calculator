let createId = (function () {
  let nextId = 100;
  return function createId() {
    return nextId++;
  };
}());

let validateShift = function (shiftObj) {
  // must have integer id
  // must have valid employeeId
  // must have numeric startTime (>= 0, < 24)
  // must have numeric length (> 0, <= 24)
  // startTime must be < endTime
  return true;
};

let validateEmployee = function (employeeObj) {
  // must have integer id
  // must have string name
  // must have string role
  // must have numeric payRate > 0
  return true;
};

export class Shift {
  constructor (employeeId, startTime, length) {
    this.employeeId = employeeId;
    this.startTime = startTime;
    this.length = length;
    this.id = createId();
    if (!validateShift(this)) {
      throw new Error('Invalid parameters for Shift.');
    }
  }
  _setPossiblyInvalidProp(propName, value) {
    let mock = Object.create(this);
    mock[propName] = value;
    if (!validateShift(mock)) {
      throw new Error(`Invalid ${propName}`);
    }
    this[propName] = value;
  }
  setStartTime(time) {
    this._setPossiblyInvalidProp('startTime', time);
    return this;
  }
  setLength(length) {
    this._setPossiblyInvalidProp('length', length);
    return this;
  }
}

export class Schedule {
  constructor () {
    this.openTime = 8.0;
    this.closeTime = 22.0;
    this.weekday = 1;
    this.shifts = {};
  }
  setOpenTime(time) {
    if (isNaN(time) || time >= 24 || time < 0) {
      throw new Error('Invalid open time.');
    }
    this.openTime = time;
  }
  setCloseTime(time) {
    if (isNaN(time) || time > 24 || time <= 0) {
      throw new Error('Invalid close time.');
    }
    this.closeTime = time;
  }
  addShift(employeeId) {
    let shiftObj = new Shift(employeeId, this.openTime, 8);
    this.shifts[shiftObj.id] = shiftObj;
    return shiftObj;
  }
  setShiftStart(shiftId, time) {
    return this.shifts[shiftId].setStartTime(time);
  }
  setShiftLength(shiftId, length) {
    return this.shifts[shiftId].setLength(length);
  }
  deleteShift(shiftId) {
    delete this.shifts[shiftId];
  }
  listShifts() {
    let shifts = [];
    let keys = Object.keys(this.shifts);
    let len = keys.length;
    for (let i = 0; i < len; i++) {
      shifts.push(this.shifts[keys[i]]);
    }
    return shifts;
  }
  isEmployeeWorking(employeeId) {
    let keys = Object.keys(this.shifts);
    let len = keys.length;
    for (let i = 0; i < len; i++) {
      console.log(this.shifts[keys[i]]);
      if (this.shifts[keys[i]].employeeId === employeeId) {
        return true;
      }
    }
    return false;
  }
}

export class Employee {
  constructor (name, role, payRate) {
    this.name = name;
    this.role = role;
    this.payRate = payRate;
    this.id = createId();
    if (!validateEmployee(this)) {
      throw new Error('Invalid parameters for Employee.');
    }
  }
}

export class EmployeeList {
  constructor () {
    this.employees = {};
  }
  addEmployee (name, role, payRate) {
    let emp = new Employee(name, role, payRate);
    this.employees[emp.id] = emp;
    return emp;
  }
  deleteEmployee (employeeId) {
    delete this.employees[employeeId];
  }
  listEmployees () {
    let emps = [];
    let keys = Object.keys(this.employees);
    let len = keys.length;
    for (let i = 0; i < len; i++) {
      emps.push(this.employees[keys[i]]);
    }
    return emps;
  }
}
